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

def variantes_te(parte):
    """La forma て se sonoriza tras ん/ん-bases: 休む → 休んで. Así que 〜ていては
    aparece de verdad como 〜でいては, y sigue siendo el mismo punto."""
    return [parte, "で" + parte[1:]] if parte.startswith("て") else [parte]

def aparece(forma, texto):
    for variante in re.split(r"\s*/\s*", forma):          # 「にせよ / にしろ」
        partes = [p for p in re.split("[\uff5e\u301c~]", variante) if p]   # ～ 〜 ~
        pos = 0
        ok = True
        for k, parte in enumerate(partes):
            i, encontrada = -1, parte
            for v in variantes_te(parte):
                i = texto.find(v, pos)
                if i >= 0: encontrada = v; break
            # La última pieza suele conjugarse (願う→願います, ない→なかった,
            # 済む→済んだ): se acepta también sin su okurigana final.
            if i < 0 and k == len(partes) - 1 and len(parte) > 1:
                i = texto.find(parte[:-1], pos)
                if i >= 0: encontrada = parte[:-1]
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
