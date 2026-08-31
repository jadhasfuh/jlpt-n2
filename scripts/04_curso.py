# -*- coding: utf-8 -*-
"""Arma el curso: nivel JLPT -> sección -> unidad (subgrupo, partido si es largo).

Cada unidad tiene ~20 palabras y es lo que se practica de una sentada. Un
subgrupo largo se parte en 家族 ①, 家族 ②… con las fáciles primero.
La gramática es una sección propia dentro de N2, por categorías.
"""
import json, csv, re, sys, pathlib, collections
sys.path.insert(0, "scripts")
from taxonomia import SECCIONES, SUBGRUPOS

POR_UNIDAD = 20        # palabras por unidad
MIN_COLA = 8           # si la última parte queda con menos, se funde con la anterior
GRAM_POR_UNIDAD = 8

NIVELES = ["N5", "N4", "N3", "N2", "N1"]
CIRCULOS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
KANJI = re.compile(r"[一-鿿]")

vocab = json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))
et_sec = {s[0]: {"ja": s[1], "es": s[2]} for s in SECCIONES}
et_sub = {(s, g[0]): {"ja": g[1], "es": g[2]} for s in SUBGRUPOS for g in SUBGRUPOS[s]}
orden_sec = [s[0] for s in SECCIONES]

def dificultad(p):
    """Dentro de un mismo nivel: menos kanji y más corta = más fácil."""
    return (len(KANJI.findall(p["kanji"] or "")), len(p["kanji"] or p["kana"]), p["kana"])

def partir(items, por, min_cola):
    trozos = [items[i:i + por] for i in range(0, len(items), por)]
    if len(trozos) > 1 and len(trozos[-1]) < min_cola:
        cola = trozos.pop()
        trozos[-1].extend(cola)
    return trozos

def numerar(base_ja, base_es, i, total):
    if total == 1:
        return base_ja, base_es
    marca = CIRCULOS[i] if i < len(CIRCULOS) else f"（{i + 1}）"
    return f"{base_ja} {marca}", f"{base_es} ({i + 1})"

# ---------------------------------------------------------------- vocabulario
por_clave = collections.defaultdict(list)
for p in vocab:
    por_clave[(p["jlpt"], p["seccion"], p["subgrupo"])].append(p)

unidades = []
for nivel in NIVELES:
    for sec in orden_sec:
        for sub, _, _ in SUBGRUPOS[sec]:
            palabras = sorted(por_clave.get((nivel, sec, sub), []), key=dificultad)
            if not palabras:
                continue
            trozos = partir(palabras, POR_UNIDAD, MIN_COLA)
            for i, trozo in enumerate(trozos):
                ja, es = numerar(et_sub[(sec, sub)]["ja"], et_sub[(sec, sub)]["es"], i, len(trozos))
                unidades.append({
                    "id": f"{nivel}/{sec}/{sub}-{i + 1}",
                    "tipo": "vocabulario", "nivel": nivel, "seccion": sec,
                    "subgrupo": sub, "parte": i + 1, "partes": len(trozos),
                    "ja": ja, "es": es,
                    "palabras": [p["id"] for p in trozo], "gramatica": [],
                })

# ------------------------------------------------------------------ gramática
# Cada nivel reparte SU gramática entre SUS unidades de vocabulario, para que
# se encuentre en contexto. N2 viene del TSV escrito a mano; el resto, de las
# listas bajadas y clasificadas.
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

gram = []
for g in csv.DictReader(open("data/fuente/gramatica.tsv", encoding="utf-8"), delimiter="|"):
    gram.append({"id": slug(g["romaji"]), "nivel": "N2", "ja": g["ja"],
                 "en": g["en"], "es": g["es"], "tier": int(g["tier"]), "cat": g["cat"]})

bajada = pathlib.Path("data/build/gramatica_clasificada.json")
if bajada.exists():
    for g in json.loads(bajada.read_text(encoding="utf-8")):
        # Los ids de N2 ya están en uso: los demás se prefijan con su nivel
        # para que no puedan chocar.
        gram.append({"id": f"{g['nivel'].lower()}-{slug(g['romaji'])}", "nivel": g["nivel"],
                     "ja": g["ja"], "en": g["en"], "es": g.get("es", ""),
                     "tier": g["tier"], "cat": g["cat"]})

ORDEN_CAT = ["particulas","formas","conectores","tiempo","grado","adicion","contraste","causa",
             "condicion","grado_limite","comparacion","modo","estado_cambio","relacion",
             "punto_vista","cortesia","deseo","interrogativos","obligacion","posibilidad",
             "modal","enfasis","resultado","estilo"]
def clave_gram(g):
    return (g["tier"], ORDEN_CAT.index(g["cat"]) if g["cat"] in ORDEN_CAT else 99, g["id"])

for nivel in NIVELES:
    suyas = sorted([g for g in gram if g["nivel"] == nivel], key=clave_gram)
    destino = [u for u in unidades if u["nivel"] == nivel]
    if not suyas or not destino:
        continue
    N, G = len(destino), len(suyas)
    for i, u in enumerate(destino):
        a, b = -(-i * G // N), -(-(i + 1) * G // N)   # techo: la primera ya estrena
        u["gramatica"] = [g["id"] for g in suyas[a:b]]

pathlib.Path("data/build/gramatica_todos.json").write_text(
    json.dumps(gram, ensure_ascii=False, indent=1), encoding="utf-8")

# ------------------------------------------------------------------- verificación
ids_v = [i for u in unidades for i in u["palabras"]]
assert len(ids_v) == len(vocab) == len(set(ids_v)), f"{len(ids_v)} vs {len(vocab)}"
ids_g = [i for u in unidades for i in u["gramatica"]]
assert len(ids_g) == len(gram) == len(set(ids_g)), f"{len(ids_g)} vs {len(gram)}"
assert len({u["id"] for u in unidades}) == len(unidades), "ids de unidad repetidos"

pathlib.Path("data/build/unidades.json").write_text(
    json.dumps(unidades, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"unidades: {len(unidades)}  ({sum(1 for u in unidades if u['tipo']=='gramatica')} de gramática)")
for n in NIVELES:
    us = [u for u in unidades if u["nivel"] == n]
    pal = sum(len(u["palabras"]) for u in us)
    secs = len({u["seccion"] for u in us})
    print(f"  {n}: {len(us):3d} unidades · {pal:5d} palabras · {secs} secciones")
largas = [u for u in unidades if len(u["palabras"]) > 27]
print("unidades con más de 27 palabras:", len(largas))
