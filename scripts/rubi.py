# -*- coding: utf-8 -*-
"""Convierte {漢字|かんじ} en <ruby>漢字<rt>かんじ</rt></ruby> y [texto] en <em class="g">.

Escribir el marcado a mano en cada lectura era donde más erratas se colaban.
"""
import re

def rubi(t: str) -> str:
    t = re.sub(r"\{([^|}]+)\|([^}]+)\}", r"<ruby>\1<rt>\2</rt></ruby>", t)
    t = re.sub(r"\[([^\]]+)\]", r'<em class="g">\1</em>', t)
    return t
