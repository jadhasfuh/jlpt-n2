# El libro de N5: una historia continua

## Qué es

Las 106 lecturas de N5, escritas como capítulos de **una sola historia** en el
orden en que la app recorre las unidades. Cada capítulo sigue siendo la
lectura de su unidad —mismo `unidad_id`, mismas preguntas, mismo ejercicio de
ordenar—, así que no se rompe nada. El «libro» es leerlas seguidas.

## De dónde sale la idea, y qué no copiamos

De みんなの日本語 y su Mike Miller: un personaje que reaparece lección tras
lección y convierte una lista de textos en algo que se quiere seguir leyendo.
La técnica es de todos; **el personaje y la trama son de 3A Corporation**, así
que aquí no aparecen ni su nombre, ni su empresa, ni ninguna de sus escenas.
Personajes propios, pueblo propio, historia propia.

## Los personajes

- **カルロス** — estudiante mexicano, veintitrés años. Llega a Japón para un
  año de curso. Es quien narra. Se eligió hispanohablante a propósito: quien
  lee esto en español se reconoce en él.
- **たなかさん** — la casera, sesenta y muchos. Vive al lado. Habla despacio y
  pregunta demasiado, que es justo lo que necesita alguien que empieza.
- **みなみさん** — compañera de la escuela de idiomas, de Osaka. Directa.
- **けんた** — hermano pequeño de Minami, doce años, sólo le interesa el fútbol.
- **食堂のおじさん** — el del comedor de delante de la estación. Sale poco y
  siempre dice lo mismo, que es parte de la gracia.

## El arco, atado al orden real de las unidades

| Unidades | Sección | Qué pasa |
|---|---|---|
| 1–8 | 場所と移動 | Llega al pueblo, se orienta, aprende a moverse |
| 9–22 | 動きと行為 | La vida diaria empieza: cosas que se hacen con las manos |
| 23–28 | 学校と学び | Primer día en la escuela de idiomas |
| 29–35 | 技術・道具・文化 | Aficiones: la música de Kenta, el fútbol |
| 36–47 | 人と体 | Las personas: la familia de Minami, un resfriado |
| 48–59 | 時間と数 | Rutina, calendario, el primer mes |
| 60–66 | 気持ち・考え | Se hace amigo de gente. Nostalgia |
| 67–83 | 暮らし | Casa, comida, compras, dinero |
| 84–95 | 性質・仕事 | Un trabajo de medio tiempo |
| 96–103 | 自然 | Un viaje al mar con Minami y Kenta |
| 104–106 | つなぐ言葉 | Se acaba el año. La despedida |

## Reglas de escritura

1. **Cada capítulo usa sólo kanji vistos hasta esa unidad.** Lo comprueba
   `scripts/13_validar_lecturas.py`, igual que ahora.
2. **El vocabulario de la unidad aparece en su capítulo.** Ésa es la razón de
   que el capítulo exista: la página anterior enseña las palabras, la
   siguiente las usa en una historia.
3. **Las tres traducciones cuadran frase a frase** (japonés, español, inglés),
   que es lo que necesita el ejercicio de ordenar.
4. **Continuidad real**: lo que pasa en un capítulo se nota en los siguientes.
   Si en el ocho pierde el billete, en el nueve no tiene dinero.
5. **Nada de moralejas.** Es una historia, no una lección de vida.
