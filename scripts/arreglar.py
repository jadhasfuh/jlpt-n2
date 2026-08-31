# -*- coding: utf-8 -*-
"""Sustituye texto en TODOS los campos de una lectura, no sólo en el cuerpo.

   Corrigiendo a mano se me olvidaba que el mismo kanji suele estar también en
   el título y en las opciones de las preguntas: el validador seguía marcando
   la lectura y parecía que el arreglo no había funcionado.

   uso:  python3 scripts/arreglar.py N1_kurashi_dinero-3 "viejo" "nuevo"
"""
import json, pathlib, sys

def arreglar(nombre: str, viejo: str, nuevo: str) -> int:
    p = pathlib.Path("data/fuente/lecturas", nombre + ".json")
    d = json.loads(p.read_text(encoding="utf-8"))
    n = 0
    for k in ("titulo", "cuerpo"):
        n += d[k].count(viejo); d[k] = d[k].replace(viejo, nuevo)
    for q in d.get("preguntas", []):
        n += q["p"].count(viejo); q["p"] = q["p"].replace(viejo, nuevo)
        n += sum(o.count(viejo) for o in q["opciones"])
        q["opciones"] = [o.replace(viejo, nuevo) for o in q["opciones"]]
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return n

if __name__ == "__main__":
    print(arreglar(sys.argv[1], sys.argv[2], sys.argv[3]), "sustituciones")
