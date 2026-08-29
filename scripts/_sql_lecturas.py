# -*- coding: utf-8 -*-
"""Extrae del seed sólo el bloque de lecturas y añade el borrado de huérfanas."""
import json, pathlib, re
s = pathlib.Path("data/dist/seed.sql").read_text(encoding="utf-8")
bloques = re.findall(r"insert into lecturas .*?;", s, re.S)
ids = [l["unidad_id"] for l in json.loads(
    pathlib.Path("data/dist/lecturas.json").read_text(encoding="utf-8"))]
lista = ", ".join("'" + i.replace("'", "''") + "'" for i in ids) or "''"
print("begin;")
print("\n".join(bloques))
print(f"delete from lecturas where unidad_id not in ({lista});")
print("commit;")
