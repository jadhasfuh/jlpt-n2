# Handoff: JLPTest — rediseño visual (marca, Inicio, Unidad, Práctica, Test, Repaso, Escucha)

## Overview
Rediseño visual de la app JLPTest (Next.js, App Router, componentes en español:
`Cabecera`, `Inicio`, `VistaUnidad`, `Practica`, `Test`, `Repaso`, `Escucha`, `Perfil`,
`BarraInferior`, `Anillo`, `Jp`, `Ajustes`).

Objetivos del rediseño:
1. **Marca**: lockup `jlptest` + disco rojo (el "sol" como punto final), app icon `jt·`, favicon.
2. **Quitar los emoji** (⛩ 🔁 🎌 🎧 🔥 ⏱ ✕) y sustituirlos por **iconos Phosphor** (SVG stroke) y por **kanji como marca** (語彙 / 漢字 / 文法 / 読解 / ふりがな / 意味 / 聴解).
3. Sistema visual **Nocturne**: fondo oscuro azul-grisáceo, acento blurple usado como línea y resplandor (nunca como relleno grande), botones **con borde, sin fondo sólido**, reglas finas, tipografía Inter peso 500 máximo en títulos.
4. Que Inicio deje de leerse como una lista plana y que Práctica/Test/Escucha se lean como "escenas".

## About the Design Files
`JLPTest.dc.html` es una **referencia de diseño en HTML**, no código de producción.
No lo copies dentro de la app: **recrea** estas pantallas en el codebase real
(Next.js + React + CSS con las clases españolas ya existentes: `.tarjeta`, `.fila`, `.btn`,
`.anillo`, `.barra-inferior`, `.tenue`, `.silencio`, `.jp`, `.pastilla`, `.punto`…).

Para verlo: abre el archivo en un navegador. Es un lienzo con dos "turnos" de opciones;
cada opción tiene un id visible (`1a`, `1b`, `2a`…).

**Decisión tomada por el cliente: la marca es `1b`, desarrollada en `2a`.**
Las demás opciones de logo (`1a`, `1c`, `1d`) se conservan solo como registro — no implementar.

## Fidelity
**Alta fidelidad.** Colores, tipografía, tamaños y espaciados son definitivos.
Los datos (números de XP, palabras, unidades, ejemplos de vocabulario) son de relleno:
usa los reales de `lib/contenido` y `lib/progreso`.

---

## Marca (`1b` / `2a`) — implementar en `Cabecera.tsx` y en los iconos de la app

Lockup: la palabra `jlptest` en **Inter 600, letter-spacing −0.04em**, con
`jlp` en `--color-text` y `test` en `--color-neutral-400`, seguida de un **disco rojo**.

Construcción del disco:
- diámetro = altura de x ÷ 2 (a 19px de tipo → 7px; a 46px → 17px)
- se apoya en la **línea base**, `margin-bottom` ≈ diámetro × 0.45
- separación respecto a la última letra = ~0.3 × diámetro (5px a 19px de tipo)
- **nunca** se agranda, se recolorea ni se mueve: es puntuación, no un icono

Rojo de marca: `--rojo: #d7263d` (el usuario eligió este valor; alternativas válidas
`#e2445c` sobre fondo oscuro, `#bc002d` sobre fondo claro).

App icon / favicon: cuadrado `--color-neutral-900` (#292b31), radio 13px @56px
(9px @36, 5px @18), letras `jt` en Inter 600 −0.05em, color `--color-neutral-200`,
y el disco rojo arriba a la derecha (9px @56, 6px @36, 4px @18).
Versión clara: fondo `--color-neutral-100`, texto `--color-neutral-900`, rojo `#bc002d`.
Versión a una tinta: fondo rojo, texto y disco en blanco.

Markup React sugerido para el lockup (sustituye `<Link className="marca">jlp<span>test</span></Link>`):

```tsx
export function Marca({ tam = 19 }: { tam?: number }) {
  const d = Math.round(tam * 0.37);           // diámetro del disco
  return (
    <Link href="/" className="marca" style={{ fontSize: tam }}>
      jlp<span>test</span>
      <i className="marca-punto" style={{ width: d, height: d, marginBottom: d * 0.45 }} />
    </Link>
  );
}
```

```css
.marca{display:inline-flex;align-items:flex-end;gap:.26em;font-weight:600;letter-spacing:-.04em;text-decoration:none;color:var(--texto)}
.marca span{color:var(--texto-tenue)}
.marca-punto{display:block;border-radius:50%;background:var(--rojo)}
```

---

## Screens / Views

### 1. Inicio (`1e` oscuro / `1f` claro) — `Inicio.tsx` + `page.tsx`
**Propósito**: elegir por dónde seguir; ver de un vistazo racha y pendientes.

Layout (móvil 390px, padding lateral 22px), de arriba abajo:
1. **Cabecera**: marca a la izquierda; a la derecha dos botones-icono de 32×32 (radio 8px,
   borde `--color-divider`): tema (Phosphor `moon` / `sun`) y buscar (`magnifying-glass`).
2. **Hero**: `padding: 6px 0 12px`. Título `日本語能力試験` en Noto Sans JP, **26px, peso 500,
   line-height 1.25**. Subtítulo 13px/1.5 en `--color-neutral-400`, `max-width: 33ch`.
3. **Tira de estadísticas**: un solo bloque con `border: 1px solid var(--color-divider)`,
   radio 12px, **cuatro celdas de igual ancho separadas por reglas verticales de 1px**
   (`--color-divider`). Cada celda: cifra Inter 600 19px `font-variant-numeric: tabular-nums`,
   y debajo etiqueta 9.5px peso 500, `letter-spacing:.09em`, mayúsculas, `--color-neutral-500`.
   Celdas: XP · DÍAS (cifra en rojo + icono Phosphor `fire` 14px, **sustituye al emoji 🔥**) ·
   DOMINADAS · UNIDADES. `margin-bottom: 10px`.
4. **Fila "Te toca repasar"** (solo si `pend.vencidas > 0`): `padding: 11px 14px`, radio 12px,
   `border: 1px solid var(--color-accent)`, fondo `color-mix(in srgb, var(--color-accent) 10%, transparent)`.
   A la izquierda un `Anillo` de 40px al 100% con el número de vencidas dentro (11px de grosor
   de aro: disco interior de 31px del color del fondo). Título 14.5px peso 500;
   subtítulo 12px `--color-neutral-400`. Chevron Phosphor `caret-right` 15px en color acento
   (**sustituye a `<span className="flecha">›</span>`**).
5. **Fila "Cinco minutos"**: igual pero borde `--color-divider`, aro sustituido por un círculo
   de 40px con borde `--color-neutral-700` y dentro el icono Phosphor `timer` 19px
   (**sustituye al emoji ⏱**). `margin-bottom: 12px`.
6. **Encabezado de sección "NIVELES"**: 9.5px peso 500 `letter-spacing:.12em` mayúsculas
   `--color-neutral-500`, seguido de una regla de 1px que ocupa el resto del ancho.
   `margin-bottom: 7px`.
7. **Lista de niveles** (`gap: 5px`), una fila por nivel N5→N1:
   `padding: 9px 14px`, radio 12px, borde `--color-divider`, `position:relative; overflow:hidden`.
   - **Numeral kanji fantasma**: 五 四 三 二 一 en `position:absolute; right:34px; bottom:-12px;
     font-size:52px; line-height:1`, color `rgba(233,233,237,.05)` (tema claro `rgba(41,43,49,.07)`).
     Es el recurso que da ritmo a la lista — no lo omitas.
   - **Anillo** 38px con `conic-gradient(<tono> 0 <pct>%, rgba(233,233,237,.13) <pct>% 100%)`
     y disco interior de 29px del color de fondo, con el texto `N5`… en Inter 600 11.5px.
   - Tonos por nivel (rampa del acento, terminando en el rojo de marca):
     N5 `#b5abfc` · N4 `#968ae0` · N3 `#796cbf` · N2 `#a7566f` · N1 `var(--rojo)`.
     (Tema claro: `#796cbf`, `#5d5294`, `#423a6a`, `#8a3c52`, `#bc002d`.)
   - Texto: nombre 14px peso 500 (`DESC_NIVEL`), subtítulo 11.5px `--color-neutral-500`
     **en una sola línea** — usa `800 palabras · 8 secciones` (sin el recuento de gramática:
     con él envuelve a dos líneas y la lista no cabe en pantalla).
   - Chevron `caret-right` 14px `--color-neutral-600`.
8. **BarraInferior**: `border-top: 1px solid var(--color-divider)`, fondo
   `color-mix(in srgb, var(--color-surface) 60%, transparent)`, `padding: 8px 12px 18px`.
   Tres destinos con icono Phosphor 22px + etiqueta 10px peso 500:
   Curso `cards`/`rectangle-stack`, Repaso `arrows-clockwise`, Perfil `user`.
   Activo en `--color-accent`, inactivo en `--color-neutral-500`.
   **Badge** en Repaso: pastilla roja, alto 16px, radio 8px, texto 9.5px peso 600 blanco,
   con el número de vencidas.

**Tema claro** (`1f`): mismo markup, solo cambian los tokens en el contenedor raíz —
`--color-bg:#f6f7fd; --color-surface:#e9ecf8; --color-text:#232532;
--color-divider:rgba(41,43,49,.15); --color-accent:#5d5294;` y el rojo pasa a `#bc002d`.
Las tarjetas y filas llevan fondo `--color-surface` (en oscuro van sin fondo).

### 2. Unidad (`1g`) — `VistaUnidad.tsx`
- Cabecera: enlace atrás con icono `caret-left` 16px + `unidad.ja` de la sección;
  a la derecha los botones rápidos `ふりがな` y `意味` (12px, `btn-secondary`).
- Título: `tag` con el nivel (N4), luego `unidad.ja` en Noto Sans JP 27px peso 500,
  y `unidad.es` 13px `--color-neutral-400` con "· unidad 3 de 12".
- **Barra de progreso de la unidad**: 4px de alto, radio 2px, fondo `rgba(233,233,237,.12)`,
  relleno en `--color-accent`; a su derecha, en 11px `--color-neutral-500`,
  `practicada · mejor test 82%`.
- **Pestañas**: botones 13px con el kanji + el contador en 11px al 60-75% de opacidad:
  `語彙 20` · `漢字 9` · `文法 4` · `読解`. La activa lleva borde y texto acento y fondo
  `color-mix(in srgb, var(--color-accent) 12%, transparent)`.
- **Lista de vocabulario** (sustituye a la `<table className="tabla-vocab">`): contenedor con
  borde y radio 12px; filas de `padding: 12px 14px` separadas por 1px `--color-divider`:
  punto de estado (6px) · `<ruby>` de 112px de ancho con la lectura como `<rt>`
  (`font-size:.5em; opacity:.62`) · significado 13.5px + inglés 11px `--color-neutral-500`
  (o botón fantasma "ver significado") · botón de voz con Phosphor `speaker-high` 17px.
- **Leyenda** bajo la lista, 10.5px: dominada (acento) · en curso (`--color-accent-700`) ·
  nueva (`rgba(233,233,237,.2)`) · vencida (rojo).
- **Barra flotante inferior**: `Practicar` (btn-primary, flex 1), `Test` (secundario, flex 1),
  y un botón cuadrado de 46px con Phosphor `headphones` (**sustituye al emoji 🎧**).
  Fondo `linear-gradient(to top, var(--color-bg) 62%, transparent)` + borde superior.

### 3. Práctica (`1h`) — `Practica.tsx`
- Barra superior: botón `x` 32×32; **progreso segmentado** (una barrita de 3px por tarjeta,
  `gap:3px`): acertadas en `--color-accent`, falladas en rojo, pendientes en
  `rgba(233,233,237,.16)`; botón `ふりがな`; contador `7/20`.
- Centro: halo `radial-gradient` de 280px en acento al 16% detrás de la palabra;
  `tag-accent` con `語彙 · N4`; la palabra en `<ruby>` **64px peso 500** con la lectura
  a `.28em`; botón redondo de 42px con `speaker-high`; significado 19px + inglés 13px;
  y una **frase de ejemplo** en caja con borde de 1px y radio 10px, con la palabra
  resaltada en `--color-accent-300` y la traducción debajo en 11.5px.
- Acciones: `No la sabía` (secundario, icono `x`) y `La sabía` (primario, icono `check`),
  ambos `flex:1`, `padding:13px`. Debajo, nota de 10.5px: "Las que falles vuelven antes de
  cerrar la sesión" (explica la segunda vuelta que ya implementa el componente).

### 4. Test (`2b`) — `Test.tsx`
- Barra superior: `x`, barra de progreso continua de 3px, contador `9/20`, y aciertos
  (`check` + número) en `--color-accent-300`.
- Pregunta: rótulo "¿QUÉ SIGNIFICA?" 9.5px mayúsculas; palabra en `<ruby>` 52px centrada.
- **Cuatro opciones** en columna (`gap:8px`), botones alineados a la izquierda,
  `padding:14px 15px`, texto 14px peso 400, con una **casilla de 20px** a la izquierda:
  - sin responder: casilla con borde `--color-neutral-700` y la letra A/B/C/D
  - correcta: borde y casilla en acento, casilla con `check`, etiqueta "correcta"
  - tu fallo: borde y casilla en rojo, casilla con `x`, etiqueta "tu respuesta"
- **Explicación en el sitio** (no en una pantalla aparte): bloque con
  `border-left: 2px solid var(--color-accent)` y `padding-left: 13px` con la frase de ejemplo,
  su traducción, y cuándo vuelve la palabra ("Vuelve dentro de 10 minutos").
- Botón `Siguiente` a ancho completo con `caret-right`.

### 5. Repaso (`2c`) — `Repaso.tsx`
- Título `Repaso` 24px + línea "Hoy te tocan 34 de las 118 que llevas vivas."
- **Tarjeta de la cola**: borde acento, radio 14px, fondo acento al 8%, halo radial en la
  esquina superior derecha. Dentro: anillo de 74px con
  `conic-gradient(var(--rojo) 0 41%, var(--color-accent) 41% 100%)` — la porción roja son las
  vencidas — con el total dentro; a la derecha "Tu cola de hoy" y dos líneas con punto de
  color (14 vencidas / 20 tocan hoy). Botón primario a ancho completo: "Empezar · 34 tarjetas".
- **Previsión a 7 días**: barras de 5px de radio, alto proporcional, `gap:6px`; hoy en
  `--color-accent`, los tres días siguientes en `--color-accent-700`, el resto en
  `--color-accent-800`; etiquetas de día en 10px `--color-neutral-500`.
  Sale de las fechas de vencimiento que ya guarda `lib/progreso`, recortadas por `topeDiario`.
- **"Lo más flojo"**: tres filas con `<ruby>` (96px), significado y número de fallos
  (en rojo si ≥3).

### 6. Escucha (`2d`) — `Escucha.tsx`
- Barra superior con `x`, progreso, `5/20` y `tag-neutral` con `聴解`.
- Centro: botón de reproducción de **112px** (círculo, borde acento, fondo acento al 12%,
  triángulo `play` relleno de 38px), halo radial de 300px detrás.
- **Onda**: 15 barras de 3px de ancho, alturas 10–40px, radio 2px, degradadas del acento
  a `--color-accent-900` de izquierda a derecha (indica cuánto queda de audio).
- Controles: `Otra vez` (icono `arrow-counter-clockwise`) y `0,75×`.
- Tres opciones de respuesta **solo con el kanji + significado**; nada de texto que delate
  la lectura hasta responder. Al pie, botón fantasma "No la reconozco · verla escrita".

---

## Interactions & Behavior
- Todos los estados interactivos vienen del sistema: `:hover` = tinte del acento al 7–12%,
  `:active` = 14–22%, `:focus-visible` = `outline: 2px solid var(--color-accent);
  outline-offset: 2px`. **Nunca dejar el foco azul del navegador.**
- Transiciones: 140ms `ease-out` en color/fondo/borde; 200ms en la barra de progreso.
  El halo de Práctica/Escucha no anima.
- Práctica: pulsar "Ver significado" revela reverso + frase; la lógica de segunda vuelta
  ya existe y no cambia.
- Test: al responder, la opción correcta y la elegida se marcan a la vez y aparece la
  explicación; el botón pasa a `Siguiente`.
- Escucha: al entrar, reproducir automáticamente una vez; `Otra vez` reproduce; `0,75×`
  alterna 1× / 0,75×.
- Responsive: a partir de 900px, escritorio (`1i`): barra lateral de 214px con la marca,
  navegación (Curso, Repaso con badge, Diccionario, Perfil), estadísticas apiladas y botón
  de tema abajo; contenido a `padding: 30px 34px` con los niveles en **grid de 2 columnas**,
  tarjetas de `padding:16px`, anillo de 46px y numeral kanji fantasma de 72px.

## State Management
Sin cambios sobre lo que ya existe: `leerProgreso()`, `resumen()`, `contarPendientes()`,
`estadoItem()`, el evento `window "progreso"`, y `useAjustes()` (furigana, significado,
colores, tema). El rediseño solo añade dos datos derivados:
- **previsión a 7 días** para `2c`: agrupar los vencimientos futuros por día (7 cubos).
- **estado por palabra** ya disponible en `estadoItem` → mapea a los 4 colores de la leyenda.

## Design Tokens
Del sistema Nocturne (`nocturne-tokens.css`, adjunto). Los que usa este diseño:

| Token | Valor |
| --- | --- |
| `--color-bg` | `#161826` (claro: `#f6f7fd`) |
| `--color-surface` | `#232532` (claro: `#e9ecf8`) |
| `--color-text` | `#e9e9ed` (claro: `#232532`) |
| `--color-divider` | `color-mix(in srgb,#e9e9ed 16%,transparent)` |
| `--color-accent` | `#9184d9` (claro: `#5d5294`) |
| rampa acento | 100 `#f5f4ff` · 200 `#e7e5fe` · 300 `#d2cefd` · 400 `#b5abfc` · 500 `#968ae0` · 600 `#796cbf` · 700 `#5d5294` · 800 `#423a6a` · 900 `#2b2741` |
| rampa neutra | 100 `#f3f5fe` · 200 `#e4e7f5` · 300 `#cfd3e5` · 400 `#b2b6ca` · 500 `#9397ab` · 600 `#75798c` · 700 `#595d6c` · 800 `#3f424d` · 900 `#292b31` |
| `--rojo` (marca, nuevo) | `#d7263d` — oscuro `#e2445c`, claro `#bc002d` |
| Espaciado | 2.8 / 5.6 / 8.4 / 11.2 / 16.8 / 22.4 px |
| Radios | sm 4 · md 8 · lg 14 px (móvil usa 11–14 en filas y tarjetas) |
| Sombras | `--shadow-sm/md/lg` (en oscuro: borde de 1px + oscuridad ambiental) |
| Tipografía | Inter 400/500/600 — títulos **nunca por encima de 500** |
| Tipografía JP | Noto Sans JP 400/500 (`.jp`); Noto Serif JP solo si se usa el sello 試 |

Escala de texto usada: 9.5 (etiquetas mayúsculas) · 10.5–12 (secundario) · 13–14.5 (cuerpo)
· 19–27 (títulos) · 52–64 (la palabra en Práctica/Test).

## Assets
- **Iconos**: [Phosphor](https://phosphoricons.com), estilo *regular*, `stroke-width` 16–20
  sobre `viewBox 0 0 256 256`, `currentColor`. Instala `@phosphor-icons/react` y sustituye
  cada emoji: ⛩→`Cards`, 🔁→`ArrowsClockwise`, 🎌→`User`, 🎧→`Headphones`, 🔥→`Fire`,
  ⏱→`Timer`, ✕→`X`, ›→`CaretRight`, ☀️/🌙→`Sun`/`Moon`, 🔊→`SpeakerHigh`.
  Los SVG del HTML son aproximaciones dibujadas a mano: **usa los oficiales de Phosphor**.
- **Fuentes**: Inter (400/500/600) y Noto Sans JP (400/500/700) desde Google Fonts.
- No hay imágenes en el diseño.

## Files
- `JLPTest.dc.html` — el lienzo completo con las dos rondas de opciones (`1a`–`1i`, `2a`–`2d`).
- `nocturne-tokens.css` — la hoja de tokens y clases del sistema Nocturne, tal cual.
  Puedes copiar el bloque `:root` a tu `globals.css` y mapearlo a tus variables actuales
  (`--acento`, `--verde`, `--texto`…) en lugar de duplicar nombres.
