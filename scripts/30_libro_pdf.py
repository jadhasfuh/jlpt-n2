# -*- coding: utf-8 -*-
"""Maqueta el libro en PDF, a tamaño real, para ver cómo quedaría impreso.

    python3 scripts/30_libro_pdf.py                 # el libro entero
    python3 scripts/30_libro_pdf.py --capitulos 8   # sólo los ocho primeros

Un capítulo por pliego: a la izquierda el vocabulario y la gramática, a la
derecha la historia y su dibujo. El hueco del dibujo va marcado con su medida
en milímetros, que es lo que hay que encargar.

El furigana se dibuja a mano, carácter a carácter: no hay forma de que una
librería de PDF entienda <ruby>, y de todas formas para una maqueta lo que
importa es que el hueco entre renglones sea el de verdad.
"""
import json, re, sys, pathlib
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ------------------------------------------------------------------ la página
ANCHO, ALTO = 148 * mm, 210 * mm        # A5, que es el A5変 de 小説ミラーさん
M_LOMO, M_CANTO = 18 * mm, 15 * mm      # el margen del lomo es mayor: ahí se cose
M_ARRIBA, M_ABAJO = 20 * mm, 22 * mm
CAJA = ANCHO - M_LOMO - M_CANTO

CUERPO = 12.5                            # pt — un libro para principiantes
                                         # se lee grande; a 11 pt sobraba página
INTERLINEA = 2.0 * CUERPO                # el furigana pide interlínea doble
FURIGANA = CUERPO * 0.5
RENGLONES_HISTORIA = 12

# Aire alrededor del dibujo. Con los 4 mm de antes el texto arrancaba pegado al
# pie de la ilustración y la página se amontonaba; abajo hace falta más que
# arriba, porque arriba el dibujo respira contra el blanco del título.
AIRE_ARRIBA = 6 * mm
AIRE_ABAJO = 10 * mm

FUENTES = pathlib.Path("/private/tmp/claude-501/-Users-jadhasfuh-Documents-jlptest"
                       "/de6ce02c-8b5a-444f-9eba-a860178bf9ed/scratchpad/fuentes")
pdfmetrics.registerFont(TTFont("Mincho", str(FUENTES / "ipaexm.ttf")))
pdfmetrics.registerFont(TTFont("Gothic", str(FUENTES / "ipaexg.ttf")))

INVISIBLE = re.compile(r"[\u200b-\u200f\u2028\u2029\ufeff\xa0]")
RUBY = re.compile(r"<ruby>([^<]+)<rt>([^<]+)</rt></ruby>")
TAGS = re.compile(r"<[^>]+>")

def trozos(html, gramatica=()):
    """El texto partido en (base, lectura|None, gótica).

    `gótica` marca los trozos que son un punto de gramática del capítulo. En
    japonés no se enfatiza con negrita: se cambia de familia, del 明朝 del texto
    a la ゴシック. Es lo que hace cualquier libro de texto japonés y lo que
    hacemos aquí."""
    fuera, i = [], 0
    for m in RUBY.finditer(html):
        if m.start() > i:
            fuera += [(c, None) for c in INVISIBLE.sub("", TAGS.sub("", html[i:m.start()]))]
        fuera.append((m.group(1), m.group(2)))
        i = m.end()
    fuera += [(c, None) for c in INVISIBLE.sub("", TAGS.sub("", html[i:]))]
    fuera = [x for x in fuera if x[0] != ""]

    marca = [False] * len(fuera)
    if gramatica:
        # Se busca sobre el texto plano y se traduce la posición a trozos.
        plano = "".join(b for b, _ in fuera)
        inicio, pos = [], 0
        for b, _ in fuera:
            inicio.append(pos); pos += len(b)
        for f in gramatica:
            desde = 0
            while True:
                k = plano.find(f, desde)
                if k < 0: break
                for j, ini in enumerate(inicio):
                    if ini < k + len(f) and ini + len(fuera[j][0]) > k:
                        marca[j] = True
                desde = k + 1
    return [(b, l, marca[j]) for j, (b, l) in enumerate(fuera)]


def formas_gramatica(ids):
    """Lo que se puede buscar de cada punto: su forma, su lectura en kana y
    cada trozo de un patrón partido por 〜.

    Se descartan los de UN carácter —も, に, ね— porque son partículas y salen
    en cada frase: resaltarlas no marca la gramática, sólo mancha la página."""
    fuera = set()
    for gid in ids:
        g = gram.get(gid)
        if not g: continue
        for bruto in (g.get("forma"), g.get("lectura")):
            if not bruto: continue
            for parte in re.split(r"[〜~…・/]", bruto):
                p = parte.strip().strip("（）()［］")
                if len(p) >= 2 and re.fullmatch(r"[ぁ-ヿ一-鿿]+", p):
                    fuera.add(p)
    return sorted(fuera, key=len, reverse=True)

def recortar(t, limite=34):
    """Corta por palabra y pone puntos suspensivos, no a mitad de «Sustantivo»."""
    t = INVISIBLE.sub("", t)
    if len(t) <= limite: return t
    corte = t[:limite].rsplit(" ", 1)[0]
    return (corte if len(corte) > limite * 0.6 else t[:limite - 1]) + "…"

def ancho(t, fuente=("Mincho", CUERPO)):
    return pdfmetrics.stringWidth(t, fuente[0], fuente[1])

# 禁則処理: caracteres que no pueden EMPEZAR un renglón. Si al cortar cae uno
# de éstos al principio, se arrastra al renglón de antes. Sin esto salen
# renglones que empiezan por 「、」, que en japonés no se hace nunca.
NO_INICIAN = set("、。，．・：；！？」』）］｝〉》”’ーぁぃぅぇぉっゃゅょゎヵヶァィゥェォッャュョ")


def renglones(ts, caja):
    """Reparte los trozos en renglones. Se corta en los espacios, que es donde
    corta un libro para principiantes; si un bloque no cabe, se corta igual."""
    fuera, linea, x = [], [], 0.0
    for base, lec, g in ts:
        w = max(ancho(base), ancho(lec or "", ("Mincho", FURIGANA)))
        if base == " ":
            if x + w > caja and linea:
                fuera.append(linea); linea, x = [], 0.0
                continue
        elif x + w > caja and linea:
            # si lo que abre el renglón nuevo no puede abrirlo, se queda aquí
            if base and base[0] in NO_INICIAN:
                linea.append((base, lec, g)); x += w
                continue
            fuera.append(linea); linea, x = [], 0.0
        linea.append((base, lec, g)); x += w
    if linea: fuera.append(linea)
    return fuera

def pinta_renglon(c, x, y, linea):
    for base, lec, g in linea:
        w = ancho(base)
        if lec:
            wl = ancho(lec, ("Mincho", FURIGANA))
            c.setFont("Mincho", FURIGANA)
            c.drawString(x + (w - wl) / 2, y + CUERPO * 0.92, lec)
        c.setFont("Gothic" if g else "Mincho", CUERPO)
        c.drawString(x, y, base)
        if g:                                   # y subrayado fino, por si acaso
            c.setLineWidth(0.4)
            c.line(x, y - CUERPO * 0.22, x + w, y - CUERPO * 0.22)
        x += w

# --------------------------------------------------------------- 縦書き
# El japonés vertical no es «lo mismo girado»: hay tres familias de glifos que
# se comportan distinto, y si no se tratan el resultado canta a la legua.
#
#  · 。、 no van centradas: se suben a la esquina de arriba a la derecha de su
#    cuadratín. Centradas parecen un lunar en medio de la columna.
#  · ー「」（）… giran 90°. El alargamiento vocálico tumbado es lo que más
#    delata a un vertical mal hecho.
#  · Las kana pequeñas (ゃゅょっ) se corren un poco a la derecha y arriba.
#
# El resto se dibuja centrado en el eje de la columna, un cuadratín por celda.
ESQUINA  = set("、。，．")
GIRAN    = set("ー〜（）()「」『』〔〕［］｛｝【】〈〉《》…‥ー–—~")
PEQUENAS = set("ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ")

COLUMNA = CUERPO * 2.15          # ancho de columna: cuerpo + furigana al lado

def columnas(ts, alto):
    """Reparte los trozos en columnas de `alto` puntos, de arriba abajo."""
    fuera, col, usado = [], [], 0.0
    for base, lec, g in ts:
        h = len(base) * CUERPO
        if base == " ":
            if usado + h > alto and col:
                fuera.append(col); col, usado = [], 0.0
                continue
        elif usado + h > alto and col:
            if base and base[0] in NO_INICIAN:
                col.append((base, lec, g)); usado += h
                continue
            fuera.append(col); col, usado = [], 0.0
        col.append((base, lec, g)); usado += h
    if col: fuera.append(col)
    return fuera

def pinta_columna(c, x, y_alto, col):
    """Una columna. `x` es el eje; el furigana va a su derecha."""
    y = y_alto
    for base, lec, g in col:
        if lec:                                   # furigana al lado derecho
            c.setFont("Mincho", FURIGANA)
            paso = (len(base) * CUERPO) / max(1, len(lec))
            for i, ch in enumerate(lec):
                c.drawString(x + CUERPO * 0.52,
                             y - (i + 1) * paso + paso * 0.25, ch)
        c.setFont("Gothic" if g else "Mincho", CUERPO)
        for ch in base:
            w = ancho(ch)
            cx, cy = x - w / 2, y - CUERPO * 0.86
            if ch in ESQUINA:
                c.drawString(cx + CUERPO * 0.30, cy + CUERPO * 0.42, ch)
            elif ch in GIRAN:
                c.saveState()
                c.translate(x, y - CUERPO / 2)
                c.rotate(-90)
                c.drawString(-w / 2, -CUERPO * 0.36, ch)
                c.restoreState()
            elif ch in PEQUENAS:
                c.drawString(cx + CUERPO * 0.12, cy + CUERPO * 0.10, ch)
            else:
                c.drawString(cx, cy, ch)
            y -= CUERPO

# ------------------------------------------------------------------- los datos
lecturas = {l["unidad_id"]: l for l in json.load(open("data/dist/lecturas.json"))}
unidades = {u["id"]: u for u in json.load(open("data/dist/unidades.json"))}
vocab = {v["id"]: v for v in json.load(open("data/dist/vocabulario.json"))}
gram = {g["id"]: g for g in json.load(open("data/dist/gramatica.json"))}
orden = json.load(open("data/fuente/orden_libro.json"))["N5"]

VERTICAL = "--vertical" in sys.argv

tope = None
if "--capitulos" in sys.argv:
    tope = int(sys.argv[sys.argv.index("--capitulos") + 1])
desde = 0
if "--desde" in sys.argv:
    desde = int(sys.argv[sys.argv.index("--desde") + 1]) - 1
capitulos = orden[desde:desde + tope] if tope else orden[desde:]

SALIDA = pathlib.Path("docs/libro-n5-maqueta-vertical.pdf" if VERTICAL
                      else "docs/libro-n5-maqueta.pdf")
DIBUJOS = pathlib.Path("docs/libro/ilustraciones")


def dibujo_de(n, uid):
    """El PNG del capítulo, si está. Mientras no existía se pintaba un recuadro
    de puntos con su medida; ahora se pinta el dibujo y el recuadro sólo sale
    para lo que falte."""
    f = DIBUJOS / f"{n:03d}-{uid.split('/')[-1]}.png"
    return f if f.exists() else None


_BLANCOS = {}

def _blanqueado(f):
    """El dibujo con el fondo en blanco puro.

    El papel del dibujo ronda el 240 y la página del PDF es blanca, así que
    pegado tal cual se ve el rectángulo. Se empuja el casi-blanco a blanco y la
    línea se queda igual. Se guarda en memoria porque el mismo dibujo puede
    pintarse dos veces si se generan las dos ediciones."""
    if f not in _BLANCOS:
        from PIL import Image
        im = Image.open(f).convert("L").point(lambda v: 255 if v > 228 else v)
        _BLANCOS[f] = im
    return _BLANCOS[f]


def pinta_dibujo(c, f, x, y, ancho, alto):
    """Encaja el dibujo dentro del hueco sin deformarlo y lo centra."""
    from reportlab.lib.utils import ImageReader
    im = ImageReader(_blanqueado(f))
    iw, ih = im.getSize()
    esc = min(ancho / iw, alto / ih)
    w, h = iw * esc, ih * esc
    c.drawImage(im, x + (ancho - w) / 2, y + (alto - h) / 2, w, h,
                mask="auto")
c = canvas.Canvas(str(SALIDA), pagesize=(ANCHO, ALTO))
huecos = []
largos = []   # capítulos que ocupan más de una página

# ---------------------------------------------------------------- la portada
# --sin-portada sirve para mirar una página suelta: sips y Vista Previa sólo
# rasterizan la primera, y con portada esa primera es siempre la misma.
_portada = DIBUJOS / "00-portada-montada.png"
if "--sin-portada" not in sys.argv and _portada.exists():
  # La portada ya viene compuesta —dibujo, título y logo— a 300 ppp con sangre.
  # Se mete a sangre completa y se recorta sola al tamaño de página.
  from reportlab.lib.utils import ImageReader
  _im = ImageReader(str(_portada))
  _iw, _ih = _im.getSize()
  _esc = max(ANCHO / _iw, ALTO / _ih)
  c.drawImage(_im, (ANCHO - _iw * _esc) / 2, (ALTO - _ih * _esc) / 2,
              _iw * _esc, _ih * _esc)
  c.showPage()
elif "--sin-portada" not in sys.argv:
  c.setFont("Mincho", 30)
  c.drawCentredString(ANCHO / 2, ALTO * 0.62, "こうべの一年")
  c.setFont("Gothic", 11); c.setFillGray(0.4)
  c.drawCentredString(ANCHO / 2, ALTO * 0.62 - 14 * mm, "Un año en Kobe")
  c.drawCentredString(ANCHO / 2, ALTO * 0.62 - 20 * mm, "jlptest · N5")
  c.setFillGray(0.75); c.setFont("Gothic", 8)
  c.drawCentredString(ANCHO / 2, M_ABAJO, f"maqueta · {ANCHO/mm:.0f} × {ALTO/mm:.0f} mm")
  c.setFillGray(0)
  c.showPage()

for n, uid in enumerate(capitulos, desde + 1):
    u, l = unidades[uid], lecturas[uid]
    gram_formas = formas_gramatica(u["gramatica"])
    if "--solo-historia" in sys.argv:
        pass
    # ---------------------------------------------------- izquierda: la ayuda
    #
    # Antes eran dos columnas sueltas de 4,6 mm, vocabulario y gramática con el
    # mismo peso y sin nada que las separase. Ahora cada bloque lleva su
    # cabecera con filete, la palabra manda en 明朝, la lectura va encima en
    # pequeño —donde el ojo ya la busca, por el furigana— y el significado
    # debajo. La gramática, que es lo que cuesta, va en fichas más altas.
    x0, y = M_CANTO, ALTO - M_ARRIBA
    ANCHO_AYUDA = ANCHO - M_CANTO - M_LOMO
    c.setFont("Gothic", 8); c.setFillGray(0.45)
    c.drawString(x0, y, f"{n}")
    c.setFillGray(0)
    y -= 9 * mm

    def cabecera(txt, y):
        c.setFont("Gothic", 8); c.setFillGray(0.40)
        c.drawString(x0, y, txt)
        w = pdfmetrics.stringWidth(txt, "Gothic", 8)
        c.setStrokeGray(0.85); c.setLineWidth(0.5)
        c.line(x0 + w + 3 * mm, y + 2.6, x0 + ANCHO_AYUDA, y + 2.6)
        c.setFillGray(0)
        return y - 7 * mm

    y = cabecera("この しょうの ことば", y)
    for pid in u["palabras"]:
        v = vocab.get(pid)
        if not v or y < M_ABAJO + 6 * mm: continue
        if v["lectura"] and v["lectura"] != v["escritura"]:
            c.setFont("Gothic", 6.2); c.setFillGray(0.5)
            c.drawString(x0, y + 4.4 * mm, v["lectura"])
            c.setFillGray(0)
        c.setFont("Mincho", 10.5)
        c.drawString(x0, y, v["escritura"])
        c.setFont("Gothic", 7.6); c.setFillGray(0.25)
        c.drawString(x0 + 34 * mm, y, recortar(v["es"], 40))
        c.setFillGray(0)
        y -= 7.4 * mm

    if u["gramatica"] and y > M_ABAJO + 16 * mm:
        y -= 4 * mm
        y = cabecera("ぶんぽう", y)
        for gid in u["gramatica"]:
            g = gram.get(gid)
            if not g or y < M_ABAJO + 6 * mm: continue
            # la forma en una caja tenue: es lo que hay que reconocer al leer
            alto_f = 9.2 * mm
            c.setFillGray(0.955)
            c.roundRect(x0 - 1.5 * mm, y - 2.6 * mm, ANCHO_AYUDA, alto_f,
                        1.2 * mm, stroke=0, fill=1)
            c.setFillGray(0)
            c.setFont("Gothic", 10)
            c.drawString(x0, y + 2.6 * mm, g["forma"])
            if g.get("lectura"):
                w = pdfmetrics.stringWidth(g["forma"], "Gothic", 10)
                c.setFont("Gothic", 6.2); c.setFillGray(0.5)
                c.drawString(x0 + w + 2.5 * mm, y + 2.6 * mm, g["lectura"])
                c.setFillGray(0)
            c.setFont("Gothic", 7.4); c.setFillGray(0.28)
            c.drawString(x0, y - 0.8 * mm, recortar(g["es"], 58))
            c.setFillGray(0)
            y -= alto_f + 2.4 * mm

    if "--solo-historia" not in sys.argv: c.showPage()
    else: c.setPageSize((ANCHO, ALTO))

    # ---------------------------------------------------- derecha: la historia
    if VERTICAL:
        # En un libro japonés el lomo va a la derecha, así que el margen ancho
        # —el que se come la costura— cambia de lado.
        x_der, x_izq = ANCHO - M_LOMO, M_CANTO
        y_alto = ALTO - M_ARRIBA
        c.setFont("Gothic", 8); c.setFillGray(0.45)
        c.drawString(M_CANTO, ALTO - M_ARRIBA, f"{n}")
        c.setFillGray(0)

        # El dibujo va en una BANDA APAISADA ARRIBA, no en el hueco que sobre.
        #
        # En vertical lo que sobra es una tira alta y estrecha —43 mm de ancho
        # por 168 de alto en el capítulo 1—, y los dibujos son 3:2 apaisados.
        # Meterlos ahí obligaría a redibujar los 103 en vertical. Con la banda
        # arriba se reusan tal cual, y además es como lo hace media literatura
        # infantil japonesa: estampa arriba, columnas debajo.
        ancho_dib = ANCHO - M_LOMO - M_CANTO
        # La banda se queda con lo que sobre, no al revés: con una altura fija
        # de 2/3 del ancho había 14 capítulos a los que ya no les cabía el
        # texto. Se prueba de la más alta a la más baja y se coge la primera
        # que deja sitio a todas las columnas.
        disponible = x_der - x_izq
        alto_dib = 0.0
        for prueba in [ancho_dib * r for r in
                       (2/3, 0.58, 0.5, 0.42, 0.34, 0.26, 0.18, 0.0)]:
            alto_col_p = (ALTO - M_ARRIBA - (prueba + AIRE_ABAJO if prueba else 0)) - M_ABAJO
            n_tit = len(columnas(trozos(l["titulo"]), alto_col_p)[:2])
            n_cue = len(columnas(trozos(l["cuerpo"], gram_formas), alto_col_p))
            # el título separa un poco más que el cuerpo
            if n_tit * COLUMNA * 1.15 + n_cue * COLUMNA <= disponible:
                alto_dib = prueba
                break
        if alto_dib:
            f = dibujo_de(n, uid)
            if f:
                pinta_dibujo(c, f, x_izq, ALTO - M_ARRIBA - alto_dib,
                             ancho_dib, alto_dib)
            else:
                c.setDash(2, 3); c.setStrokeGray(0.7)
                c.rect(x_izq, ALTO - M_ARRIBA - alto_dib, ancho_dib, alto_dib)
                c.setDash(); c.setFont("Gothic", 7); c.setFillGray(0.5)
                c.drawCentredString(ANCHO / 2, ALTO - M_ARRIBA - alto_dib / 2,
                                    f"falta el dibujo   {ancho_dib/mm:.0f} × "
                                    f"{alto_dib/mm:.0f} mm")
                c.setFillGray(0)
            huecos.append(("grande", n, alto_dib / mm))
        else:
            huecos.append(("viñeta", n, 0))

        y_alto = ALTO - M_ARRIBA - (alto_dib + AIRE_ABAJO if alto_dib else 0)
        alto_col = (y_alto - M_ABAJO)
        cols_tit = columnas(trozos(l["titulo"]), alto_col)
        x = x_der
        for col in cols_tit[:2]:
            pinta_columna(c, x, y_alto, col); x -= COLUMNA * 1.15

        # Igual que en horizontal: si no caben todas las columnas, el capítulo
        # sigue en la página siguiente.
        cols = columnas(trozos(l["cuerpo"], gram_formas), alto_col)
        extra = 0
        for col in cols:
            if x - COLUMNA < x_izq:
                c.showPage(); extra += 1
                x, y_alto = x_der, ALTO - M_ARRIBA
                alto_col = y_alto - M_ABAJO
                c.setFont("Gothic", 8); c.setFillGray(0.45)
                c.drawString(M_CANTO, ALTO - M_ARRIBA, f"{n}")
                c.setFillGray(0)
            pinta_columna(c, x, y_alto, col); x -= COLUMNA
        if extra:
            largos.append((n, extra))
        c.showPage()
        continue

    x0, y = M_LOMO, ALTO - M_ARRIBA
    c.setFont("Gothic", 8); c.setFillGray(0.45)
    c.drawRightString(ANCHO - M_CANTO, y, f"{n}")
    c.setFillGray(0); y -= 7 * mm
    for ln in renglones(trozos(l["titulo"]), CAJA)[:2]:
        pinta_renglon(c, x0, y, ln); y -= INTERLINEA * 1.25

    lineas = renglones(trozos(l["cuerpo"], gram_formas), CAJA)
    alto_texto = len(lineas) * INTERLINEA
    y_texto_fin = M_ABAJO
    hueco_alto = (y - AIRE_ARRIBA) - (y_texto_fin + alto_texto)

    # Cuando el texto es largo, el hueco que sobra no da para un dibujo digno.
    # Antes eso dejaba el capítulo sin dibujo; ahora manda el dibujo y el texto
    # sigue en la página siguiente, que es para lo que se permitió el doble
    # pliego. Un capítulo largo no tiene por qué ser un capítulo sin dibujo.
    BANDA = 62 * mm
    if hueco_alto < 35 * mm + AIRE_ARRIBA + AIRE_ABAJO:
        hueco_alto = BANDA + AIRE_ARRIBA + AIRE_ABAJO

    if hueco_alto > 20 * mm + AIRE_ABAJO:          # cabe el dibujo grande
        alto_dib = hueco_alto - AIRE_ARRIBA - AIRE_ABAJO
        base_dib = y - AIRE_ARRIBA - alto_dib
        f = dibujo_de(n, uid)
        if f:
            pinta_dibujo(c, f, x0, base_dib, CAJA, alto_dib)
        else:
            c.setDash(2, 3); c.setStrokeGray(0.7)
            c.rect(x0, base_dib, CAJA, alto_dib)
            c.setDash()
            c.setFont("Gothic", 7); c.setFillGray(0.5)
            c.drawCentredString(x0 + CAJA / 2, base_dib + alto_dib / 2,
                                f"falta el dibujo   {CAJA/mm:.0f} × "
                                f"{alto_dib/mm:.0f} mm")
            c.setFillGray(0)
        huecos.append(("grande", n, alto_dib / mm))
        y = base_dib - AIRE_ABAJO
    else:                                          # sólo cabe una viñeta
        huecos.append(("viñeta", n, 0))

    # Un capítulo puede pasar de una página. Cuando el texto no cabe, sigue en
    # la siguiente en vez de recortarse: es preferible un capítulo de dos hojas
    # a una historia a la que le falta el final.
    paginas_extra = 0
    for ln in lineas:
        if y < M_ABAJO:
            c.showPage()
            paginas_extra += 1
            y = ALTO - M_ARRIBA
            c.setFont("Gothic", 8); c.setFillGray(0.45)
            c.drawRightString(ANCHO - M_CANTO, y, f"{n}")
            c.setFillGray(0); y -= 9 * mm
        pinta_renglon(c, x0, y, ln); y -= INTERLINEA
    if paginas_extra:
        largos.append((n, paginas_extra))
    c.showPage()

_paginas = c.getPageNumber() - 1
c.save()

grandes = [h for h in huecos if h[0] == "grande"]
vinetas = [h for h in huecos if h[0] == "viñeta"]
print(f"{SALIDA}  ·  {len(capitulos)} capítulos = {_paginas} páginas")
print(f"  dibujo grande: {len(grandes)}   (alto medio "
      f"{sum(h[2] for h in grandes)/max(1,len(grandes)):.0f} mm)")
print(f"  sólo viñeta:   {len(vinetas)}   capítulos {[h[1] for h in vinetas]}")
if largos:
    print(f"  de más de una página: {len(largos)} "
          f"(capítulo, páginas de más) → {largos[:12]}")
