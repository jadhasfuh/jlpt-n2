# Qué mandar a la imprenta

Dos archivos, los dos en esta carpeta. **Nunca en uno solo**: las imprentas
quieren el interior y la cubierta por separado.

| Archivo | Qué es |
|---|---|
| `libro-n5-interior.pdf` | El bloque de texto, 320 páginas |
| `libro-n5-cubierta.pdf` | Contraportada + lomo + portada, en una hoja |

## La ficha del pedido

    Título          こうべの一年 / Un año en Kobe
    Formato         A5, 148 × 210 mm
    Páginas         320 (múltiplo de 4; la última va en blanco a propósito)
    Interior        1 tinta, negro. NO CMYK.
    Papel interior  90 g offset ahuesado (o el equivalente de la casa)
    Cubierta        4/0 CMYK, 300 g, plastificado mate
    Lomo            17,6 mm  ← calculado para 320 págs en 90 g
    Encuadernación  Rústica fresada
    ENCUADERNADO POR LA DERECHA (右綴じ), como un libro japonés

## Lo que hay que decir sí o sí

**Se encuaderna por la derecha.** El texto va en vertical (縦書き) y se lee de
derecha a izquierda. Si no se dice, la imprenta lo monta a la occidental por
costumbre y el libro sale del revés: la portada quedaría al final y las páginas
en orden inverso. Es el error caro de este trabajo.

## Detalles que preguntan

- **Sangre.** La cubierta lleva 3 mm por los cuatro lados y marcas de corte.
  El interior **no lleva y no la necesita**: no hay nada que llegue al borde,
  los dibujos van dentro de la caja de texto.
- **Resolución.** Los dibujos son de 1536 px sobre 115 mm de ancho = 339 ppp.
- **Fuentes.** Las IPAex (Mincho y Gothic) van incrustadas. El preflight avisa
  además de «Helvetica y Times-Roman no incrustadas»: reportlab las declara en
  cada página y no escribe ni un glifo con ellas, así que no imprimen nada.
  **No se pueden quitar**: al borrarlas se desordenan los subconjuntos de las
  IPAex y el japonés sale con las letras cambiadas. Está probado.
- **PDF/X-1a.** No lo generamos: no hay Ghostscript en la máquina que arma los
  archivos. El PDF es correcto en geometría, resolución y fuentes, y la
  conversión la hacen ellos sin coste. Casi todas aceptan un PDF normal bien
  hecho; si la de ustedes lo exige, se lo pedimos a ellos o se pasa por Acrobat.
- **El lomo depende del papel.** 17,6 mm es para 90 g offset. Si ponen otro,
  hay que rehacer la cubierta:
  `python3 scripts/35_libro_imprenta.py` (ver `PAPELES` en el script).

## Antes de dar el visto bueno

Pedir **prueba física**, no sólo PDF firmado. Lo que hay que mirar en ella:

1. Que abra por la derecha.
2. Que la primera página del interior sea 「この 本の つかい方」 y **no** la
   portada. La portada va sólo en la cubierta.
3. Que el furigana se lea. Va a cuerpo pequeño y es lo primero que se pierde
   si el papel chupa tinta.
4. Que el lomo caiga donde toca: el título centrado y sin invadir las tapas.
