# -*- coding: utf-8 -*-
"""Construye el catálogo de kanji: sólo los que aparecen en nuestro vocabulario,
   con su nivel JLPT, lecturas, trazos y frecuencia.

   Fuente: davidluzgouveia/kanji-data (13 108 kanji, campo jlpt_new).
"""
import json, re, pathlib, collections

KANJI = re.compile(r"[一-鿿]")
crudo = json.loads(pathlib.Path("data/raw/kanji_data.json").read_text(encoding="utf-8"))
vocab = json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))

# ¿en qué palabras aparece cada kanji, y en qué nivel se ve por primera vez?
apariciones = collections.defaultdict(list)
PESO = {"N5": 0, "N4": 1, "N3": 2, "N2": 3, "N1": 4}
for p in vocab:
    for c in set(KANJI.findall(p["kanji"] or "")):
        apariciones[c].append(p)

def a_katakana(t):
    """La fuente da las dos lecturas en hiragana. La convención de los
    diccionarios y los libros de texto es on'yomi en KATAKANA y kun'yomi en
    hiragana: así se distinguen de un vistazo."""
    return "".join(chr(ord(c) + 0x60) if "ぁ" <= c <= "ゖ" else c for c in t)

catalogo = []
for c, palabras in apariciones.items():
    d = crudo.get(c, {})
    nivel_jlpt = d.get("jlpt_new")
    # nivel en el que el estudiante lo encuentra por primera vez en el curso
    primero = min(palabras, key=lambda p: PESO[p["jlpt"]])["jlpt"]
    catalogo.append({
        "char": c,
        "nivel": f"N{nivel_jlpt}" if nivel_jlpt else "",     # nivel JLPT oficial del kanji
        "curso": primero,                                     # dónde aparece aquí por primera vez
        "trazos": d.get("strokes"),
        "grado": d.get("grade"),
        "freq": d.get("freq"),
        "en": d.get("meanings", [])[:4],
        "on": [a_katakana(x) for x in d.get("readings_on", [])[:4]],
        "kun": d.get("readings_kun", [])[:4],
        "palabras": sorted(p["id"] for p in palabras)[:12],   # ejemplos de uso
        "n_palabras": len(palabras),
    })

# frecuencia ascendente = más comunes primero; los que no la traen, al final
catalogo.sort(key=lambda k: (PESO[k["curso"]], k["freq"] or 99999, k["char"]))
pathlib.Path("data/build/kanji.json").write_text(
    json.dumps(catalogo, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"kanji en nuestro vocabulario: {len(catalogo)}")
print("por nivel JLPT oficial:", dict(sorted(collections.Counter(k['nivel'] or 'fuera de JLPT' for k in catalogo).items())))
print("por nivel del curso:   ", dict(sorted(collections.Counter(k['curso'] for k in catalogo).items(),
                                             key=lambda x: PESO[x[0]])))
sin = [k for k in catalogo if not k["en"]]
print(f"sin significado en la fuente: {len(sin)}")
print("\nmuestra:")
for k in catalogo[:5]:
    print(f"  {k['char']}  JLPT {k['nivel'] or '—'} · curso {k['curso']} · {k['trazos']} trazos · "
          f"{', '.join(k['en'][:2])} · on {'/'.join(k['on'][:2])}")
