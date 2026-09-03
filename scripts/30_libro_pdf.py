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

FUENTES = pathlib.Path("/private/tmp/claude-501/-Users-jadhasfuh-Documents-jlptest"
                       "/de6ce02c-8b5a-444f-9eba-a860178bf9ed/scratchpad/fuentes")
pdfmetrics.registerFont(TTFont("Mincho", str(FUENTES / "ipaexm.ttf")))
pdfmetrics.registerFont(TTFont("Gothic", str(FUENTES / "ipaexg.ttf")))

INVISIBLE = re.compile(r"[\u200b-\u200f\u2028\u2029\ufeff\xa0]")
RUBY = re.compile(r"<ruby>([^<]+)<rt>([^<]+)</rt></ruby>")
TAGS = re.compile(r"<[^>]+>")

def trozos(html):
    """El texto partido en (base, lectura|None), respetando el orden."""
    fuera, i = [], 0
    for m in RUBY.finditer(html):
        if m.start() > i:
            fuera += [(c, None) for c in INVISIBLE.sub("", TAGS.sub("", html[i:m.start()]))]
        fuera.append((m.group(1), m.group(2)))
        i = m.end()
    fuera += [(c, None) for c in INVISIBLE.sub("", TAGS.sub("", html[i:]))]
    return [t for t in fuera if t[0] != ""]

def recortar(t, limite=34):
    """Corta por palabra y pone puntos suspensivos, no a mitad de «Sustantivo»."""
    t = INVISIBLE.sub("", t)
    if len(t) <= limite: return t
    corte = t[:limite].rsplit(" ", 1)[0]
    return (corte if len(corte) > limite * 0.6 else t[:limite - 1]) + "…"

def ancho(t, fuente=("Mincho", CUERPO)):
    return pdfmetrics.stringWidth(t, fuente[0], fuente[1])

def renglones(ts, caja):
    """Reparte los trozos en renglones. Se corta en los espacios, que es donde
    corta un libro para principiantes; si un bloque no cabe, se corta igual."""
    fuera, linea, x = [], [], 0.0
    for base, lec in ts:
        w = max(ancho(base), ancho(lec or "", ("Mincho", FURIGANA)))
        if base == " ":
            if x + w > caja and linea:
                fuera.append(linea); linea, x = [], 0.0
                continue
        elif x + w > caja and linea:
            fuera.append(linea); linea, x = [], 0.0
        linea.append((base, lec)); x += w
    if linea: fuera.append(linea)
    return fuera

def pinta_renglon(c, x, y, linea):
    for base, lec in linea:
        w = ancho(base)
        if lec:
            wl = ancho(lec, ("Mincho", FURIGANA))
            c.setFont("Mincho", FURIGANA)
            c.drawString(x + (w - wl) / 2, y + CUERPO * 0.92, lec)
        c.setFont("Mincho", CUERPO)
        c.drawString(x, y, base)
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
    for base, lec in ts:
        h = len(base) * CUERPO
        if base == " ":
            if usado + h > alto and col:
                fuera.append(col); col, usado = [], 0.0
                continue
        elif usado + h > alto and col:
            fuera.append(col); col, usado = [], 0.0
        col.append((base, lec)); usado += h
    if col: fuera.append(col)
    return fuera

def pinta_columna(c, x, y_alto, col):
    """Una columna. `x` es el eje; el furigana va a su derecha."""
    y = y_alto
    for base, lec in col:
        if lec:                                   # furigana al lado derecho
            c.setFont("Mincho", FURIGANA)
            paso = (len(base) * CUERPO) / max(1, len(lec))
            for i, ch in enumerate(lec):
                c.drawString(x + CUERPO * 0.52,
                             y - (i + 1) * paso + paso * 0.25, ch)
        c.setFont("Mincho", CUERPO)
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
capitulos = orden[:tope] if tope else orden

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
sobran = []   # capítulos a los que no les cabe el texto en vertical

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

for n, uid in enumerate(capitulos, 1):
    u, l = unidades[uid], lecturas[uid]
    if "--solo-historia" in sys.argv:
        pass
    # ---------------------------------------------------- izquierda: la ayuda
    x0, y = M_CANTO, ALTO - M_ARRIBA
    c.setFont("Gothic", 8); c.setFillGray(0.45)
    c.drawString(x0, y, f"{n}")
    c.setFillGray(0)
    y -= 8 * mm
    c.setFont("Gothic", 8.5); c.setFillGray(0.35)
    c.drawString(x0, y, "この しょうの ことば")
    c.setFillGray(0); y -= 6 * mm
    for pid in u["palabras"]:
        v = vocab.get(pid)
        if not v or y < M_ABAJO: continue
        c.setFont("Mincho", 9.5); c.drawString(x0, y, v["escritura"])
        c.setFont("Gothic", 7.5); c.setFillGray(0.45)
        c.drawString(x0 + 26 * mm, y, v["lectura"])
        c.setFillGray(0.15); c.setFont("Gothic", 7.5)
        c.drawString(x0 + 50 * mm, y, recortar(v["es"]))
        c.setFillGray(0); y -= 4.6 * mm
    if u["gramatica"] and y > M_ABAJO + 14 * mm:
        y -= 3 * mm
        c.setFont("Gothic", 8.5); c.setFillGray(0.35)
        c.drawString(x0, y, "ぶんぽう"); c.setFillGray(0); y -= 6 * mm
        for gid in u["gramatica"]:
            g = gram.get(gid)
            if not g or y < M_ABAJO: continue
            c.setFont("Mincho", 9.5); c.drawString(x0, y, g["forma"])
            c.setFillGray(0.15); c.setFont("Gothic", 7.5)
            c.drawString(x0 + 50 * mm, y, recortar(g["es"])); c.setFillGray(0)
            y -= 4.6 * mm
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
            alto_col_p = (ALTO - M_ARRIBA - (prueba + 6 * mm if prueba else 0)) - M_ABAJO
            n_tit = len(columnas(trozos(l["titulo"]), alto_col_p)[:2])
            n_cue = len(columnas(trozos(l["cuerpo"]), alto_col_p))
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

        y_alto = ALTO - M_ARRIBA - (alto_dib + 6 * mm if alto_dib else 0)
        alto_col = (y_alto - M_ABAJO)
        cols_tit = columnas(trozos(l["titulo"]), alto_col)
        x = x_der
        for col in cols_tit[:2]:
            pinta_columna(c, x, y_alto, col); x -= COLUMNA * 1.15

        cols = columnas(trozos(l["cuerpo"]), alto_col)
        cabidas = 0
        for col in cols:
            if x - COLUMNA < x_izq: break
            pinta_columna(c, x, y_alto, col); x -= COLUMNA
            cabidas += 1
        if cabidas < len(cols):
            sobran.append((n, len(cols) - cabidas))
        c.showPage()
        continue

    x0, y = M_LOMO, ALTO - M_ARRIBA
    c.setFont("Gothic", 8); c.setFillGray(0.45)
    c.drawRightString(ANCHO - M_CANTO, y, f"{n}")
    c.setFillGray(0); y -= 7 * mm
    for ln in renglones(trozos(l["titulo"]), CAJA)[:2]:
        pinta_renglon(c, x0, y, ln); y -= INTERLINEA * 1.25

    lineas = renglones(trozos(l["cuerpo"]), CAJA)
    alto_texto = len(lineas) * INTERLINEA
    y_texto_fin = M_ABAJO
    hueco_alto = (y - 4 * mm) - (y_texto_fin + alto_texto)

    if hueco_alto > 20 * mm:                       # cabe el dibujo grande
        f = dibujo_de(n, uid)
        if f:
            pinta_dibujo(c, f, x0, y - hueco_alto, CAJA, hueco_alto - 4 * mm)
        else:
            c.setDash(2, 3); c.setStrokeGray(0.7)
            c.rect(x0, y - hueco_alto, CAJA, hueco_alto - 4 * mm)
            c.setDash()
            c.setFont("Gothic", 7); c.setFillGray(0.5)
            c.drawCentredString(x0 + CAJA / 2, y - hueco_alto / 2,
                                f"falta el dibujo   {CAJA/mm:.0f} × "
                                f"{(hueco_alto-4*mm)/mm:.0f} mm")
            c.setFillGray(0)
        huecos.append(("grande", n, (hueco_alto - 4 * mm) / mm))
        y -= hueco_alto
    else:                                          # sólo cabe una viñeta
        huecos.append(("viñeta", n, 0))

    for ln in lineas:
        pinta_renglon(c, x0, y, ln); y -= INTERLINEA
    c.showPage()

c.save()

grandes = [h for h in huecos if h[0] == "grande"]
vinetas = [h for h in huecos if h[0] == "viñeta"]
print(f"{SALIDA}  ·  {len(capitulos)} capítulos = {len(capitulos)*2} páginas")
print(f"  dibujo grande: {len(grandes)}   (alto medio "
      f"{sum(h[2] for h in grandes)/max(1,len(grandes)):.0f} mm)")
print(f"  sólo viñeta:   {len(vinetas)}   capítulos {[h[1] for h in vinetas]}")
if sobran:
    print(f"  NO CABEN en vertical: {len(sobran)} capítulos "
          f"(capítulo, columnas que se salen) → {sobran[:12]}")
