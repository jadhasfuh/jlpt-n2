# -*- coding: utf-8 -*-
"""Traduce EN->ES las definiciones del vocabulario. Sin API key: usa el endpoint
público de traducción. Cachea en data/build/es_cache.json y es reanudable.
Cuando haya ANTHROPIC_API_KEY, scripts/05b_traducir_claude.py mejora esto."""
import json, subprocess, urllib.parse, pathlib, sys, time, re

CACHE = pathlib.Path("data/build/es_cache.json")
LOTE = 30

def pedir(texto):
    q = urllib.parse.quote(texto)
    url = ("https://translate.googleapis.com/translate_a/single"
           f"?client=gtx&sl=en&tl=es&dt=t&q={q}")
    p = subprocess.run(["curl", "-sL", "--max-time", "30", "-A", "Mozilla/5.0", url],
                       capture_output=True, text=True)
    d = json.loads(p.stdout)
    return "".join(seg[0] for seg in d[0])

def limpiar(s):
    """Quita términos repetidos: 'saludo, saludo' -> 'saludo'."""
    s = s.strip()
    partes, vistos = [], set()
    for t in re.split(r"\s*,\s*", s):
        k = t.strip().lower()
        if k and k not in vistos:
            vistos.add(k); partes.append(t.strip())
    return ", ".join(partes)

def traducir_lote(textos):
    """Devuelve lista alineada; si el conteo de líneas no cuadra, cae a uno por uno."""
    junto = "\n".join(textos)
    try:
        res = pedir(junto).split("\n")
    except Exception:
        res = []
    if len(res) != len(textos):
        res = []
        for t in textos:
            try:
                res.append(pedir(t))
            except Exception:
                res.append("")
            time.sleep(0.15)
    return [limpiar(x) for x in res]

vocab = json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))
unicos = sorted({r["en"].strip() for r in vocab if r["en"].strip()})
cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
faltan = [t for t in unicos if t not in cache or not cache[t]]
print(f"definiciones únicas: {len(unicos)} | ya en caché: {len(unicos)-len(faltan)} | por traducir: {len(faltan)}", flush=True)

for i in range(0, len(faltan), LOTE):
    grupo = faltan[i:i+LOTE]
    for t, es in zip(grupo, traducir_lote(grupo)):
        cache[t] = es
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"  {min(i+LOTE, len(faltan))}/{len(faltan)}", flush=True)
    time.sleep(0.25)

vacias = sum(1 for t in unicos if not cache.get(t))
print(f"listo. sin traducir: {vacias}")
