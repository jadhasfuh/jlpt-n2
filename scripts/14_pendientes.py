# -*- coding: utf-8 -*-
"""Saca las próximas unidades sin lectura, con todo lo que hace falta para
   escribirlas: vocabulario, kanji permitidos y gramática de la unidad.

   uso:  python3 scripts/14_pendientes.py [cuantas] [--nivel N2] [--seccion hito]
"""
import json, re, sys, pathlib, argparse

ORDEN = ["N5", "N4", "N3", "N2", "N1"]
ap = argparse.ArgumentParser()
ap.add_argument("cuantas", nargs="?", type=int, default=10)
ap.add_argument("--nivel")
ap.add_argument("--seccion")
ap.add_argument("--resumen", action="store_true", help="sólo contar, sin volcar el detalle")
a = ap.parse_args()

unidades = json.load(open("data/dist/unidades.json", encoding="utf-8"))
vocab = {p["id"]: p for p in json.load(open("data/dist/vocabulario.json", encoding="utf-8"))}
gram = {g["id"]: g for g in json.load(open("data/dist/gramatica.json", encoding="utf-8"))}
kanji = {k["char"]: k for k in json.load(open("data/dist/kanji.json", encoding="utf-8"))}
hechas = {p.stem.replace("_", "/") for p in pathlib.Path("data/fuente/lecturas").glob("*.json")}

# Prioridad: el nivel del examen primero, luego hacia abajo y hacia arriba.
PRIORIDAD = ["N2", "N3", "N4", "N5", "N1"]
def clave(u):
    return (PRIORIDAD.index(u["nivel"]), u["seccion"], u["subgrupo"], u["parte"])

todas = sorted([u for u in unidades if u["palabras"]], key=clave)
pendientes = [u for u in todas if u["id"] not in hechas]
if a.nivel:   pendientes = [u for u in pendientes if u["nivel"] == a.nivel]
if a.seccion: pendientes = [u for u in pendientes if u["seccion"] == a.seccion]

print(f"unidades con lectura: {len(hechas)} / {len(todas)}  ·  pendientes: {len(pendientes)}")
por_nivel = {}
for u in pendientes: por_nivel[u["nivel"]] = por_nivel.get(u["nivel"], 0) + 1
print("pendientes por nivel:", {n: por_nivel.get(n, 0) for n in ORDEN})
if a.resumen: sys.exit(0)

# kanji acumulados hasta cada unidad, para saber qué se puede usar
pos = {u["id"]: i for i, u in enumerate(sorted(unidades, key=lambda u: (ORDEN.index(u["nivel"]), u["seccion"], u["subgrupo"], u["parte"])))}
ordenadas = sorted(unidades, key=lambda u: pos[u["id"]])

print()
for u in pendientes[:a.cuantas]:
    tope = ORDEN.index(u["nivel"])
    permitidos = {k for k, d in kanji.items()
                  if d["nivel"] and ORDEN.index(d["nivel"]) <= tope}
    print(f"### {u['id']}   {u['ja']}  ({u['es']}) · nivel {u['nivel']}")
    print("VOCABULARIO:")
    for i in u["palabras"]:
        p = vocab[i]
        print(f"   {p['escritura']}〔{p['lectura']}〕{(p['es'] or p['en'])[:40]}")
    print(f"KANJI DE LA UNIDAD ({len(u['kanji'])}): {''.join(u['kanji'])}")
    if u["gramatica"]:
        print("GRAMÁTICA A USAR: " + " / ".join(f"{gram[g]['forma']} = {gram[g]['es'][:34]}" for g in u["gramatica"]))
    print(f"KANJI PERMITIDOS (nivel {u['nivel']} o más fácil): {len(permitidos)} en total")
    print()
