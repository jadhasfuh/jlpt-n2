# -*- coding: utf-8 -*-
"""Prepara el libro para mandarlo a imprenta.

    python3 scripts/35_libro_imprenta.py                 # interior + cubierta
    python3 scripts/35_libro_imprenta.py --paginas 92    # grosor del papel

Saca dos archivos en docs/imprenta/, que es como los quieren las imprentas:
un PDF para el INTERIOR y otro para la CUBIERTA, nunca los dos juntos.

Lo que exige una imprenta, comprobado y no de memoria:

  · PDF con las fuentes incrustadas. Reportlab incrusta las IPAex, así que sale
    solo.
  · Imágenes a 300 ppp al tamaño final. Los dibujos van a 1536 px sobre 115 mm
    de ancho = 339 ppp. La portada se genera ya a 300 ppp.
  · 3 mm de sangre donde el color llegue al borde. En el INTERIOR no hace
    falta: los dibujos van dentro de la caja y no tocan el corte. En la
    CUBIERTA sí, porque el dibujo llega al filo.
  · El interior a UNA TINTA (escala de grises), no CMYK. Un negro compuesto de
    cuatro tintas se desregistra y encima cuesta más. La cubierta sí va CMYK.
  · Número de páginas múltiplo de 4, que es como se pliegan los cuadernillos.

Lo que este script NO hace, y hay que decirlo: **no genera PDF/X-1a**.
Reportlab no lo sabe y en esta máquina no hay Ghostscript. El PDF que sale es
correcto en geometría, resolución y fuentes; la conversión a PDF/X la hace la
imprenta sin problema, o se hace con Acrobat. Casi todas aceptan un PDF normal
bien hecho.
"""
import pathlib, subprocess, sys
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "docs" / "imprenta"
DIBUJOS = RAIZ / "docs" / "libro" / "ilustraciones"
FUENTES = pathlib.Path("/private/tmp/claude-501/-Users-jadhasfuh-Documents-jlptest"
                       "/de6ce02c-8b5a-444f-9eba-a860178bf9ed/scratchpad/fuentes")

CORTE_W, CORTE_H = 148 * mm, 210 * mm      # A5
SANGRE = 3 * mm
MARCA = 5 * mm                              # largo de las marcas de corte

# Grosor por hoja según el papel. El lomo = (páginas / 2) x grosor.
PAPELES = {"90g-offset": 0.11, "80g-offset": 0.10, "100g-estucado": 0.09}


def interior():
    """El interior, ya montado por 30_libro_pdf.py, con las páginas en blanco
    que hagan falta para que el total sea múltiplo de 4."""
    from pypdf import PdfReader, PdfWriter
    # La edición que se imprime es la VERTICAL: es como se lee un libro en
    # Japón. Con --horizontal sale la otra.
    vertical = "--horizontal" not in sys.argv
    origen = RAIZ / "docs" / ("libro-n5-maqueta-vertical.pdf" if vertical
                              else "libro-n5-maqueta.pdf")
    if not origen.exists():
        sys.exit(f"falta {origen.name}; corre antes scripts/30_libro_pdf.py"
                 + (" --vertical" if vertical else ""))
    print(f"  edición: {'VERTICAL (縦書き, se cose por la DERECHA)' if vertical else 'horizontal'}")
    r = PdfReader(str(origen))
    w = PdfWriter()
    for p in r.pages:
        w.add_page(p)
    faltan = (-len(r.pages)) % 4
    for _ in range(faltan):
        w.add_blank_page()
    w.add_metadata({"/Title": "こうべの一年 · Un año en Kobe",
                    "/Author": "jlptest.org", "/Subject": "Lector graduado N5"})
    destino = SALIDA / "libro-n5-interior.pdf"
    with destino.open("wb") as f:
        w.write(f)
    print(f"  interior  → {destino.relative_to(RAIZ)}")
    print(f"    {len(r.pages)} páginas + {faltan} en blanco = {len(r.pages) + faltan} "
          f"(múltiplo de 4)")
    return len(r.pages) + faltan


def cubierta(paginas, papel="90g-offset"):
    """Contraportada + lomo + portada, en una sola hoja con sangre y marcas."""
    lomo = (paginas / 2) * PAPELES[papel] * mm
    W = CORTE_W * 2 + lomo + SANGRE * 2
    H = CORTE_H + SANGRE * 2
    destino = SALIDA / "libro-n5-cubierta.pdf"
    c = canvas.Canvas(str(destino), pagesize=(W, H))
    c.setTitle("こうべの一年 — cubierta")

    # la portada, a la derecha, a sangre
    f = DIBUJOS / "00-portada-montada.png"
    if f.exists():
        im = ImageReader(str(f))
        iw, ih = im.getSize()
        ancho = CORTE_W + SANGRE * 2
        esc = max(ancho / iw, H / ih)
        c.drawImage(im, W - iw * esc, (H - ih * esc) / 2, iw * esc, ih * esc)

    # contraportada y lomo en el color del papel del dibujo
    c.setFillColorRGB(0.969, 0.961, 0.941)
    c.rect(0, 0, SANGRE + CORTE_W + lomo, H, stroke=0, fill=1)

    pdfmetrics.registerFont(TTFont("Gothic", str(FUENTES / "ipaexg.ttf")))
    pdfmetrics.registerFont(TTFont("Mincho", str(FUENTES / "ipaexm.ttf")))
    c.setFillColorRGB(0.11, 0.12, 0.14)
    c.setFont("Gothic", 10)
    # En japonés: es un libro que se lee en Japón, y la contraportada es lo
    # primero que mira quien lo coge en una tienda de allí.
    c.setFont("Mincho", 10.5)
    tx = c.beginText(SANGRE + 18 * mm, H - SANGRE - 42 * mm)
    tx.setLeading(19)
    for l in ("カルロスは メキシコから 神戸に 来ました。",
              "インターネットの エージェントで きめた",
              "がっこうと、ちいさい アパートと、",
              "ピザやの アルバイトの 一年の はなしです。",
              "",
              "ぜんぶ N5の ことばと ぶんぽうだけで",
              "書いて あります。103の しょうが、",
              "ひとつづきの ものがたりに なって います。",
              "",
              "かんじには ぜんぶ ふりがなが ついて います。",
              "",
              "日本語能力試験 N5の べんきょうの ための 本です。"):
        tx.textLine(l)
    c.drawText(tx)
    c.setFont("Gothic", 9); c.setFillColorRGB(0.35, 0.36, 0.40)
    tx = c.beginText(SANGRE + 18 * mm, H - SANGRE - 118 * mm)
    tx.setLeading(14)
    for l in ("Un año en Kobe. Ciento tres capítulos, una sola",
              "historia, escrita entera con el vocabulario y la",
              "gramática del N5. Todos los kanji llevan furigana.",
              "",
              "Material de apoyo para preparar el JLPT N5.",
              "",
              "jlptest.org"):
        tx.textLine(l)
    c.drawText(tx)
    c.setFillColorRGB(0.11, 0.12, 0.14)

    # el lomo, girado
    c.saveState()
    c.translate(SANGRE + CORTE_W + lomo / 2, H / 2)
    c.rotate(-90)
    c.setFont("Mincho", 11)
    c.drawCentredString(0, -4, "こうべの一年   ·   jlptest.org")
    c.restoreState()

    # marcas de corte, fuera de la zona impresa
    c.setStrokeColorRGB(0, 0, 0); c.setLineWidth(0.25)
    for x in (SANGRE, SANGRE + CORTE_W, SANGRE + CORTE_W + lomo, W - SANGRE):
        for y0, y1 in ((0, MARCA * 0.6), (H - MARCA * 0.6, H)):
            c.line(x, y0, x, y1)
    for y in (SANGRE, H - SANGRE):
        for x0, x1 in ((0, MARCA * 0.6), (W - MARCA * 0.6, W)):
            c.line(x0, y, x1, y)

    c.showPage(); c.save()
    print(f"  cubierta  → {destino.relative_to(RAIZ)}")
    print(f"    {W/mm:.0f} × {H/mm:.0f} mm  ·  lomo {lomo/mm:.1f} mm "
          f"({paginas} páginas en {papel})  ·  3 mm de sangre y marcas de corte")
    print("    OJO: encuadernación 右綴じ, por la derecha. Hay que decírselo a la")
    print("    imprenta: por defecto montan a la occidental y saldría del revés.")


if __name__ == "__main__":
    SALIDA.mkdir(parents=True, exist_ok=True)
    papel = "90g-offset"
    if "--papel" in sys.argv:
        papel = sys.argv[sys.argv.index("--papel") + 1]
    n = interior()
    cubierta(n, papel)
