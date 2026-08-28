# -*- coding: utf-8 -*-
"""Etiqueta cada palabra con su nivel JLPT más bajo (N5 < N4 < N2)."""
import re, html, json, pathlib

def parse(path):
    doc = pathlib.Path(path).read_text(encoding="utf-8", errors="replace")
    row_re = re.compile(r"<tr[^>]*id='(\d+)'[^>]*>(.*?)</tr>", re.S)
    cell_re = re.compile(r"<td[^>]*>(.*?)</td>", re.S)
    def clean(s):
        return " ".join(html.unescape(re.sub(r"<[^>]+>", "", s)).replace("　"," ").split())
    out = []
    for m in row_re.finditer(doc):
        c = [clean(x) for x in cell_re.findall(m.group(2))]
        if len(c) >= 5:
            out.append({"kana": c[1], "kanji": c[2], "en": c[4]})
    return out

n5 = parse("data/raw/n5_vocab_raw.html")
n4 = parse("data/raw/n4_vocab_raw.html")
print("N5:", len(n5), "| N4:", len(n4))

def clave(r):  # kana + kanji identifica la entrada
    return (r["kana"].strip(), r["kanji"].strip())

set5 = {clave(r) for r in n5}
set4 = {clave(r) for r in n4}
# sólo kana, por si el kanji difiere entre listas
kana5 = {r["kana"].strip() for r in n5}
kana4 = {r["kana"].strip() for r in n4}

vocab = json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))
conteo = {"N5": 0, "N4": 0, "N2": 0}
for r in vocab:
    k = clave(r)
    if k in set5 or (r["kana"].strip() in kana5 and not r["kanji"]):
        r["jlpt"] = "N5"
    elif k in set4 or (r["kana"].strip() in kana4 and not r["kanji"]):
        r["jlpt"] = "N4"
    else:
        r["jlpt"] = "N2"
    conteo[r["jlpt"]] += 1

pathlib.Path("data/build/vocab_clasificado.json").write_text(
    json.dumps(vocab, ensure_ascii=False, indent=1), encoding="utf-8")
print("reparto por dificultad:", conteo)
