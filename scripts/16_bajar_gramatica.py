# -*- coding: utf-8 -*-
"""Baja las listas de gramática de jlptsensei para todos los niveles.

   La tabla usa <td> sin cerrar (HTML5 lo permite), así que se parsea por las
   clases jl-td-gr / jl-td-gj / jl-td-gm en vez de por etiquetas cerradas.
"""
import re, html, json, subprocess, pathlib, time

RAW = pathlib.Path("data/raw"); RAW.mkdir(parents=True, exist_ok=True)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")

FILA = re.compile(
    r'<td class="jl-td-gr[^"]*">.*?>([^<]+)</a>'      # romaji
    r'.*?<td class="jl-td-gj[^"]*">.*?>([^<]+)</a>'   # japonés
    r'.*?<td class="jl-td-gm[^"]*">([^<]*)',          # significado
    re.S)

def bajar(url, destino):
    if destino.exists() and destino.stat().st_size > 5000:
        return destino.read_text(encoding="utf-8", errors="replace")
    p = subprocess.run(["curl", "-sL", "--max-time", "40", "-A", UA,
                        "-H", "Accept-Language: es-ES,es;q=0.9,en;q=0.8", url],
                       capture_output=True, text=True)
    destino.write_text(p.stdout, encoding="utf-8")
    time.sleep(1.2)
    return p.stdout

def limpio(s):
    return " ".join(html.unescape(s).split())

todo = {}
for nivel in ["N5", "N4", "N3", "N1"]:
    n = nivel[1]
    filas = []
    for pagina in range(1, 8):
        url = (f"https://jlptsensei.com/jlpt-n{n}-grammar-list/"
               if pagina == 1 else
               f"https://jlptsensei.com/jlpt-n{n}-grammar-list/page/{pagina}/")
        t = bajar(url, RAW / f"gramatica_{nivel.lower()}_{pagina}.html")
        nuevas = [(limpio(a), limpio(b), limpio(c)) for a, b, c in FILA.findall(t)]
        if not nuevas:
            break
        filas.extend(nuevas)
    # quitar repetidas conservando el orden
    vistas, unicas = set(), []
    for f in filas:
        if f[1] not in vistas:
            vistas.add(f[1]); unicas.append(f)
    todo[nivel] = unicas
    print(f"  {nivel}: {len(unicas)} puntos")

pathlib.Path("data/build/gramatica_bajada.json").write_text(
    json.dumps(todo, ensure_ascii=False, indent=1), encoding="utf-8")
print("\nmuestra de N5:")
for f in todo["N5"][:5]:
    print(f"   {f[1]:<22} {f[2][:44]}")
