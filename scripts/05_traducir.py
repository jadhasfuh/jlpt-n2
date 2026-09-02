# -*- coding: utf-8 -*-
"""Traduce EN->ES las definiciones del vocabulario. Sin API key: usa el endpoint
público de traducción. Cachea en data/build/es_cache.json y es reanudable.
Cuando haya ANTHROPIC_API_KEY, scripts/05b_traducir_claude.py mejora esto."""
import json, os, subprocess, urllib.parse, pathlib, sys, time, re

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

# La caché vive en data/build/, que está fuera del repositorio. Si falta —un
# clon nuevo, o un borrado— se reconstruye sola. Sin esto habría que retraducir
# 8.400 definiciones contra un servicio público que bloquea por tandas.
#
# Se recupera primero de **Supabase**, no de data/dist/. Reconstruir desde dist
# parecía suficiente hasta que se comprobó el círculo: si lo que se rompe es
# justo la exportación, dist no tiene español y la reconstrucción no recupera
# nada. La base guarda lo último que se publicó, que es lo que de verdad hace
# de copia.
def _de_la_base():
    import base64, subprocess
    url = os.environ.get("DATABASE_URL") or (
        "postgresql://postgres.nstpivbrojehlaghfwov@aws-0-us-west-2.pooler.supabase.com"
        ":5432/postgres")
    psql = os.environ.get("PSQL", "/opt/homebrew/opt/libpq/bin/psql")
    consulta = ("select encode(convert_to(json_agg(json_build_object('en',en,'es',es))::text,"
                "'UTF8'),'base64') from (select distinct en,es from vocabulario "
                "where coalesce(es,'')<>'' and coalesce(en,'')<>'' union "
                "select distinct en,es from gramatica "
                "where coalesce(es,'')<>'' and coalesce(en,'')<>'') t;")
    try:
        r = subprocess.run([psql, url, "-tAqX", "-c", consulta],
                           capture_output=True, text=True, timeout=120)
        if r.returncode: return []
        return json.loads(base64.b64decode(r.stdout.strip()).decode("utf-8")) or []
    except Exception:
        return []   # sin base a mano se sigue con lo que haya

if sum(1 for v in cache.values() if v) < 1000:
    _rec = _de_la_base()
    for _r in _rec:
        _en, _es = (_r.get("en") or "").strip(), (_r.get("es") or "").strip()
        if _en and _es and not cache.get(_en): cache[_en] = _es
    if _rec: print(f"recuperadas de la base: {len(_rec)}")

for _f in ("data/dist/vocabulario.json", "data/dist/gramatica.json"):
    _p = pathlib.Path(_f)
    if not _p.exists(): continue
    for _r in json.loads(_p.read_text(encoding="utf-8")):
        _en, _es = (_r.get("en") or "").strip(), (_r.get("es") or "").strip()
        if _en and _es and not cache.get(_en): cache[_en] = _es

# Las definiciones escritas a mano mandan sobre la máquina y sobre la caché,
# que vive fuera del repositorio. Se cargan siempre, también en un clon nuevo.
A_MANO = pathlib.Path("data/fuente/traducciones_es.tsv")
if A_MANO.exists():
    n = 0
    for l in A_MANO.read_text(encoding="utf-8").splitlines():
        if not l.strip() or l.startswith("#") or "\t" not in l: continue
        en_, es_ = l.split("\t", 1)
        if es_.strip(): cache[en_] = es_.strip(); n += 1
    print(f"definiciones a mano: {n}")
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

# La caché se escribe SIEMPRE, no sólo dentro del bucle.
#
# Antes se guardaba únicamente al terminar cada lote, así que si no faltaba
# nada por traducir el bucle no se ejecutaba y la reconstrucción de arriba se
# quedaba en memoria. El fichero seguía sin existir, 06 exportaba sin español y
# la app enseñaba los significados en inglés estando en español.
CACHE.parent.mkdir(parents=True, exist_ok=True)
CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=0), encoding="utf-8")

vacias = sum(1 for t in unicos if not cache.get(t))
print(f"listo. sin traducir: {vacias} · caché guardada: {len(cache)} definiciones")
