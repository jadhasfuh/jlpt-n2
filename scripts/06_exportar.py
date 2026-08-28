# -*- coding: utf-8 -*-
"""Exporta el contenido final a data/dist/ (lo que consume la app y el seed)."""
import json, csv, re, sys, pathlib, collections
sys.path.insert(0, "scripts")
from taxonomia import SECCIONES, SUBGRUPOS

DIST = pathlib.Path("data/dist"); DIST.mkdir(parents=True, exist_ok=True)
cache = {}
p = pathlib.Path("data/build/es_cache.json")
if p.exists():
    cache = json.loads(p.read_text(encoding="utf-8"))

KANA = "぀-ヿー"

def limpiar_jp(s):
    """Quita marcas de la fuente: （感）, ~, espacios raros."""
    s = re.sub(r"^（[^）]*）\s*", "", s or "")
    return s.replace("～", "~").strip()

def partir_gramatica(ja):
    """'再び（ふたたび）' -> ('再び', 'ふたたび'). Quita sufijos tipo ' [2]'."""
    ja = re.sub(r"\s*\[\d+\]\s*$", "", ja).strip()
    m = re.match(r"^(.*?)（([^）]*)）\s*$", ja)
    if m and re.search(f"[{KANA}]", m.group(2)):
        return m.group(1).strip(), m.group(2).strip()
    return ja, ""

# ---------- correcciones a mano sobre la fuente ----------
def sin_comentario(linea):
    return re.sub(r"\s*#.*$", "", linea).rstrip()

CORRECCIONES = {}
f = pathlib.Path("data/fuente/correcciones.tsv")
if f.exists():
    for linea in f.read_text(encoding="utf-8").splitlines():
        linea = sin_comentario(linea)
        if not linea or linea.startswith(("#", "id|")):
            continue
        campos = (linea.split("|") + ["", "", "", "", ""])[:5]
        CORRECCIONES[int(campos[0])] = dict(zip(("kana", "kanji", "en", "es"), campos[1:]))

DESCARTAR = set()
f = pathlib.Path("data/fuente/descartar.txt")
if f.exists():
    for linea in f.read_text(encoding="utf-8").splitlines():
        linea = sin_comentario(linea)
        if linea and not linea.startswith("#"):
            DESCARTAR.add(int(linea))

# ---------- vocabulario ----------
vocab = json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))
vocab = [r for r in vocab if r["id"] not in DESCARTAR]
for r in vocab:
    for campo, valor in CORRECCIONES.get(r["id"], {}).items():
        if valor.strip():
            r[campo] = valor.strip()
salida_v = []
for r in vocab:
    kana, kanji = limpiar_jp(r["kana"]), limpiar_jp(r["kanji"])
    en = r["en"].strip()
    salida_v.append({
        "id": r["id"],
        "kana": kana,
        "kanji": kanji,
        "escritura": kanji or kana,          # lo que se muestra
        "lectura": kana,                     # lo que va en el furigana
        "pos": r["pos"],
        "en": en,
        "es": CORRECCIONES.get(r["id"], {}).get("es", "").strip() or cache.get(en, ""),
        "es_origen": "auto" if cache.get(en) else "",
        "registro": r.get("registro", []),
        "seccion": r["seccion"],
        "subgrupo": r["subgrupo"],
        "jlpt": r["jlpt"],
    })

# ---------- gramática ----------
gram = list(csv.DictReader(open("data/fuente/gramatica.tsv", encoding="utf-8"), delimiter="|"))
salida_g = []
for g in gram:
    forma, lectura = partir_gramatica(g["ja"])
    salida_g.append({
        "id": re.sub(r"[^a-z0-9]+", "-", g["romaji"].lower()).strip("-"),
        "forma": forma,
        "lectura": lectura,
        "en": g["en"],
        "es": g["es"],
        "tier": int(g["tier"]),
        "cat": g["cat"],
    })
por_id_g = {g["id"]: g for g in salida_g}

# ---------- niveles ----------
niveles = json.load(open("data/build/curriculo.json", encoding="utf-8"))
et_sec = {s[0]: {"ja": s[1], "es": s[2]} for s in SECCIONES}
et_sub = {(s, g[0]): {"ja": g[1], "es": g[2]} for s in SUBGRUPOS for g in SUBGRUPOS[s]}
salida_n = []
for n in niveles:
    sub = et_sub[(n["seccion"], n["subgrupo_dom"])]
    ids = [w["id"] for w in n["palabras"] if w["id"] not in DESCARTAR]
    salida_n.append({
        "id": n["id"],
        "numero": n["numero"],
        "seccion": n["seccion"],
        "titulo_ja": sub["ja"],
        "titulo_es": sub["es"],
        "palabras": ids,
        "gramatica": [re.sub(r"[^a-z0-9]+", "-", g["romaji"].lower()).strip("-") for g in n["gramatica"]],
    })
for n in salida_n:
    assert all(g in por_id_g for g in n["gramatica"]), n["id"]

# ---------- taxonomía con conteos ----------
c_sub = collections.Counter((w["seccion"], w["subgrupo"]) for w in salida_v)
salida_t = []
for sid, ja, es in SECCIONES:
    subs = [{"id": g, "ja": gja, "es": ges, "palabras": c_sub.get((sid, g), 0)}
            for g, gja, ges in SUBGRUPOS[sid]]
    salida_t.append({"id": sid, "ja": ja, "es": es,
                     "palabras": sum(s["palabras"] for s in subs),
                     "niveles": sum(1 for n in salida_n if n["seccion"] == sid),
                     "subgrupos": subs})

# ---------- lecturas escritas a mano (respaldo hasta generar las 250) ----------
dir_lect = pathlib.Path("data/fuente/lecturas")
salida_l = [json.loads(f.read_text(encoding="utf-8"))
            for f in sorted(dir_lect.glob("*.json"))] if dir_lect.exists() else []
ids_niveles = {n["id"] for n in salida_n}
salida_l = [l for l in salida_l if l["nivel_id"] in ids_niveles]

for nombre, dato in [("vocabulario", salida_v), ("gramatica", salida_g),
                     ("niveles", salida_n), ("secciones", salida_t),
                     ("lecturas", salida_l)]:
    (DIST / f"{nombre}.json").write_text(json.dumps(dato, ensure_ascii=False), encoding="utf-8")
    print(f"{nombre}.json  {len(dato):5d} registros  {(DIST/f'{nombre}.json').stat().st_size/1024:8.1f} KB")

trad = sum(1 for w in salida_v if w["es"])
print(f"\ncon traducción al español: {trad}/{len(salida_v)} ({trad/len(salida_v)*100:.1f}%)")
