# -*- coding: utf-8 -*-
"""Comprueba que cada furigana sea una lectura posible de su kanji.

   Se recorre cada <ruby>base<rt>lectura</rt></ruby> de las lecturas y del
   banco de examen y se intenta repartir la lectura entre los caracteres de
   la base usando las lecturas on/kun del diccionario de kanji, admitiendo
   rendaku (は→ば/ぱ), sokuon (つ/ち→っ) y kana que se lee a sí mismo.

   Lo que no se deja repartir se reporta. No prueba que la lectura sea la
   correcta en ese contexto —eso lo dice el sentido de la frase—, pero sí
   caza el error que de verdad se cuela: haber escrito una lectura que ese
   kanji no tiene en ningún caso.
"""
import json, pathlib, re, sys, collections

RUBY = re.compile(r"<ruby>([^<]+)<rt>([^<]+)</rt></ruby>")
KANJI = re.compile(r"[一-鿿々]")

# 熟字訓 y lecturas de palabra entera: no se reparten kanji a kanji y no hay
# forma de deducirlas de las lecturas sueltas.
ENTERAS = {
    "今日": "きょう", "明日": "あした", "昨日": "きのう", "一日": "ついたち",
    "二日": "ふつか", "三日": "みっか", "四日": "よっか", "五日": "いつか",
    "六日": "むいか", "七日": "なのか", "八日": "ようか", "九日": "ここのか",
    "十日": "とおか", "二十日": "はつか", "大人": "おとな", "一人": "ひとり",
    "二人": "ふたり", "今年": "ことし", "今朝": "けさ", "果物": "くだもの",
    "眼鏡": "めがね", "上手": "じょうず", "下手": "へた", "部屋": "へや",
    "友達": "ともだち", "梅雨": "つゆ", "田舎": "いなか", "土産": "みやげ",
    "為替": "かわせ", "相撲": "すもう", "行方": "ゆくえ", "吹雪": "ふぶき",
    "紅葉": "もみじ", "時計": "とけい", "八百屋": "やおや", "手伝": "てつだ",
    "母屋": "おもや", "老舗": "しにせ", "白髪": "しらが", "浴衣": "ゆかた",
    "海女": "あま", "神楽": "かぐら", "数珠": "じゅず", "足袋": "たび",
    "雑魚": "ざこ", "河原": "かわら", "景色": "けしき", "師走": "しわす",
    "五月雨": "さみだれ", "早乙女": "さおとめ", "従兄弟": "いとこ",
    "父": "ちち", "母": "はは",
}

# Lecturas buenas que no salen de juntar las de sus kanji: o son 熟字訓, o el
# diccionario no recoge esa forma (嘲笑う, 扇ぐ). Revisadas a mano una a una.
EXCEPCIONES = {
    ("お腹", "おなか"), ("三味線", "しゃみせん"), ("二十歳", "はたち"),
    ("余所見", "よそみ"), ("切手", "きって"), ("切符", "きっぷ"),
    ("博士", "はかせ"), ("叔母", "おば"), ("台詞", "せりふ"),
    ("名残", "なごり"), ("呑気", "のんき"), ("嘲笑", "あざわら"),
    ("大凡", "おおよそ"), ("女将", "おかみ"), ("微塵", "みじん"),
    ("微笑", "ほほえ"), ("心地", "ここち"), ("心地", "ごこち"),
    ("所為", "せい"), ("扇", "あお"), ("文字", "もじ"), ("日向", "ひなた"),
    ("日本", "にほん"), ("日本語", "にほんご"), ("明日", "あす"),
    ("木綿", "もめん"), ("母", "かあ"), ("流石", "さすが"), ("溝", "どぶ"),
    ("火傷", "やけど"), ("玄人", "くろうと"), ("生温", "なまぬる"),
    ("生真面目", "きまじめ"), ("甲斐", "かい"), ("甲斐", "がい"),
    ("目論見", "もくろみ"), ("真中", "まんなか"), ("真似", "まね"),
    ("真面目", "まじめ"), ("瞬", "まばた"), ("空", "うつ"),
    ("素人", "しろうと"), ("芝生", "しばふ"), ("薬缶", "やかん"),
    ("親父", "おやじ"), ("詰", "なじ"), ("鈍", "のろ"), ("錆", "さ"),
    ("雪崩", "なだれ"), ("頭文字", "かしらもじ"), ("風邪", "かぜ"),
    ("義兄", "あに"), ("温", "ぬる"), ("昨夜", "ゆうべ"),
}

KATA_A_HIRA = str.maketrans({chr(c): chr(c - 0x60) for c in range(0x30A1, 0x30F7)})
RENDAKU = {"か":"が","き":"ぎ","く":"ぐ","け":"げ","こ":"ご","さ":"ざ","し":"じ",
           "す":"ず","せ":"ぜ","そ":"ぞ","た":"だ","ち":["ぢ","じ"],"つ":["づ","ず"],"て":"で",
           "と":"ど","は":["ば","ぱ"],"ひ":["び","ぴ"],"ふ":["ぶ","ぷ"],
           "へ":["べ","ぺ"],"ほ":["ぼ","ぽ"]}

# Fila -u -> fila -i: el 連用形 de los verbos de grupo 1, que es la forma que
# se queda dentro de los compuestos (引く -> 引き算, 売る -> 売上).
FILA_I = {"う":"い","く":"き","ぐ":"ぎ","す":"し","つ":"ち","ぬ":"に",
          "ぶ":"び","む":"み","る":"り"}

def variantes(lec: str) -> set[str]:
    """Una lectura y sus deformaciones al entrar en compuesto."""
    lec = lec.translate(KATA_A_HIRA).replace("-", "")
    if "." in lec:
        raiz, okuri = lec.split(".", 1)
        # 建てる cabe en 建物 como たて, y 引く en 引き算 como ひき: dentro de
        # un compuesto la okurigana se escribe o no, pero se lee igual.
        completo = raiz + okuri
        formas = {raiz, completo}
        if completo and completo[-1] in FILA_I:
            formas.add(completo[:-1] + FILA_I[completo[-1]])   # grupo 1
            formas.add(completo[:-1])                          # grupo 2
    else:
        formas = {lec}
    formas = {f for f in formas if f}
    if not formas: return set()
    out = set(formas)
    for f in formas:
        ini = RENDAKU.get(f[0])
        if ini:
            for v in ([ini] if isinstance(ini, str) else ini):
                out.add(v + f[1:])
        if f[-1] in "つちくきりち":
            out.add(f[:-1] + "っ")
    return out

def _variantes_viejo(lec: str) -> set[str]:
    out = {lec}
    ini = RENDAKU.get(lec[0])
    if ini:
        for v in ([ini] if isinstance(ini, str) else ini):
            out.add(v + lec[1:])
    if lec[-1] in "つちくき":
        out.add(lec[:-1] + "っ")          # 発 はつ → はっ, 学 がく → がっ
    if lec.endswith("ん"): out.add(lec)
    return out

def cargar_kanji():
    """Todas las lecturas de cada kanji.

    El catálogo de `data/dist` recorta a cuatro lecturas por kanji porque es
    lo que cabe en la ficha; para validar hacen falta todas, así que se lee la
    fuente cruda si está y el catálogo sólo como respaldo.
    """
    crudo = pathlib.Path("data/raw/kanji_data.json")
    tabla = {}
    if crudo.exists():
        for c, d in json.loads(crudo.read_text(encoding="utf-8")).items():
            lecturas = set()
            for l in list(d.get("readings_on") or []) + list(d.get("readings_kun") or []):
                lecturas |= variantes(l)
            if lecturas: tabla[c] = lecturas
        return tabla
    for k in json.loads(pathlib.Path("data/dist/kanji.json").read_text(encoding="utf-8")):
        lecturas = set()
        for l in list(k.get("on") or []) + list(k.get("kun") or []):
            lecturas |= variantes(l)
        tabla[k["char"]] = lecturas
    return tabla

def reparte(base: str, lectura: str, tabla) -> bool:
    """¿Se puede repartir `lectura` entre los caracteres de `base`?"""
    memo = {}
    def paso(i, j):
        if i == len(base): return j == len(lectura)
        if (i, j) in memo: return memo[(i, j)]
        c = base[i]
        ok = False
        # 熟字訓: 日本語 es 日本（にほん）+ 語（ご）, no tres kanji sueltos.
        for palabra, lec in ENTERAS.items():
            if base.startswith(palabra, i) and lectura.startswith(lec, j) \
               and paso(i + len(palabra), j + len(lec)):
                ok = True; break
        if ok:
            memo[(i, j)] = True
            return True
        if not KANJI.match(c):                      # kana dentro de la base
            ok = lectura.startswith(c, j) and paso(i + 1, j + 1)
        else:
            posibles = tabla.get(c, set())
            if c == "々" and i > 0:                 # repetidor: lee como el anterior
                posibles = tabla.get(base[i - 1], set())
            for l in posibles:
                if lectura.startswith(l, j) and paso(i + 1, j + len(l)):
                    ok = True; break
            # Un kanji del que no sabemos nada no puede tumbar la lectura entera.
            if not ok and not posibles:
                ok = any(paso(i + 1, j + n) for n in range(1, len(lectura) - j + 1))
        memo[(i, j)] = ok
        return ok
    return paso(0, 0)

def textos():
    for f in sorted(pathlib.Path("data/fuente/lecturas").glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        campos = [d["titulo"], d["cuerpo"]]
        for q in d.get("preguntas") or []:
            campos.append(q["p"]); campos += q["opciones"]
        for c in campos: yield f.stem, c
    banco = pathlib.Path("data/fuente/examen")
    if banco.is_dir():
        # Los tipos de pregunta no tienen todos los mismos campos (dokkai trae
        # el texto largo, choukai el guion), así que se recorre todo el objeto.
        def cadenas(x):
            if isinstance(x, str): yield x
            elif isinstance(x, dict):
                for v in x.values(): yield from cadenas(v)
            elif isinstance(x, list):
                for v in x: yield from cadenas(v)
        for f in sorted(banco.glob("*.json")):
            for c in cadenas(json.loads(f.read_text(encoding="utf-8"))):
                yield f.stem, c

# Cuántas palabras del vocabulario tienen hoy una lectura que no sale de
# juntar las de sus kanji. Casi todas son 熟字訓 legítimos (お母さん, 風邪,
# 素人…): la lista completa se imprime con --vocabulario. Lo que importa es
# que este número no suba, porque entonces es que se ha colado una lectura
# nueva que no es de esa palabra.
TOPE_VOCABULARIO = 99

def revisa_vocabulario(tabla, detalle=False) -> int:
    v = json.loads(pathlib.Path("data/dist/vocabulario.json").read_text(encoding="utf-8"))
    malas = [w for w in v if any(KANJI.match(c) for c in w["escritura"])
             and not reparte(w["escritura"], w["lectura"], tabla)]
    print(f"vocabulario: {len(malas)} de {len(v)} palabras con lectura de palabra entera "
          f"(tope {TOPE_VOCABULARIO})")
    if detalle:
        for w in malas:
            print(f'  {w["id"]:>7} {w["escritura"]}【{w["lectura"]}】 {w["es"][:40]}')
    return len(malas)

def main():
    tabla = cargar_kanji()
    vistos, malos = set(), collections.defaultdict(list)
    total = 0
    for origen, texto in textos():
        for m in RUBY.finditer(texto):
            base, lec = m.group(1), m.group(2)
            total += 1
            if (base, lec) in vistos: continue
            vistos.add((base, lec))
            if (base, lec) not in EXCEPCIONES and not reparte(base, lec, tabla):
                malos[(base, lec)].append(origen)
    print(f"furiganas revisados: {total} ({len(vistos)} distintos)")
    if malos:
        print(f"sin lectura conocida: {len(malos)}")
        for (base, lec), donde in sorted(malos.items()):
            print(f"  {base}【{lec}】 · {donde[0]}")
    else:
        print("  todos reparten con las lecturas del diccionario")
    n = revisa_vocabulario(tabla, "--vocabulario" in sys.argv)
    if n > TOPE_VOCABULARIO:
        print(f"  ¡ojo! han aparecido {n - TOPE_VOCABULARIO} lecturas nuevas sin explicar; "
              f"míralas con --vocabulario")
    return 1 if (malos or n > TOPE_VOCABULARIO) else 0

if __name__ == "__main__":
    sys.exit(main())
