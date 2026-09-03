# -*- coding: utf-8 -*-
"""Dibuja las escenas de 発話表現 del banco de examen.

    python3 scripts/33_ilustrar_examen.py           # los que falten
    python3 scripts/33_ilustrar_examen.py --todos   # rehace también los hechos

Estos 28 ítems (N3, N4 y N5) llevan la instrucción 「絵を見ながら質問を聞いて
ください。矢印（→）の人は何と言いますか」 —«mira el dibujo: qué dice la persona
de la flecha»— y hasta ahora no había dibujo. El ejercicio pedía mirar algo que
no existía.

No se usa la hoja de personajes del libro: Carlos y compañía son de la historia,
y verlos en un examen despistaría. Aquí van desconocidos, y el estilo se baja de
revoluciones —la deformación del libro llama la atención, y en un examen lo que
tiene que llamar la atención es la escena.
"""
import json, pathlib, re, sys, importlib.util

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "public" / "examen" / "escenas"

# se reaprovechan la petición con reintentos y el guardado en gris
_spec = importlib.util.spec_from_file_location("il", RAIZ / "scripts/32_ilustrar_libro.py")
_il = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_il)

ESTILO = """
STYLE — plain black-ink line drawing, in the manner of a JLPT listening paper.
Flat, calm, easy to read at a glance. Confident even lines, solid black shapes
for hair and dark clothing, no halftone, no hatching, no grey, no shading.
Black on white. Slightly angular and hand-drawn, never soft or cute, but CALM:
no wild distortion, no exaggerated faces, no drama. The drawing has one job,
which is to make the situation obvious in one second.

HARD RULES:
1. NO TEXT anywhere: no letters, no numbers, no words, no signs, no speech
   bubbles, in any language. Papers, screens and posters stay blank or carry a
   few meaningless wavy strokes.
2. Every person has exactly one head, two arms, two legs. Hands are simple
   rough shapes with no fingers drawn. Faces are plain and neutral.
3. Very simple. Two or three people at most, a couple of props, and the rest of
   the paper EMPTY. Suggest the room with two or three strokes. Never a
   detailed background.
4. Ordinary anonymous Japanese people, plainly dressed. Not caricatures.

FORBIDDEN: Studio Ghibli; Pixar or any 3D look; manga or anime; cute
picture-book style; big round glossy eyes; colour of any kind.
""".strip()

FLECHA = ("A thick plain black ARROW (just a shaft and a solid triangular head, "
          "like a printed → symbol, not a drawn hand) comes in from the empty "
          "edge of the picture and points clearly at the head of the person who "
          "is about to speak. The arrow is a printed mark on the page, not part "
          "of the scene, and it must not overlap any face.")


def items():
    fuera = []
    for f in sorted((RAIZ / "data/fuente/examen").glob("*.json")):
        for it in json.loads(f.read_text(encoding="utf-8")):
            if it.get("tipo") == "hatsuwa":
                fuera.append(it)
    return fuera


def limpia(s):
    return re.sub(r"</?ruby>|</?rt>|<[^>]+>", "", s or "").strip()


def dibuja(it):
    # El enunciado ES la escena: 「友だちが 重い にもつを 持って います。何と
    # 言いますか」. La última frase es la pregunta y no se dibuja.
    escena = re.sub(r"[^。]*何と\s*言いますか。?\s*$", "", limpia(it["enunciado"])).strip()
    quien = limpia(it.get("explicacion", {}).get("es", ""))
    prompt = (ESTILO + "\n\nSUBJECT — one illustration for a Japanese listening "
              "exercise. Draw the situation described, as plainly as possible.\n\n"
              f"SITUATION (Japanese, from the exam bank):\n{escena}\n\n"
              f"WHAT THE PERSON IS ABOUT TO DO (context, do not draw as text):\n"
              f"{quien}\n\n" + FLECHA + "\n\n"
              "Horizontal composition, lots of empty white paper. "
              "Remember: no text of any kind anywhere in the image.")
    destino = SALIDA / f"{it['id']}.png"
    print(f"{it['id']}  {escena[:44]}")
    _il.genera(prompt, destino, size="1536x1024")


def main():
    todos = items()
    print(f"ítems de 発話表現 en el banco: {len(todos)}")
    SALIDA.mkdir(parents=True, exist_ok=True)
    rehacer = "--todos" in sys.argv
    for it in todos:
        if not rehacer and (SALIDA / f"{it['id']}.png").exists():
            print(f"{it['id']}  ya está, se salta"); continue
        dibuja(it)


if __name__ == "__main__":
    main()
