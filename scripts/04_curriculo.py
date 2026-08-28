# -*- coding: utf-8 -*-
"""Construye los niveles: 20 palabras nuevas + su cuota de gramática."""
import json, csv, sys, pathlib, collections
sys.path.insert(0, "scripts")
from taxonomia import SECCIONES, SUBGRUPOS

PALABRAS_POR_NIVEL = 20
MIN_ULTIMO = 8   # si al final de una sección sobran menos, se fusiona con el nivel anterior

# Orden pedagógico de las secciones
ORDEN = ["hito","kurashi","jikan","basho","kokoro","dousa","kotoba",
         "seishitsu","shizen","gakkou","shigoto","gijutsu","tsunagu","sonota"]
assert set(ORDEN) == {s[0] for s in SECCIONES}

vocab = json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))
gram  = list(csv.DictReader(open("data/fuente/gramatica.tsv", encoding="utf-8"), delimiter="|"))

# --- orden interno del vocabulario: subgrupo -> dificultad -> kana ---
PESO_JLPT = {"N5": 0, "N4": 1, "N2": 2}
por_sec = collections.defaultdict(list)
for r in vocab:
    por_sec[r["seccion"]].append(r)

def idx_sub(sec, sub):
    return [g[0] for g in SUBGRUPOS[sec]].index(sub)

niveles = []
for sec in ORDEN:
    palabras = sorted(por_sec[sec],
                      key=lambda r: (idx_sub(sec, r["subgrupo"]), PESO_JLPT[r["jlpt"]], r["kana"]))
    trozos = [palabras[i:i+PALABRAS_POR_NIVEL] for i in range(0, len(palabras), PALABRAS_POR_NIVEL)]
    if len(trozos) > 1 and len(trozos[-1]) < MIN_ULTIMO:
        sobra = trozos.pop()
        trozos[-1].extend(sobra)
    for t in trozos:
        dom = collections.Counter(w["subgrupo"] for w in t).most_common(1)[0][0]
        niveles.append({"seccion": sec, "subgrupo_dom": dom, "palabras": t})

# --- gramática: de más simple a más compleja, repartida uniformemente ---
ORDEN_CAT = ["conectores","tiempo","grado","adicion","contraste","causa","condicion",
             "grado_limite","comparacion","modo","estado_cambio","relacion","punto_vista",
             "obligacion","posibilidad","modal","enfasis","resultado","estilo"]
gram.sort(key=lambda g: (int(g["tier"]), ORDEN_CAT.index(g["cat"]), g["romaji"]))
for i, g in enumerate(gram):
    g["orden"] = i + 1

N, G = len(niveles), len(gram)
for i, niv in enumerate(niveles):
    a, b = -(-i * G // N), -(-(i + 1) * G // N)   # techo: la sesión 1 estrena gramática
    niv["gramatica"] = gram[a:b]

for i, niv in enumerate(niveles, 1):
    niv["id"] = f"L{i:03d}"
    niv["numero"] = i

pathlib.Path("data/build/curriculo.json").write_text(
    json.dumps(niveles, ensure_ascii=False, indent=1), encoding="utf-8")

# --- verificación de integridad ---
colocadas = [w["id"] for n in niveles for w in n["palabras"]]
assert len(colocadas) == len(vocab), f"faltan/sobran palabras: {len(colocadas)} vs {len(vocab)}"
assert len(set(colocadas)) == len(vocab), "hay palabras repetidas entre niveles"
usadas = [g["romaji"] for n in niveles for g in n["gramatica"]]
assert len(usadas) == len(gram) == len(set(usadas)), "gramática mal repartida"

# --- informe ---
print(f"niveles: {N} | palabras: {sum(len(n['palabras']) for n in niveles)} | gramática: {sum(len(n['gramatica']) for n in niveles)}")
print(f"niveles sin gramática nueva: {sum(1 for n in niveles if not n['gramatica'])}")
print(f"máx. gramática en un nivel: {max(len(n['gramatica']) for n in niveles)}")
print(f"tamaños de nivel: {sorted(set(len(n['palabras']) for n in niveles))}")
print()
et = {s[0]: (s[1], s[2]) for s in SECCIONES}
for sec in ORDEN:
    ns = [n for n in niveles if n["seccion"] == sec]
    print(f"{et[sec][0]:<12} {et[sec][1]:<32} niveles {ns[0]['numero']:>3}–{ns[-1]['numero']:<3} ({len(ns)})")
