# -*- coding: utf-8 -*-
"""Los avisos que ha mandado la gente, con lo que hace falta para atacarlos.

Cada aviso llega con un id y poco más; lo útil es verlo al lado de lo que hoy
dice la app y de la palabra en japonés. Eso es lo que hace este script: junta
el aviso con el dato actual para poder decidir en un vistazo.

   uso:  python3 scripts/22_reportes.py                 # lo que queda por mirar
         python3 scripts/22_reportes.py --todos         # también lo ya cerrado
         python3 scripts/22_reportes.py --arreglado 12 34
         python3 scripts/22_reportes.py --descartado 7
"""
import argparse, json, os, pathlib, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("--todos", action="store_true")
ap.add_argument("--arreglado", nargs="*", type=int, default=[])
ap.add_argument("--descartado", nargs="*", type=int, default=[])
a = ap.parse_args()

# .env.local no se comparte; el script lo lee igual que el resto del pipeline.
env = {}
for linea in pathlib.Path(".env.local").read_text(encoding="utf-8").splitlines():
    if "=" in linea and not linea.strip().startswith("#"):
        k, v = linea.split("=", 1)
        env[k.strip()] = v.split("#")[0].strip()
URL = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = env.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SECRET_KEY")
if not URL or not KEY:
    sys.exit("faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local")

def api(ruta, metodo="GET", cuerpo=None, extra=None):
    """Se llama con curl y no con urllib porque el Python de este Mac no trae
       los certificados raíz y falla la verificación TLS contra Supabase."""
    cmd = ["curl", "-sS", "-X", metodo, f"{URL}/rest/v1/{ruta}",
           "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}",
           "-H", "Content-Type: application/json"]
    for k, v in (extra or {}).items(): cmd += ["-H", f"{k}: {v}"]
    if cuerpo is not None: cmd += ["-d", json.dumps(cuerpo)]
    salida = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    if not salida.strip(): return []
    datos = json.loads(salida)
    if isinstance(datos, dict) and datos.get("message"):
        sys.exit(f"Supabase: {datos['message']}")
    return datos

def cerrar(ids, estado):
    for i in ids:
        api(f"reportes?id=eq.{i}", "PATCH",
            {"estado": estado, "resuelto": "now()"}, {"Prefer": "return=minimal"})
    print(f"{len(ids)} marcados como {estado}")

if a.arreglado: cerrar(a.arreglado, "arreglado")
if a.descartado: cerrar(a.descartado, "descartado")
if a.arreglado or a.descartado: sys.exit(0)

filtro = "" if a.todos else "&estado=eq.abierto"
reportes = api(f"reportes?select=*&order=creado.desc{filtro}")
if not reportes:
    print("No hay avisos pendientes."); sys.exit(0)

# El dato de hoy, para no tener que ir a buscarlo a mano.
vocab = {str(p["id"]): p for p in json.load(open("data/dist/vocabulario.json", encoding="utf-8"))}
gram = {g["id"]: g for g in json.load(open("data/dist/gramatica.json", encoding="utf-8"))}

def actual(r):
    if r["tipo"] == "vocabulario":
        p = vocab.get(r["ref"])
        if not p: return "· la palabra ya no existe en el catálogo"
        return (f"· {p['escritura']}（{p.get('lectura') or ''}）\n"
                f"    es: {p.get('es') or '—'}\n    en: {p.get('en') or '—'}")
    if r["tipo"] == "gramatica":
        g = gram.get(r["ref"])
        if not g: return "· la gramática ya no existe en el catálogo"
        return (f"· {g['forma']}（{g.get('lectura') or ''}）\n"
                f"    es: {g.get('es') or '—'}\n    en: {g.get('en') or '—'}")
    return f"· {r['tipo']} {r['ref']}"

MOTIVOS = {"traduccion": "la traducción", "lectura": "la lectura",
           "ejemplo": "el ejemplo", "otro": "otra cosa"}

por_tipo = {}
for r in reportes: por_tipo.setdefault(r["tipo"], []).append(r)

print(f"{len(reportes)} aviso(s)"
      f"{'' if a.todos else ' abiertos'}\n")
for tipo, lista in sorted(por_tipo.items()):
    print(f"── {tipo} ({len(lista)})")
    for r in lista:
        marca = "" if r["estado"] == "abierto" else f"  [{r['estado']}]"
        print(f"\n  #{r['id']}  {MOTIVOS.get(r['motivo'], r['motivo'])}"
              f"  ·  {r['creado'][:10]}  ·  idioma {r['idioma']}{marca}")
        print("  " + actual(r).replace("\n", "\n  "))
        if r.get("visto"):      print(f"    vio: {r['visto']}")
        if r.get("sugerencia"): print(f"    dice: {r['sugerencia']}")
    print()

print("Para cerrar:  python3 scripts/22_reportes.py --arreglado <ids…>")
print("              python3 scripts/22_reportes.py --descartado <ids…>")
