# -*- coding: utf-8 -*-
"""Comprueba que cada lectura use sólo kanji y vocabulario ya vistos.

   «Ya visto» = lo de su propia unidad más todo lo de las unidades anteriores
   (mismo nivel y niveles más fáciles). Lo que se salga se reporta, con el
   nivel del kanji infractor, para poder corregir el texto.
"""
import json, re, pathlib, sys

K = re.compile(r"[一-鿿]")
ORDEN = ["N5", "N4", "N3", "N2", "N1"]

unidades = json.load(open("data/dist/unidades.json", encoding="utf-8"))
gram = {g["id"]: g for g in json.load(open("data/dist/gramatica.json", encoding="utf-8"))}
kanji_cat = {k["char"]: k for k in json.load(open("data/dist/kanji.json", encoding="utf-8"))}
lecturas = json.load(open("data/dist/lecturas.json", encoding="utf-8"))
pos = {u["id"]: i for i, u in enumerate(
    sorted(unidades, key=lambda u: (ORDEN.index(u["nivel"]), u["seccion"], u["subgrupo"], u["parte"])))}
ordenadas = sorted(unidades, key=lambda u: pos[u["id"]])

def permitidos(unidad_id):
    """Kanji de esa unidad y de todas las anteriores, vocabulario Y gramática.

    Los puntos de gramática también llevan kanji (〜に伴って, 〜に基づいて…) y son
    parte de lo que la unidad enseña: contarlos como «fuera de alcance» era un
    falso positivo.
    """
    i = pos[unidad_id]
    vistos = set()
    for u in ordenadas[:i + 1]:
        vistos.update(u["kanji"])
        for gid in u["gramatica"]:
            g = gram.get(gid)
            if g:
                vistos.update(K.findall(g["forma"]))
    return vistos

def sin_marcado(html):
    html = re.sub(r"<rt>.*?</rt>", "", html)      # el furigana es kana
    return re.sub(r"<[^>]+>", "", html)

# Distinguimos dos cosas muy distintas:
#  GRAVE — kanji de un nivel MÁS DIFÍCIL que el de la unidad. No debe pasar.
#  leve  — kanji del mismo nivel o más fácil que aún no ha salido en el curso.
#          Es aceptable: va con furigana y el alumno lo reconocerá.
graves = leves = 0
for l in lecturas:
    uid = l["unidad_id"]
    if uid not in pos:
        print(f"  {uid}: la unidad no existe"); problemas += 1; continue
    ok = permitidos(uid)
    texto = sin_marcado(l["titulo"]) + sin_marcado(l["cuerpo"])
    for q in l.get("preguntas", []):
        texto += sin_marcado(q["p"]) + "".join(sin_marcado(o) for o in q["opciones"])
    nivel_unidad = ORDEN.index(uid.split("/")[0])
    fuera = sorted({c for c in K.findall(texto) if c not in ok})
    duros, blandos = [], []
    for c in fuera:
        n = kanji_cat.get(c, {}).get("nivel")
        # sin nivel JLPT = fuera de las listas: cuenta como difícil
        if not n or ORDEN.index(n) > nivel_unidad:
            duros.append(f"{c}({n or 'fuera del JLPT'})")
        else:
            blandos.append(c)
    if duros:
        graves += 1
        print(f"  ❌ {uid:<28} {len(duros):2d} kanji por encima del nivel: {', '.join(duros)}")
    if blandos:
        leves += 1
        print(f"  ·  {uid:<28} {len(blandos):2d} aún no vistos pero del nivel o más fáciles: {''.join(blandos)}")

# El marcado se escribe como {漢字|かんじ} y lo convierte scripts/rubi.py. Si algo
# se cuela a medio convertir (<rt>字|じ</rt>, o llaves sueltas), el furigana sale
# mal en pantalla y hasta ahora nadie lo miraba.
import re as _re
rotas = 0
for l in lecturas:
    trozos = [l["titulo"], l["cuerpo"]]
    for q in l.get("preguntas", []):
        trozos.append(q["p"]); trozos += q["opciones"]
    for t in trozos:
        if any(c in m for m in _re.findall(r"<rt>([^<]*)</rt>", t) for c in "|{}") \
           or _re.search(r"\{[^}]*\|", t):
            print(f"  ✗ {l['unidad_id']}: marcado a medio convertir")
            rotas += 1
            break
if rotas:
    print(f"  lecturas con marcado roto: {rotas}")

# Escribiendo a mano se cuela alguna palabra en alfabeto latino dentro de la
# base de un <ruby> ("<ruby>third<rt>だい</rt>"): en pantalla sale una palabra
# inglesa con furigana japonés y no hay forma de verlo salvo leyéndolo entero.
latinas = 0
for l in lecturas:
    trozos = [l["titulo"], l["cuerpo"]]
    for q in l.get("preguntas", []):
        trozos.append(q["p"]); trozos += q["opciones"]
    for t in trozos:
        malas = [b for b in _re.findall(r"<ruby>([^<]*)<rt>", t) if _re.search(r"[A-Za-z]", b)]
        if malas:
            print(f"  ✗ {l['unidad_id']}: alfabeto latino dentro de un ruby: {', '.join(malas)}")
            latinas += 1
            break
if latinas:
    print(f"  lecturas con letras latinas en el furigana: {latinas}")

print(f"\nlecturas revisadas: {len(lecturas)}")
print(f"  con kanji por encima del nivel (hay que corregir): {graves}")
print(f"  sólo con kanji adelantados pero del nivel o menos:  {leves}")
sys.exit(0)
