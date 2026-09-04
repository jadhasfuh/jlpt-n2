# -*- coding: utf-8 -*-
"""Convierte {漢字|かんじ} en <ruby>漢字<rt>かんじ</rt></ruby> y [texto] en <em class="g">.

Escribir el marcado a mano en cada lectura era donde más erratas se colaban.
"""
import re

LLAVE = re.compile(r"\{([^|}]+)\|([^}]+)\}")
CORCHETE = re.compile(r"\[([^\]]+)\]")
# Lo que queda entre llaves o corchetes después de convertir es taquigrafía mal
# escrita. Pasó de verdad: alguien escribió {ほうが} sin la barra y las llaves
# salieron IMPRESAS en el libro, porque nada volvía a mirar el texto.
SUELTO = re.compile(r"[{}\[\]]")


def rubi(t: str, uid: str = "") -> str:
    t = LLAVE.sub(r"<ruby>\1<rt>\2</rt></ruby>", t)
    t = CORCHETE.sub(r'<em class="g">\1</em>', t)
    m = SUELTO.search(t)
    if m:
        donde = f"{uid}: " if uid else ""
        raise ValueError(
            f"{donde}taquigrafía sin convertir en «"
            f"{t[max(0, m.start()-24):m.start()+18]}». "
            f"¿Falta la barra de {{漢字|かんじ}}?")
    return t
