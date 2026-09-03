# -*- coding: utf-8 -*-
"""Reparte la posición de la respuesta correcta en las preguntas de las lecturas.

Hermano de 23_reequilibrar_respuestas.py, que hace lo mismo con el banco de
examen. El problema aquí era más gordo: de las 748 preguntas de cuatro
opciones, 737 tenían la respuesta en la segunda; y de las 720 de tres, 650 en
la primera. Se aprobaba la comprensión lectora pulsando siempre la misma
casilla, sin leer el texto.

No se reescribe ninguna pregunta: se permutan las opciones y se mueve el
índice. El destino se reparte por turnos dentro de cada (nivel, nº de
opciones), así que es estable: volver a ejecutarlo no mueve nada.
"""
import json, pathlib, random, collections

D = pathlib.Path("data/fuente/lecturas")

archivos, grupos = {}, collections.defaultdict(list)
for f in sorted(D.glob("*.json")):
    datos = json.loads(f.read_text(encoding="utf-8"))
    archivos[f] = datos
    for i, q in enumerate(datos.get("preguntas", [])):
        nivel = datos["unidad_id"].split("/")[0]
        grupos[(nivel, len(q["opciones"]))].append((f.stem, i, q))

antes, despues, tocados = collections.Counter(), collections.Counter(), 0
for clave, lista in sorted(grupos.items()):
    lista.sort(key=lambda x: (x[0], x[1]))
    for k, (stem, i, q) in enumerate(lista):
        n = len(q["opciones"])
        vieja = q["correcta"]
        antes[vieja] += 1
        destino = k % n
        if destino == vieja:
            despues[vieja] += 1
            continue
        otros = [j for j in range(n) if j != vieja]
        random.Random(f"{stem}#{i}").shuffle(otros)
        perm, oi = [], 0
        for nuevo in range(n):
            if nuevo == destino:
                perm.append(vieja)
            else:
                perm.append(otros[oi]); oi += 1
        q["opciones"] = [q["opciones"][perm[x]] for x in range(n)]
        q["correcta"] = destino
        despues[destino] += 1
        tocados += 1

for f, datos in archivos.items():
    f.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

total = sum(antes.values())
print(f"preguntas: {total} · reordenadas: {tocados}")
print(f"  antes:   {dict(sorted(antes.items()))} → siempre la misma: {round(max(antes.values())/total*100)} %")
print(f"  después: {dict(sorted(despues.items()))} → siempre la misma: {round(max(despues.values())/total*100)} %")
