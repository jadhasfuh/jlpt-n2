# -*- coding: utf-8 -*-
"""Traduce al español los significados de los kanji. Reusa la caché de 05."""
import json, pathlib, sys
sys.path.insert(0, "scripts")
import importlib.util
spec = importlib.util.spec_from_file_location("tr", "scripts/05_traducir.py")

# Reusamos las funciones de 05 sin ejecutar su main: se copian aquí las mínimas.
import subprocess, urllib.parse, re, time
CACHE = pathlib.Path("data/build/es_cache.json")
cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}

def pedir(texto):
    url = ("https://translate.googleapis.com/translate_a/single"
           f"?client=gtx&sl=en&tl=es&dt=t&q={urllib.parse.quote(texto)}")
    p = subprocess.run(["curl","-sL","--max-time","30","-A","Mozilla/5.0",url],
                       capture_output=True, text=True)
    return "".join(seg[0] for seg in json.loads(p.stdout)[0])

def limpiar(s):
    partes, vistos = [], set()
    for t in re.split(r"\s*,\s*", s.strip()):
        k = t.strip().lower()
        if k and k not in vistos:
            vistos.add(k); partes.append(t.strip().lower())
    return ", ".join(partes)

kanji = json.load(open("data/build/kanji.json", encoding="utf-8"))
textos = sorted({", ".join(k["en"]) for k in kanji if k["en"]})
faltan = [t for t in textos if t not in cache]
print(f"significados únicos: {len(textos)} | por traducir: {len(faltan)}", flush=True)

for i in range(0, len(faltan), 30):
    grupo = faltan[i:i+30]
    try:
        res = pedir("\n".join(grupo)).split("\n")
    except Exception:
        res = []
    if len(res) != len(grupo):
        res = []
        for t in grupo:
            try: res.append(pedir(t))
            except Exception: res.append("")
            time.sleep(0.15)
    for t, es in zip(grupo, res):
        # Nunca guardar un fallo: si Google nos limita (429) devolvería "" y esa
        # cadena vacía se quedaría en la caché dándose por buena para siempre.
        if es.strip():
            cache[t] = limpiar(es)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"  {min(i+30,len(faltan))}/{len(faltan)}", flush=True)
    time.sleep(0.25)

for k in kanji:
    k["es"] = cache.get(", ".join(k["en"]), "")
pathlib.Path("data/build/kanji.json").write_text(
    json.dumps(kanji, ensure_ascii=False, indent=1), encoding="utf-8")
print("con español:", sum(1 for k in kanji if k["es"]), "/", len(kanji))
