# Anuncio de Facebook — «Lecturas progresivas»

Imagen: `android/play/promo-lecturas-1080x1350.png` (1080 × 1350, 4:5, que es
el formato que más alto ocupa en el feed).

Se regenera con:

```bash
python3 scripts/32_ilustrar_libro.py anuncio            # el arte, sin letras
python3 scripts/32_ilustrar_libro.py anuncio --montar   # el texto y el logo encima
```

El texto va compuesto con PIL y no dibujado por el modelo, por lo mismo que en
la portada: estos modelos escriben fatal. Titular en Futura Bold, cuerpo en
Avenir Next Medium, el rojo muestreado del propio logo (215, 38, 61).

## El texto del post

> **Aprender japonés no es memorizar listas. Es llegar a leer.**
>
> Puedes saber mil palabras y seguir sin entender un párrafo. Lo que cierra ese
> hueco es leer mucho y en el orden correcto: textos que usen justo lo que ya
> sabes, con un puñado de palabras nuevas cada vez.
>
> Eso es lo que hay en jlptest.org:
>
> 📖 **607 lecturas ordenadas de N5 a N1.** Cada una usa el vocabulario y la
> gramática de su unidad, así que nunca te topas con algo que todavía no tocaba.
>
> ✍️ **Furigana que enciendes y apagas.** Primero intentas leer sin ayuda; si te
> atascas, lo pones. Y los kanji se colorean por nivel, para que veas de un
> vistazo cuáles ya deberías conocer.
>
> 📚 **En N5 las lecturas son un libro.** Los 103 capítulos cuentan una sola
> historia: Carlos llega a Kobe con una agencia que contrató por internet, y de
> ahí salen el papeleo, la escuela, el trabajo de medio tiempo y los viajes mal
> planeados. Se lee de corrido, no como ejercicios sueltos.
>
> 🎧 **Y con audio**, para que además de leerlo lo reconozcas al oírlo.
>
> Empieza gratis: **los cinco primeros capítulos están abiertos**, y la primera
> sección de cada nivel también.
>
> 👉 jlptest.org

## Por qué este ángulo

El anuncio anterior contaba todo lo que hay dentro —vocabulario, gramática,
lectura, audio, tests— y funciona para quien ya está buscando una app de JLPT.
Éste ataca otra cosa: **el hueco entre saber palabras y entender japonés**, que
es la frustración que la gente sí reconoce como suya, y que es justo lo que
resuelven las lecturas.

Por eso el titular no dice «lecturas progresivas» a secas en el texto del post:
lo dice la imagen. El texto empieza por el problema.
