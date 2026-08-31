# -*- coding: utf-8 -*-
"""Genera data/dist/seed_examen.sql con el banco de preguntas."""
import json, pathlib, subprocess, sys

if subprocess.run([sys.executable, "scripts/20_validar_examen.py"]).returncode:
    sys.exit("No se genera SQL con el banco en rojo.")

items = []
for f in sorted(pathlib.Path("data/fuente/examen").glob("*.json")):
    items += json.loads(f.read_text(encoding="utf-8"))

CAMPOS = ["id", "nivel", "tipo", "grupo", "orden_grupo", "instruccion_ja",
          "enunciado", "objetivo", "opciones", "respuesta", "logica_distractores",
          "explicacion", "puntos", "pasaje", "guion", "audio", "etiquetas",
          "dificultad"]
JSONB = {"opciones", "logica_distractores", "explicacion", "puntos", "pasaje",
         "guion", "etiquetas"}

def lit(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return str(v)
    return "'" + str(v).replace("'", "''") + "'"

filas = []
for it in items:
    vals = []
    for c in CAMPOS:
        v = it.get(c)
        if c in JSONB:
            vals.append("null" if v is None else lit(json.dumps(v, ensure_ascii=False)) + "::jsonb")
        elif c == "orden_grupo":
            vals.append(str(v or 0))
        else:
            vals.append(lit(v))
    filas.append("  (" + ", ".join(vals) + ")")

ids = ", ".join(lit(it["id"]) for it in items)
sql = (
  "-- Banco de preguntas. Generado por scripts/21_sql_examen.py — no editar a mano.\n"
  "begin;\n"
  f"insert into items ({', '.join(CAMPOS)}) values\n" + ",\n".join(filas) + "\n"
  "on conflict (id) do update set " +
  ", ".join(f"{c} = excluded.{c}" for c in CAMPOS if c != "id") + ";\n\n"
  f"delete from items where id not in ({ids});\n"
  "commit;\n")

salida = pathlib.Path("data/dist/seed_examen.sql")
salida.write_text(sql, encoding="utf-8")
print(f"\n{salida}  {salida.stat().st_size/1024:.0f} KB  ·  {len(items)} ítems")
