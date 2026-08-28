# jlptest — japonés del N5 al N1

Web (y pronto app) para preparar el JLPT. El contenido se navega
**nivel → sección → unidad**: eliges N5…N1, dentro de cada nivel hay 14
secciones temáticas, y cada sección se parte en unidades de ~20 palabras
(家族 ①, 家族 ②…) con las fáciles primero.

En cada unidad: la lista de vocabulario, un interruptor con la gramática que
aparece ahí, la lectura, y dos botones flotantes — **Practicar** y **Test**.
La gramática también se puede consultar acumulada por sección y completa por
nivel.

En el contenido japonés nunca aparece romaji. Dos botones rápidos en cada
pantalla: **ふりがな** y **意味**. Y al seleccionar cualquier trozo de japonés
se abre el diccionario interno.

Diseño **mobile-first** con barra de navegación inferior, pensado para que la
app de React Native reutilice los mismos tokens y el mismo módulo de acceso.

---

## Cómo está armado el contenido

| Cifra | |
|---|---|
| 7 614 | palabras, de N5 a N1 |
| 197 | puntos de gramática (todos N2), repartidos entre las unidades de ese nivel |
| 602 | unidades de ~20 palabras |
| 14 | secciones temáticas · 101 subgrupos |

| Nivel | Palabras | Unidades |
|---|---|---|
| N5 | 859 | 100 |
| N4 | 655 | 95 |
| N3 | 1 785 | 127 |
| N2 | 1 652 | 123 |
| N1 | 2 663 | 157 |

**Dos fuentes.** La base es la lista del N2 de jlptstudy.net (4 959 entradas, la
spec de 2004). Como esa lista no distingue N3 ni trae N1, los niveles reales se
cruzan con las listas de los cinco niveles de
`jamsinclair/open-anki-jlpt-decks`, de donde además se importan las 2 655
palabras de N1 que faltaban.

**Secciones y subgrupos.** Clasificación por reglas sobre la definición inglesa,
el kanji y la categoría gramatical (`scripts/reglas.py`). El 90 % cae en un tema
concreto; el resto queda en 「その他」.

**Dentro de cada sección**, las palabras se ordenan de menos a más kanji y de más
corta a más larga, y se cortan en unidades de 20.

**Significados** en inglés (de la fuente) y en español. Las etiquetas de registro
—cortés, coloquial, jerga…— van aparte del significado. La traducción al español
es automática en esta primera versión.

**Gamificación**: XP por palabra nueva y por repaso, racha de días, estados por
palabra (nueva / aprendiendo / dominada), medallas por nota de test y anillos de
progreso por nivel y sección.

**Acceso sin cuenta** (`src/lib/acceso.ts`): la sección 人と体 de cada nivel es
libre; el resto pedirá cuenta cuando exista el login. Mientras tanto
`NEXT_PUBLIC_ACCESO_ABIERTO` deja todo abierto. La app de React Native importará
ese mismo módulo.

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

Mientras tanto hay 10 lecturas escritas a mano
(`data/fuente/lecturas/`) para que el paso funcione desde el primer día.

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
data/fuente/     gramatica.tsv (las 197, a mano), lecturas/, correcciones.tsv
data/raw/        HTML original de las listas (gitignored, se vuelve a bajar)
data/build/      pasos intermedios y cachés (gitignored)
data/dist/       el contenido final que consume la app
scripts/         01→07 pipeline de datos; 08 seed; 09 lecturas; 10 seed.sql
src/lib/         contenido, tipos, progreso, cliente de Supabase
src/components/  VistaUnidad, Practica, Test, Jp/furigana, Diccionario, Perfil
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
