# -*- coding: utf-8 -*-
"""Convierte a WebP las imágenes que sirve la app.

    python3 scripts/39_aligerar_imagenes.py            # convierte lo que falte
    python3 scripts/39_aligerar_imagenes.py --secar    # sólo dice cuánto sería

public/ se mete entero en la imagen de Docker y en el APK, y con los 103
dibujos del libro más los del examen se había puesto en 89 MB. Son dibujos de
línea negra sobre blanco: en PNG ocupan medio mega cada uno porque el formato
guarda píxel a píxel, y en WebP bajan a la octava parte sin que se note en la
línea (probado a 88, que es donde el trazo fino todavía sale limpio).

Los PNG de docs/libro/ilustraciones NO se tocan: ésos son los del PDF y van a
imprenta, donde hay que entregar sin pérdida. Esto es sólo para la pantalla.

Es idempotente: convierte lo que no tenga ya su .webp al día y borra el PNG.
"""
import pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CARPETAS = ["public/libro", "public/examen/escenas", "public/examen/opciones"]
CALIDAD = 88


def main():
    from PIL import Image
    secar = "--secar" in sys.argv
    antes = despues = 0
    hechos = 0
    for c in CARPETAS:
        for f in sorted((RAIZ / c).glob("*.png")):
            destino = f.with_suffix(".webp")
            antes += f.stat().st_size
            if destino.exists() and destino.stat().st_mtime >= f.stat().st_mtime:
                despues += destino.stat().st_size
                continue
            im = Image.open(f)
            if secar:
                import io
                b = io.BytesIO(); im.save(b, "WEBP", quality=CALIDAD, method=6)
                despues += b.tell()
            else:
                im.save(destino, "WEBP", quality=CALIDAD, method=6)
                despues += destino.stat().st_size
                f.unlink()
            hechos += 1

    mb = lambda n: n / 1024 / 1024
    print(f"{hechos} imágenes {'se convertirían' if secar else 'convertidas'}")
    print(f"  {mb(antes):.1f} MB → {mb(despues):.1f} MB "
          f"({despues * 100 // max(1, antes)}%)")


if __name__ == "__main__":
    main()
