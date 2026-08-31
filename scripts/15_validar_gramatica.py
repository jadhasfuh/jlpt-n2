# -*- coding: utf-8 -*-
"""¿Cada lectura usa de verdad la gramática de su unidad?

   Los patrones con ～ (ろくに～ない, ては～ては…) llevan algo en medio, así que
   no valen como búsqueda literal: se parten y se exige que los trozos
   aparezcan EN ORDEN.
"""
import json, pathlib, re, sys

u = {x["id"]: x for x in json.load(open("data/dist/unidades.json", encoding="utf-8"))}
g = {x["id"]: x for x in json.load(open("data/dist/gramatica.json", encoding="utf-8"))}

def limpio(html):
    return re.sub(r"<[^>]+>", "", re.sub(r"<rt>.*?</rt>", "", html))

# Las formas corteses de los cierres más comunes. La conjugación japonesa de
# ならない → なりません cambia la raíz (nar-anai → nar-imasen), así que recortar
# la última letra no basta y una tabla corta es más honrada que adivinar.
CORTESES = {
    "ならない": "なりません", "いけない": "いけません", " いけない": " いけません",
    "できない": "できません", "しれない": "しれません", "ない": "ません",
}

# La forma volitiva es よう sólo en los verbos ichidan (食べる→食べよう). En los
# godan la terminación cambia con la vocal de la raíz: 行く→行こう, 知る→知ろう,
# 待つ→待とう… Un patrón escrito como «ようとする» las cubre todas.
VOLITIVAS = ["よう", "おう", "こう", "ごう", "そう", "とう", "のう", "ぼう", "もう", "ろう"]

def variantes_volitiva(parte):
    if not parte.startswith("よう"):
        return [parte]
    return [v + parte[2:] for v in VOLITIVAS]

def variantes_te(parte):
    """La forma て se sonoriza tras ん/ん-bases: 休む → 休んで. Así que 〜ていては
    aparece de verdad como 〜でいては, y sigue siendo el mismo punto."""
    return [parte, "で" + parte[1:]] if parte.startswith("て") else [parte]

# Tres «puntos» del N5 no son una forma que se pueda buscar, sino una categoría
# entera (los adjetivos en い y en な). Una lectura de esa unidad los usa por
# fuerza, así que exigir la cadena literal sería un falso positivo eterno.
# Nombres de categorías gramaticales, no cadenas que se puedan buscar en un
# texto: una lectura de esa unidad las usa por fuerza.
CATEGORIAS = {"い-adjectives", "な-adjectives", "他動詞 & 自動詞", "受身形",
              "使役形", "命令形", "可能形", "意向形", "尊敬語", "謙譲語"}

def aparece(forma, texto):
    if forma in CATEGORIAS: return True
    # Las alternativas vienen con «/» en las escritas a mano y con «・» en las
    # bajadas de jlptsensei (じゃない・ではない): basta con que aparezca una.
    for variante in re.split(r"\s*[/・]\s*", forma):
        # ～ 〜 ~ y los huecos con corchetes (の中で[A]が一番) son lo mismo:
        # algo va en medio y sólo se exige que las piezas salgan en orden.
        # ～ 〜 ~, los corchetes ([A]), los puntos suspensivos y los nombres de
        # categoría que hacen de comodín (数量 + は) son todos huecos.
        variante = re.sub(r"(数量|名詞|動詞|形容詞|[A-Z])\s*\+\s*", "～", variante)
        partes = [p.strip() for p in
                  re.split(r"[\uff5e\u301c~]|\[[^\]]*\]|・・・|…", variante) if p.strip()]
        pos = 0
        ok = True
        for k, parte in enumerate(partes):
            i, encontrada = -1, parte
            for v in [x for base in variantes_volitiva(parte)
                        for x in variantes_te(base)]:
                i = texto.find(v, pos)
                if i >= 0: encontrada = v; break
            # La última pieza suele conjugarse (願う→願います, ない→なかった,
            # 済む→済んだ): se acepta también sin su okurigana final.
            # ¿Está en su forma cortés? (〜なければならない → 〜なければなりません)
            if i < 0:
                for llano, cortes in CORTESES.items():
                    if parte.endswith(llano):
                        v = parte[:-len(llano)] + cortes
                        j = texto.find(v, pos)
                        if j >= 0: i, encontrada = j, v; break
            if i < 0 and k == len(partes) - 1 and len(parte) > 1:
                # する y 来る son irregulares: cortar la última letra da «す» y
                # «来», que no aparecen. Sus raíces de verdad son し y き.
                for raiz in (parte[:-2] + "し" if parte.endswith("する") else None,
                             parte[:-2] + "き" if parte.endswith("くる") else None,
                             parte[:-1]):
                    if not raiz: continue
                    i = texto.find(raiz, pos)
                    if i >= 0: encontrada = raiz; break
            parte = encontrada
            if i < 0: ok = False; break
            pos = i + len(parte)
        if ok: return True
    return False

faltan = 0
for f in sorted(pathlib.Path("data/fuente/lecturas").glob("*.json")):
    l = json.loads(f.read_text(encoding="utf-8"))
    uid = l["unidad_id"]
    if uid not in u: continue
    texto = limpio(l["cuerpo"])
    sin = [g[x]["forma"] for x in u[uid]["gramatica"] if g.get(x) and not aparece(g[x]["forma"], texto)]
    if sin:
        faltan += 1
        print(f"  {uid:<28} no usa: {', '.join(sin)}")

print(f"\nlecturas sin la gramática de su unidad: {faltan}")
sys.exit(0)
