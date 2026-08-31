# -*- coding: utf-8 -*-
"""Traduce al español los significados de la gramática bajada."""
import json, pathlib, subprocess, urllib.parse, re, time

CACHE = pathlib.Path("data/build/es_cache.json")
cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
filas = json.loads(pathlib.Path("data/build/gramatica_clasificada.json").read_text(encoding="utf-8"))

def pedir(t):
    url = ("https://translate.googleapis.com/translate_a/single"
           f"?client=gtx&sl=en&tl=es&dt=t&q={urllib.parse.quote(t)}")
    p = subprocess.run(["curl","-sL","--max-time","30","-A","Mozilla/5.0",url],
                       capture_output=True, text=True)
    return "".join(s[0] for s in json.loads(p.stdout)[0])

def limpiar(s):
    partes, vistos = [], set()
    for t in re.split(r"\s*[;,]\s*", s.strip()):
        k = t.strip().lower()
        if k and k not in vistos:
            vistos.add(k); partes.append(t.strip())
    return "; ".join(partes)

textos = sorted({f["en"] for f in filas if f["en"].strip()})
faltan = [t for t in textos if t not in cache]
print(f"significados únicos: {len(textos)} · por traducir: {len(faltan)}", flush=True)

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
        # Nunca guardar un fallo: si Google nos limita (429) devolvería "" y
        # esa cadena vacía se quedaría en la caché para siempre.
        if es.strip():
            cache[t] = limpiar(es)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"  {min(i+30,len(faltan))}/{len(faltan)}", flush=True)
    time.sleep(0.25)

for f in filas:
    f["es"] = cache.get(f["en"], "")
pathlib.Path("data/build/gramatica_clasificada.json").write_text(
    json.dumps(filas, ensure_ascii=False, indent=1), encoding="utf-8")
hechas = sum(1 for f in filas if f["es"])
print("con español:", hechas, "/", len(filas))
if hechas < len(filas):
    print(f"  faltan {len(filas)-hechas}: vuelve a lanzarlo más tarde (Google limita por horas)")
