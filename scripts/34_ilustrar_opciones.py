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


def items(nivel):
    fuera = []
    for f in sorted((RAIZ / "data/fuente/examen").glob("*.json")):
        for it in json.loads(f.read_text(encoding="utf-8")):
            if it.get("tipo") == "kadai" and it["nivel"] == nivel:
                fuera.append(it)
    return fuera


def dibuja(it, i, opcion):
    prompt = (_examen.ESTILO + "\n\n" + PRECISION + "\n\nSUBJECT — option "
              f"{i + 1} of 4 for a Japanese listening question.\n\n"
              f"THE QUESTION (context only, do not draw it):\n"
              f"{_examen.limpia(it['enunciado'])}\n\n"
              f"WHAT TO DRAW (Japanese, from the exam bank) — exactly this and "
              f"nothing else:\n{_examen.limpia(opcion)}\n\n"
              "Square composition on white. No text, no numbers, no labels.")
    destino = SALIDA / f"{it['id']}-{i + 1}.png"
    print(f"  {it['id']}-{i + 1}  {_examen.limpia(opcion)[:38]}")
    _il.genera(prompt, destino, size="1024x1024")


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
