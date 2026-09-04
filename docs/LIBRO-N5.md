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

## El orden del libro, separado del curso

Desde el 2026-09-03 el libro tiene su propia secuencia, en
`data/fuente/orden_libro.json`. El curso ordena por tema —人と体, 暮らし,
時間…— porque así se estudia; la historia va por cuándo pasan las cosas, y
mezclarlos dejaba noviembre antes de que llegara el otoño y el vuelo a Japón en
el capítulo 8, cuando Carlos ya había llegado, empezado la escuela y conocido a
la clase.

Un id que no esté en la lista se va al final, en el orden del curso: añadir una
unidad no rompe el libro, sólo la deja sin sitio hasta que se le dé uno.

El año, ya en orden: llegada y papeleo → la escuela → los amigos y Anna →
la pizzería → noviembre y el frío → Sapporo en diciembre → el invierno que se
abre a la primavera → abril, junio y la despedida.

## El vocabulario del libro, también separado del curso

Decidido el 2026-09-03, después de ver que 名前 se leía en el capítulo 2 —Carlos
se presenta— y no se estudiaba hasta el 99. No era un caso suelto: **79
palabras se leían antes de aprenderse**, en 47 de los 103 capítulos, y las
peores eran las más básicas, porque el curso las ordena por tema y sus temas
caen al final —とても en el 83, 大きい en el 82, アパート en el 71—.

`data/fuente/vocabulario_libro.json` da al libro su propia lista: la palabra
que la historia usa va al capítulo donde aparece por primera vez, y la que el
libro no llega a usar se queda donde la puso el curso. Ninguna se pierde: las
926 siguen colocadas, 321 adelantadas y el resto en su sitio de siempre. Con
eso, **las palabras que se leen antes de estudiarse pasan de 79 a 0**.

La saca `scripts/31_vocabulario_libro.py`, que analiza el texto con **janome**
—buscar por trozos no vale: el texto de N5 va casi todo en kana y de 「した」
salía 舌, de 「こうえん」 salía 講演—. Aun con analizador se equivoca en las
rachas largas de kana: de 「ひこうき」 sacaba ひく y de 「おおやさん」, 野菜. Por
eso **manda el archivo, no el script**: se corrige a mano y no se pierde.

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
| 104–106 | つなぐ言葉 | El festival de la escuela: tres canciones con Jean y Gonza, ensayadas en un parque para perder la vergüenza. Y la mudanza: devolver el piso, limpiarlo y pelearse con la basura |

## La basura de Kobe, que es un capítulo entero

Devolver el piso es lo último que hace y es de lo que ningún libro avisa. Los
datos son los del ayuntamiento de Kobe, no inventados:

- **燃えるごみ** — dos veces por semana, en la **bolsa designada** de la ciudad,
  bien atada, sacada a la クリーンステーション entre las **cinco y las ocho de
  la mañana** del día que toca. No la noche antes.
- **缶・びん・ペットボトル** — los miércoles.
- **容器包装プラスチック** — una vez por semana.
- **燃えないごみ** — dos veces al mes.
- **大型ごみ** — recogida individual: hay que **pedir cita**, y eso es lo que
  pilla a todo el que se va. El colchón no se saca a la calle y ya.
- El calendario del barrio se llama **ワケトンカレンダー**, por la mascota.

El capítulo se escribe con eso: Carlos descubre que su colchón necesita cita
con dos semanas de antelación y que se va en una que ya no tiene.

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

## Lo que queda para N4 y arriba

La historia de N5 acaba cuando termina el año de escuela. Lo que no cabe aquí
—porque el vocabulario no da— se guarda para los niveles siguientes:

- **N4**: la búsqueda de piso sin agencia, con garante y 礼金. El examen de
  japonés de verdad. La relación con Anna cuando ya se pueden decir cosas
  difíciles. Cambiar de baito.
- **N3**: el visado de trabajo, la entrevista, el primer contrato. La distancia
  con los de casa cuando llevas dos años fuera.
- **N2 y N1**: eso ya no es un libro de aventuras: son los textos de opinión que
  el examen pide, y ahí el protagonista sobra.

O sea que Carlos vive N5 y N4 completos, se profesionaliza en N3 y desaparece
cuando el examen deja de contar historias.

## La edición en papel

Decidido el 2026-09-03: **un capítulo por pliego, con ilustración.** Página
izquierda el vocabulario y la gramática, derecha la historia y un dibujo.

Es lo que hace cualquier graded reader, y resuelve de paso el problema de
tamaño. La referencia que miramos es
[小説ミラーさん](https://www.3anet.co.jp/np/books/2470/) —A5変, 147 páginas,
18 relatos, unos 2 800 caracteres cada uno—. Nuestros capítulos son de otra
naturaleza: 103 en vez de 18, y **172 casillas de mediana** contando espacios y
puntuación. Alargarlos a 2 800 sería reescribir el libro y romper la regla de
«un capítulo = una unidad de veinte palabras». El hueco que sobra no es un
defecto: es donde va el dibujo, que un principiante necesita tanto como el
texto.

### Las cuentas

Sobre A5変 (148 × 210 mm), cuerpo de 11 pt con furigana —que pide interlínea
doble, unos 7,8 mm por renglón—:

| | |
|---|---|
| Caja de texto | 105 mm de ancho → **27 casillas por renglón** |
| Alto disponible | 168 mm → 21 renglones en total |
| Historia | **12 renglones** = 324 casillas |
| Ilustración | los 9 renglones restantes: 105 × 70 mm |

Con 12 renglones **caben 100 de los 103 capítulos**. La mediana pide 9, así que
la mayoría deja sitio de sobra y el dibujo puede crecer.

### Las tres excepciones

Los tres capítulos que salieron de fundir una cola de una palabra con su
vecina se van del doble:

| | | |
|---|---|---|
| 33 · 頭が いたい ひ | 358 casillas | 19 renglones |
| 34 · たなかさんの 家族 | 341 | 18 |
| 63 · ちいさい へや | 280 | 14 |

No se recortan: el texto está bien y fundirlos fue lo correcto. En el papel se
les da la página entera de texto con una viñeta pequeña en una esquina, en
lugar del dibujo grande. Tres excepciones en 103 no rompen un libro.

### La maqueta

`python3 scripts/30_libro_pdf.py` saca **docs/libro-n5-maqueta.pdf**: el libro
entero a tamaño real, 148 × 210 mm, con los márgenes, el cuerpo de 12,5 pt, el
furigana dibujado carácter a carácter y el hueco del dibujo marcado con su
medida en milímetros. Sirve para mirarlo antes de encargar nada.

Se compone con **IPAex明朝** para la historia e **IPAexゴシック** para las
etiquetas —son TrueType y libres, que es lo que hace falta para incrustarlas—.
Las Hiragino del sistema no valen: llevan contornos PostScript y ninguna
librería de PDF las mete dentro del archivo.

Con `--capitulos 8` saca sólo los ocho primeros, que para mirar la maqueta
basta y tarda un segundo.

### Cuántos dibujos

**103, uno por capítulo, más la portada.** El texto ocupa 6 renglones de
mediana —12 el más largo—, así que en todos cabe el dibujo grande: 115 mm de
ancho por 82 mm de alto de media. Ninguno se queda en viñeta.

No son 103 dibujos sin relación. Son **siete personajes** —Carlos, Jean, Gonsa,
Min, Anna, la señora Tanaka y Kenta— y una veintena de escenarios que vuelven:

| | |
|---|---|
| Su habitación | 20 capítulos |
| El aula | 16 |
| La pizzería | 16 |
| Las calles de Kobe | 14 |
| Casa de la señora Tanaka | 8 |
| Avión y aeropuerto · Sapporo · naturaleza | 5 cada uno |
| Ventanillas oficiales | 4 |
| Casa de Anna | 3 |
| El hospital | 1 |

### 縦書き: la edición vertical

`python3 scripts/30_libro_pdf.py --vertical` saca
**docs/libro-n5-maqueta-vertical.pdf**: la historia de arriba abajo y las
columnas de derecha a izquierda, como un libro japonés. Las páginas de
vocabulario y gramática se quedan en horizontal, que es donde se consultan.

Reportlab no sabe componer en vertical, así que se dibuja carácter a carácter
—igual que ya se hacía con el furigana—. Lo que no es «lo mismo girado», y se
nota en cuanto falla:

- **。、** no van centradas: se suben a la esquina de arriba a la derecha del
  cuadratín. Centradas parecen un lunar en mitad de la columna.
- **ー「」（）…** giran 90°. El alargamiento vocálico tumbado es lo que más
  delata a un vertical mal hecho.
- Las **kana pequeñas** (ゃゅょっ) se corren un poco a la derecha y arriba.
- El **furigana** deja de ir encima y pasa al lado derecho de su kanji.

El ancho de columna es 2,15 × el cuerpo: el cuerpo más el furigana al lado.

**El dibujo cambia de sitio.** En horizontal el hueco que sobra es una banda
apaisada debajo del texto; en vertical sería una tira alta y estrecha —43 × 168
mm en el capítulo 1—, y los 103 dibujos son 3:2 apaisados. Redibujarlos en
vertical costaría otra tanda entera, así que en esta edición la ilustración va
en una **banda apaisada arriba** y las columnas debajo, que además es como lo
resuelve media literatura infantil japonesa.

La banda se queda con lo que sobre, no al revés: se prueban alturas de 2/3 del
ancho hacia abajo y se coge la primera que deja sitio a todas las columnas. Con
altura fija había 14 capítulos a los que ya no les cabía el texto. Así entran
los 103: 101 con dibujo (75 mm de alto de media) y los dos largos —el 32 y el
35— sin banda, que son los mismos que en horizontal se quedaban sin dibujo
grande.

**Ojo con la encuadernación:** un libro en vertical se cose por la **derecha**
y se lee de atrás hacia delante. El margen ancho —el que se come la costura—
cambia de lado, y eso ya lo hace el script. Pero si algún día se manda a
imprenta hay que decírselo a la imprenta explícitamente (右綴じ), porque por
defecto montan a la occidental.

### En la app

El interruptor **縦** vive en la misma botonera que あ, 意 y 色, y sale sólo
donde hay prosa larga que poner en columnas: la lectura de la unidad y el
libro. En una lista de vocabulario o en las opciones de un test no hay nada que
apilar y el botón sólo estorbaría.

Ahí no hay que dibujar nada a mano: el navegador ya sabe hacerlo con
`writing-mode: vertical-rl`, que coloca 。 y 、 en su sitio, gira lo que hay que
girar y manda el furigana al lado derecho. Dos cosas que sí hay que darle:

- Una **altura**. Sin ella el texto sale en una sola columna infinita hacia
  abajo en vez de repartirse.
- `direction: rtl` en el contenedor que scrollea, que es lo que hace que el
  navegador empiece por la derecha, donde está el principio del texto. El
  bloque de dentro vuelve a `ltr` para que no se den la vuelta los números ni
  el español intercalado.

Y `line-height` en vertical no es el alto del renglón sino el **ancho de la
columna**: con el 1.9 de horizontal las columnas se pegan cuando hay furigana.

### El estilo de los dibujos (decidido el 2026-09-03)

**Masaaki Yuasa**, tomando el diseño de 四畳半神話大系, けものづめ, ピンポン y
デビルマンcrybaby. Lo que lo define, y lo que hay que exigirle al modelo en cada
petición porque tiende a suavizarlo:

- Caras **angulosas y asimétricas**, construidas con planos planos: mentón en
  punta, nariz de cuña, las dos mitades no coinciden. Ojos **pequeños y
  entrecerrados**, nunca grandes ni redondos ni brillantes.
- Cuerpos alargados y elásticos, cabezas pequeñas, extremidades que se doblan
  donde no toca, todo el mundo un poco fuera de la vertical.
- **Plano**: tinta negra sobre papel crudo y manchas negras macizas de borde
  duro. Nada de trama, ni de rayado, ni de grises, ni de volumen.
- Los tres latinos llevan **ojos latinos** —grandes, almendrados, iris visible,
  cejas pesadas—, que es lo que los separa de los japoneses.
- **Carlos, Jean y Gonsa se caricaturizan; la señora Tanaka y Kenta no.** A los
  dos se les dibuja del natural, con la misma línea pero sin deformar.

La palabra «cartoon» en el prompt lo arruina: arrastra al modelo a caras
redondas y simétricas, o sea Ghibli con Pixar. Hay que pedir anguloso, plano y
feo-bonito, y prohibir Ghibli y Pixar por su nombre.

Alturas, que el modelo se salta si no se las mides: **Carlos y Jean miden
igual**; Gonsa les saca media cabeza y no más.

### Cómo se generan

`python3 scripts/32_ilustrar_libro.py hoja` saca la hoja de personajes, que es
la que sostiene la coherencia: el modelo no recuerda nada entre llamadas, así
que la hoja se manda **como imagen de referencia en cada capítulo**. Está en
`docs/libro/ilustraciones/00-personajes.png` y no se regenera salvo que
cambien los personajes.

`... cap --todos` dibuja los capítulos y **salta los que ya existen**, así que
se puede parar y seguir. `... cap 12 40` rehace sueltos (hay que borrarlos
antes).

Los PNG se guardan en escala de grises: son dibujos a tinta, y en RGB ocupan
3,4 veces más sin aportar nada. Quedan a ~340 ppp sobre los 115 mm de ancho.

Dos cosas que hacen fallar la API: los títulos «Kemonozume» y «Devilman
crybaby» disparan el filtro de contenido de vez en cuando —el script reintenta
sin ellos— y el crédito de OpenAI se agota sin avisar, con un 429 que en
realidad dice `credit_balance_exhausted`.

### El libro montado

`python3 scripts/30_libro_pdf.py` ya no dibuja el recuadro de puntos: mete las
ilustraciones de verdad, y la portada compuesta como página 1. El recuadro sólo
sale para lo que falte, y entonces pone «falta el dibujo».

Al incrustarlos se les empuja el fondo a blanco puro: el papel del dibujo ronda
el 240 y la página del PDF es blanca, así que pegados tal cual se veía el
rectángulo. De paso el PDF baja de 67 MB a 22.

La portada sale a **1818 × 2550 px**: A5 a 300 ppp más 3 mm de sangre por lado,
que es lo que pide cualquier imprenta. El dibujo viene del modelo a 1024 × 1536
y hay que ampliarlo —con una máscara de enfoque para recuperar la línea—, pero
el **título y el logo se dibujan a tamaño final**, que es donde de verdad se
nota la falta de resolución: una letra ampliada canta y una línea de tinta
ampliada no.

### La maqueta del capítulo

El orden es **texto y después dibujo**, nunca al revés. Antes el dibujo se metía
en el hueco que sobrara, así que caía en medio de la historia y cada capítulo lo
tenía de un tamaño distinto. Ahora el texto corre entero —por las páginas que
haga falta— y el dibujo cierra el capítulo, **siempre a 115 × 77 mm**.

Los cortes de renglón caen **en los espacios**, no en cualquier carácter. El
japonés normal se puede partir entre casi cualquier par de letras, pero este
libro va en 分かち書き y partir dentro de una palabra —食べまし / た— se lee
fatal a este nivel.

Al final de cada capítulo va un **QR a esa misma lección en la app**, donde
están el audio, la traducción y el test. Va al final y no al principio a
propósito: mirar la traducción antes de leer es dejar de leer.

Delante de todo hay dos páginas de entrada: **cómo se usa el libro** y el
**índice** de los 103 capítulos.

### Nombres propios y números, en kanji

神戸, 札幌, 三宮, 花隈, 元町, 東京, 西神中央, 日本 — todos con furigana. Los
kanji van muy por encima de N5, pero al llegar a Japón las estaciones y los
carteles no están en kana: saber leerlos es de lo primero que hace falta.

Igual con los números y las horas: 四時 y no よじ, 二人 y no ふたり. Al
convertirlos hay que mirar lo que va delante y detrás, porque 「いちじ」 sale
dentro de 「じゅういちじ」 (las once) y de 「いちじかん」 (una hora), y 「とお」
dentro de とおい y とおり.

### Para la imprenta

`python3 scripts/35_libro_imprenta.py` deja en `docs/imprenta/` los dos
archivos que pide cualquier imprenta —el **interior** y la **cubierta** por
separado, nunca juntos—:

| | |
|---|---|
| `libro-n5-interior.pdf` | 148 × 210 mm, una tinta — **sale de la edición VERTICAL** |
| `libro-n5-cubierta.pdf` | 313 × 216 mm: contra + lomo + portada, con sangre y marcas |

Lo comprobado, no de memoria:

- **Fuentes incrustadas.** Reportlab mete las IPAex, así que sale solo.
- **300 ppp al tamaño final.** Los dibujos van a 1536 px sobre 115 mm = 339 ppp.
- **3 mm de sangre donde el color llega al borde.** En el **interior no hace
  falta**: los dibujos van dentro de la caja y no tocan el corte. En la
  cubierta sí, porque el dibujo llega al filo.
- **El interior a una tinta**, en escala de grises y no CMYK. Un negro
  compuesto de cuatro tintas se desregistra y encima cuesta más.
- **Páginas múltiplo de 4**, que es como se pliegan los cuadernillos: 207 + 1 en
  blanco = 208.
- **El lomo depende del papel**: 11,4 mm con 208 páginas en offset de 90 g.
  Con `--papel 80g-offset` o `100g-estucado` sale otro. **Confírmalo con la
  imprenta antes de mandar nada**, porque el grosor real varía por proveedor y
  un lomo mal calculado descuadra la cubierta entera.

**Lo que NO hace: PDF/X-1a.** Reportlab no lo sabe y aquí no hay Ghostscript.
El PDF es correcto en geometría, resolución y fuentes; la conversión la hace la
imprenta sin problema, o se hace con Acrobat. Casi todas aceptan un PDF normal
bien hecho, pero pregúntalo.

## Cobertura: cuánto del temario sale de verdad en la historia

`python3 scripts/36_cobertura_libro.py` lo mide (con `--detalle` saca la lista).
Medido el 2026-09-03:

| | total | dentro de la historia | sólo en la ficha |
|---|---|---|---|
| Vocabulario | 925 | **689 (74 %)** | 236 (25 %) |
| Gramática | 84 | **46 (54 %)** | 38 (45 %) |

Al medirlo por primera vez era 47 % y 19 %. Los 103 capítulos se reescribieron
con su lista delante, alargándolos: la mediana pasó de 172 casillas a más del
doble, y el libro de 207 páginas a 234.

La gramática cuenta también cuando el capítulo la **marca** con 「[…]」. Los
puntos de un solo carácter —も, に, ね— salen en cada frase, así que
encontrarlos a ciegas no probaba nada; marcar uno sí, porque el alumno ve dónde
está el punto en vez de adivinarlo entre cincuenta.

Además hay **19 capítulos sin ningún punto de gramática asignado**.

Esto contradice la idea del libro. Si una palabra sólo está en la ficha, no se
aprende leyendo: queda una lista de vocabulario con una historia al lado, que
es justo lo que no queríamos. El capítulo 2 lo enseña bien: su texto son 180
casillas y su ficha pide 土曜日, 映画館, 先週 y 昨夜, que no aparecen por ningún
lado.

**De dónde viene.** `31_vocabulario_libro.py` coloca cada palabra en el capítulo
donde la historia la usa por primera vez, pero **la que el libro no usa se queda
donde la puso el curso**. O sea que el 52 % son palabras que el relato
sencillamente no gasta.

**Lo que hace falta**, y no es automatizable: alargar los textos. La mediana son
172 casillas y el hueco da para 12 renglones (324), así que cabe más historia
sin tocar la maqueta. Subir del 47 % al 80 % es reescribir los 103 capítulos con
su lista delante.

Lo que sobre después va a un **índice final**: forma, significado, un ejemplo y
un dibujo con los personajes. Pero el índice es para el resto, no para el grueso.

### Lo que falta cuando haya dibujos

Las lecturas necesitarán un campo para la ilustración y su pie. Hasta que
existan las imágenes no se añade: un campo vacío en 607 lecturas no ayuda a
nadie.
