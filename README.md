# 日本語 N2 — curso por niveles

Web para preparar el JLPT N2: **250 sesiones de 20 palabras nuevas**, agrupadas
por tema, con los **197 puntos de gramática** repartidos de la forma más simple
a la más compleja, y una lectura al final de cada sesión que sólo usa lo ya visto.

En el contenido japonés nunca aparece romaji. En cada paso hay dos botones
rápidos: **ふりがな** (lectura en kana) y **意味** (significado). Además, al
seleccionar cualquier trozo de japonés en la página se abre el diccionario
interno con la lectura y el significado.

---

## Cómo está armado el contenido

| Cifra | |
|---|---|
| 4 961 | palabras (lista N2 de 2004, la misma de jlptstudy.net) |
| 197 | puntos de gramática, con significado en español |
| 250 | sesiones de 20 palabras |
| 14 | secciones temáticas, 99 subgrupos |

**Secciones y subgrupos.** El vocabulario se clasificó con un motor de reglas
sobre la definición inglesa, el kanji y la categoría gramatical
(`scripts/reglas.py`). El 93,5 % cae en un tema concreto; el resto queda en
「その他」, que es una sección legítima y no un cajón de sastre roto.

**Orden dentro de cada sesión.** Cada palabra lleva su nivel real (N5 / N4 / N2),
sacado de cruzar la lista con las de N5 y N4 de la misma fuente. Dentro de un
subgrupo las fáciles van primero, así cada sesión arranca con terreno conocido.

**Gramática.** Cada punto tiene una dificultad (1 a 4) y una categoría
(conectores, tiempo, contraste, causa…). Se ordena por ahí y se reparte
uniformemente entre las 250 sesiones: 197 sesiones estrenan un punto y 53 son
de repaso.

**Significados.** Vienen en inglés (de la fuente) y en español. Las etiquetas de
registro —cortés, coloquial, jerga…— se separan del significado y se muestran
aparte. La traducción al español de esta primera versión es automática; el paso
para rehacerla con Claude ya está escrito (ver más abajo).

---

## Correr en local

```bash
npm install
npm run dev            # http://localhost:3000
```

Arranca sin base de datos: el contenido viaja en `data/dist/*.json` y el
progreso se guarda en el navegador.

### Regenerar el contenido

```bash
npm run datos
```

Encadena, en este orden: parseo de la lista → relleno de las definiciones que
faltaban (Jisho) → clasificación temática → etiquetado N5/N4/N2 → armado de las
sesiones → traducción al español → exportación a `data/dist/`.
Cada paso cachea lo suyo, así que repetirlo es barato.

---

## Base de datos (Supabase)

1. Supabase → **New project**. Anota el *project ref* y la contraseña.
2. En el editor SQL, pega y corre `supabase/migrations/20260828120000_esquema_inicial.sql`.
3. Pon las variables en `.env.local` (y en Railway):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # va al navegador
   SUPABASE_SECRET_KEY=sb_secret_...                         # SOLO servidor
   ```

   Son las llaves de formato nuevo; los nombres viejos
   (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) también se aceptan.
4. Carga el contenido:

   ```bash
   npm run seed
   ```

`seed` es idempotente: se puede volver a correr cada vez que cambie
`data/dist/`. La llave secreta se salta RLS, así que **nunca** va en una
variable `NEXT_PUBLIC_`.

---

## Lecturas

Se generan por lotes con la API de Claude y quedan guardadas en la tabla
`lecturas`. Cada texto recibe el vocabulario de las últimas 10 sesiones y toda
la gramática vista hasta ahí, y debe devolver el japonés con `<ruby>` para el
furigana, la traducción al español y tres preguntas de comprensión.

```bash
export ANTHROPIC_API_KEY=...
npm run lecturas -- --desde 1 --hasta 20        # una tanda de prueba
npm run lecturas                                 # las que falten
```

Es reanudable (salta las que ya existen) e imprime el gasto al terminar.
Referencia: unas 250 lecturas con `claude-opus-5` rondan los 10–15 USD; con
`--modelo claude-sonnet-5` baja a la tercera parte.

Mientras tanto, las sesiones 1 a 3 traen lecturas escritas a mano
(`data/fuente/lecturas.json`) para que el paso funcione desde el primer día.

---

## Desplegar en Railway

Mismo patrón que Mercadito:

1. Railway → **New Project → Deploy from GitHub repo**. Detecta el `Dockerfile`.
2. Variables de entorno en el dashboard (las cuatro de arriba).
3. A partir de ahí, **cada push a `main` es un deploy**.
4. Dominio: Settings → Domains → Custom Domain, y en el registrador un
   ALIAS/ANAME en la raíz (o CNAME en un subdominio).

`next.config.ts` usa `output: "standalone"` y el `Dockerfile` fija
`HOSTNAME=0.0.0.0`: sin eso el contenedor escucha en localhost y Railway da la
app por caída.

---

## Mapa del repo

```
data/fuente/     gramatica.tsv (las 197, escritas a mano) y lecturas de muestra
data/raw/        HTML original de las listas (gitignored, se vuelve a bajar)
data/build/      pasos intermedios y cachés (gitignored)
data/dist/       el contenido final que consume la app
scripts/         01→07, el pipeline de datos; 08 seed; 09 lecturas
src/lib/         contenido, tipos, progreso, cliente de Supabase
src/components/  Sesión (los pasos), Jp/furigana, Diccionario, Repaso, Ajustes
supabase/        config.toml y migrations/ (el esquema)
```

### Integración de GitHub / branching

No hace falta y **cuesta dinero**: cada rama de preview levanta su propia
instancia de cómputo, cobrada por hora y **fuera del tope de gasto** de la
organización. El esquema de este proyecto se corre una vez y la carga es un
script, así que el flujo de migraciones por pull request no aporta nada todavía.

Si algún día se activa, el repo ya está en el formato que espera: `supabase/`
con `config.toml` y `migrations/`. En ese caso: *Working directory* vacío (el
directorio `supabase/` está en la raíz), *Production branch* `main`,
**Automatic branching apagado** y *Supabase changes only* encendido.

## Lo que falta

- Audio propio. Hoy el botón 🔊 usa la voz japonesa del navegador, que en macOS
  e iOS suena bien y en otros sistemas puede no existir.
- Autenticación. El progreso se guarda con un id local del navegador y se
  espeja en `progreso`; falta atarlo a una cuenta real.
- Repasar la traducción automática al español con Claude, y afinar a mano los
  subgrupos que quedaron en 「その他」.
