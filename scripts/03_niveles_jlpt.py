# -*- coding: utf-8 -*-
"""Etiqueta cada palabra con su nivel JLPT real (N5..N1) e importa el
   vocabulario N1, que la lista original (spec del N2 de 2004) no traía.

   Fuente de los niveles: jamsinclair/open-anki-jlpt-decks, que sí cubre los
   cinco niveles actuales. La lista de jlptstudy sigue siendo la base del
   contenido; esto sólo añade la etiqueta de nivel y el bloque de N1.
"""
import csv, json, re, pathlib

RAW = pathlib.Path("data/raw")
NIVELES = ["N5", "N4", "N3", "N2", "N1"]
ID_N1 = 100000          # los ids importados van aparte para no chocar
KANJI = re.compile(r"[一-鿿]")

def cargar(nivel):
    filas = list(csv.DictReader(open(RAW / f"jlpt_{nivel.lower()}.csv", encoding="utf-8")))
    escrituras, lecturas = set(), set()
    for f in filas:
        e = (f.get("expression") or "").strip()
        l = (f.get("reading") or "").strip()
        if e: escrituras.add(e)
        if l: lecturas.add(l)
        if e and not l: lecturas.add(e)
    return filas, escrituras, lecturas

listas = {n: cargar(n) for n in NIVELES}
for n in NIVELES:
    print(f"  {n}: {len(listas[n][0])} filas")

vocab = json.load(open("data/build/vocab_raw.json", encoding="utf-8"))
print(f"\npool de partida: {len(vocab)}")

def nivel_de(kana, kanji):
    """El nivel más fácil donde aparece la palabra. None si no está en ninguno."""
    for n in NIVELES:
        _, esc, lec = listas[n]
        if (kanji and kanji in esc) or (kana in esc) or (kana in lec):
            return n
    return None

def limpio(s):
    return re.sub(r"^（[^）]*）\s*", "", s or "").replace("~", "").replace("～", "").strip()

# --- 1) etiquetar lo que ya tenemos ---
sin_match = 0
for r in vocab:
    n = nivel_de(limpio(r["kana"]), limpio(r["kanji"]))
    if n:
        r["jlpt"] = n
    else:
        r["jlpt"] = r.get("jlpt", "N2")   # partículas, prefijos, saludos…
        sin_match += 1

# --- 2) importar el N1 que nos falta ---
ya = {limpio(r["kanji"]) for r in vocab if r["kanji"]} | {limpio(r["kana"]) for r in vocab}
nuevas, sig = [], ID_N1
for f in listas["N1"][0]:
    exp = (f.get("expression") or "").strip()
    lec = (f.get("reading") or "").strip()
    sig_en = (f.get("meaning") or "").strip()
    if not exp or exp in ya:
        continue
    ya.add(exp)
    tiene_kanji = bool(KANJI.search(exp))
    nuevas.append({
        "id": sig, "kana": lec if tiene_kanji and lec else exp,
        "kanji": exp if tiene_kanji else "",
        "pos": "", "en": sig_en, "jlpt": "N1",
    })
    sig += 1

vocab.extend(nuevas)
pathlib.Path("data/build/vocab_raw.json").write_text(
    json.dumps(vocab, ensure_ascii=False, indent=1), encoding="utf-8")

import collections
c = collections.Counter(r["jlpt"] for r in vocab)
print(f"importadas de N1: {len(nuevas)} | sin match en ninguna lista: {sin_match}")
print(f"pool final: {len(vocab)}")
for n in NIVELES:
    print(f"  {n}: {c[n]}")
