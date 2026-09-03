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

# ------------------------------------------------------------------- los datos
lecturas = {l["unidad_id"]: l for l in json.load(open("data/dist/lecturas.json"))}
unidades = {u["id"]: u for u in json.load(open("data/dist/unidades.json"))}
vocab = {v["id"]: v for v in json.load(open("data/dist/vocabulario.json"))}
gram = {g["id"]: g for g in json.load(open("data/dist/gramatica.json"))}
orden = json.load(open("data/fuente/orden_libro.json"))["N5"]

tope = None
if "--capitulos" in sys.argv:
    tope = int(sys.argv[sys.argv.index("--capitulos") + 1])
capitulos = orden[:tope] if tope else orden

SALIDA = pathlib.Path("docs/libro-n5-maqueta.pdf")
c = canvas.Canvas(str(SALIDA), pagesize=(ANCHO, ALTO))
huecos = []

# ---------------------------------------------------------------- la portada
c.setFont("Mincho", 30)
c.drawCentredString(ANCHO / 2, ALTO * 0.62, "カルロスの 一年")
c.setFont("Gothic", 11); c.setFillGray(0.4)
c.drawCentredString(ANCHO / 2, ALTO * 0.62 - 14 * mm, "El año de Carlos")
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
        c.drawString(x0 + 50 * mm, y, INVISIBLE.sub("", v["es"])[:34])
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
            c.drawString(x0 + 50 * mm, y, INVISIBLE.sub("", g["es"])[:34]); c.setFillGray(0)
            y -= 4.6 * mm
    if "--solo-historia" not in sys.argv: c.showPage()
    else: c.setPageSize((ANCHO, ALTO))

    # ---------------------------------------------------- derecha: la historia
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
        c.setDash(2, 3); c.setStrokeGray(0.7)
        c.rect(x0, y - hueco_alto, CAJA, hueco_alto - 4 * mm)
        c.setDash()
        c.setFont("Gothic", 7); c.setFillGray(0.5)
        c.drawCentredString(x0 + CAJA / 2, y - hueco_alto / 2,
                            f"dibujo   {CAJA/mm:.0f} × {(hueco_alto-4*mm)/mm:.0f} mm")
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
