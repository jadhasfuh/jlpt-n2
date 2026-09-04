# -*- coding: utf-8 -*-
"""Etiqueta cada palabra con su nivel JLPT real (N5..N1) e importa el
   vocabulario N1, que la lista original (spec del N2 de 2004) no traía.

   Fuente de los niveles: jamsinclair/open-anki-jlpt-decks, que sí cubre los
   cinco niveles actuales. La lista de jlptstudy sigue siendo la base del
   contenido; esto sólo añade la etiqueta de nivel y el bloque de N1.
"""
import csv, json, re, pathlib

RAW = pathlib.Path("data/raw")
NIVELES = ["N5", "N4", "N3", "N2", "N1"]
ID_N1 = 100000          # los ids importados van aparte para no chocar
KANJI = re.compile(r"[一-鿿]")

def cargar(nivel):
    filas = list(csv.DictReader(open(RAW / f"jlpt_{nivel.lower()}.csv", encoding="utf-8")))
    escrituras, lecturas = set(), set()
    for f in filas:
        e = (f.get("expression") or "").strip()
        l = (f.get("reading") or "").strip()
        if e: escrituras.add(e)
        if l: lecturas.add(l)
        if e and not l: lecturas.add(e)
    return filas, escrituras, lecturas

listas = {n: cargar(n) for n in NIVELES}
for n in NIVELES:
    print(f"  {n}: {len(listas[n][0])} filas")

vocab = json.load(open("data/build/vocab_raw.json", encoding="utf-8"))
# Este script lee y escribe el mismo fichero, así que lo primero es tirar lo
# que importó él en pasadas anteriores (id >= ID_N1). Sin esto, relanzarlo sin
# repetir 01 y 07 antes hace que el pool crezca solo y que las palabras ya
# importadas bloqueen, como duplicados, a las que tocaba rescatar.
vocab = [r for r in vocab if r["id"] < ID_N1]
print(f"\npool de partida: {len(vocab)}")

def nivel_de(kana, kanji):
    """El nivel más fácil donde aparece la palabra. None si no está en ninguno."""
    for n in NIVELES:
        _, esc, lec = listas[n]
        if (kanji and kanji in esc) or (kana in esc) or (kana in lec):
            return n
    return None

def limpio(s):
    return re.sub(r"^（[^）]*）\s*", "", s or "").replace("~", "").replace("～", "").strip()

# El catálogo publicado manda sobre el nivel de lo que ya está dentro.
#
# Sin esto, cada pasada puede mover una palabra de nivel, y mover una palabra
# de nivel la mueve de unidad. Las unidades no son un detalle interno: las
# lecturas se escriben contra el vocabulario de su unidad, y el progreso de
# cada usuario guarda ids de unidad. Recomponerlas silenciosamente rompe las
# dos cosas.
PUBLICADO, PUBLICADO_ID = {}, {}
_dist = pathlib.Path("data/fuente/vocabulario_publicado.json")
if _dist.exists():
    for _p in json.loads(_dist.read_text(encoding="utf-8")):
        # Lo que manda es el ID, no la escritura. El catálogo publicado trae
        # la misma escritura en dos niveles —数 está como N3 y como N5, dos
        # palabras con lecturas distintas— y un único mapa por escritura no
        # puede acertar con las dos: le colgaba N3 a la N5 y la lectura de
        # N5/jikan/cantidad-1 se quedaba con un kanji por encima de su nivel.
        PUBLICADO_ID[_p["id"]] = _p["jlpt"]
        # Por escritura sólo para lo que se importa, que aún no tiene id. Ante
        # un empate gana el nivel más fácil, el criterio del resto del archivo.
        _k = _p.get("escritura") or _p.get("kana")
        if _k:
            _c = limpio(_k)
            if NIVELES.index(_p["jlpt"]) <= NIVELES.index(PUBLICADO.get(_c, "N1")):
                PUBLICADO[_c] = _p["jlpt"]

# --- 1) etiquetar lo que ya tenemos ---
sin_match = 0
for r in vocab:
    ya_publicado = PUBLICADO_ID.get(r["id"]) or PUBLICADO.get(limpio(r.get("kanji") or r.get("kana")))
    if ya_publicado:
        r["jlpt"] = ya_publicado
        continue
    n = nivel_de(limpio(r["kana"]), limpio(r["kanji"]))
    if n:
        r["jlpt"] = n
    else:
        r["jlpt"] = r.get("jlpt", "N2")   # partículas, prefijos, saludos…
        sin_match += 1

# --- 2) importar lo que falte de CUALQUIER nivel ---
#
# Antes esto sólo miraba la lista de N1, porque se escribió para tapar el hueco
# de que la base venía de la especificación del N2 de 2004 y no traía N1. Pero
# esa base tampoco trae todo lo de N5..N2: faltaban 518 palabras, y entre ellas
# los siete días de la semana, 毎日, お金, 手紙, 図書館 y 誕生日. Un alumno de
# N5 no aprendía a decir «lunes».
#
# Se recorre de N5 a N1 para que, si una palabra aparece en varias listas, se
# quede con el nivel más fácil, que es el criterio del resto del archivo.
# Los ids de lo importado tienen que ser ESTABLES entre pasadas.
#
# Antes salían de un contador, así que la misma palabra recibía un id distinto
# cada vez. Y los ids son lo que guardan las unidades, de modo que todas
# parecían haber perdido y ganado palabras aunque el contenido fuera idéntico.
# Ahora una palabra ya publicada recupera su id de siempre; sólo lo realmente
# nuevo estrena número, y por encima del máximo que ya exista.
#
# Leer el id de la pasada anterior (data/dist) no bastaba: si una pasada se
# equivoca, la siguiente hereda el error. El mapa de verdad vive en
# data/fuente/ids_importados.tsv, que sólo crece, y manda sobre todo lo demás.
_MAPA = pathlib.Path("data/fuente/ids_importados.tsv")
IDS_PUBLICADOS = {}
if _dist.exists():
    for _p in json.loads(_dist.read_text(encoding="utf-8")):
        _k = _p.get("escritura") or _p.get("kanji") or _p.get("kana")
        if _k: IDS_PUBLICADOS.setdefault(limpio(_k), _p["id"])
FIJOS = {}
if _MAPA.exists():
    for _l in _MAPA.read_text(encoding="utf-8").splitlines():
        if not _l.strip() or _l.startswith(("#", "escritura\t")): continue
        _e, _i = _l.rsplit("\t", 1)
        FIJOS[limpio(_e)] = int(_i)
    IDS_PUBLICADOS.update(FIJOS)   # el fichero gana

ya = {limpio(r["kanji"]) for r in vocab if r["kanji"]} | {limpio(r["kana"]) for r in vocab}

# Grafías corregidas que no deben volver. Al cambiarle la grafía a una palabra
# del pool, la vieja queda libre y el importador la mete otra vez como si fuera
# otra palabra: salen dos tarjetas de lo mismo, una con la grafía descartada.
_ni = pathlib.Path("data/fuente/no_importar.txt")
if _ni.exists():
    for _l in _ni.read_text(encoding="utf-8").splitlines():
        _l = re.sub(r"\s*#.*$", "", _l).strip()
        if _l:
            ya.add(limpio(_l))

def _prim(sentido: str) -> str:
    """El primer sentido, en minúsculas y sin adornos: «to slip out of place,
    to be off» → «slip out of place». Es lo que permite reconocer que dos
    entradas son la misma palabra sin exigir que el texto coincida entero."""
    t = re.sub(r"\([^)]*\)", "", (sentido or "")).split(",")[0].strip().lower()
    return re.sub(r"^(to|a|an|the)\s+", "", t).strip()

# Lectura → sentidos que ya hay con esa lectura.
#
# Ojo al tocar esto: el filtro decide qué se importa, y lo que se importa mueve
# el contador de ids nuevos. Aflojarlo reasigna los ids 1028xx y las líneas de
# correcciones.tsv, que van por id, caen sobre otra palabra. Si hay que dejar
# pasar una pareja concreta (暖かい/温かい), se hace en correcciones.tsv
# separando el primer sentido inglés, no aquí.
SENTIDOS = {}
for _r in vocab:
    _k = limpio(_r.get("kana") or "")
    if _k:
        SENTIDOS.setdefault(_k, set()).add(_prim(_r.get("en") or ""))

def mismo_sentido(lectura: str, sentido: str) -> bool:
    """¿Ya existe una palabra con esa lectura Y ese significado?"""
    p = _prim(sentido)
    return bool(p) and p in SENTIDOS.get(lectura, set())
nuevas = []
sig = max([*IDS_PUBLICADOS.values(), ID_N1]) + 1
# Los ids que ya están en uso en el pool base. Una palabra importada puede
# tener el mismo id publicado que una del pool (la misma palabra llegó por las
# dos vías), y dos entradas con el mismo id rompen el reparto de unidades.
OCUPADOS = {r["id"] for r in vocab}
por_nivel = {}
for nivel in NIVELES:
    for f in listas[nivel][0]:
        exp = (f.get("expression") or "").strip()
        lec = (f.get("reading") or "").strip()
        sig_en = (f.get("meaning") or "").strip()
        if not exp:
            continue
        # Las entradas con varias formas («いい; よい») y las que son plantillas
        # de afijo («～円») se saltan: no son una palabra que estudiar tal cual,
        # y el resto del pipeline no sabe qué hacer con ellas.
        if ";" in exp or "；" in exp:
            continue
        clave = limpio(exp)
        tiene_kanji = bool(KANJI.search(exp))
        # La lectura sólo sirve para descartar duplicados cuando la entrada se
        # escribe en kana. 乳 y 父 se leen las dos ちち y son dos palabras
        # distintas: mirar la lectura tiraba 121 palabras ya publicadas.
        #
        # Pero mirar sólo la escritura coló el caso contrario: 美味しい entraba
        # aunque おいしい ya estuviera, y el alumno veía la misma palabra dos
        # veces en la misma unidad. La diferencia entre 乳/父 y おいしい/美味しい
        # es el **significado**: los primeros son dos palabras que suenan
        # igual, la segunda es una palabra con dos formas de escribirse.
        if not clave or clave in ya or (not tiene_kanji and limpio(lec) in ya):
            continue
        if tiene_kanji and mismo_sentido(limpio(lec), sig_en):
            continue
        ya.add(clave)
        SENTIDOS.setdefault(limpio(lec) or clave, set()).add(_prim(sig_en))
        idp = IDS_PUBLICADOS.get(clave)
        if idp is None or idp in OCUPADOS:
            idp = sig
            sig += 1
        OCUPADOS.add(idp)
        nuevas.append({
            "id": idp, "kana": lec if tiene_kanji and lec else exp,
            "kanji": exp if tiene_kanji else "",
            "pos": "", "en": sig_en, "jlpt": PUBLICADO.get(clave) or nivel,
        })
        por_nivel[nivel] = por_nivel.get(nivel, 0) + 1

# Lo que ha estrenado id se apunta, para que la próxima pasada lo respete.
_estrenados = [(n["kanji"] or n["kana"], n["id"]) for n in nuevas
               if limpio(n["kanji"] or n["kana"]) not in FIJOS]
if _estrenados:
    with _MAPA.open("a", encoding="utf-8") as _f:
        for _e, _i in sorted(_estrenados, key=lambda x: x[1]):
            _f.write(f"{_e}\t{_i}\n")
    print("ids nuevos apuntados en ids_importados.tsv:", len(_estrenados))

vocab.extend(nuevas)
pathlib.Path("data/build/vocab_raw.json").write_text(
    json.dumps(vocab, ensure_ascii=False, indent=1), encoding="utf-8")

import collections
c = collections.Counter(r["jlpt"] for r in vocab)
print(f"importadas: {len(nuevas)} {por_nivel} | sin match en ninguna lista: {sin_match}")
print(f"pool final: {len(vocab)}")
for n in NIVELES:
    print(f"  {n}: {c[n]}")
