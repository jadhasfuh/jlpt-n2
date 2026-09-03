# -*- coding: utf-8 -*-
"""Revisa que cada lectura no mezcle です・ます con la forma de diccionario.

Un texto para estudiantes tiene que elegir un registro y mantenerlo: si empieza
en «～ました» y a la mitad pasa a «～た», el alumno no aprende cuándo se usa cada
uno, sólo se confunde. Lo que sí es legítimo y aquí NO se marca:

  · lo que va dentro de 「」 (es diálogo: ahí manda quién habla, no el narrador),
  · las oraciones subordinadas, que en japonés van siempre en forma llana
    (por eso sólo se mira el predicado FINAL de cada oración),
  · los títulos y los pies sueltos, que no llevan predicado.
"""
import json, re, sys, pathlib, collections

RUBY = re.compile(r"<rt>.*?</rt>|</?ruby>|</?rb>|</?em[^>]*>|<[^>]+>")
def texto(s):
    return RUBY.sub("", s or "").replace("　", " ")

CITA = re.compile(r"「[^」]*」|『[^』]*』")

# el predicado final, ya sin la puntuación
CORTE = re.compile(r"[。．\.！？!?\n]+")

CORTES  = ("です", "ですか", "でした", "ですね", "ですよ", "でしょう", "でしょうか",
           "ます", "ますか", "ました", "ましたか", "ません", "ませんか",
           "ませんでした", "ましょう", "ましょうか", "ください", "くださいね",
           "ございます", "ございました", "なさい", "ますね", "ますよ", "ますが")
# terminaciones llanas inequívocas
LLANAS  = ("だ", "だった", "だろう", "だね", "だよ", "だな", "である", "であった",
           "じゃない", "ではない", "ではなかった", "じゃなかった", "かった",
           "ない", "なかった", "た", "る", "う", "く", "ぐ", "す", "つ", "ぬ",
           "ぶ", "む", "い", "よ", "ね", "な", "の", "ぞ", " か")

VERBO_LLANO = re.compile(r"(?:[ぁ-んァ-ヶ一-鿿])(?:う|く|ぐ|す|つ|ぬ|ぶ|む|る)$")
TA_LLANO    = re.compile(r"(?:[ぁ-んァ-ヶ一-鿿])(?:た|だ)$")
I_ADJ       = re.compile(r"(?:[ぁ-んァ-ヶ一-鿿])(?:い|かった)$")

# Una enumeración no tiene registro: «バングラデシュ、ミャンマー、ベトナム、
# そして ぼく» o «止める、止む» no son frases en forma llana, son listas. Lo que
# las distingue de una frase de verdad es que no llevan ninguna partícula de
# caso. Sólo se aplica al lado llano: en cortés la terminación ya es prueba.
PARTICULAS = ("を", "が", "に", "へ", "で", "と", "から", "まで", "より", "は", "も")

def registro(fr):
    """'cortes', 'llano' o None si la frase no lleva predicado conjugado."""
    f = fr.strip().rstrip("、,)）」』")
    if not f:
        return None
    for c in sorted(CORTES, key=len, reverse=True):
        if f.endswith(c):
            return "cortes"
    if not any(p in f for p in PARTICULAS):
        return None
    # 〜のだ / 〜んだ y 〜のです ya quedan cubiertos arriba o abajo
    if f.endswith(("である", "であった", "だった", "だろう")) or re.search(r"[^たなイ]だ$", f):
        return "llano"
    if f.endswith(("ない", "なかった")):
        return "llano"
    if TA_LLANO.search(f) or VERBO_LLANO.search(f) or I_ADJ.search(f):
        return "llano"
    return None

def frases(cuerpo, con_citas=False):
    t = texto(cuerpo)
    if not con_citas:
        t = CITA.sub("〔cita〕", t)
    return [f for f in CORTE.split(t) if f.strip()]

def analizar(cuerpo):
    c = collections.Counter()
    detalle = []
    for f in frases(cuerpo):
        r = registro(f)
        if r:
            c[r] += 1
            detalle.append((r, f.strip()))
    return c, detalle

if __name__ == "__main__":
    solo = sys.argv[1] if len(sys.argv) > 1 else ""
    mezclados = []
    tot = collections.Counter()
    for p in sorted(pathlib.Path("data/fuente/lecturas").glob("*.json")):
        if solo and solo not in p.stem:
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        c, det = analizar(d.get("cuerpo", ""))
        tot["textos"] += 1
        tot["cortes"] += c["cortes"]; tot["llano"] += c["llano"]
        if c["cortes"] and c["llano"]:
            menor = "llano" if c["llano"] <= c["cortes"] else "cortes"
            mezclados.append((p.stem, c["cortes"], c["llano"], menor,
                              [f for r, f in det if r == menor]))
    print(f"lecturas revisadas: {tot['textos']}  ·  frases: "
          f"{tot['cortes']} en です・ます, {tot['llano']} en forma llana")
    print(f"textos que mezclan los dos registros: {len(mezclados)}")
    for stem, nc, nl, menor, ejs in sorted(mezclados, key=lambda x: -min(x[1], x[2])):
        print(f"\n{stem}  ({nc} cortés / {nl} llano — sobra el {menor})")
        for e in ejs[:6]:
            print("   ·", e[:70])
