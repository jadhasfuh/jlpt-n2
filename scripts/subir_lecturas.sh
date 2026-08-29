#!/usr/bin/env bash
# Reexporta, regenera el SQL y sube sólo las lecturas a Supabase.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/06_exportar.py | grep -E "lecturas" || true
python3 scripts/10_generar_sql.py > /dev/null
PG=/opt/homebrew/opt/postgresql@16/bin
DB="postgresql://postgres.nstpivbrojehlaghfwov@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
# del seed completo extraemos sólo el bloque de lecturas
python3 - <<'PY' > /tmp/solo_lecturas.sql
import re, pathlib
s = pathlib.Path("data/dist/seed.sql").read_text(encoding="utf-8")
bloques = re.findall(r"insert into lecturas .*?;", s, re.S)
print("begin;"); print("\n".join(bloques)); print("commit;")
PY
$PG/psql "$DB" -v ON_ERROR_STOP=1 -q -f /tmp/solo_lecturas.sql
$PG/psql "$DB" -tAq -c "select 'lecturas en la base: ' || count(*) from lecturas;"
python3 scripts/13_validar_lecturas.py | tail -3
