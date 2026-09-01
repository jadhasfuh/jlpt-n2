# -*- coding: utf-8 -*-
"""Regalar acceso completo a alguien, sin pasar por Paddle.

    python3 scripts/24_cortesia.py dar amigo@correo.com 12 "compañero de clase"
    python3 scripts/24_cortesia.py quitar amigo@correo.com
    python3 scripts/24_cortesia.py lista

Los meses son obligatorios al dar: una cortesía sin fecha de fin es una
suscripción gratis para siempre que dentro de un año nadie recuerda haber
dado. Si hace falta renovarla, se vuelve a dar y se sustituye la anterior.

Funciona aunque la persona todavía no tenga cuenta: la cortesía va por correo,
y se aplica sola en cuanto entre con esa dirección.
"""
import os, re, subprocess, sys, datetime

DB = os.environ.get("DATABASE_URL") or (
    "postgresql://postgres.nstpivbrojehlaghfwov@aws-0-us-west-2.pooler.supabase.com:5432/postgres")
PSQL = os.environ.get("PSQL", "/opt/homebrew/opt/libpq/bin/psql")
CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def sql(consulta: str) -> str:
    r = subprocess.run([PSQL, DB, "-v", "ON_ERROR_STOP=1", "-tAq", "-c", consulta],
                       capture_output=True, text=True)
    if r.returncode:
        print(r.stderr.strip()); sys.exit(1)
    return r.stdout.strip()

def escapar(s: str) -> str:
    return s.replace("'", "''")

def uso():
    print(__doc__); sys.exit(1)

if len(sys.argv) < 2: uso()
accion = sys.argv[1]

if accion == "lista":
    filas = sql("""
      select email||'  hasta '||hasta::date
             ||case when hasta < now() then '  (caducada)' else '  ('||
                    round(extract(epoch from (hasta-now()))/86400)||' días)' end
             ||coalesce('  · '||nota,'')
      from cortesias order by hasta desc;""")
    print(filas if filas else "  no hay ninguna cortesía dada")

elif accion == "dar":
    if len(sys.argv) < 4: uso()
    email = sys.argv[2].strip().lower()
    if not CORREO.match(email):
        print(f"  «{email}» no parece un correo"); sys.exit(1)
    try:
        meses = int(sys.argv[3])
    except ValueError:
        uso()
    if meses < 1: print("  los meses tienen que ser al menos 1"); sys.exit(1)
    nota = escapar(sys.argv[4]) if len(sys.argv) > 4 else None
    sql(f"""insert into cortesias (email, hasta, nota)
            values ('{escapar(email)}', now() + interval '{meses} months',
                    {f"'{nota}'" if nota else 'null'})
            on conflict (email) do update
              set hasta = excluded.hasta, nota = coalesce(excluded.nota, cortesias.nota);""")
    hasta = sql(f"select hasta::date from cortesias where email='{escapar(email)}';")
    print(f"  {email}: acceso completo hasta el {hasta}")
    # Que se sepa si la persona ya tiene cuenta o si el regalo está esperando.
    hay = sql(f"select count(*) from perfiles where lower(email)='{escapar(email)}';")
    print("  ya tiene cuenta: se le aplica al recargar"
          if hay != "0" else
          "  todavía no tiene cuenta: se le aplicará sola cuando entre con ese correo")

elif accion == "quitar":
    if len(sys.argv) < 3: uso()
    email = sys.argv[2].strip().lower()
    antes = sql(f"select count(*) from cortesias where email='{escapar(email)}';")
    if antes == "0":
        print(f"  {email} no tenía ninguna cortesía"); sys.exit(0)
    sql(f"delete from cortesias where email='{escapar(email)}';")
    print(f"  quitada la cortesía de {email}")

else:
    uso()
