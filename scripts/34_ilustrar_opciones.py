# -*- coding: utf-8 -*-
"""Dibuja las cuatro opciones de 課題理解 (N5, y N4 con --nivel N4).

    python3 scripts/34_ilustrar_opciones.py            # N5, los que falten
    python3 scripts/34_ilustrar_opciones.py --nivel N4

En el examen real, a nivel N5 y N4 las opciones de 課題理解 no son texto: son
cuatro viñetas, y el alumno elige mirando. Eso es parte de la dificultad —hay
que retener el audio mientras se mira—, así que con opciones de texto el
ejercicio es más fácil de lo que debería.

Cada ítem son cuatro dibujos, `<id>-1.png` … `<id>-4.png`, uno por opción.

La diferencia con 33_ilustrar_examen.py: allí el dibujo sólo pone la escena y
la respuesta está en el audio; aquí **el dibujo ES la respuesta**. Si el alumno
no puede contar dos huevos y distinguirlos de tres, la pregunta no tiene
solución. Por eso el estilo se mantiene pero la exigencia de precisión sube: lo
que la opción diga, y sólo eso, dibujado de forma que se cuente de un vistazo.
"""
import json, pathlib, re, sys, importlib.util

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "public" / "examen" / "opciones"

_spec = importlib.util.spec_from_file_location("il", RAIZ / "scripts/32_ilustrar_libro.py")
_il = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_il)

_ex = importlib.util.spec_from_file_location("ex", RAIZ / "scripts/33_ilustrar_examen.py")
_examen = importlib.util.module_from_spec(_ex)
_ex.loader.exec_module(_examen)

PRECISION = """
THIS DRAWING IS THE ANSWER TO AN EXAM QUESTION. Precision beats everything:
- Draw EXACTLY what is listed, nothing more and nothing less. No extra objects,
  no decorative props, no background clutter. An extra item makes the question
  unanswerable.
- If a NUMBER is given, draw exactly that many, clearly separated and easy to
  count at a glance. Never overlap them.
- Each object must be recognisable on its own, from a distance, without
  context. Draw the plainest, most typical version of the thing.
- Centre the objects with even space around them. Nobody in the picture unless
  the option names a person.
""".strip()


# --------------------------------------------------- los dos casos que fallan
#
# 1. COLOR. En línea negra no hay forma de distinguir 「青いシャツ」 de
#    「白いシャツ」: salían las dos como una camisa de contorno, o sea dos
#    opciones idénticas y una pregunta sin respuesta. Esas van en color. En el
#    papel del examen no se puede, pero esto es una pantalla y el color no
#    cuesta nada — y encima 青い/赤い/白い es justo el vocabulario que se está
#    preguntando.
#
# 2. RELOJES. El modelo pone las manecillas donde le parece: pedimos 二時三十分
#    y dibujó las 3:30, con la aguja de la hora en el 3 en vez de a medio camino
#    entre el 2 y el 3. Un reloj es geometría, así que se dibuja aquí y no se
#    le pide a nadie. Es el caso en que la precisión manda sobre el estilo.

ESTILO_COLOR = """
STYLE — plain line drawing in FLAT COLOUR, for a Japanese listening paper.
A clean black outline, and inside it ONE FLAT SOLID COLOUR per object — the
exact colour the option names, bright and unmistakable. Blue is a clear medium
blue, red is a clear red, white is plain white with only the outline. No
shading, no gradients, no texture, no grey, no pattern: one flat fill and
nothing else. White background.

THE COLOUR IS THE ANSWER. Two options in this question differ ONLY in colour,
so if the fill is grey, washed out, or the wrong hue the question has no
solution. Make the colour obvious at a glance.

HARD RULES:
1. NO TEXT anywhere: no letters, no numbers, no words, no labels, no logos.
2. Draw exactly what is listed and nothing else. If a number is given, draw
   exactly that many, clearly separated and easy to count.
3. Centred on white with even space around. Nobody in the picture unless the
   option names a person.

FORBIDDEN: Studio Ghibli; Pixar or any 3D look; manga or anime; cute
picture-book style; photorealism; shading; drop shadows.
""".strip()

COLORES = ("青", "赤", "白", "黒", "黄", "緑", "茶", "紫",
           "あお", "あか", "しろ", "くろ", "きいろ", "みどり",
           "ピンク", "オレンジ")

CIFRA = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6,
         "七": 7, "八": 8, "九": 9, "十": 10}


def _numero(s):
    """Kanji a entero, para 1..59: 二十 → 20, 五十 → 50, 二十五 → 25."""
    if not s: return None
    if "十" in s:
        a, _, b = s.partition("十")
        return (CIFRA.get(a, 1) if a else 1) * 10 + (CIFRA.get(b, 0) if b else 0)
    return CIFRA.get(s)


def hora_de(texto):
    """(hora, minuto) si la opción es una hora; si no, None."""
    m = re.fullmatch(r"\s*([一二三四五六七八九十]+)時(半|([一二三四五六七八九十]+)分)?\s*", texto)
    if not m: return None
    h = _numero(m.group(1))
    if h is None: return None
    if m.group(2) == "半": return (h, 30)
    if m.group(3):
        mi = _numero(m.group(3))
        return (h, mi) if mi is not None else None
    return (h, 0)


def pinta_reloj(h, mi, destino, lado=1024):
    """Un reloj de pared con la hora exacta, al estilo de los demás dibujos:
    línea negra gruesa sobre blanco y sin un solo número."""
    from PIL import Image, ImageDraw
    import math
    esc = 4                                   # se dibuja en grande y se reduce
    S = lado * esc
    im = Image.new("L", (S, S), 255)
    d = ImageDraw.Draw(im)
    c, r = S / 2, S * 0.40
    d.ellipse([c - r, c - r, c + r, c + r], outline=0, width=int(S * 0.012))
    d.ellipse([c - r * 0.93, c - r * 0.93, c + r * 0.93, c + r * 0.93],
              outline=0, width=int(S * 0.004))
    for k in range(60):
        a = math.radians(k * 6 - 90)
        largo = r * (0.10 if k % 5 == 0 else 0.045)
        gordo = int(S * (0.010 if k % 5 == 0 else 0.004))
        r1 = r * 0.86
        d.line([c + r1 * math.cos(a), c + r1 * math.sin(a),
                c + (r1 - largo) * math.cos(a), c + (r1 - largo) * math.sin(a)],
               fill=0, width=gordo)
    def aguja(ang, largo, gordo):
        a = math.radians(ang - 90)
        d.line([c, c, c + largo * math.cos(a), c + largo * math.sin(a)],
               fill=0, width=gordo)
    # la aguja de la hora avanza con los minutos: a y media va a medio camino
    aguja(((h % 12) + mi / 60) * 30, r * 0.50, int(S * 0.022))
    aguja(mi * 6, r * 0.76, int(S * 0.014))
    d.ellipse([c - S * 0.012, c - S * 0.012, c + S * 0.012, c + S * 0.012], fill=0)
    im.resize((lado, lado), Image.LANCZOS).save(destino)
    print(f"  → {destino.relative_to(RAIZ)}  (reloj {h}:{mi:02d}, dibujado a mano)")


def items(nivel):
    fuera = []
    for f in sorted((RAIZ / "data/fuente/examen").glob("*.json")):
        for it in json.loads(f.read_text(encoding="utf-8")):
            if it.get("tipo") == "kadai" and it["nivel"] == nivel:
                fuera.append(it)
    return fuera


def dibuja(it, i, opcion):
    limpia = _examen.limpia(opcion)
    destino = SALIDA / f"{it['id']}-{i + 1}.png"

    reloj = hora_de(limpia)
    if reloj:
        pinta_reloj(reloj[0], reloj[1], destino)
        return

    # Si la opción nombra un color, el dibujo va en color; en línea negra dos
    # opciones que sólo se diferencian en el color salen idénticas.
    hay_color = any(c in limpia for c in COLORES)
    # Parchear frases sueltas del estilo monocromo no bastaba: salían grises.
    # Con su propio bloque el color sale del color que pide la opción.
    estilo = ESTILO_COLOR if hay_color else _examen.ESTILO

    # Se le pasan LAS CUATRO opciones, no sólo la suya. El japonés elide el
    # sustantivo —「青いのと 赤いの」 son かばん, que sólo aparece en las otras
    # opciones— y sin verlas el modelo se lo inventa: pidió bolsos y dibujó
    # lápices. Además así sabe de qué tiene que distinguirse.
    todas = "\n".join(
        f"  {k + 1}. {_examen.limpia(o)}" + ("   ← DRAW THIS ONE" if k == i else "")
        for k, o in enumerate(it["opciones"]))
    prompt = (estilo + "\n\n" + PRECISION + "\n\nSUBJECT — option "
              f"{i + 1} of 4 for a Japanese listening question.\n\n"
              f"THE QUESTION (context only, do not draw it):\n"
              f"{_examen.limpia(it['enunciado'])}\n\n"
              f"THE FOUR OPTIONS, so you know what the objects are and what "
              f"this one has to differ from:\n{todas}\n\n"
              f"WHAT TO DRAW (Japanese, from the exam bank) — exactly this and "
              f"nothing else:\n{limpia}\n\n"
              "Square composition on white. No text, no numbers, no labels.")
    print(f"  {it['id']}-{i + 1}  {limpia[:38]}" + ("   [color]" if hay_color else ""))
    _il.genera(prompt, destino, size="1024x1024", gris=not hay_color)


def main():
    nivel = "N5"
    if "--nivel" in sys.argv:
        nivel = sys.argv[sys.argv.index("--nivel") + 1]
    todos = items(nivel)
    print(f"課題理解 de {nivel}: {len(todos)} ítems = {len(todos) * 4} dibujos")
    SALIDA.mkdir(parents=True, exist_ok=True)
    for it in todos:
        for i, op in enumerate(it["opciones"]):
            if (SALIDA / f"{it['id']}-{i + 1}.png").exists():
                continue
            dibuja(it, i, op)


def manifiesto():
    """La lista de ítems que tienen SUS CUATRO opciones dibujadas.

    La app la lee para saber cuándo pintar viñetas en vez de texto. Se escribe
    aquí y no se deduce en el navegador: probar a cargar la imagen y esperar el
    error da un parpadeo, y con un ítem a medio dibujar dejaría dos opciones
    con dibujo y dos con texto, que es la peor de las combinaciones.
    """
    completos = []
    for f in sorted((RAIZ / "data/fuente/examen").glob("*.json")):
        for it in json.loads(f.read_text(encoding="utf-8")):
            if it.get("tipo") != "kadai":
                continue
            n = len(it["opciones"])
            if all((SALIDA / f"{it['id']}-{i + 1}.png").exists() for i in range(n)):
                completos.append(it["id"])
    destino = RAIZ / "src/lib/opciones-ilustradas.json"
    destino.write_text(json.dumps(sorted(completos), indent=1) + "\n", encoding="utf-8")
    print(f"ítems con las cuatro opciones dibujadas: {len(completos)} → {destino.relative_to(RAIZ)}")


if __name__ == "__main__":
    if "--manifiesto" in sys.argv:
        manifiesto()
    else:
        main()
        manifiesto()
