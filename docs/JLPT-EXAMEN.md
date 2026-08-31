# JLPT — tipos de pregunta, distribución oficial y fórmula de generación

Documento de referencia para el generador de mini exámenes. Lo aportó Adrián el
31-08-2026; la estructura viene del sitio oficial (jlpt.jp → 試験科目と問題の構成
y los PDF «大問のねらい» de cada nivel).

> **Sobre derechos**: aquí sólo se recoge la **estructura** del examen (qué tipos
> de pregunta hay y cuántos), que es información funcional publicada por la
> propia Fundación Japón. Los exámenes pasados **sí** están protegidos: no se
> copia ni un ítem. Todo lo que genere la app es original, escrito siguiendo
> esa estructura. Lo mismo vale para los ejemplos semilla de §5, que son
> originales escritos en el mismo formato.

## Taxonomía de 大問 por nivel

| Sección | 大問 | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|---|
| 文字・語彙 | 漢字読み | ○ | ○ | ○ | ○ | ○ |
| | 表記 | — | ○ | ○ | ○ | ○ |
| | 語形成 | — | ○ (sólo N2) | — | — | — |
| | 文脈規定 | ○ | ○ | ○ | ○ | ○ |
| | 言い換え類義 | ○ | ○ | ○ | ○ | ○ |
| | 用法 | ○ | ○ | ○ | ○ | — |
| 文法 | 文の文法1 (forma correcta) | ○ | ○ | ○ | ○ | ○ |
| | 文の文法2 (ordenar, la ★) | ○ | ○ | ○ | ○ | ○ |
| | 文章の文法 (cloze de párrafo) | ○ | ○ | ○ | ○ | ○ |
| 読解 | 内容理解 短文 (~200 car.) | ○ | ○ | ○ | ○ | ○ |
| | 内容理解 中文 (~500) | ○ | ○ | ○ | ○ | ○ |
| | 内容理解 長文 (~1000) | ○ | — | ○ | — | — |
| | 統合理解 (2+ textos, ~600) | ○ | ○ | — | — | — |
| | 主張理解 長文 (~900) | ○ | ○ | — | — | — |
| | 情報検索 (folleto, ~700) | ○ | ○ | ○ | ○ | ○ |
| 聴解 | 課題理解 | ○ | ○ | ○ | ○ | ○ |
| | ポイント理解 | ○ | ○ | ○ | ○ | ○ |
| | 概要理解 (opciones NO impresas) | ○ | ○ | ○ | — | — |
| | 発話表現 | — | — | ○ | ○ | ○ |
| | 即時応答 | ○ | ○ | ○ | ○ | ○ |
| | 統合理解 | ○ | ○ | — | — | — |

Tiempos N2: 言語知識・読解 105 min · 聴解 50 min.

## Número de ítems por nivel

| 大問 | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|
| 漢字読み | 6 | 5 | 8 | 7 | 7 |
| 表記 | – | 5 | 6 | 5 | 5 |
| 語形成 | – | 5 | – | – | – |
| 文脈規定 | 7 | 7 | 11 | 8 | 6 |
| 言い換え類義 | 6 | 5 | 5 | 4 | 3 |
| 用法 | 6 | 5 | 5 | 4 | – |
| **文字・語彙** | **25** | **32** | **35** | **28** | **21** |
| 文法1 形式判断 | 10 | 12 | 13 | 13 | 9 |
| 文法2 組み立て | 5 | 5 | 5 | 4 | 4 |
| 文章の文法 | 5 | 5 | 5 | 4 | 4 |
| **文法** | **20** | **22** | **23** | **21** | **17** |
| 短文 | 4 | 5 | 4 | 3 | 2 |
| 中文 | 9 | 9 | 6 | 3 | 2 |
| 長文 | 4 | – | 4 | – | – |
| 統合理解 | 3 | 2 | – | – | – |
| 主張理解 | 4 | 3 | – | – | – |
| 情報検索 | 2 | 2 | 2 | 2 | 1 |
| **読解** | **26** | **21** | **16** | **8** | **5** |
| 課題理解 | 5 | 5 | 6 | 8 | 7 |
| ポイント理解 | 6 | 6 | 6 | 7 | 6 |
| 概要理解 | 5 | 5 | 3 | – | – |
| 発話表現 | – | – | 4 | 5 | 5 |
| 即時応答 | 11 | 12 | 9 | 8 | 6 |
| 統合理解 | 3 | 4 | – | – | – |
| **聴解** | **30** | **32** | **28** | **28** | **24** |
| **TOTAL** | **~101** | **~107** | **~102** | **~85** | **~67** |

## Lo que cambia el plan: la puntuación es escalada

180 puntos, 60 por bloque. Los 21 ítems de 読解 valen lo mismo que los 54 de
語彙+文法: **cada pregunta de lectura pesa ~2,5× más** que una de vocabulario.
Igual 聴解 (32 ítems = 60 pts).

Dentro de cada sección en N2:
- **文字・語彙 (32)**: 漢字読み 16 % · 表記 16 % · 語形成 16 % · 文脈規定 22 % · 言い換え 16 % · 用法 16 %
- **文法 (22)**: 形式判断 55 % · 組み立て 23 % · 文章の文法 23 %
- **読解 (21)**: 短文 24 % · 中文 43 % · 統合 10 % · 主張 14 % · 情報検索 10 %
- **聴解 (32)**: 課題理解 16 % · ポイント理解 19 % · 概要理解 16 % · 即時応答 37 % · 統合 13 %

即時応答 es el tipo más numeroso del examen entero (12 ítems, y son cortos).
中文 es el de 読解 con más peso. 文脈規定 el mayor bloque de vocabulario.

## Cómo se construyen los distractores (lo importante)

**漢字読み** — cruzar dos ejes entre: 清音/濁音 · 長音 sí/no · 促音 sí/no ·
on vs kun · 連濁/母音交替 (ふね→ふな). Para verbos: tres verbos con la misma
conjugación (囲まれた / はさまれた / つつまれた / のぞまれた).

**表記** — al revés: subrayado en hiragana, opciones en kanji. Distractores:
homófonos (講/構/購), radical parecido (待/持/侍), 送り仮名 mal (表わす/表す).

**語形成** (sólo N2) — prefijos 不無非未再最半総各新旧元, sufijos
的性化率費料代観式感風力中上下, o elemento de compuesto (書き〜, 〜込む).
Las cuatro opciones, del mismo tipo.

**文脈規定** — las cuatro comparten **forma** (mismo sufijo, misma categoría,
mismas moras) y sólo el contexto decide. Incluir al menos uno de: antónimo,
palabra que comparte un kanji, falso amigo fonético.

**言い換え類義** — objetivo coloquial o en kanji, respuesta neutra. Distractores
en **escala** (よく/少し/全然 似ている) o antónimo directo.

**用法** — palabra en cabecera y cuatro frases. Los tres errores son de tres
clases: colocación imposible · contradicción interna en la frase
(小さい声でどなる) · sustitución por palabra parecida (こしらえる ≈ こしかける).

**文法1** — distractores de la misma familia (〜わけだ/〜わけがない/〜わけではない)
o misma función con otro matiz.

**文法2** — cuatro fragmentos; sólo una ordenación tiene sentido pero dos son
gramaticalmente tentadoras. Incluir siempre una partícula suelta o una
nominalización.

**文章の文法** — cada hueco prueba algo distinto: conector · referencia
(これ/その/こうした) · modalidad final · aspecto · postura del autor.

**読解** — en textos con metáfora **siempre** hay un distractor literal. Los
otros dos: hecho verdadero pero secundario, y afirmación demasiado amplia o no
dicha.

**聴解 課題理解** — mecanismos: cambio de plan a mitad · eliminación de opciones
una a una · cálculo aritmético simple · distinguir «ahora» de «después» · mapa.

**聴解 ポイント理解** — la pregunta se da ANTES. Varias condiciones parecidas;
sólo una responde exactamente.

**聴解 概要理解** — monólogo de 45–60 s con un giro (ところで / 実は / その後).
Distractores: detalles verdaderos pero secundarios, o la situación **antes** del
giro. Opciones no impresas.

**聴解 即時応答** — una frase y tres respuestas. Distractores: responde a la
forma pero no al sentido, o registro equivocado.

## Esquema de un ítem

```json
{
  "id": "n2-goi-kanji-0001",
  "nivel": "N2",
  "seccion": "moji_goi | bunpou | dokkai | choukai",
  "tipo": "kanji_yomi | hyouki | gokeisei | bunmyaku | iikae | youhou | bunpou1 | bunpou2 | bunshou_bunpou | tanbun | chuubun | tougou | shuchou | jouhou | kadai | point | gaiyou | sokuji | tougou_choukai",
  "instruccion_ja": "＿＿の言葉の読み方として最もよいものを…",
  "enunciado": "彼は毎朝、新聞に目を通してから出勤する。",
  "objetivo": "目を通して",
  "opciones": ["めをとおして", "めをつうして", "めをかよって", "もくをとおして"],
  "respuesta": 0,
  "logica_distractores": ["on-yomi incorrecta", "kun de otro verbo", "on/kun mezclados"],
  "explicacion": { "es": "…", "en": "…" },
  "puntos": ["frase clave → reformulación"],
  "pasaje": null, "guion": null, "audio": null,
  "etiquetas": ["negocios", "verbo compuesto"],
  "dificultad": 3, "revisado": false
}
```

Para 読解: `pasaje` = {texto, notas:[{termino, glosa}], cita?} con varias preguntas.
Para 聴解: `guion` = {intro, turnos:[{quien:"M|F", texto}], pregunta, opciones_habladas}.

## Reglas de calidad (validar antes de guardar)

- Exactamente 4 opciones (3 en 即時応答) y **una** correcta; hay que poder
  justificar por qué falla cada distractor.
- Ninguna opción es subconjunto literal de otra (evita dos respuestas válidas).
- Vocabulario y gramática dentro del nivel (≤10 % del superior en 読解, con 注).
- Longitudes: 短文 180–220 · 中文 450–550 · 主張 850–950 · 情報検索 600–750 ·
  monólogo 概要 150–220 caracteres.
- Segunda pasada a ciegas: resolver el ítem sin ver la respuesta. Si no coincide
  o hay dos válidas, se descarta.
- Deduplicar la palabra objetivo contra las ya generadas.

## Un 模擬試験 N2 completo

5 漢字読み · 5 表記 · 5 語形成 · 7 文脈規定 · 5 言い換え · 5 用法 · 12 文法1 ·
5 文法2 · 1 párrafo 文章の文法 (5 huecos) · 5 短文 · 3 中文 (×3 preg.) ·
1 統合 (2) · 1 主張 (3) · 1 情報検索 (2) · 5 課題理解 · 6 ポイント理解 ·
5 概要理解 · 12 即時応答 · 統合理解 (2 diálogos + 1 doble).

## Audio (聴解)

1. Guion con hablante M/F y marcas de pausa.
2. TTS con dos voces japonesas distintas. Gratis: **VOICEVOX** (API local) o
   **edge-tts** (ja-JP-NanamiNeural F / ja-JP-KeitaNeural M).
3. Montaje: intro → 1 s → diálogo → 1 s → pregunta repetida → (si toca, leer
   las opciones) → 8–10 s de silencio.
4. Velocidad natural (1,0×); 0,9× en modo aprendizaje.
5. Modo dictado: el mismo guion con huecos donde están las frases clave.
