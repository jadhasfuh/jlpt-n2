# Anuncio de Facebook: el encargo para ChatGPT

Pegar tal cual en ChatGPT. Está escrito para que devuelva **texto e imagen**
en una sola pasada y para que no invente cifras: todas las que aparecen aquí
salen de `data/dist` y son ciertas a 2 de septiembre de 2026.

Cuando cambien (más lecturas, más kanji), actualízalas aquí antes de pedirlo.

---

## El prompt

> Eres redactor publicitario y director de arte. Trabajas para **jlptest**
> (https://jlptest.org), una aplicación web para estudiar japonés de cara al
> examen oficial JLPT, de nivel N5 a N1.
>
> **Qué es el producto, con datos reales:**
> - 8.027 palabras organizadas en 614 unidades temáticas, no en listas sueltas.
> - 1.981 kanji con sus lecturas, trazos y las palabras donde aparecen.
> - 846 puntos de gramática ordenados de simple a complejo.
> - 614 lecturas escritas al nivel de cada unidad: cada una usa sólo el
>   vocabulario y los kanji que el estudiante ya ha visto.
> - Exámenes de práctica con la estructura y la puntuación del JLPT real.
> - Tarjetas con repetición espaciada, ejercicios de oído y de ordenar frases.
> - Interfaz y traducciones en español e inglés.
> - Se empieza gratis: la sección 人と体 de cada nivel está abierta.
> - Suscripción de 79 MXN al mes. Se paga en la web.
>
> **A quién le hablamos:** hispanohablantes de 18 a 40 años que estudian
> japonés por su cuenta y quieren presentarse al JLPT, o que llevan meses con
> apps de idiomas genéricas y sienten que no avanzan hacia el examen.
>
> **Tono:** directo, concreto y sin humo. Nada de «¡domina el japonés en 30
> días!», nada de promesas de aprobado, nada de emojis en cascada. La ventaja
> real es que es un temario ordenado y completo, no un juego de rachas.
>
> **Entrégame:**
>
> 1. **Cinco variantes de texto principal** (el cuerpo del anuncio), de 90 a
>    150 palabras cada una. Que cada variante ataque un ángulo distinto:
>    (a) el examen como fecha límite, (b) el desorden de estudiar con veinte
>    recursos sueltos, (c) las lecturas escritas a tu nivel, (d) la repetición
>    espaciada explicada en una frase, (e) el precio frente a una academia.
> 2. **Cinco titulares** de 40 caracteres o menos.
> 3. **Cinco descripciones** de 30 caracteres o menos.
> 4. **Una llamada a la acción** recomendada de entre las que ofrece Meta.
> 5. **Tres ideas de segmentación** en el administrador de anuncios: intereses,
>    edades y países de habla hispana con más estudiantes de japonés.
>
> Después, **genera la imagen** del anuncio con estas indicaciones:
>
> - Formato vertical 4:5 (1080 × 1350 px), que es el que más rinde en el feed.
> - Paleta exacta de la marca: fondo azul noche `#161826`, texto claro
>   `#E9E9ED`, acento violeta `#9184D9`. Nada de degradados chillones.
> - Estética sobria y tipográfica, cercana a una app bien diseñada: mucho aire,
>   pocos elementos, nada de fotos de archivo de gente sonriendo con un libro.
> - El elemento central puede ser un kanji grande y bien dibujado —漢, 語 o 試—
>   o una tarjeta de estudio limpia sobre el fondo oscuro.
> - **Muy poco texto dentro de la imagen**: como mucho una línea corta en
>   español y la palabra «jlptest». El resto del mensaje va en el texto del
>   anuncio, no en el gráfico.
> - Si escribes japonés en la imagen, tiene que ser correcto y legible: usa
>   sólo 日本語能力試験 o un kanji suelto. **No inventes caracteres**; es el
>   error que arruina un anuncio de una app de japonés.
>
> Antes de darme nada, dime en una línea qué ángulo te parece más fuerte y por
> qué.

---

## Después, al montar el anuncio en Meta

- Sube la imagen en 4:5 y deja que Meta recorte a 1:1 para otras posiciones.
- Enlaza a `https://jlptest.org/test/n5`, no a la portada: quien llega desde
  un anuncio entra mejor haciendo el test gratuito que leyendo una portada.
- Empieza con 3 o 4 días y presupuesto bajo, sólo para ver cuál de los cinco
  textos tiene mejor CTR, y luego concentra el gasto en ése.
- No prometas aprobar el examen en el texto: además de ser falso, es la clase
  de afirmación que Meta rechaza en la revisión.
