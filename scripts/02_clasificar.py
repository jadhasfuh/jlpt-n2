# -*- coding: utf-8 -*-
"""Clasifica el vocabulario en secciones/subgrupos -> data/build/vocab_clasificado.json"""
import json, re, sys, collections, pathlib
sys.path.insert(0, "scripts")
from taxonomia import SECCIONES, SUBGRUPOS
from reglas import REGLAS_EN, REGLAS_KANJI, REGLAS_EN2

# Etiquetas de registro que trae la fuente entre paréntesis. Se separan del
# significado: si se dejan, el traductor las convierte en disparates
# ("(hon) mother" -> "(cariño) madre").
ETIQUETAS = {
    "hon": "cortés (respeto)", "hum": "cortés (humilde)", "pol": "cortés",
    "col": "coloquial", "sl": "jerga", "fam": "familiar", "vulg": "vulgar",
    "uk": "se escribe en kana", "abbr": "abreviatura", "arch": "arcaico",
    "obs": "en desuso", "obsc": "poco usual", "derog": "despectivo",
    "male": "habla masculina", "fem": "habla femenina", "on-mim": "onomatopeya",
    "iK": "kanji irregular", "io": "okurigana irregular", "oK": "kanji antiguo",
    "ik": "kana irregular", "ok": "kana antiguo", "gikun": "lectura especial",
}
RX_ETIQUETA = re.compile(r"\((" + "|".join(map(re.escape, ETIQUETAS)) + r")\)\s*")

def normalizar(en):
    """Devuelve (definición limpia, lista de etiquetas de registro)."""
    marcas = [ETIQUETAS[m] for m in RX_ETIQUETA.findall(en)]
    en = RX_ETIQUETA.sub("", en)
    en = re.sub(r"^\s*\(\d+\)\s*", "", en)          # "(1) x, (2) y" -> "x; y"
    en = re.sub(r"\s*,?\s*\(\d+\)\s*", "; ", en)
    en = re.sub(r"\s+", " ", en).strip(" ;,")
    return en, sorted(set(marcas))

vocab = json.load(open("data/build/vocab_raw.json", encoding="utf-8"))
for r in vocab:
    r["en"], r["registro"] = normalizar(r["en"])
P1 = [(s, g, re.compile(p, re.I)) for s, g, p in REGLAS_EN]
P2 = [(s, g, re.compile(p, re.I)) for s, g, p in REGLAS_EN2]

def singular(t):
    return re.sub(r"(\w{3,}?)(?:ies\b|es\b|s\b)", r"\1", t)

def es_afijo(r):
    t = r["kana"] + r["kanji"]
    return "~" in t or "～" in t

def por_pos(r):
    pos = set(p.strip() for p in re.split(r"[,\s]+", r["pos"]) if p.strip())
    if pos & {"conj"}:                        return ("tsunagu", "conjunciones")
    if pos & {"pref", "suf", "n-suf", "ctr"}: return ("tsunagu", "afijos")
    if pos & {"int", "exp"}:                  return ("kokoro", "saludos")
    if pos & {"adj-pn"}:                      return ("tsunagu", "kosoado")
    if pos & {"adv", "n-adv"}:                return ("tsunagu", "adverbios")
    if pos & {"num"}:                         return ("jikan", "contadores")
    if any(p.startswith("v") or p in {"u-v", "vs", "vt", "vi"} for p in pos):
        return ("sonota", "verbos")
    if pos & {"adj", "adj-na", "adj-no"}:     return ("sonota", "adjetivos")
    if pos & {"n", "n-t"}:                    return ("sonota", "sustantivos")
    return ("sonota", "varios")

def clasificar(r):
    en = r["en"]
    if en.strip():
        for s, g, rx in P1:
            if rx.search(en): return s, g, "en"
        sg = singular(en)
        if sg != en:
            for s, g, rx in P1:
                if rx.search(sg): return s, g, "en-sg"
        for s, g, rx in P2:
            if rx.search(en) or rx.search(sg): return s, g, "en2"
    if es_afijo(r):
        return "tsunagu", "afijos", "afijo"
    if r["kanji"]:
        for s, g, chars in REGLAS_KANJI:
            if any(c in r["kanji"] for c in chars): return s, g, "kanji"
    s, g = por_pos(r)
    return s, g, "pos"

conteo, fuente = collections.Counter(), collections.Counter()
for r in vocab:
    s, g, f = clasificar(r)
    r["seccion"], r["subgrupo"] = s, g
    fuente[f] += 1; conteo[(s, g)] += 1

pathlib.Path("data/build/vocab_clasificado.json").write_text(
    json.dumps(vocab, ensure_ascii=False, indent=1), encoding="utf-8")

print("origen:", dict(fuente))
fb = sum(c for (s, g), c in conteo.items() if s == "sonota")
print(f"en その他: {fb} ({fb/len(vocab)*100:.1f}%)")
vacios = [(s,g) for s,_,_ in SECCIONES for g,_,_ in SUBGRUPOS[s] if conteo.get((s,g),0)==0]
print("subgrupos vacíos:", vacios or "ninguno")
peq = sorted([(c,s,g) for (s,g),c in conteo.items() if c<20])
print("subgrupos con <20 palabras (menos de un nivel):")
for c,s,g in peq: print(f"   {c:3d}  {s}/{g}")
