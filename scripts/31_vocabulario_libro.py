# -*- coding: utf-8 -*-
"""Las listas de vocabulario del LIBRO, que no son las del curso.

El curso reparte las palabras por tema: とても vive en «Cualidades y grado»,
que es la sección 11 de 14, así que se estudia en el capítulo 83 aunque Carlos
la use en el 2. Para estudiar por temas está bien; para leer una historia, no:
79 palabras se leían antes de aprenderse.

Aquí cada palabra va al capítulo donde el relato la usa por primera vez. Lo que
el libro no llega a usar se queda al final, en el orden del curso, para que no
se pierda nada.

El texto de N5 va casi todo en kana, así que buscar por trozos no vale —de
「した」 salía 舌, de 「こうえん」 salía 講演—. Se analiza con janome: se parte en
palabras de verdad y se compara la forma de diccionario, no la cadena.

    python3 scripts/31_vocabulario_libro.py            # ensayo, con el informe
    python3 scripts/31_vocabulario_libro.py --escribir
"""
import json, re, sys, pathlib, collections
from janome.tokenizer import Tokenizer

NIVEL = "N5"
CONTENIDO = {"名詞", "動詞", "形容詞", "副詞", "連体詞", "接続詞", "感動詞"}
# Palabras que el analizador saca de cualquier frase y no son la lección.
VACIAS = {"する", "ある", "いる", "なる", "こと", "もの", "そう", "よう", "の",
          "ん", "これ", "それ", "あれ", "ため", "とき", "ところ", "ぼく", "さん"}

RB = re.compile(r"<rt>.*?</rt>")
TAGS = re.compile(r"<[^>]+>")
def plano(html):
    return TAGS.sub("", RB.sub("", html))

voc = json.load(open("data/dist/vocabulario.json", encoding="utf-8"))
unidades = {u["id"]: u for u in json.load(open("data/dist/unidades.json", encoding="utf-8"))}
lecturas = {l["unidad_id"]: l for l in json.load(open("data/dist/lecturas.json", encoding="utf-8"))}
orden = json.load(open("data/fuente/orden_libro.json", encoding="utf-8"))[NIVEL]

# Sólo se buscan las palabras que el curso enseña en este nivel: fuera de ahí
# los homófonos se disparan.
del_nivel = {p for uid in orden for p in unidades[uid]["palabras"]}
# Dos índices, y no da igual cuál se use. Por la escritura no hay duda: 暑い es
# 暑い. Por la lectura sí la hay —あつい es 暑い y 厚い, こうえん es 公園 y
# 講演—, y el libro escribe casi todo en kana. Cuando una lectura tiene más de
# un dueño en el nivel, no se elige ninguno: adivinar es lo que metía 舌 por
# 「した」 y 厚い por 「あついですか」.
por_escritura = collections.defaultdict(list)
por_lectura = collections.defaultdict(list)
for e in voc:
    if e["id"] not in del_nivel: continue
    esc = e["escritura"].replace("~", "").replace("〜", "")
    lec = e["lectura"].replace("~", "").replace("〜", "")
    if esc: por_escritura[esc].append(e)
    if lec: por_lectura[lec].append(e)
ambiguas = {k for k, v in por_lectura.items() if len({e["id"] for e in v}) > 1}

KANA = re.compile(r"[ぁ-ゖ]")

t = Tokenizer()
asignado, listas, sin_encontrar = {}, [], collections.Counter()
for n, uid in enumerate(orden, 1):
    l = lecturas[uid]
    texto = plano(l["titulo"] + "。" + l["cuerpo"])
    nuevas = []
    pos = 0
    for tok in t.tokenize(texto):
        pos = texto.find(tok.surface, pos)
        fin = pos + len(tok.surface)
        pos = fin
        ps = tok.part_of_speech.split(",")
        if ps[0] not in CONTENIDO: continue
        base = tok.base_form if tok.base_form != "*" else tok.surface
        if base in VACIAS or len(base) < 2: continue
        # El analizador parte mal las rachas largas de kana: de 「ひこうきの」
        # saca 「ひこ」 con base 「ひく」, y de 「おおやさんです」 saca 「やさ」 con
        # base 「やさい」. Dos cortes bastan para casi todo:
        #   · una palabra de una sola letra nunca es la lección;
        #   · un sustantivo o un adverbio ESCRITO EN KANA no se conjuga, así
        #     que tiene que terminar donde termina el bunsetsu —el texto de N5
        #     va separado por espacios—, no en medio de otra racha de kana.
        #     Con kanji no se comprueba: 都市 seguido de 「です」 es normal.
        if len(tok.surface) < 2: continue
        todo_kana = all(KANA.match(c) for c in tok.surface)
        if (todo_kana and ps[0] in ("名詞", "副詞", "連体詞")
                and KANA.match(texto[fin:fin+1] or " ")):
            continue
        elegido = None
        for clave in (base, tok.surface):
            if clave in por_escritura:
                elegido = por_escritura[clave][0]; break
            if clave in por_lectura and clave not in ambiguas:
                elegido = por_lectura[clave][0]; break
        if elegido and elegido["id"] not in asignado:
            asignado[elegido["id"]] = n
            nuevas.append(elegido["id"])
    listas.append((uid, nuevas))

# Ninguna palabra se pierde. La que el libro usa se adelanta al capítulo donde
# aparece; la que no llega a usar se queda donde la puso el curso. Así el libro
# ordena por la historia sin dejar de enseñar el nivel entero.
por_cap = {uid: list(ids) for uid, ids in listas}
for uid in orden:
    for pid in unidades[uid]["palabras"]:
        if pid not in asignado:
            por_cap[uid].append(pid)
            asignado[pid] = -1

salida = {
    "_": ("Vocabulario del libro: la palabra que la historia usa va al capítulo "
          "donde aparece por primera vez; la que el libro no usa se queda donde "
          "la puso el curso. Lo genera scripts/31_vocabulario_libro.py, pero "
          "manda este archivo: se puede corregir a mano y no se pierde."),
    NIVEL: por_cap,
}
if "--escribir" in sys.argv:
    pathlib.Path("data/fuente/vocabulario_libro.json").write_text(
        json.dumps(salida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

por = {e["id"]: e for e in voc}
cuenta = [len(v) for v in por_cap.values()]
cuenta.sort()
adelantadas = sum(1 for v in asignado.values() if v > 0)
print(f"palabras del nivel: {len(del_nivel)}  ·  el libro usa (y adelanta): "
      f"{adelantadas} ({adelantadas*100//len(del_nivel)} %)  ·  el resto se queda "
      f"donde el curso: {len(del_nivel)-adelantadas}")
print(f"nuevas por capítulo: mediana {cuenta[len(cuenta)//2]} · máx {cuenta[-1]} "
      f"· capítulos sin ninguna: {cuenta.count(0)}")
print()
for n, uid in enumerate(orden[:8], 1):
    ids = por_cap[uid]
    print(f"  cap {n:3} ({len(ids):2})  " + " ".join(por[i]["escritura"] for i in ids[:18]))
if "--escribir" not in sys.argv:
    print("\n(ensayo: no se ha escrito nada)")
