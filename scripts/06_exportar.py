# -*- coding: utf-8 -*-
"""Exporta a data/dist/ lo que consumen la app y la carga a Supabase."""
import json, csv, re, sys, pathlib, collections
sys.path.insert(0, "scripts")
from taxonomia import SECCIONES, SUBGRUPOS
from tipos_cat import CAT_ES

DIST = pathlib.Path("data/dist"); DIST.mkdir(parents=True, exist_ok=True)
NIVELES = ["N5", "N4", "N3", "N2", "N1"]
cache = {}
p = pathlib.Path("data/build/es_cache.json")
if p.exists():
    cache = json.loads(p.read_text(encoding="utf-8"))

def sin_comentario(l): return re.sub(r"\s*#.*$", "", l).rstrip()

CORRECCIONES, DESCARTAR = {}, set()
f = pathlib.Path("data/fuente/correcciones.tsv")
if f.exists():
    for l in f.read_text(encoding="utf-8").splitlines():
        l = sin_comentario(l)
        if not l or l.startswith(("#", "id|")): continue
        c = (l.split("|") + [""] * 5)[:5]
        CORRECCIONES[int(c[0])] = dict(zip(("kana", "kanji", "en", "es"), c[1:]))
f = pathlib.Path("data/fuente/descartar.txt")
if f.exists():
    for l in f.read_text(encoding="utf-8").splitlines():
        l = sin_comentario(l)
        if l and not l.startswith("#"): DESCARTAR.add(int(l))

KANA = "぀-ヿー"
def limpiar_jp(s):
    return re.sub(r"^（[^）]*）\s*", "", s or "").replace("～", "~").strip()

def partir_gramatica(ja):
    ja = re.sub(r"\s*\[\d+\]\s*$", "", ja).strip()
    m = re.match(r"^(.*?)（([^）]*)）\s*$", ja)
    if m and re.search(f"[{KANA}]", m.group(2)):
        return m.group(1).strip(), m.group(2).strip()
    return ja, ""

# ---------------------------------------------------------------- vocabulario
vocab = [r for r in json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))
         if r["id"] not in DESCARTAR]
for r in vocab:
    for campo, valor in CORRECCIONES.get(r["id"], {}).items():
        if valor.strip(): r[campo] = valor.strip()

salida_v = []
for r in vocab:
    kana, kanji = limpiar_jp(r["kana"]), limpiar_jp(r["kanji"])
    en = r["en"].strip()
    salida_v.append({
        "id": r["id"], "kana": kana, "kanji": kanji,
        "escritura": kanji or kana, "lectura": kana,
        "pos": r["pos"], "en": en,
        "es": CORRECCIONES.get(r["id"], {}).get("es", "").strip() or cache.get(en, ""),
        "registro": r.get("registro", []),
        "seccion": r["seccion"], "subgrupo": r["subgrupo"], "jlpt": r["jlpt"],
    })

# ------------------------------------------------------------------ gramática
# Los 846 puntos de los cinco niveles: N2 del TSV a mano, el resto bajados.
gram = json.loads(pathlib.Path("data/build/gramatica_todos.json").read_text(encoding="utf-8"))
salida_g = []
for g in gram:
    forma, lectura = partir_gramatica(g["ja"])
    salida_g.append({"id": g["id"], "nivel": g["nivel"], "forma": forma, "lectura": lectura,
                     "en": g["en"], "es": g["es"], "tier": g["tier"], "cat": g["cat"]})

# ------------------------------------------------------------------- unidades
unidades = [u for u in json.load(open("data/build/unidades.json", encoding="utf-8"))]
descartadas = {u["id"]: [i for i in u["palabras"] if i in DESCARTAR] for u in unidades}
for u in unidades:
    u["palabras"] = [i for i in u["palabras"] if i not in DESCARTAR]

# ---------------------------------------------------------------------- kanji
KANJI_RX = re.compile(r"[一-鿿]")
kanji_cat = json.loads(pathlib.Path("data/build/kanji.json").read_text(encoding="utf-8"))
por_char = {k["char"]: k for k in kanji_cat}
esc_de = {p["id"]: p["kanji"] for p in salida_v}

def kanji_de(ids):
    """Los kanji que aparecen en esas palabras, ordenados como el catálogo."""
    vistos = set()
    for i in ids:
        vistos.update(KANJI_RX.findall(esc_de.get(i, "") or ""))
    return [k["char"] for k in kanji_cat if k["char"] in vistos]

for u in unidades:
    u["kanji"] = kanji_de(u["palabras"])

# ------------------------------------------------------------- árbol del curso
et_sec = {s[0]: {"ja": s[1], "es": s[2]} for s in SECCIONES}
orden_sec = [s[0] for s in SECCIONES]

curso = []
for nivel in NIVELES:
    del_nivel = [u for u in unidades if u["nivel"] == nivel]
    secs = []
    for sid in orden_sec:
        us = [u for u in del_nivel if u["seccion"] == sid]
        if not us: continue
        secs.append({
            "id": sid, "ja": et_sec[sid]["ja"], "es": et_sec[sid]["es"],
            "palabras": sum(len(u["palabras"]) for u in us),
            "gramatica": sum(len(u["gramatica"]) for u in us),
            "kanji": len({c for u in us for c in u["kanji"]}),
            "unidades": [{"id": u["id"], "ja": u["ja"], "es": u["es"], "tipo": u["tipo"],
                          "items": len(u["palabras"]), "gramatica": len(u["gramatica"]),
                          "kanji": len(u["kanji"])}
                         for u in us],
        })
    curso.append({
        "id": nivel, "secciones": secs,
        "palabras": sum(len(u["palabras"]) for u in del_nivel),
        "gramatica": sum(len(u["gramatica"]) for u in del_nivel),
        "unidades": len(del_nivel),
        # los kanji oficiales de ese nivel JLPT que además salen en el curso
        "kanji": sum(1 for k in kanji_cat if k["nivel"] == nivel),
    })

# -------------------------------------------------------------------- lecturas
dir_lect = pathlib.Path("data/fuente/lecturas")
ids_u = {u["id"] for u in unidades}
salida_l = []
for f in sorted(dir_lect.glob("*.json")):
    l = json.loads(f.read_text(encoding="utf-8"))
    if l.get("unidad_id") in ids_u: salida_l.append(l)
    else: print(f"  ¡ojo! lectura huérfana: {f.name}")

# ------------------------------------------------------------------ categorías
categorias = [{"id": k, "es": v} for k, v in CAT_ES.items()]

# Mapa compacto kanji -> nivel, para colorear el texto en el navegador (~10 KB).
mapa_nivel = {k["char"]: (k["nivel"] or k["curso"]) for k in kanji_cat}
# Antes de escribir nada: si el español se ha caído, no se exporta.
#
# Pasó de verdad. La caché de traducción no llegó a escribirse en disco, este
# script exportó con un 0,1 % de español y la app estuvo enseñando los
# significados en inglés a quien la tenía puesta en español. La cifra salía
# impresa al final y nadie la miró, así que ahora no es un aviso sino una
# parada, y va antes de tocar data/dist/ para no dejar el destrozo hecho.
_pct = sum(1 for w in salida_v if w["es"]) / len(salida_v) * 100
if _pct < 95:
    print(f"PARADA: sólo el {_pct:.1f} % del vocabulario tiene español.\n"
          f"Casi seguro falta data/build/es_cache.json: ejecuta\n"
          f"  python3 scripts/05_traducir.py\n"
          f"y vuelve a exportar. No se ha escrito nada en data/dist/.", file=sys.stderr)
    sys.exit(1)

(DIST / "kanji_niveles.json").write_text(json.dumps(mapa_nivel, ensure_ascii=False), encoding="utf-8")
print(f"{'kanji_niveles':<14} {len(mapa_nivel):5d} registros  "
      f"{(DIST/'kanji_niveles.json').stat().st_size/1024:8.1f} KB")

for nombre, dato in [("vocabulario", salida_v), ("gramatica", salida_g),
                     ("unidades", unidades), ("curso", curso), ("kanji", kanji_cat),
                     ("lecturas", salida_l), ("categorias", categorias)]:
    (DIST / f"{nombre}.json").write_text(json.dumps(dato, ensure_ascii=False), encoding="utf-8")
    print(f"{nombre:<14} {len(dato):5d} registros  {(DIST/f'{nombre}.json').stat().st_size/1024:8.1f} KB")

for viejo in ("niveles.json", "secciones.json"):
    (DIST / viejo).unlink(missing_ok=True)

trad = sum(1 for w in salida_v if w["es"])
print(f"\ncon español: {trad}/{len(salida_v)} ({trad/len(salida_v)*100:.1f}%)")
print("por nivel:", {n: next(c['palabras'] for c in curso if c['id']==n) for n in NIVELES})
