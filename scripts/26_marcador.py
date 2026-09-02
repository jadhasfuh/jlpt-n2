# -*- coding: utf-8 -*-
"""Moderar el marcador del test abierto.

    python3 scripts/26_marcador.py lista            # las últimas 40 filas
    python3 scripts/26_marcador.py lista 100        # las últimas 100
    python3 scripts/26_marcador.py borrar 137       # una fila por su id
    python3 scripts/26_marcador.py borrar-nombre X  # todo lo de ese nombre

El nombre lo escribe cualquiera sin cuenta y se enseña en público, así que
tiene que haber una forma de quitar lo que no debería estar ahí. Sin esto,
«podemos borrar filas a mano» era una intención, no una herramienta.
"""
import json, os, subprocess, sys

PSQL = os.environ.get("PSQL", "/opt/homebrew/opt/libpq/bin/psql")
DB = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres.nstpivbrojehlaghfwov@aws-0-us-west-2.pooler.supabase.com:5432/postgres")

def consultar(sql: str):
    r = subprocess.run([PSQL, DB, "-tAqX", "-c", sql], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr.strip(), file=sys.stderr); sys.exit(1)
    return r.stdout.strip()

def escapar(v: str) -> str:
    return v.replace("'", "''")

def lista(cuantas=40):
    sql = ("select json_agg(f) from (select id, nivel, nombre, aciertos, total, "
           f"to_char(creado,'YYYY-MM-DD HH24:MI') as cuando from marcador "
           f"order by creado desc limit {int(cuantas)}) f;")
    filas = json.loads(consultar(sql) or "[]") or []
    print(f"{len(filas)} filas (las más nuevas primero)\n")
    for f in filas:
        print(f'  {f["id"]:>6}  {f["cuando"]}  {f["nivel"]}  '
              f'{f["aciertos"]:>2}/{f["total"]:<2}  {f["nombre"]}')

def borrar(id_):
    consultar(f"delete from marcador where id = {int(id_)};")
    print(f"borrada la fila {id_}")

def borrar_nombre(nombre):
    n = consultar(f"with x as (delete from marcador where nombre = '{escapar(nombre)}' "
                  "returning 1) select count(*) from x;")
    print(f"borradas {n} filas de «{nombre}»")

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] not in ("lista", "borrar", "borrar-nombre"):
        print(__doc__); sys.exit(1)
    if args[0] == "lista": lista(*(args[1:2] or []))
    elif args[0] == "borrar": borrar(args[1])
    else: borrar_nombre(args[1])
