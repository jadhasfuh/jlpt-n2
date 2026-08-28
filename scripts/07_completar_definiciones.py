# -*- coding: utf-8 -*-
"""Rellena las definiciones que la fuente dejó vacías, consultando Jisho."""
import json, subprocess, urllib.parse, pathlib, time, re

CACHE = pathlib.Path("data/build/jisho_cache.json")
vocab = json.load(open("data/build/vocab_raw.json", encoding="utf-8"))
cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}

def consultar(termino):
    url = "https://jisho.org/api/v1/search/words?keyword=" + urllib.parse.quote(termino)
    p = subprocess.run(["curl", "-sL", "--max-time", "25", "-A", "Mozilla/5.0", url],
                       capture_output=True, text=True)
    try:
        datos = json.loads(p.stdout).get("data", [])
    except Exception:
        return ""
    for d in datos[:2]:
        sentidos = d.get("senses", [])
        if sentidos:
            defs = sentidos[0].get("english_definitions", [])
            if defs:
                return ", ".join(defs[:3])
    return ""

def limpio(s):
    s = re.sub(r"^（[^）]*）\s*", "", s or "").replace("～", "").replace("~", "")
    return s.strip()

pendientes = [r for r in vocab if not r["en"].strip()]
print(f"sin definición: {len(pendientes)}", flush=True)
nuevas = 0
for n, r in enumerate(pendientes, 1):
    clave = f"{r['kana']}|{r['kanji']}"
    if clave not in cache:
        termino = limpio(r["kanji"]) or limpio(r["kana"])
        cache[clave] = consultar(termino) if termino else ""
        time.sleep(0.35)
        if n % 20 == 0:
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
            print(f"  {n}/{len(pendientes)}", flush=True)
    if cache[clave]:
        r["en"] = cache[clave]
        nuevas += 1

CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
pathlib.Path("data/build/vocab_raw.json").write_text(
    json.dumps(vocab, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"completadas: {nuevas} | siguen vacías: {len(pendientes)-nuevas}")
