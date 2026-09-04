# -*- coding: utf-8 -*-
"""Lee los 103 capítulos seguidos y busca lo que se rompe al alargarlos.

    python3 scripts/38_continuidad_libro.py

Al ampliar las lecturas para cubrir vocabulario se cuela siempre lo mismo, y
siempre por el mismo motivo: cada capítulo se escribe mirando su lista de
palabras, no el capítulo anterior. Esto mira lo contrario —la historia como
historia— y avisa de tres cosas:

  · un personaje que aparece antes del capítulo donde se le presenta
  · una frase repetida dentro del capítulo o copiada del capítulo de al lado
  · el número de personajes de una escena, que es lo que decide cuánta gente
    dibuja 32_ilustrar_libro.py

No corrige nada: enseña el capítulo y la frase para poder decidir. Lo que no
sabe ver —una promesa que no se cumple, como el museo del terremoto, o una
frase de gramática pegada al final sin venir a cuento— hay que leerlo.
"""
import json, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ALIAS = {"Carlos": ["carlos"], "Jean": ["jean"], "Gonza": ["gonsa", "gonza"],
         "Anna": ["anna"], "señora Tanaka": ["tanaka"], "Min": ["min"],
         "Kenta": ["kenta"], "Alan sensei": ["alan"]}

# El capítulo en que se le conoce. Nombrarle antes es el fallo típico.
PRESENTA = {"Carlos": 1, "Alan sensei": 2, "señora Tanaka": 3, "Jean": 11,
            "Gonza": 11, "Min": 11, "Anna": 24, "Kenta": 29}


# Rasgos físicos que sólo tiene parte del reparto. Si un capítulo los nombra y
# no nombra a nadie que los tenga, el que los lleva acaba siendo el narrador —y
# el dibujo obedece al texto: el capítulo del ramen decía «se me empañaron las
# gafas» y salió un Carlos con gafas que no lleva en ninguna otra página.
RASGOS = {
    "gafas": (("gafas", "めがね", "眼鏡"), ("Jean", "Anna", "señora Tanaka")),
    "guitarra": (("guitarra", "ギター"), ("Jean",)),
    "afro": (("afro",), ("Gonza",)),
}


def quienes(texto):
    t = texto.lower()
    return [k for k, ns in ALIAS.items()
            if any(re.search(rf"\b{n}\b", t) for n in ns)]


def frases(texto):
    return [f.strip() for f in re.split(r"(?<=[.»?!])\s+", texto) if len(f.strip()) > 25]


def main():
    orden = json.loads((RAIZ / "data/fuente/orden_libro.json").read_text())["N5"]
    capitulos = []
    for uid in orden:
        f = RAIZ / "data/fuente/lecturas" / (uid.replace("/", "_") + ".json")
        capitulos.append((uid, json.loads(f.read_text(encoding="utf-8")).get("traduccion", "")))

    problemas = 0
    anterior = set()
    for n, (uid, es) in enumerate(capitulos, 1):
        gente = quienes(es)

        for quien in gente:
            if n < PRESENTA.get(quien, 0):
                print(f"  ✗ cap {n:3d} {uid}: sale {quien}, "
                      f"y se le presenta en el {PRESENTA[quien]}")
                problemas += 1

        for rasgo, (palabras, duenos) in RASGOS.items():
            if any(w in es for w in palabras) and not any(d in gente for d in duenos):
                print(f"  ✗ cap {n:3d} {uid}: habla de {rasgo} y no sale "
                      f"{' ni '.join(duenos)}; se lo va a quedar Carlos")
                problemas += 1

        vistas = set()
        for fr in frases(es):
            if fr in vistas:
                print(f"  ✗ cap {n:3d} {uid}: frase repetida → «{fr[:70]}»")
                problemas += 1
            elif fr in anterior:
                print(f"  ✗ cap {n:3d} {uid}: frase copiada del capítulo anterior "
                      f"→ «{fr[:70]}»")
                problemas += 1
            vistas.add(fr)
        anterior = vistas

        if len(gente) >= 5:
            print(f"  · cap {n:3d} {uid}: {len(gente)} personajes en escena "
                  f"({', '.join(gente)}) — mucha gente para un dibujo")

    print(f"\nerrores de continuidad: {problemas}")
    return 1 if problemas else 0


if __name__ == "__main__":
    sys.exit(main())
