# Capturas de la ficha de Play

Cuatro capturas de teléfono, 1080 × 1920 (9:16), en el tema oscuro. Play pide
entre 2 y 8; las dos primeras son las que salen en el resultado de búsqueda,
así que el orden importa.

| Fichero | Pantalla | Qué demuestra |
|---|---|---|
| `1-inicio.png` | Portada | Los personajes, el tamaño del curso y por dónde se empieza |
| `2-curso.png`  | N5 | Que es un temario ordenado —libro, kanji, gramática, unidades—, no una lista de palabras |
| `3-libro.png`  | Libro, capítulo 2 | La historia ilustrada con furigana: es lo que no tiene nadie más |
| `4-examen.png` | Test gratis | Una pregunta con la forma del JLPT de verdad |

## Cómo se rehacen

Con la app levantada en local:

```bash
PORT=3100 npm run start
```

Se capturan con WebKit a 360 px de ancho —lo que ve un móvil— ampliado ×3 con
`pageZoom`, así salen a 1080 sin escalar un mapa de bits. El tema oscuro se
deja puesto en `localStorage` antes de que arranque React, o se cuela un
parpadeo en claro dentro de la foto.

No valen capturas del emulador de Android Studio: salen con la barra de estado
y la de navegación, y Play las rechaza o quedan feas recortadas.

## Lo que falta para la ficha

- El gráfico destacado ya está: `../grafico-destacado-1024x500.png`.
- El icono, en `../icono-512.png`.
- Play pide además una captura de tablet de 7" y otra de 10" **sólo si** se
  declara compatible con tablets.
