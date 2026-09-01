# -*- coding: utf-8 -*-
"""Reparte la posición de la respuesta correcta por el banco de examen.

El 78 % de los ítems escritos antes tenían la respuesta en la opción 1. Un
examen que se aprueba pulsando siempre la primera casilla no mide nada, y era
peor todavía en el test abierto de /test/n5, donde 23 de 25 caían en la misma
posición: cualquiera lo pasaba sin saber japonés.

Aquí no se reescribe ninguna pregunta. Se permutan las opciones y se arrastra
todo lo que apunta a ellas:

  · `respuesta`, que es un índice;
  · `logica_distractores`, que va alineada con las opciones que NO son la
    correcta, en orden;
  · `orden` de 並べ替え, que es una lista de índices de opción — y de la que
    depende la comprobación de la ★ en 20_validar_examen.py.

El destino se reparte por turnos dentro de cada (nivel, tipo), así que es
estable: volver a ejecutarlo deja la respuesta donde ya estaba.
"""
import json, pathlib, random, collections

D = pathlib.Path("data/fuente/examen")

archivos = {}
grupos = collections.defaultdict(list)
for f in sorted(D.glob("*.json")):
    datos = json.loads(f.read_text(encoding="utf-8"))
    archivos[f] = datos
    for i, it in enumerate(datos):
        grupos[(it["nivel"], it["tipo"])].append((f, i, it))

antes = collections.Counter()
despues = collections.Counter()
tocados = 0

for clave, lista in sorted(grupos.items()):
    lista.sort(key=lambda x: x[2]["id"])
    for k, (f, i, it) in enumerate(lista):
        n = len(it["opciones"])
        vieja = it["respuesta"]
        antes[vieja] += 1
        destino = k % n
        if destino == vieja:
            despues[vieja] += 1
            continue

        otros = [j for j in range(n) if j != vieja]
        random.Random(it["id"]).shuffle(otros)
        # perm[nuevo] = viejo
        perm, oi = [], 0
        for nuevo in range(n):
            if nuevo == destino:
                perm.append(vieja)
            else:
                perm.append(otros[oi]); oi += 1
        inv = {viejo: nuevo for nuevo, viejo in enumerate(perm)}

        # Las razones van pegadas a su opción, no a su posición.
        razones = it.get("logica_distractores") or []
        por_opcion = {}
        for pos, viejo in enumerate([j for j in range(n) if j != vieja]):
            if pos < len(razones):
                por_opcion[viejo] = razones[pos]

        it["opciones"] = [it["opciones"][perm[x]] for x in range(n)]
        it["respuesta"] = destino
        if razones:
            it["logica_distractores"] = [
                por_opcion.get(perm[x], "") for x in range(n) if x != destino
            ]
        if it.get("orden"):
            it["orden"] = [inv[v] for v in it["orden"]]

        despues[destino] += 1
        tocados += 1

for f, datos in archivos.items():
    f.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

total = sum(antes.values())
print(f"ítems: {total} · reordenados: {tocados}")
print(f"  antes:   {dict(sorted(antes.items()))} → siempre la misma: {round(max(antes.values())/total*100)} %")
print(f"  después: {dict(sorted(despues.items()))} → siempre la misma: {round(max(despues.values())/total*100)} %")
