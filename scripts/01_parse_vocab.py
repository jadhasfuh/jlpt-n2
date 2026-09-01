# -*- coding: utf-8 -*-
"""Parsea el HTML crudo de jlptstudy (lista N2) a data/build/vocab_raw.json"""
import re, json, html, unicodedata, pathlib

SRC = pathlib.Path("data/raw/n2_vocab_raw.html")
OUT = pathlib.Path("data/build/vocab_raw.json")

doc = SRC.read_text(encoding="utf-8", errors="replace")

row_re = re.compile(r"<tr[^>]*id='(\d+)'[^>]*>(.*?)</tr>", re.S)
cell_re = re.compile(r"<td[^>]*>(.*?)</td>", re.S)

def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = s.replace("　", " ")
    return " ".join(s.split())

rows = []
for m in row_re.finditer(doc):
    cells = [clean(c) for c in cell_re.findall(m.group(2))]
    if len(cells) < 5:
        continue
    idx, kana, kanji, pos, eng = cells[0], cells[1], cells[2], cells[3], cells[4]
    rows.append({"id": int(idx), "kana": kana, "kanji": kanji, "pos": pos, "en": eng})

print("filas:", len(rows))

# --- higiene de datos ---
KANA = r"぀-ヿー"
CJK  = r"一-鿿"
def is_jp(s): return bool(re.search(f"[{KANA}{CJK}]", s))

bad = [r for r in rows if not is_jp(r["kana"]) and not is_jp(r["kanji"])]
print("sin japonés (mojibake/vacías):", len(bad))
for r in bad[:20]: print("   ", r)

empty_en = [r for r in rows if not r["en"].strip()]
print("sin definición:", len(empty_en))

# Las correcciones a mano se aplican AQUÍ, no sólo al exportar. La lista
# original trae mojibake ("Ͼ立" por 対立), y si el resto del pipeline lo ve
# corrupto clasifica mal y, peor, vuelve a importar la palabra buena desde las
# listas como si fuera otra distinta, con el id repetido.
_c = pathlib.Path("data/fuente/correcciones.tsv")
if _c.exists():
    _por_id = {r["id"]: r for r in rows}
    _n = 0
    for _l in _c.read_text(encoding="utf-8").splitlines():
        _l = re.sub(r"\s*#.*$", "", _l).rstrip()
        if not _l or _l.startswith(("#", "id|")): continue
        _campos = (_l.split("|") + [""] * 5)[:5]
        _r = _por_id.get(int(_campos[0]))
        if not _r: continue
        for _k, _v in zip(("kana", "kanji", "en", "es"), _campos[1:]):
            if _v.strip(): _r[_k] = _v.strip(); _n += 1
    print("correcciones a mano aplicadas:", _n)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
print("->", OUT)
