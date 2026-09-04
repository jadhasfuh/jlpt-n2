# -*- coding: utf-8 -*-
"""Recoloca en su nivel las palabras que heredaron el de un homófono.

    python3 scripts/40_niveles_homofonos.py            # la lista, sin tocar nada
    python3 scripts/40_niveles_homofonos.py --aplicar  # la escribe en el ancla

`03_niveles_jlpt.py` buscaba el nivel por lectura además de por grafía, así que
cada homófono de una palabra fácil heredaba su nivel: せんせい está en la lista
del N5 por 先生, y con eso 専制 «despotismo» entró como vocabulario de estudio
del N5. Lo mismo 選択 por 洗濯, 仮定 por 課程, 防止 por 帽子, y 斬る «decapitar»
por 切る, que llegó a ser la única palabra de una unidad de N5 titulada 法律と
犯罪.

Ya está corregida la regla, pero el nivel de lo publicado lo fija
`vocabulario_publicado.json` —el ancla que impide que las palabras se muevan
solas de unidad—, así que ahí hay que escribirlo a mano. Esto es ese paso.

NO BORRA NADA. Un homófono con otro kanji y otro significado es otra palabra y
se queda en el curso; lo único que cambia es en qué nivel se estudia. El total
del catálogo es el mismo antes y después, y se comprueba al final.
"""
import csv, json, pathlib, re, sys, collections

RAIZ = pathlib.Path(__file__).resolve().parent.parent
RAW = RAIZ / "data/raw"
ANCLA = RAIZ / "data/fuente/vocabulario_publicado.json"
NIVELES = ["N5", "N4", "N3", "N2", "N1"]


def limpio(s):
    """Igual que en 03: sin la glosa entre paréntesis y sin la tilde de afijo."""
    return re.sub(r"^（[^）]*）\s*", "", s or "").replace("~", "").replace("～", "").strip()


def listas():
    """Por nivel: las grafías y las parejas grafía+lectura, limpias como en 03.

    La pareja es lo que identifica la palabra. La lista distingue 円/えん (N5,
    el yen) de 円/まる (N3, el círculo) y 杯/はい (N5, el contador) de
    杯/さかずき (N1, la copa de sake): con la grafía sola, el contador arrastra
    a la copa hasta el N5, que es el mismo fallo del revés.
    """
    fuera = {}
    for n in NIVELES:
        esc, par = set(), set()
        for f in csv.DictReader(open(RAW / f"jlpt_{n.lower()}.csv", encoding="utf-8")):
            e = limpio((f.get("expression") or "").strip())
            l = limpio((f.get("reading") or "").strip())
            if e:
                esc.add(e)
                if l: par.add((e, l))
        fuera[n] = (esc, par)
    return fuera


def a_mano():
    """Las excepciones de data/fuente/niveles_a_mano.tsv."""
    f = RAIZ / "data/fuente/niveles_a_mano.tsv"
    fuera = {}
    if not f.exists():
        return fuera
    for linea in f.read_text(encoding="utf-8").splitlines():
        if not linea.strip() or linea.startswith("#"):
            continue
        campos = linea.split("\t")
        if len(campos) >= 3:
            fuera[(campos[0].strip(), campos[1].strip())] = campos[2].strip()
    return fuera


def nivel_de(k, ka, lst, mano=None):
    """El nivel según las listas, con el mismo orden que 03_niveles_jlpt.py:
    la pareja grafía+lectura y la palabra escrita en kana. None si no aparece
    con su lectura en ninguna, y entonces no se toca.

    Lo escrito a mano manda sobre todo: es para lo poco que la propia lista de
    origen tiene mal."""
    if mano and (k, ka) in mano:
        return mano[(k, ka)]
    for n in NIVELES:
        if (k, ka) in lst[n][1]:
            return n
    # まだ está en la lista como まだ y 未だ sólo en N1 leído いまだ, que es otra
    # palabra: sin esto, nuestra まだ escrita 未だ se iría al N1.
    for n in NIVELES:
        if (ka, ka) in lst[n][1]:
            return n
    # La grafía sola no vale: la lista trae 足 sólo como 足/そく —el contador
    # de zapatos del N2—, y con eso 足/あし «pie» se iba al N2. Si la palabra
    # no está con su lectura, no se toca.
    return None


def main():
    lst = listas()
    mano = a_mano()
    pub = json.loads(ANCLA.read_text(encoding="utf-8"))
    print(f"excepciones a mano: {len(mano)}")

    mueve = []
    for p in pub:
        k = limpio(p.get("kanji") or p.get("escritura") or "")
        ka = limpio(p.get("kana") or p.get("lectura") or "")
        # Sólo las que se escriben con kanji: lo que va en kana no tiene grafía
        # en las listas y su nivel sale de la lectura, que ahí sí es la buena.
        if not k or k == ka:
            continue
        n = nivel_de(k, ka, lst, mano)
        if n and n != p["jlpt"]:
            mueve.append((p, n))

    print(f"palabras del ancla: {len(pub)}")
    print(f"con el nivel heredado de un homófono: {len(mueve)}\n")

    por = collections.Counter((p["jlpt"], n) for p, n in mueve)
    for (a, b), c in sorted(por.items(), key=lambda x: -x[1]):
        print(f"  {a} → {b}: {c}")

    if "--aplicar" not in sys.argv:
        print("\n(en seco; con --aplicar se escribe)")
        return 0

    antes = collections.Counter(p["jlpt"] for p in pub)
    for p, n in mueve:
        p["jlpt"] = n
    despues = collections.Counter(p["jlpt"] for p in pub)

    assert sum(antes.values()) == sum(despues.values()) == len(pub), \
        "el catálogo ha cambiado de tamaño: aquí no se borra nada"

    ANCLA.write_text(json.dumps(pub, ensure_ascii=False, indent=1) + "\n",
                     encoding="utf-8")
    print(f"\n{ANCLA.relative_to(RAIZ)} reescrito")
    for n in NIVELES:
        print(f"  {n}: {antes[n]} → {despues[n]}")
    print(f"  total: {sum(antes.values())} → {sum(despues.values())} (no cambia)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
