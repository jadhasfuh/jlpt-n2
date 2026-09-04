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


def palabras(ts):
    """Agrupa los trozos en PALABRAS, usando los espacios del 分かち書き.

    El japonés normal se puede cortar entre casi cualquier par de caracteres,
    pero este libro va escrito con espacios entre palabras y cortar dentro
    —食べまし / た— se lee fatal a este nivel. Cortando sólo en los espacios,
    cada renglón acaba en palabra entera."""
    fuera, act = [], []
    for tr in ts:
        if tr[0] == " ":
            if act: fuera.append(act); act = []
            fuera.append([tr])
        else:
            act.append(tr)
    if act: fuera.append(act)
    return fuera


def ancho_de(pal):
    return sum(max(ancho(b), ancho(l or "", ("Mincho", FURIGANA))) for b, l, _ in pal)


def renglones(ts, caja):
    """Reparte los trozos en renglones. Se corta en los espacios, que es donde
    corta un libro para principiantes; si un bloque no cabe, se corta igual."""
    fuera, linea, x = [], [], 0.0
    for pal in palabras(ts):
        w = ancho_de(pal)
        if pal[0][0] == " ":
            # un espacio al final de renglón no se pinta: se traga el corte
            if x + w > caja and linea:
                fuera.append(linea); linea, x = [], 0.0
                continue
        elif x + w > caja and linea:
            # lo que no puede abrir renglón se queda en el de antes
            if pal[0][0] and pal[0][0][0] in NO_INICIAN:
                linea += pal; x += w
                continue
            fuera.append(linea); linea, x = [], 0.0
        linea += pal; x += w
    if linea: fuera.append(linea)
    return fuera

def pinta_titulo(c, x, y, linea, cuerpo=None, vertical=False):
    """El título del capítulo: en ゴシック y más grande que el texto.

    Iba en 明朝 al mismo cuerpo que la historia, así que no se distinguía de un
    renglón cualquiera. En japonés no se enfatiza con negrita —no existe una
    versión negrita del 明朝 clásico—, sino cambiando de familia."""
    cuerpo = cuerpo or CUERPO * 1.35
    for base, lec, _ in linea:
        w = pdfmetrics.stringWidth(base, "Gothic", cuerpo)
        if lec:
            wl = pdfmetrics.stringWidth(lec, "Gothic", cuerpo * 0.42)
            c.setFont("Gothic", cuerpo * 0.42); c.setFillGray(0.45)
            c.drawString(x + (w - wl) / 2, y + cuerpo * 0.92, lec)
            c.setFillGray(0)
        c.setFont("Gothic", cuerpo)
        c.drawString(x, y, base)
        x += w
    return x


def ancho_titulo(linea, cuerpo=None):
    cuerpo = cuerpo or CUERPO * 1.35
    return sum(pdfmetrics.stringWidth(b, "Gothic", cuerpo) for b, _, _ in linea)


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
    for pal in palabras(ts):
        h = sum(len(b) for b, _, _ in pal) * CUERPO
        if pal[0][0] == " ":
            if usado + h > alto and col:
                fuera.append(col); col, usado = [], 0.0
                continue
        elif usado + h > alto and col:
            if pal[0][0] and pal[0][0][0] in NO_INICIAN:
                col += pal; usado += h
                continue
            fuera.append(col); col, usado = [], 0.0
        col += pal; usado += h
    if col: fuera.append(col)
    return fuera

def pinta_columna(c, x, y_alto, col, titulo=False):
    """Una columna. `x` es el eje; el furigana va a su derecha."""
    y = y_alto
    cuerpo = CUERPO * 1.3 if titulo else CUERPO
    for base, lec, g in col:
        if lec:                                   # furigana al lado derecho
            c.setFont("Gothic" if titulo else "Mincho", FURIGANA)
            paso = (len(base) * cuerpo) / max(1, len(lec))
            for i, ch in enumerate(lec):
                c.drawString(x + cuerpo * 0.52,
                             y - (i + 1) * paso + paso * 0.25, ch)
        c.setFont("Gothic" if (g or titulo) else "Mincho", cuerpo)
        for ch in base:
            w = pdfmetrics.stringWidth(ch, "Gothic" if titulo else "Mincho", cuerpo)
            cx, cy = x - w / 2, y - cuerpo * 0.86
            if ch in ESQUINA:
                c.drawString(cx + cuerpo * 0.30, cy + cuerpo * 0.42, ch)
            elif ch in GIRAN:
                c.saveState()
                c.translate(x, y - cuerpo / 2)
                c.rotate(-90)
                c.drawString(-w / 2, -cuerpo * 0.36, ch)
                c.restoreState()
            elif ch in PEQUENAS:
                c.drawString(cx + cuerpo * 0.12, cy + cuerpo * 0.10, ch)
            else:
                c.drawString(cx, cy, ch)
            y -= cuerpo

# ------------------------------------------------------------------- los datos
lecturas = {l["unidad_id"]: l for l in json.load(open("data/dist/lecturas.json"))}
unidades = {u["id"]: u for u in json.load(open("data/dist/unidades.json"))}
vocab = {v["id"]: v for v in json.load(open("data/dist/vocabulario.json"))}
gram = {g["id"]: g for g in json.load(open("data/dist/gramatica.json"))}
kanji = {k["char"]: k for k in json.load(open("data/dist/kanji.json"))}
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

# ---------------------------------------------- el margen del lomo, por hoja
#
# Todo se dibuja con la caja pegada al canto (M_CANTO) y luego se mueve la
# página entera si el lomo cae a la izquierda. El lomo CAMBIA DE LADO en cada
# hoja: cosido por la derecha (縦書き, 右綴じ) cae a la derecha en las impares
# y a la izquierda en las pares; en un libro occidental, al revés.
#
# Antes se dibujaban todas las páginas iguales, así que la mitad del libro
# tenía el margen estrecho pegado al encolado — y en rústica fresada ahí se
# pierden tres o cuatro milímetros más, con lo que el texto se come el lomo.
DESPL = M_LOMO - M_CANTO


def _pagina_interior():
    """El número que tendrá la página en el libro impreso.

    La portada no cuenta: va en el archivo de la cubierta, y
    35_libro_imprenta.py la quita. Si contara, todas las paridades saldrían
    cambiadas.
    """
    return c.getPageNumber() - (0 if "--sin-portada" in sys.argv else 1)


def _coloca_margen():
    n = _pagina_interior()
    if n < 1:
        return
    lomo_izquierda = (n % 2 == 0) if VERTICAL else (n % 2 == 1)
    if lomo_izquierda:
        c.translate(DESPL, 0)


_pasa_pagina = c.showPage


def _showPage():
    _pasa_pagina()
    _coloca_margen()


c.showPage = _showPage
_coloca_margen()
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

# ------------------------------------------------- las páginas de entrada
# Cómo se usa el libro y el índice. Van antes del capítulo 1 porque es lo que
# uno mira al abrirlo, y porque el QR de cada capítulo no se entiende si no se
# ha explicado antes para qué sirve.
def _fila_indice(y, num, titulo):
    c.setFont("Gothic", 8); c.setFillGray(0.45)
    c.drawRightString(M_CANTO + 8 * mm, y, str(num))
    c.setFillGray(0); c.setFont("Mincho", 9)
    for base, lec, _ in [x for ln in renglones(trozos(titulo), CAJA - 14 * mm)[:1] for x in ln]:
        pass
    c.drawString(M_CANTO + 12 * mm, y, re.sub(r"<[^>]+>", "", RUBY.sub(r"\1", titulo)))


if "--sin-portada" not in sys.argv:
    # ---- cómo se usa ----
    # Las cifras se cuentan, no se escriben: cuando el vocabulario cambió de
    # nivel el libro seguía prometiendo 925 palabras y ya no eran.
    _n_palabras = sum(len(unidades[u]["palabras"]) for u in orden)
    _n_gram = len({g for u in orden for g in unidades[u]["gramatica"]})
    y = ALTO - M_ARRIBA - 6 * mm
    c.setFont("Mincho", 16); c.drawString(M_CANTO, y, "この 本の つかい方")
    y -= 9 * mm
    c.setFont("Gothic", 9.5); c.setFillGray(0.35)
    for linea in ("Este libro es material de APOYO para preparar el JLPT N5.",
                  "No sustituye al temario: lo pone a funcionar. Todo lo que",
                  f"hay dentro —las {_n_palabras} palabras y los {_n_gram} puntos de",
                  "gramática— es el vocabulario y la gramática del N5, y nada más.",
                  ):
        c.drawString(M_CANTO, y, linea); y -= 6.2 * mm
    y -= 5 * mm
    c.setFillGray(0.2)
    for linea in ("Cada capítulo tiene dos partes. Primero las palabras y la",
                  "gramática que vas a necesitar; después la historia.",
                  "",
                  "Léelo entero antes de mirar nada. Si te atascas, vuelve a la",
                  "lista de la izquierda: todo lo que hace falta está ahí.",
                  "",
                  "Al final de cada capítulo hay un código. Con la cámara del",
                  "móvil te lleva a esa misma lección en jlptest.org, donde",
                  "puedes oír el texto, ver la traducción y hacer el test.",
                  "",
                  "Está al final y no al principio a propósito: mirar la",
                  "traducción antes de leer es dejar de leer.",
                  "",
                  "La gramática del capítulo va marcada en el texto con otra",
                  "letra y un subrayado fino, para que se vea dónde se usa."):
        c.drawString(M_CANTO, y, linea); y -= 6.2 * mm
    c.setFillGray(0)
    c.showPage()

    # ---- quién es quién ----
    # Los personajes vuelven durante 103 capítulos, y a mitad del libro es fácil
    # perder cuál era Jean y cuál Gonsa. Una foto y una línea bastan.
    import importlib.util as _iu
    _s = _iu.spec_from_file_location("_il", "scripts/32_ilustrar_libro.py")
    _il = _iu.module_from_spec(_s); _s.loader.exec_module(_il)

    # 3:2, como las de un carné. El tamaño lo manda el que quepan los nueve en
    # dos hojas: con la foto más grande entraban cuatro por página y salían tres.
    ANCHO_R, ALTO_R = 45 * mm, 30 * mm
    COL_X = [M_CANTO, M_CANTO + ANCHO_R + 13 * mm]
    y = ALTO - M_ARRIBA - 6 * mm
    c.setFont("Mincho", 16); c.drawString(M_CANTO, y, "この 本の 人たち")
    y -= 11 * mm
    fila_alto = ALTO_R + 20 * mm          # de fila a fila
    fila_lleno = ALTO_R + 17.5 * mm       # foto, nombre y tres líneas
    for i, (cual, (ja, es, desc)) in enumerate(_il.FICHAS.items()):
        col = i % 2
        if col == 0 and y - fila_lleno < M_ABAJO:
            c.showPage(); y = ALTO - M_ARRIBA - 6 * mm
        x = COL_X[col]
        f = DIBUJOS / f"retrato-{cual}.png"
        if f.exists():
            pinta_dibujo(c, f, x, y - ALTO_R, ANCHO_R, ALTO_R)
        else:
            c.setDash(2, 3); c.setStrokeGray(0.75)
            c.rect(x, y - ALTO_R, ANCHO_R, ALTO_R); c.setDash()
        c.setFont("Mincho", 10.5); c.setFillGray(0)
        c.drawString(x, y - ALTO_R - 6 * mm, ja)
        c.setFont("Gothic", 7.5); c.setFillGray(0.45)
        c.drawString(x + pdfmetrics.stringWidth(ja, "Mincho", 10.5) + 3 * mm,
                     y - ALTO_R - 6 * mm, es)
        c.setFillGray(0.28); c.setFont("Gothic", 7)
        yy = y - ALTO_R - 10.5 * mm
        linea = ""
        for palabra in desc.split():
            if pdfmetrics.stringWidth(linea + " " + palabra, "Gothic", 7) > ANCHO_R:
                c.drawString(x, yy, linea); yy -= 3.4 * mm; linea = palabra
            else:
                linea = (linea + " " + palabra).strip()
        if linea: c.drawString(x, yy, linea)
        c.setFillGray(0)
        if col == 1: y -= fila_alto
    if len(_il.FICHAS) % 2: y -= fila_alto
    c.showPage()

    # ---- índice ----
    y = ALTO - M_ARRIBA - 6 * mm
    c.setFont("Mincho", 16); c.drawString(M_CANTO, y, "もくじ")
    y -= 11 * mm
    for i, uid_i in enumerate(orden, 1):
        if y < M_ABAJO:
            c.showPage(); y = ALTO - M_ARRIBA
        _fila_indice(y, i, lecturas[uid_i]["titulo"])
        y -= 5.4 * mm
    c.showPage()

_temario = {"voc": [0, 0], "kanji": [0, 0], "gram": [0, 0]}   # pintado / total

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

    def sigue_ficha(y, alto):
        """Sitio para una fila más; si no lo hay, pasa de página.

        Antes se hacía `continue` y la fila desaparecía sin avisar: en los
        capítulos con veinticuatro palabras y veinticinco kanji el temario se
        quedaba a medias, que es justo lo que no puede pasar en la página que
        existe para que la historia se entienda.
        """
        if y - alto >= M_ABAJO:
            return y
        c.showPage()
        yy = ALTO - M_ARRIBA
        c.setFont("Gothic", 8); c.setFillGray(0.45)
        c.drawString(x0, yy, f"{n}")
        c.setFillGray(0)
        return yy - 9 * mm

    _temario["voc"][1] += sum(1 for p in u["palabras"] if p in vocab)
    _temario["kanji"][1] += sum(1 for ch in u["kanji"] if ch in kanji)
    _temario["gram"][1] += sum(1 for g in u["gramatica"] if g in gram)

    y = cabecera("この しょうの ことば", y)
    for pid in u["palabras"]:
        v = vocab.get(pid)
        if not v: continue
        y = sigue_ficha(y, 7.4 * mm)
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
        _temario["voc"][0] += 1

    # Los kanji del capítulo. Estaban en la unidad y no se enseñaban en ningún
    # sitio del libro: el temario son las tres cosas, palabras, kanji y
    # gramática. Van en una rejilla con la lectura y el significado, que en
    # papel es donde caben sin comerse la página.
    if u["kanji"]:
        y -= 4 * mm
        y = sigue_ficha(y, 18 * mm)
        y = cabecera("この しょうの かんじ", y)
        POR_FILA = 6
        PASO = ANCHO_AYUDA / POR_FILA
        fila = 0
        for i, ch in enumerate(u["kanji"]):
            k = kanji.get(ch)
            if not k: continue
            col = i % POR_FILA
            if col == 0:
                y = sigue_ficha(y, 11 * mm)
                fila += 1
            x = x0 + col * PASO
            c.setFont("Mincho", 15)
            c.drawString(x, y, ch)
            # Debajo, la PALABRA DEL CAPÍTULO que lo usa, no una lectura
            # suelta del diccionario: la primera de 館 es やかた, que no sirve
            # de nada, y la que el alumno acaba de ver es 映画館. Si el kanji
            # no sale en ninguna palabra del capítulo, entonces sí la lectura.
            pie = ""
            for pid in u["palabras"]:
                w = vocab.get(pid)
                if w and ch in (w.get("escritura") or ""):
                    pie = w["escritura"].replace("~", "").replace("～", "")
                    break
            if not pie:
                pie = (k.get("kun") or k.get("on") or [""])[0].split(".")[0].strip("-")
            if pie:
                c.setFont("Mincho" if any(ord(x) > 0x4DFF for x in pie) else "Gothic", 5.6)
                c.setFillGray(0.5)
                c.drawString(x, y - 4.2 * mm, pie[:6])
                c.setFillGray(0)
            _temario["kanji"][0] += 1
            if col == POR_FILA - 1 or i == len(u["kanji"]) - 1:
                y -= 11 * mm

    if u["gramatica"]:
        y -= 4 * mm
        y = sigue_ficha(y, 18 * mm)
        y = cabecera("ぶんぽう", y)
        for gid in u["gramatica"]:
            g = gram.get(gid)
            if not g: continue
            y = sigue_ficha(y, 11.6 * mm)
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
            _temario["gram"][0] += 1

    if "--solo-historia" not in sys.argv: c.showPage()
    else: c.setPageSize((ANCHO, ALTO))

    # ---------------------------------------------------- derecha: la historia
    #
    # El orden es TEXTO y después DIBUJO, no al revés. Antes el dibujo se metía
    # en el hueco que sobraba, así que caía en medio de la historia y cada
    # capítulo lo tenía de un tamaño distinto. Ahora el texto corre entero —por
    # las páginas que haga falta— y el dibujo cierra el capítulo, siempre con
    # la misma medida.
    ANCHO_DIB = CAJA
    ALTO_DIB = CAJA * 2 / 3          # los dibujos son 3:2

    def pon_qr(x, y_base, lado=17 * mm):
        """El QR a la lección de la app: ahí están el test y la traducción.

        Va al final del capítulo, que es cuando uno acaba de leer y quiere
        comprobar si lo ha entendido. Al principio sería una invitación a no
        leer."""
        from reportlab.graphics.barcode import qr
        from reportlab.graphics.shapes import Drawing, Group
        from reportlab.graphics import renderPDF
        w = qr.QrCodeWidget(f"https://jlptest.org/libro/n5?c={n - 1}",
                            barLevel="M", barBorder=0)
        b = w.getBounds()
        g = Group(w)
        g.transform = (lado / (b[2] - b[0]), 0, 0, lado / (b[3] - b[1]),
                       -b[0] * lado / (b[2] - b[0]), -b[1] * lado / (b[3] - b[1]))
        d = Drawing(lado, lado)
        d.add(g)
        renderPDF.draw(d, c, x, y_base)
        c.setFont("Gothic", 5.6); c.setFillGray(0.5)
        c.drawCentredString(x + lado / 2, y_base - 3.6 * mm, "アプリで れんしゅう")
        c.setFillGray(0)

    def pon_dibujo(x, y_base, ancho=None, alto=None):
        ancho = ancho or ANCHO_DIB
        alto = alto or ALTO_DIB
        f = dibujo_de(n, uid)
        if f:
            pinta_dibujo(c, f, x, y_base, ancho, alto)
        else:
            c.setDash(2, 3); c.setStrokeGray(0.7)
            c.rect(x, y_base, ancho, alto); c.setDash()
            c.setFont("Gothic", 7); c.setFillGray(0.5)
            c.drawCentredString(x + ancho / 2, y_base + alto / 2,
                                f"falta el dibujo   {ancho/mm:.0f} × {alto/mm:.0f} mm")
            c.setFillGray(0)
        huecos.append(("grande", n, alto / mm))

    if VERTICAL:
        # En un libro japonés el lomo va a la derecha, así que el margen ancho
        # —el que se come la costura— cambia de lado.
        x_der, x_izq = ANCHO - M_LOMO, M_CANTO
        y_alto = ALTO - M_ARRIBA
        alto_col = y_alto - M_ABAJO
        c.setFont("Gothic", 8); c.setFillGray(0.45)
        c.drawString(M_CANTO, ALTO - M_ARRIBA, f"{n}")
        c.setFillGray(0)

        x = x_der
        cols_tit = columnas(trozos(l["titulo"]), alto_col)[:2]
        cols = cols_tit + columnas(trozos(l["cuerpo"], gram_formas), alto_col)
        extra = 0
        for k, col in enumerate(cols):
            if x - COLUMNA < x_izq:
                c.showPage(); extra += 1
                x, y_alto = x_der, ALTO - M_ARRIBA
                alto_col = y_alto - M_ABAJO
                c.setFont("Gothic", 8); c.setFillGray(0.45)
                c.drawString(M_CANTO, ALTO - M_ARRIBA, f"{n}")
                c.setFillGray(0)
            if k < len(cols_tit):
                pinta_columna(c, x, y_alto, col, titulo=True)
                x -= COLUMNA * 1.5
            else:
                pinta_columna(c, x, y_alto, col)
                x -= COLUMNA


        # El dibujo cierra el capítulo. El ancho útil de la página es
        # exactamente el del dibujo, así que en cuanto se ocupaba UNA columna ya
        # no cabía y el dibujo se iba a una tercera página: quedaban hojas con
        # una sola línea de texto. Se le deja encoger hasta el 75 % antes de
        # pasar de página, que es lo que evita la mayoría de esas huérfanas.
        libre = x - x_izq
        if libre < ANCHO_DIB * 0.75:
            c.showPage(); extra += 1
            x = x_der
            libre = ANCHO_DIB
        anc = min(ANCHO_DIB, libre)
        alt = anc * 2 / 3
        pon_dibujo(x - anc, (ALTO - alt) / 2, anc, alt)
        pon_qr(x - anc, (ALTO - alt) / 2 - 25 * mm)
        if extra:
            largos.append((n, extra))
        c.showPage()
        continue

    x0, y = M_CANTO, ALTO - M_ARRIBA
    c.setFont("Gothic", 8); c.setFillGray(0.45)
    c.drawRightString(M_CANTO + CAJA, y, f"{n}")
    c.setFillGray(0); y -= 9 * mm
    for ln in renglones(trozos(l["titulo"]), CAJA)[:2]:
        pinta_titulo(c, x0, y, ln); y -= INTERLINEA * 1.45
    # Sin filete bajo el título: chocaba con el furigana del primer renglón y
    # el título ya se distingue por la familia y el cuerpo.
    y -= INTERLINEA * 0.15

    extra = 0
    for ln in renglones(trozos(l["cuerpo"], gram_formas), CAJA):
        if y < M_ABAJO:
            c.showPage(); extra += 1
            y = ALTO - M_ARRIBA
            c.setFont("Gothic", 8); c.setFillGray(0.45)
            c.drawRightString(M_CANTO + CAJA, y, f"{n}")
            c.setFillGray(0); y -= 9 * mm
        pinta_renglon(c, x0, y, ln); y -= INTERLINEA

    # El alto que hay que reservar es el del dibujo MÁS el del QR: si sólo se
    # mira el dibujo, el QR se sale de la caja y dos capítulos se quedaban sin él.
    ALTO_CIERRE = ALTO_DIB + 25 * mm
    y -= AIRE_ARRIBA
    if y - ALTO_CIERRE < M_ABAJO:
        c.showPage(); extra += 1
        y = ALTO - M_ARRIBA
    pon_dibujo(x0, y - ALTO_DIB)
    pon_qr(x0 + CAJA - 17 * mm, y - ALTO_DIB - 21 * mm)
    if extra:
        largos.append((n, extra))
    c.showPage()

# ------------------------------------------------------------ el índice final
#
# La idea del libro es que la ficha enseñe las palabras y la página siguiente
# las use. Sale el 80 % del vocabulario y el 57 % de la gramática; el resto se
# queda en la ficha y no llega a leerse nunca. Eso es lo que recoge esto: no un
# glosario del libro entero —para eso está cada capítulo— sino exactamente lo
# que el libro nombra y no llega a usar.
#
# Va al final y no en cada capítulo a propósito: meter ahí una frase de ejemplo
# por cada punto que falta convertiría la ficha en una gramática, y la ficha
# tiene que caber de un vistazo.

def _taquigrafia(s):
    """(base, lectura|None, gótica) desde «{漢字|かんじ}» y «[gramática]».

    Se parte aquí y no con trozos() porque trozos() decide la ゴシック
    buscando la forma del punto dentro del texto, y en los ejemplos la forma
    va escrita con los espacios del 分かち書き —「た ことが あります」 contra
    「たことがある」— y no la encontraría nunca."""
    fuera, i, g = [], 0, False
    while i < len(s):
        ch = s[i]
        if ch == "[": g = True; i += 1; continue
        if ch == "]": g = False; i += 1; continue
        if ch == "{":
            j = s.index("}", i)
            base, _, lec = s[i + 1:j].partition("|")
            fuera.append((base, lec or None, g)); i = j + 1; continue
        fuera.append((ch, None, g)); i += 1
    return fuera


def _titulo_seccion(txt, sub):
    y = ALTO - M_ARRIBA - 6 * mm
    c.setFont("Mincho", 16); c.setFillGray(0); c.drawString(M_CANTO, y, txt)
    y -= 7.5 * mm
    c.setFont("Gothic", 7.6); c.setFillGray(0.45)
    for linea in sub:
        c.drawString(M_CANTO, y, linea); y -= 4.6 * mm
    c.setFillGray(0)
    return y - 5 * mm


if "--sin-portada" not in sys.argv and not tope and not desde:
    fuera_f = pathlib.Path("data/dist/fuera_del_libro.json")
    apend_f = pathlib.Path("data/fuente/libro_apendice.json")
    if fuera_f.exists() and apend_f.exists():
        _fuera = json.load(open(fuera_f))
        _ejem = json.load(open(apend_f)); _ejem.pop("_", None)
        _gpor = {g["forma"]: g for g in gram.values() if g["nivel"] == "N5"}
        # El banco los tiene con el nombre inglés; en la página quedan en
        # japonés como todo lo demás.
        _COMO_SE_DICE = {"い-adjectives": "い けいようし",
                         "な-adjectives": "な けいようし"}

        # ---- 1. la gramática que no llega a usarse, con un ejemplo ----
        y = _titulo_seccion("ぶんぽうの さくいん", [
            "Los puntos de gramática que el libro nombra en la ficha de un",
            "capítulo pero que no llegan a aparecer dentro de la historia.",
            "El ejemplo va con la gente del libro, y la parte en otra letra",
            "es el punto."])
        ALTO_G = 25 * mm
        for it in _fuera["gramatica"]:
            g = _gpor.get(it["forma"])
            ej = _ejem.get(g["id"]) if g else None
            if not ej:
                continue
            # Se miden las líneas ANTES de decidir si cabe: un ejemplo de dos
            # líneas ocupa más que el hueco fijo, y así no se parte la ficha
            # de la frase que la explica.
            lineas = renglones(_taquigrafia(ej["ej"]), CAJA)
            if y - (ALTO_G + (len(lineas) - 1) * INTERLINEA) < M_ABAJO:
                c.showPage(); y = ALTO - M_ARRIBA - 4 * mm
            c.setFillGray(0.955)
            c.roundRect(M_CANTO - 1.5 * mm, y - 2.6 * mm, CAJA, 9.2 * mm,
                        1.2 * mm, stroke=0, fill=1)
            c.setFillGray(0); c.setFont("Gothic", 10)
            c.drawString(M_CANTO, y + 2.6 * mm,
                         _COMO_SE_DICE.get(it["forma"], it["forma"]))
            c.setFont("Gothic", 6.4); c.setFillGray(0.5)
            c.drawRightString(ANCHO - M_LOMO, y + 3 * mm, f'cap. {it["cap"]}')
            c.setFont("Gothic", 7.4); c.setFillGray(0.28)
            c.drawString(M_CANTO, y - 0.8 * mm, recortar(it["es"], 58))
            c.setFillGray(0)
            y -= 13.5 * mm
            for ln in lineas:
                pinta_renglon(c, M_CANTO, y, ln); y -= INTERLINEA
            y -= 1 * mm
            c.setFont("Gothic", 7.2); c.setFillGray(0.42)
            c.drawString(M_CANTO, y, recortar(ej["es"], 78))
            c.setFillGray(0)
            y -= 11 * mm
        c.showPage()

        # ---- 2. las palabras que se quedan sólo en la ficha ----
        y = _titulo_seccion("ふろく・ことばの さくいん", [
            "Las palabras que aparecen en la ficha de un capítulo pero no en",
            "su historia. Son del N5 igual que las demás: entran en el examen",
            "aunque aquí no haya salido la ocasión de usarlas."])
        COL = [M_CANTO, M_CANTO + CAJA / 2 + 3 * mm]
        ANCHO_COL = CAJA / 2 - 3 * mm
        col, y0 = 0, y
        for w in _fuera["vocabulario"]:
            if y < M_ABAJO + 6 * mm:
                if col == 0:
                    col, y = 1, y0
                else:
                    c.showPage(); col, y = 0, ALTO - M_ARRIBA - 4 * mm; y0 = y
            x = COL[col]
            if w["lectura"] and w["lectura"] != w["escritura"]:
                c.setFont("Gothic", 6); c.setFillGray(0.5)
                c.drawString(x, y + 4.2 * mm, w["lectura"])
            c.setFillGray(0); c.setFont("Mincho", 10)
            c.drawString(x, y, w["escritura"])
            c.setFont("Gothic", 6); c.setFillGray(0.55)
            c.drawRightString(x + ANCHO_COL, y, f'{w["cap"]}')
            c.setFont("Gothic", 7); c.setFillGray(0.3)
            c.drawString(x, y - 4 * mm, recortar(w["es"], 38))
            c.setFillGray(0)
            y -= 11.4 * mm
        c.showPage()

_paginas = c.getPageNumber() - 1
c.save()

# El temario de cada capítulo tiene que llevar TODO lo de su unidad. Antes se
# saltaba en silencio lo que no cabía en la página, así que los capítulos
# grandes salían con la lista a medias.
for _que, (_puesto, _hay) in _temario.items():
    if _puesto != _hay:
        print(f"  ✗ TEMARIO INCOMPLETO: {_que} {_puesto} de {_hay}", file=sys.stderr)
print(f"  temario: {_temario['voc'][0]} palabras · {_temario['kanji'][0]} kanji · "
      f"{_temario['gram'][0]} puntos de gramática, todos puestos"
      if all(a == b for a, b in _temario.values()) else "")

grandes = [h for h in huecos if h[0] == "grande"]
vinetas = [h for h in huecos if h[0] == "viñeta"]
print(f"{SALIDA}  ·  {len(capitulos)} capítulos = {_paginas} páginas")
print(f"  dibujo grande: {len(grandes)}   (alto medio "
      f"{sum(h[2] for h in grandes)/max(1,len(grandes)):.0f} mm)")
print(f"  sólo viñeta:   {len(vinetas)}   capítulos {[h[1] for h in vinetas]}")
if largos:
    print(f"  de más de una página: {len(largos)} "
          f"(capítulo, páginas de más) → {largos[:12]}")
