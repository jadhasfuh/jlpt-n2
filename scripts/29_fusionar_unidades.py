# -*- coding: utf-8 -*-
"""Funde una unidad diminuta con la parte vecina del mismo subtema.

家族② tenía una sola palabra —両親— y su propia lectura, su propio test y su
propio capítulo del libro. Abrirla y encontrar una palabra no enseña nada, y
en el libro cortaba el capítulo en dos por una razón que sólo existía en la
hoja de cálculo.

Fundir es: las palabras de la pequeña pasan a la vecina, las dos lecturas se
pegan una detrás de otra —cuerpo, las dos traducciones y las preguntas— y la
unidad pequeña desaparece de `unidades_publicadas.json`, que es lo que impide
que 04_curso la vuelva a crear.

Las lecturas quedan más largas, que para leer es mejor. El título es el de la
primera, porque es donde empieza el texto.

    python3 scripts/29_fusionar_unidades.py            # ensayo
    python3 scripts/29_fusionar_unidades.py --escribir
"""
import json, pathlib, sys, collections

TOPE = 4          # «diminuta»: cuatro palabras o menos
LECT = pathlib.Path("data/fuente/lecturas")
PUB  = pathlib.Path("data/fuente/unidades_publicadas.json")
escribir = "--escribir" in sys.argv

unidades = json.loads(pathlib.Path("data/dist/unidades.json").read_text(encoding="utf-8"))
grupos = collections.defaultdict(list)
for u in unidades:
    grupos[(u["nivel"], u["seccion"], u["subgrupo"])].append(u)

fusiones = []
for _, partes in sorted(grupos.items()):
    if len(partes) < 2:
        continue
    partes.sort(key=lambda u: u["parte"])
    for i, p in enumerate(partes):
        if len(p["palabras"]) > TOPE:
            continue
        # a la parte anterior, que es donde sigue el hilo; si es la primera, a la siguiente
        destino = partes[i - 1] if i > 0 else partes[i + 1]
        fusiones.append((p, destino))

def archivo(uid):
    return LECT / (uid.replace("/", "_") + ".json")

def pegar(a, b):
    """b se añade al final de a, campo a campo."""
    for campo in ("cuerpo", "traduccion", "traduccion_en"):
        sep = "" if campo == "cuerpo" else " "
        a[campo] = (a.get(campo, "").rstrip() + sep + b.get(campo, "").lstrip()).strip()
    a["preguntas"] = a.get("preguntas", []) + b.get("preguntas", [])
    return a

# `unidades_publicadas.json` era una foto de cuando había 602 unidades: las 12
# que nacieron después —entre ellas justo estas colas de una palabra— no
# estaban dentro, así que fijar la fusión ahí no servía de nada y 04_curso las
# volvía a partir. Se vuelve a publicar la lista ENTERA ya fundida, que es lo
# que de verdad congela el reparto.
CLAVES = ["id", "tipo", "nivel", "seccion", "subgrupo", "parte", "partes",
          "ja", "es", "palabras", "gramatica", "kanji"]

fundir_en = {p["id"]: d["id"] for p, d in fusiones}
por_id = {u["id"]: dict(u) for u in unidades}
for pequena, destino in fusiones:
    print(f"  {pequena['id']:32} ({len(pequena['palabras'])} palabras)")
    print(f"    → {destino['id']:30} {len(destino['palabras'])} → "
          f"{len(destino['palabras']) + len(pequena['palabras'])} palabras")
    if not escribir:
        continue
    fa, fb = archivo(destino["id"]), archivo(pequena["id"])
    if fa.exists() and fb.exists():
        a = json.loads(fa.read_text(encoding="utf-8"))
        b = json.loads(fb.read_text(encoding="utf-8"))
        fa.write_text(json.dumps(pegar(a, b), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        fb.unlink()
    por_id[destino["id"]]["palabras"] = (por_id[destino["id"]]["palabras"]
                                         + por_id[pequena["id"]]["palabras"])
    por_id.pop(pequena["id"])

if escribir:
    salida = list(por_id.values())
    # renumerar parte/partes dentro de cada subtema
    grupo = collections.defaultdict(list)
    for u in salida:
        grupo[(u["nivel"], u["seccion"], u["subgrupo"])].append(u)
    for vs in grupo.values():
        vs.sort(key=lambda u: u["parte"])
        for i, u in enumerate(vs):
            u["parte"], u["partes"] = i + 1, len(vs)
    PUB.write_text(json.dumps([{k: u.get(k) for k in CLAVES} for u in salida],
                              ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n  unidades_publicadas.json reescrito: {len(salida)} unidades")

print(f"\nunidades fundidas: {len(fusiones)}" + ("" if escribir else "   (ensayo)"))
