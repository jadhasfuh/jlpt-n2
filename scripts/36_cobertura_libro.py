# -*- coding: utf-8 -*-
"""¿Cuánto del vocabulario y la gramática de cada capítulo sale en su historia?

    python3 scripts/36_cobertura_libro.py            # el resumen
    python3 scripts/36_cobertura_libro.py --detalle  # y la lista de lo que falta

La idea del libro es que la ficha enseñe las palabras y la página siguiente las
use. Una palabra que sólo está en la ficha no se aprende leyendo: es una lista
de vocabulario con una historia al lado, que es justo lo que no queríamos.

Esto mide cuántas se usan de verdad, y saca la lista de las que no, que es lo
que hay que llevarse al índice del final o —mejor— meter en la historia.
"""
import json, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
KANJI = re.compile(r"[一-鿿]")


def carga(p):
    return json.loads((RAIZ / p).read_text(encoding="utf-8"))


def plano(s):
    """El texto tal como se lee: sin marcado y sin furigana."""
    return re.sub(r"<rt>[^<]*</rt>", "", s or "")


def aparece(formas, txt):
    """Una forma cuenta si sale entera, o si sale su raíz.

    Hace falta la raíz porque los verbos van conjugados: 書く aparece en el
    texto como 書いて. Y la raíz sólo vale si tiene dos caracteres o es un
    kanji: la de 来る es «く», que sale en cualquier frase y daría por buena
    cualquier palabra."""
    for c in formas:
        if not c:
            continue
        if c in txt:
            return True
        raiz = c[:-1]
        if raiz and (len(raiz) >= 2 or KANJI.fullmatch(raiz)) and raiz in txt:
            return True
    return False


MARCADO = re.compile(r'<em class="g">([^<]+)</em>')


def marcados(html):
    """Los trozos que el capítulo señala como su punto de gramática."""
    return {re.sub(r"<[^>]+>", "", m) for m in MARCADO.findall(html or "")}


def formas_gram(g):
    """Lo buscable de un punto de gramática.

    Los de un solo carácter —も, に, ね— salen en cada frase, así que
    encontrarlos no prueba nada: por eso no se buscan a ciegas. Lo que sí
    cuenta es que el capítulo MARQUE uno, y entonces el alumno ve dónde está
    en vez de adivinarlo entre cincuenta."""
    fuera = set()
    for bruto in (g.get("forma"), g.get("lectura")):
        if not bruto:
            continue
        for parte in re.split(r"[〜~…・/]", bruto):
            p = parte.strip().strip("（）()［］")
            if len(p) >= 2 and re.fullmatch(r"[ぁ-ヿ一-鿿]+", p):
                fuera.add(p)
    return fuera


def main():
    lect = {l["unidad_id"]: l for l in carga("data/dist/lecturas.json")}
    uni = {u["id"]: u for u in carga("data/dist/unidades.json")}
    vocab = {v["id"]: v for v in carga("data/dist/vocabulario.json")}
    gram = {g["id"]: g for g in carga("data/dist/gramatica.json")}
    orden = carga("data/fuente/orden_libro.json")["N5"]
    libro = carga("data/fuente/vocabulario_libro.json")["N5"]

    v_tot = v_ok = 0
    g_tot = g_ok = 0
    falta_v, falta_g, sin_gram = [], [], []

    for n, uid in enumerate(orden, 1):
        l = lect[uid]
        txt = plano(l["cuerpo"]) + plano(l["titulo"])
        marca = marcados(l["cuerpo"]) | marcados(l["titulo"])

        for pid in libro.get(uid, []):
            w = vocab.get(pid)
            if not w:
                continue
            v_tot += 1
            if aparece((w["escritura"], w["lectura"]), txt):
                v_ok += 1
            else:
                falta_v.append((n, w["escritura"], w["lectura"], w["es"]))

        ids = uni[uid]["gramatica"]
        if not ids:
            sin_gram.append(n)
        for gid in ids:
            g = gram.get(gid)
            if not g:
                continue
            g_tot += 1
            f = formas_gram(g)
            # marcado explícito: vale aunque sea una partícula suelta
            señalado = any(x in marca for x in
                           {g.get("forma", ""), g.get("lectura", "")} | f if x)
            if señalado or (f and aparece(f, txt)):
                g_ok += 1
            else:
                falta_g.append((n, g["forma"], g.get("lectura", ""), g["es"], not f))

    def linea(nombre, ok, tot):
        print(f"{nombre}: {tot}   dentro de la historia {ok} ({ok * 100 // tot}%)"
              f"   sólo en la ficha {tot - ok} ({(tot - ok) * 100 // tot}%)")

    print(f"capítulos: {len(orden)}\n")
    linea("VOCABULARIO", v_ok, v_tot)
    linea("GRAMÁTICA  ", g_ok, g_tot)
    print(f"\ncapítulos sin ningún punto de gramática asignado: {len(sin_gram)}")

    if "--detalle" in sys.argv:
        print("\n--- vocabulario que no sale en su capítulo ---")
        for n, e, l2, es in falta_v:
            print(f"  cap {n:>3}  {e:<12} [{l2:<12}] {es[:40]}")
        print("\n--- gramática que no sale en su capítulo ---")
        for n, f, l2, es, es_etiqueta in falta_g:
            marca = "  (no es texto buscable)" if es_etiqueta else ""
            print(f"  cap {n:>3}  {f:<18} {es[:40]}{marca}")


if __name__ == "__main__":
    main()
