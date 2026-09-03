# -*- coding: utf-8 -*-
"""Arma el curso: nivel JLPT -> sección -> unidad (subgrupo, partido si es largo).

Cada unidad tiene ~20 palabras y es lo que se practica de una sentada. Un
subgrupo largo se parte en 家族 ①, 家族 ②… con las fáciles primero.
La gramática es una sección propia dentro de N2, por categorías.
"""
import json, csv, re, sys, pathlib, collections
sys.path.insert(0, "scripts")
from taxonomia import SECCIONES, SUBGRUPOS, aplicar_secciones

POR_UNIDAD = 20        # palabras por unidad
MIN_COLA = 8           # si la última parte queda con menos, se funde con la anterior
GRAM_POR_UNIDAD = 8

NIVELES = ["N5", "N4", "N3", "N2", "N1"]
CIRCULOS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
KANJI = re.compile(r"[一-鿿]")

vocab = json.load(open("data/build/vocab_clasificado.json", encoding="utf-8"))
print("secciones corregidas a mano:", aplicar_secciones(vocab))
et_sec = {s[0]: {"ja": s[1], "es": s[2], "en": s[3]} for s in SECCIONES}
et_sub = {(s, g[0]): {"ja": g[1], "es": g[2], "en": g[3]} for s in SUBGRUPOS for g in SUBGRUPOS[s]}
orden_sec = [s[0] for s in SECCIONES]

def dificultad(p):
    """Dentro de un mismo nivel: menos kanji y más corta = más fácil."""
    return (len(KANJI.findall(p["kanji"] or "")), len(p["kanji"] or p["kana"]), p["kana"])

def partir(items, por, min_cola):
    trozos = [items[i:i + por] for i in range(0, len(items), por)]
    if len(trozos) > 1 and len(trozos[-1]) < min_cola:
        cola = trozos.pop()
        trozos[-1].extend(cola)
    return trozos

def numerar(base_ja, base_es, base_en, i, total):
    if total == 1:
        return base_ja, base_es, base_en
    marca = CIRCULOS[i] if i < len(CIRCULOS) else f"（{i + 1}）"
    return f"{base_ja} {marca}", f"{base_es} ({i + 1})", f"{base_en} ({i + 1})"

# ---------------------------------------------------------------- vocabulario
por_clave = collections.defaultdict(list)
for p in vocab:
    por_clave[(p["jlpt"], p["seccion"], p["subgrupo"])].append(p)

# Reparto estable: lo que ya está publicado no se mueve.
#
# Una palabra que entra hoy no puede reordenar las unidades de ayer. Las
# lecturas están escritas contra el vocabulario de su unidad y el progreso de
# los usuarios guarda ids de unidad, así que un reparto distinto rompe ambos
# sin avisar. Las palabras nuevas se acumulan al final de su subgrupo, en las
# unidades que ya existan si caben o en unidades nuevas si no.
# La correspondencia va por la palabra ESCRITA, no por su id, y los ids del
# ancla se resuelven contra el vocabulario ANCLA, nunca contra el de la pasada
# actual: mezclar las dos cosas fue lo que rompió el reparto tres veces.
ANTERIOR, ANTERIOR_ID = {}, {}
_u = pathlib.Path("data/fuente/unidades_publicadas.json")
_v = pathlib.Path("data/fuente/vocabulario_publicado.json")
if _u.exists() and _v.exists():
    _pub = {p["id"]: p for p in json.loads(_v.read_text(encoding="utf-8"))}
    for _un in json.loads(_u.read_text(encoding="utf-8")):
        for _pid in _un["palabras"]:
            ANTERIOR_ID[_pid] = _un["id"]
            _p = _pub.get(_pid)
            # La escritura es sólo el plan B: la lista original repite 86
            # formas (間 aparece dos veces, con lecturas distintas) y al
            # indexar por escritura una de las dos perdía su unidad.
            if _p: ANTERIOR.setdefault(_p.get("kanji") or _p.get("kana"), _un["id"])

TOPE_UNIDAD = 27   # el mismo que comprueba el aviso del final

unidades = []
for nivel in NIVELES:
    for sec in orden_sec:
        for sub, *_ in SUBGRUPOS[sec]:
            palabras = sorted(por_clave.get((nivel, sec, sub), []), key=dificultad)
            if not palabras:
                continue
            # Las que ya tenían unidad vuelven a la suya, en el orden de
            # siempre; las nuevas van detrás.
            clave = lambda p: p.get("kanji") or p.get("kana")
            # La unidad de siempre sólo vale si es de ESTE grupo. Una palabra
            # que ha cambiado de nivel o de tema no puede arrastrar su id
            # antiguo hasta aquí: crearía dos unidades con el mismo id, una
            # en cada nivel, y la lectura ya no sabría cuál es la suya.
            prefijo = f"{nivel}/{sec}/{sub}-"
            def sitio(p):
                u = ANTERIOR_ID.get(p["id"]) or ANTERIOR.get(clave(p)) or ""
                return u if u.startswith(prefijo) else ""
            viejas = [p for p in palabras if sitio(p)]
            nuevas_p = [p for p in palabras if not sitio(p)]
            if viejas:
                grupos = collections.defaultdict(list)
                for p in viejas: grupos[sitio(p)].append(p)
                # Cada trozo se lleva el id con el que se publicó. Antes el id
                # se rearmaba con la posición (`-1`, `-2`…), así que bastaba
                # con que una parte se quedara vacía para que las siguientes
                # se renumeraran y una lectura acabara apuntando a un grupo de
                # palabras que no es el suyo.
                trozos = [(k, grupos[k]) for k in sorted(grupos, key=lambda x: int(x.rsplit("-", 1)[1]))]
                # Las nuevas se reparten entre las unidades que ya existen,
                # empezando por las más vacías y hasta el tope de 27. Añadir
                # una palabra a una unidad no invalida su lectura —sólo quita
                # cuando se rompe algo—, y así se evitan las unidades de una
                # sola palabra, que son una experiencia de estudio pésima.
                for p in nuevas_p:
                    hueco = min(trozos, key=lambda t: len(t[1])) if trozos else None
                    if hueco is not None and len(hueco[1]) < TOPE_UNIDAD:
                        hueco[1].append(p)
                    elif trozos and len(trozos[-1][1]) < TOPE_UNIDAD:
                        trozos[-1][1].append(p)
                    else:
                        # Unidad nueva: estrena número por encima de todos los
                        # que ya existan, para no pisar un id publicado.
                        n = max((int(k.rsplit("-", 1)[1]) for k, _ in trozos), default=0) + 1
                        trozos.append((f"{nivel}/{sec}/{sub}-{n}", [p]))
                # Aquí NO se funden colas: fundir dos unidades hace
                # desaparecer una, y si tenía lectura la deja huérfana. Una
                # unidad publicada no se borra nunca, aunque quede pequeña.
            else:
                trozos = [(f"{nivel}/{sec}/{sub}-{i + 1}", t)
                          for i, t in enumerate(partir(palabras, POR_UNIDAD, MIN_COLA))]
            for i, (uid, trozo) in enumerate(trozos):
                ja, es, en = numerar(et_sub[(sec, sub)]["ja"], et_sub[(sec, sub)]["es"],
                                     et_sub[(sec, sub)]["en"], i, len(trozos))
                unidades.append({
                    "id": uid,
                    "tipo": "vocabulario", "nivel": nivel, "seccion": sec,
                    "subgrupo": sub, "parte": i + 1, "partes": len(trozos),
                    "ja": ja, "es": es, "en": en,
                    "palabras": [p["id"] for p in trozo], "gramatica": [],
                })

# ------------------------------------------------------------------ gramática
# Cada nivel reparte SU gramática entre SUS unidades de vocabulario, para que
# se encuentre en contexto. N2 viene del TSV escrito a mano; el resto, de las
# listas bajadas y clasificadas.
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

gram = []
for g in csv.DictReader(open("data/fuente/gramatica.tsv", encoding="utf-8"), delimiter="|"):
    gram.append({"id": slug(g["romaji"]), "nivel": "N2", "ja": g["ja"],
                 "en": g["en"], "es": g["es"], "tier": int(g["tier"]), "cat": g["cat"]})

bajada = pathlib.Path("data/build/gramatica_clasificada.json")
if bajada.exists():
    for g in json.loads(bajada.read_text(encoding="utf-8")):
        # Los ids de N2 ya están en uso: los demás se prefijan con su nivel
        # para que no puedan chocar.
        gram.append({"id": f"{g['nivel'].lower()}-{slug(g['romaji'])}", "nivel": g["nivel"],
                     "ja": g["ja"], "en": g["en"], "es": g.get("es", ""),
                     "tier": g["tier"], "cat": g["cat"]})

ORDEN_CAT = ["particulas","formas","conectores","tiempo","grado","adicion","contraste","causa",
             "condicion","grado_limite","comparacion","modo","estado_cambio","relacion",
             "punto_vista","cortesia","deseo","interrogativos","obligacion","posibilidad",
             "modal","enfasis","resultado","estilo"]
def clave_gram(g):
    return (g["tier"], ORDEN_CAT.index(g["cat"]) if g["cat"] in ORDEN_CAT else 99, g["id"])

# El reparto de gramática también tiene que ser estable. Cada lectura se
# escribe usando LA gramática de su unidad, así que redistribuirla deja 360 de
# las 602 lecturas enseñando algo que su unidad ya no contiene. Lo publicado se
# respeta; sólo se reparte lo que aún no tiene sitio.
GRAM_ANTERIOR = {}
_u = pathlib.Path("data/fuente/unidades_publicadas.json")
if _u.exists():
    for _un in json.loads(_u.read_text(encoding="utf-8")):
        if _un.get("gramatica"):
            GRAM_ANTERIOR[_un["id"]] = list(_un["gramatica"])

for nivel in NIVELES:
    suyas = sorted([g for g in gram if g["nivel"] == nivel], key=clave_gram)
    destino = [u for u in unidades if u["nivel"] == nivel]
    if not suyas or not destino:
        continue

    colocadas = set()
    for u in destino:
        previas = [i for i in GRAM_ANTERIOR.get(u["id"], []) if i in {g["id"] for g in suyas}]
        if previas:
            u["gramatica"] = previas
            colocadas.update(previas)

    # Lo que no estaba colocado se reparte entre las unidades que aún no tienen.
    sobra = [g for g in suyas if g["id"] not in colocadas]
    libres = [u for u in destino if not u["gramatica"]]
    if sobra and libres:
        N, G = len(libres), len(sobra)
        for i, u in enumerate(libres):
            a, b = -(-i * G // N), -(-(i + 1) * G // N)
            u["gramatica"] = [g["id"] for g in sobra[a:b]]

pathlib.Path("data/build/gramatica_todos.json").write_text(
    json.dumps(gram, ensure_ascii=False, indent=1), encoding="utf-8")

# ------------------------------------------------------------------- verificación
ids_v = [i for u in unidades for i in u["palabras"]]
assert len(ids_v) == len(vocab) == len(set(ids_v)), f"{len(ids_v)} vs {len(vocab)}"
ids_g = [i for u in unidades for i in u["gramatica"]]
assert len(ids_g) == len(gram) == len(set(ids_g)), f"{len(ids_g)} vs {len(gram)}"
assert len({u["id"] for u in unidades}) == len(unidades), "ids de unidad repetidos"

pathlib.Path("data/build/unidades.json").write_text(
    json.dumps(unidades, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"unidades: {len(unidades)}  ({sum(1 for u in unidades if u['tipo']=='gramatica')} de gramática)")
for n in NIVELES:
    us = [u for u in unidades if u["nivel"] == n]
    pal = sum(len(u["palabras"]) for u in us)
    secs = len({u["seccion"] for u in us})
    print(f"  {n}: {len(us):3d} unidades · {pal:5d} palabras · {secs} secciones")
largas = [u for u in unidades if len(u["palabras"]) > 27]
print("unidades con más de 27 palabras:", len(largas))
