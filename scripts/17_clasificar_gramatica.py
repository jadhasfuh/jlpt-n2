# -*- coding: utf-8 -*-
"""Clasifica los puntos de gramática bajados: categoría y dificultad."""
import json, re, csv, pathlib, sys, collections
sys.path.insert(0, "scripts")
from tipos_cat import CAT_ES

REGLAS = [
 ("particulas",   r"\b(particle|subject marker|object marker|topic marker|possessive|destination|connecting)\b"),
 ("interrogativos", r"\b(why|what kind|what sort|how\b|which\b|question particle|for what reason)\b"),
 ("cortesia",     r"\b(please|polite|honorific|would you|shall we|shall i|may i|is ok to|is alright|offer help|thank)\b"),
 ("deseo",        r"\b(want to|to want|intend|plan to|let'?s|decide on|wish)\b"),
 ("formas",       r"\b(adjectives?\b|to be\b|to not be|to become|negative|conjugation|verb form|ongoing action|resulting state|have done something before|do such things as)\b"),
 ("obligacion",   r"\b(must|have to|need to|should\b|had better|don'?t have to|obligation|prohibit|may not|cannot\b)\b"),
 ("condicion",    r"\b(if\b|unless|in case|provided|when.*then|supposing|were to)\b"),
 ("causa",        r"\b(because|since\b|due to|thanks to|reason|owing to|as a result of|that'?s why)\b"),
 ("contraste",    r"\b(but\b|however|although|though|even if|even though|despite|in spite of|nevertheless|on the contrary|whereas|regardless)\b"),
 ("tiempo",       r"\b(before|after|when\b|while\b|until|since then|as soon as|during|at the time|already|still|not yet|again|finally|suddenly|immediately|whenever|every time)\b"),
 ("adicion",      r"\b(and\b|also|as well|besides|moreover|furthermore|in addition|not only|too\b|etc)\b"),
 ("comparacion",  r"\b(more than|the most|the best|better|less than|compared|as .* as|like\b|such as|same as|rather than)\b"),
 ("grado_limite", r"\b(only|just\b|merely|nothing but|no more than|except|apart from|as far as|as long as|to the extent|limit)\b"),
 ("grado",        r"\b(very|too much|extremely|hardly|barely|at all|completely|slightly|quite|almost|approximately|about\b)\b"),
 ("modal",        r"\b(probably|seems|it appears|i think|maybe|perhaps|surely|certainly|must be|might|may be|no doubt|apparently|hearsay|i heard)\b"),
 ("posibilidad",  r"\b(can\b|be able|possible|impossible|unable|no chance|cannot help)\b"),
 ("modo",         r"\b(way of doing|how to do|by means|without doing|manner|as if|in such a way|state of)\b"),
 ("enfasis",      r"\b(emphasis|emphasize|indeed|at all costs|even\b|how\b\W|what a|exclamation|nothing but|none other)\b"),
 ("relacion",     r"\b(about\b|concerning|regarding|according to|based on|depending on|in response|along with|related to|toward)\b"),
 ("punto_vista",  r"\b(from the (point|standpoint|viewpoint)|judging|in terms of|for someone|as for)\b"),
 ("estado_cambio", r"\b(become|becoming|in the process|gradually|more and more|continue to|end up)\b"),
 ("resultado",    r"\b(as a result|in the end|finally.*after|worth|ended up)\b"),
 ("estilo",       r"\b(formal|written|literary|classical|spoken japanese|colloquial|archaic|humble)\b"),
 ("conectores",   r"\b(and then|thus|so\b|therefore|by the way|in short|that is to say|anyway|besides that|or\b)\b"),
]
# Segunda tanda: lo que caía en el cajón de «conectores» y sí tiene sitio.
REGLAS2 = [
 ("formas",       r"\b(passive|causative|potential|volitional|imperative|conditional|te-form|masu|plain form|dictionary form|stem)\b"),
 ("particulas",   r"\b(sentence ending|ending particle|casual suffix|isn'?t it|right\?|eh\?|confirm something)\b"),
 ("modo",         r"\b(try doing|try to|make sure that|go to do|come to do|do .* and see|attempt)\b"),
 ("deseo",        r"\b(wants? to|show signs of|to feel|to think ~|hope|eager)\b"),
 ("modal",        r"\b(not necessarily|is not always|i'?m glad|assume|suppose|presumption|expectation|standard, rule)\b"),
 ("condicion",    r"\b(whether or not|whether\b|in the (event|case) of)\b"),
 ("estado_cambio", r"\b(tend(ency)? to|to make something|to start|to continue|go on|more and more|little by little)\b"),
 ("posibilidad",  r"\b(not easy to|struggling to|not able to|hard to|difficult to|easy to)\b"),
 ("resultado",    r"\b(leads? to|come to a conclusion|result in|end(s|ed)? up)\b"),
 ("relacion",     r"\b(suitable for|for the purpose|in the role of|as for|intended for|aimed at)\b"),
 ("grado_limite", r"\b(any kind of|whatsoever|whatever|every\b|each\b|at intervals|all at once|entire)\b"),
 ("enfasis",      r"\b(distinctive of|uniquely|special to|above all|in particular)\b"),
 ("grado",        r"\b(so much that|to the point|extent that|as much as)\b"),
 ("obligacion",   r"\b(don'?t ~|order somebody not|forbid)\b"),
]
COMPILADAS = [(c, re.compile(p, re.I)) for c, p in REGLAS] + \
             [(c, re.compile(p, re.I)) for c, p in REGLAS2]

NIVEL_BASE = {"N5": 1, "N4": 1, "N3": 2, "N1": 4}

def categoria(en):
    for c, rx in COMPILADAS:
        if rx.search(en): return c
    return "conectores"

def dificultad(nivel, forma, en):
    base = NIVEL_BASE[nivel]
    # las formas largas y las de varias piezas cuestan más
    if len(forma) > 8 or "～" in forma or "~" in forma:
        base = min(4, base + 1)
    return base

bajada = json.loads(pathlib.Path("data/build/gramatica_bajada.json").read_text(encoding="utf-8"))
filas = []
for nivel, puntos in bajada.items():
    for romaji, ja, en in puntos:
        filas.append({"nivel": nivel, "romaji": romaji, "ja": ja, "en": en,
                      "cat": categoria(en), "tier": dificultad(nivel, ja, en)})

pathlib.Path("data/build/gramatica_clasificada.json").write_text(
    json.dumps(filas, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"clasificados: {len(filas)}")
for n in ["N5","N4","N3","N1"]:
    c = collections.Counter(f["cat"] for f in filas if f["nivel"] == n)
    print(f"\n{n} ({sum(c.values())}):")
    for cat, k in c.most_common(6):
        print(f"   {k:3d} {CAT_ES.get(cat, cat)}")
