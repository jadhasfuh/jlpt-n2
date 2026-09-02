# El libro de N5: una historia continua

## Qué es

Las 106 lecturas de N5 escritas como capítulos de **una sola historia**, en el
orden en que la app recorre las unidades. Cada capítulo sigue siendo la lectura
de su unidad —mismo `unidad_id`, mismas preguntas, mismo ejercicio de ordenar—,
así que no se rompe nada. El «libro» es leerlas seguidas.

## De dónde sale la idea, y qué no copiamos

De みんなの日本語 y su Mike Miller: un personaje que reaparece lección tras
lección y convierte una lista de textos en algo que se quiere seguir leyendo.
La técnica es de todos; **el personaje y la trama son de 3A Corporation**, así
que aquí no aparecen ni su nombre, ni su empresa, ni ninguna de sus escenas.

Lo que sí hay es material de primera mano: la historia sigue lo que de verdad
le pasa a un estudiante de idiomas recién llegado, con los trámites, el trabajo
de medio tiempo y los viajes mal planeados incluidos. Eso es lo que ningún
libro cuenta y lo que hace que este sirva de guía además de lectura.

## Los personajes

- **カルロス** — mexicano, veintitrés años. Llega a **Kobe** con una agencia
  que contrató por internet. Es quien narra.
- **ジャン** y **ゴンサ** — peruanos, compañeros de la escuela de idiomas. Jean
  es el prudente; Gonza el que propone los planes malos.
- **アンナ** — japonesa. Aparece a media historia y acaba siendo su novia.
- **たなかさん** — la casera. Sesenta y muchos, pregunta demasiado, que es lo
  que necesita alguien que no entiende los recibos del gas.
- **ミンさん** — compañero de clase de Myanmar. Trabaja en la pizzería desde
  antes y se convierte en su senpai de cocina.
- **La chica del avión** — otaku de los vuelos: cronometra despegue, aterrizaje
  y duración, con el peluche oficial de la aerolínea en el regazo. Aparece en
  el vuelo de llegada y se la recuerda en el de Sapporo.

## El arco, atado al orden real de las unidades

| Unidades | Sección | Qué pasa |
|---|---|---|
| 1–8 | 場所と移動 | El vuelo y la chica que cronometra. Llega a Kobe por agencia. El barrio, los trenes, orientarse |
| 9–22 | 動きと行為 | Las primeras semanas: residencia, agua, gas, y el banco para poder trabajar |
| 23–28 | 学校と学び | La escuela. Jean y Gonza. Primer examen |
| 29–35 | 技術・道具・文化 | Aficiones. Aparece una guitarra prestada |
| 36–47 | 人と体 | Las personas. La app de citas: salir es tener una guía atenta por el precio de una cena. Aparece Anna |
| 48–59 | 時間と数 | Rutina, calendario, el primer invierno que se acerca |
| 60–66 | 気持ち・考え | Nostalgia, vergüenza, hablar con un japonés de nivel N5 |
| 67–83 | 暮らし | Casa, comida, compras, dinero contado |
| 84–95 | 性質・仕事 | El baito en la pizzería. Los compañeros de Bangladesh, que se lo toman muy en serio. Min como senpai |
| 96–103 | 自然 | Sapporo con Gonza, sin plan. La nieve por primera vez. El café internet. El centro que de fuera parece vacío y por dentro está lleno de bares. Pierden el vuelo |
| 104–106 | つなぐ言葉 | El festival de la escuela: tres canciones con Jean y Gonza, ensayadas en un parque para perder la vergüenza |

## Dos cosas que se cuentan de otra manera

La historia es real y se nota, pero el libro lo lee gente de quince años y la
ficha de la tienda declara que no hay contenido sexual ni promoción de alcohol.
Así que:

- **El café internet** mantiene lo bueno —la cabina propia, el helado gratis,
  las estanterías de manga y revistas— sin detallar qué había en todas ellas.
- **El bar de maids** se cuenta como lo que es de puertas afuera: treinta
  minutos, dos peruanos sin dinero, y la cara del resto de la clientela. Beben
  mucho y al día siguiente pierden el avión, que es el remate honesto: sale
  caro, no sale gracioso.

## Reglas de escritura

1. **Cada capítulo usa sólo kanji vistos hasta esa unidad.** Lo comprueba
   `scripts/13_validar_lecturas.py`. Lo que aún no toca va en kana.
2. **El vocabulario de la unidad aparece en su capítulo**: la página anterior
   enseña las palabras, la siguiente las usa.
3. **Las tres traducciones cuadran frase a frase**, que es lo que necesita el
   ejercicio de ordenar.
4. **Continuidad real**: lo que pasa en un capítulo se nota en los siguientes.
5. **Nada de moralejas.**
