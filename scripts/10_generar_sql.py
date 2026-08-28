# -*- coding: utf-8 -*-
"""Genera data/dist/seed.sql: todo el contenido como INSERTs, para cargarlo
   con psql sin necesitar la service key.

   psql "$DATABASE_URL" -f supabase/migrations/*.sql -f data/dist/seed.sql
"""
import json, pathlib

D = pathlib.Path("data/dist")
leer = lambda n: json.loads((D / f"{n}.json").read_text(encoding="utf-8"))

def lit(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, (list, dict)):
        if v and isinstance(v, list) and all(isinstance(x, int) for x in v):
            return "'{" + ",".join(str(x) for x in v) + "}'"
        if isinstance(v, list) and all(isinstance(x, str) for x in v):
            return "'{" + ",".join('"' + x.replace('"', '\\"') + '"' for x in v) + "}'"
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

def bloque(tabla, columnas, filas, clave, por=200):
    out = []
    actualiza = ", ".join(f"{c} = excluded.{c}" for c in columnas if c != clave)
    for i in range(0, len(filas), por):
        valores = ",\n  ".join("(" + ", ".join(lit(f.get(c)) for c in columnas) + ")"
                               for f in filas[i:i + por])
        out.append(f"insert into {tabla} ({', '.join(columnas)}) values\n  {valores}\n"
                   f"on conflict ({clave}) do update set {actualiza};")
    return "\n".join(out)

secciones = [{**s, "orden": i + 1} for i, s in enumerate(leer("secciones"))]
gramatica = [{**g, "orden": i + 1} for i, g in enumerate(leer("gramatica"))]

partes = [
    "-- Contenido del curso N2. Generado por scripts/10_generar_sql.py — no editar a mano.",
    "begin;",
    bloque("secciones", ["id", "ja", "es", "orden", "subgrupos"], secciones, "id"),
    bloque("vocabulario",
           ["id", "kana", "kanji", "escritura", "lectura", "pos", "en", "es",
            "es_origen", "seccion", "subgrupo", "jlpt"],
           leer("vocabulario"), "id"),
    bloque("gramatica", ["id", "forma", "lectura", "en", "es", "tier", "cat", "orden"],
           gramatica, "id"),
    bloque("niveles", ["id", "numero", "seccion", "titulo_ja", "titulo_es", "palabras", "gramatica"],
           leer("niveles"), "id"),
    bloque("lecturas", ["nivel_id", "titulo", "cuerpo", "traduccion", "preguntas"],
           leer("lecturas"), "nivel_id"),
    "commit;",
]
salida = D / "seed.sql"
salida.write_text("\n\n".join(partes) + "\n", encoding="utf-8")
print(f"{salida}  {salida.stat().st_size/1024:.0f} KB")
for n, d in [("secciones", secciones), ("vocabulario", leer("vocabulario")),
             ("gramatica", gramatica), ("niveles", leer("niveles")), ("lecturas", leer("lecturas"))]:
    print(f"  {n:<12} {len(d):5d}")
