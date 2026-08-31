# -*- coding: utf-8 -*-
"""Comprueba el banco de preguntas antes de subirlo.

Las reglas salen de «Reglas de calidad» en docs/JLPT-EXAMEN.md. Se ejecuta
siempre antes de sembrar: un ítem con dos respuestas válidas o con la respuesta
fuera de rango es peor que no tener ítem.
"""
import json, pathlib, sys, collections

TIPOS_3 = {"sokuji"}          # 即時応答 lleva tres opciones, no cuatro
SUBCADENA_PROHIBIDA = {"bunmyaku", "iikae", "youhou", "tanbun", "chuubun",
                       "chobun", "tougou", "shuchou", "jouhou",
                       "kadai", "point", "gaiyou", "sokuji", "tougou_choukai"}
LARGOS = {"tanbun": (150, 260), "chuubun": (400, 620), "shuchou": (800, 1000),
          "jouhou": (550, 800)}

fallos, avisos = [], []
items, vistos = [], {}

for f in sorted(pathlib.Path("data/fuente/examen").glob("*.json")):
    for it in json.loads(f.read_text(encoding="utf-8")):
        it["_archivo"] = f.name
        items.append(it)

for it in items:
    d = f'{it["_archivo"]}:{it["id"]}'
    ops = it.get("opciones") or []
    esperadas = 3 if it["tipo"] in TIPOS_3 else 4

    if it["id"] in vistos:
        fallos.append(f"{d}: id repetido (también en {vistos[it['id']]})")
    vistos[it["id"]] = it["_archivo"]

    if len(ops) != esperadas:
        fallos.append(f'{d}: {len(ops)} opciones, se esperaban {esperadas}')
    if not isinstance(it.get("respuesta"), int) or not (0 <= it["respuesta"] < len(ops)):
        fallos.append(f'{d}: respuesta fuera de rango')
    if len(set(ops)) != len(ops):
        fallos.append(f'{d}: hay opciones repetidas')

    # Ninguna opción puede ser subcadena de otra: daría dos respuestas válidas.
    # Sólo donde las opciones son significados o frases: en 漢字読み el distractor
    # típico es comerse el alargamiento (さいよう → さいよ), y esa subcadena es
    # una lectura distinta, no media respuesta.
    if it["tipo"] in SUBCADENA_PROHIBIDA:
        for i, a in enumerate(ops):
            for j, b in enumerate(ops):
                if i != j and a and a in b:
                    fallos.append(f'{d}: la opción {i+1} está contenida en la {j+1}')

    for lengua in ("es", "en"):
        if not (it.get("explicacion") or {}).get(lengua, "").strip():
            fallos.append(f'{d}: falta la explicación en {lengua}')

    # Hay que poder justificar por qué falla cada distractor.
    log = it.get("logica_distractores") or []
    if it["tipo"] not in ("bunpou2",) and len(log) != len(ops) - 1:
        avisos.append(f'{d}: {len(log)} razones para {len(ops)-1} distractores')

    if it["tipo"] in LARGOS and it.get("pasaje"):
        n = len(it["pasaje"]["texto"])
        lo, hi = LARGOS[it["tipo"]]
        if not (lo <= n <= hi):
            avisos.append(f'{d}: el pasaje tiene {n} caracteres (se esperan {lo}–{hi})')

    if it["tipo"] in ("kadai", "point", "gaiyou", "sokuji", "tougou_choukai"):
        if not it.get("guion"):
            fallos.append(f'{d}: ítem de escucha sin guion')

# Un grupo (lectura larga, audio compartido) necesita su texto en el primero.
grupos = collections.defaultdict(list)
for it in items:
    if it.get("grupo"): grupos[it["grupo"]].append(it)
for g, lista in grupos.items():
    lista.sort(key=lambda x: x.get("orden_grupo", 0))
    if not (lista[0].get("pasaje") or lista[0].get("guion")):
        fallos.append(f"grupo {g}: el primer ítem no trae ni pasaje ni guion")
    if [x.get("orden_grupo", 0) for x in lista] != list(range(len(lista))):
        fallos.append(f"grupo {g}: orden_grupo no es 0,1,2…")

por_tipo = collections.Counter(it["tipo"] for it in items)
print(f"{len(items)} ítems en {len(list(pathlib.Path('data/fuente/examen').glob('*.json')))} archivos")
for t, n in sorted(por_tipo.items(), key=lambda x: -x[1]):
    print(f"  {n:3d} {t}")
if avisos:
    print("\nAvisos:"); [print("  ·", a) for a in avisos]
if fallos:
    print("\nFALLOS:"); [print("  ✗", f) for f in fallos]
    sys.exit(1)
print("\nTodo en regla.")
