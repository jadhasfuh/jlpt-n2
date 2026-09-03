# -*- coding: utf-8 -*-
"""Mete en las lecturas los textos ampliados del libro.

    python3 scripts/37_ampliar_libro.py            # aplica y valida
    python3 scripts/37_ampliar_libro.py --secar    # sólo dice qué haría

Los textos se escriben en `data/fuente/libro_textos.json`, en taquigrafía:

    {"N5/basho/ciudad-1": {
       "cuerpo": "ぼくは {大|おお}きい {都市|とし}が すきです。[とても] ひろいです。",
       "traduccion": "…", "traduccion_en": "…"}}

`{漢字|かんじ}` se convierte en ruby y `[texto]` marca la gramática del capítulo
(scripts/rubi.py). Escribir el marcado a mano era donde más erratas se colaban.

Por qué existe este paso y no se editan los JSON directamente: las lecturas
llevan también las preguntas y su respuesta, y tocarlas a mano para cambiar sólo
el cuerpo es pedir romper algo. Aquí se sustituye lo que se escribe y el resto
se queda como estaba.

Lo que comprueba antes de escribir, que es lo que se nos ha colado antes:

  · que no se mezcle です・ます con forma diccionario (el fallo de las 87)
  · que todo kanji por encima del nivel lleve furigana
  · que el texto quepa en la página (324 casillas es lo que da la caja)
"""
import json, pathlib, re, sys

sys.path.insert(0, "scripts")
from rubi import rubi

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "data/fuente/libro_textos.json"
LECTURAS = RAIZ / "data/fuente/lecturas"
TOPE = 324                      # casillas que caben en la caja de la página
ORDEN = {"N5": 5, "N4": 4, "N3": 3, "N2": 2, "N1": 1}
RUBY = re.compile(r"<ruby>([^<]+)<rt>([^<]+)</rt></ruby>")
KANJI = re.compile(r"[一-鿿]")


def plano(html):
    """Lo que se lee: sin marcado y sin furigana."""
    return re.sub(r"<[^>]+>", "", RUBY.sub(r"\1", html or ""))


def kanji_sin_furigana(html):
    """Los kanji que NO van dentro de un <ruby>."""
    fuera = RUBY.sub("", html or "")
    return set(KANJI.findall(re.sub(r"<[^>]+>", "", fuera)))


def revisa(uid, html, niveles):
    """Devuelve la lista de problemas. Vacía si está bien."""
    malo = []
    texto = plano(html)

    if len(texto) > TOPE:
        malo.append(f"{len(texto)} casillas, no caben (tope {TOPE})")

    nivel = uid.split("/")[0]
    for k in kanji_sin_furigana(html):
        lv = niveles.get(k)
        if lv and ORDEN.get(lv, 9) < ORDEN[nivel]:
            malo.append(f"kanji {k} es {lv} y va sin furigana")

    # El registro: o todo です・ます o todo forma diccionario. Se miran sólo los
    # finales de frase, y se saltan las citas, que pueden ir en otro registro.
    finales = [f for f in re.split(r"[。！？]", re.sub(r"「[^」]*」", "", texto)) if f.strip()]
    cortes = sum(1 for f in finales if re.search(r"(です|ます|ました|ません|でした)$", f.strip()))
    if finales and 0 < cortes < len(finales):
        llanas = [f.strip()[-12:] for f in finales
                  if not re.search(r"(です|ます|ました|ません|でした)$", f.strip())]
        malo.append(f"mezcla です・ます con forma llana: …{' / …'.join(llanas[:3])}")
    return malo


def main():
    if not FUENTE.exists():
        sys.exit(f"no hay {FUENTE.relative_to(RAIZ)}")
    textos = json.loads(FUENTE.read_text(encoding="utf-8"))
    textos.pop("_", None)
    niveles = json.loads((RAIZ / "data/dist/kanji_niveles.json").read_text(encoding="utf-8"))

    secar = "--secar" in sys.argv
    puestos = problemas = 0
    for uid, campos in textos.items():
        f = LECTURAS / (uid.replace("/", "_") + ".json")
        if not f.exists():
            print(f"  ✗ {uid}: no existe esa lectura"); problemas += 1; continue
        d = json.loads(f.read_text(encoding="utf-8"))

        nuevos = {}
        for campo in ("titulo", "cuerpo", "traduccion", "traduccion_en"):
            if campo in campos:
                nuevos[campo] = rubi(campos[campo]) if campo in ("titulo", "cuerpo") \
                    else campos[campo]

        errores = []
        for campo in ("titulo", "cuerpo"):
            if campo in nuevos:
                errores += [f"[{campo}] {e}" for e in revisa(uid, nuevos[campo], niveles)]
        if errores:
            print(f"  ✗ {uid}")
            for e in errores:
                print(f"      {e}")
            problemas += 1
            continue

        antes = len(plano(d["cuerpo"]))
        d.update(nuevos)
        if not secar:
            f.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        despues = len(plano(d["cuerpo"]))
        print(f"  ✓ {uid}  {antes} → {despues} casillas")
        puestos += 1

    print(f"\n{puestos} capítulos {'se aplicarían' if secar else 'aplicados'}"
          + (f", {problemas} con problemas" if problemas else ""))
    return 1 if problemas else 0


if __name__ == "__main__":
    sys.exit(main())
