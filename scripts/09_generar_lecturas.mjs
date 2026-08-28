/**
 * Genera las lecturas de fin de sesión con la API de Claude y las guarda en Supabase.
 * Cada texto usa sólo el vocabulario y la gramática ya vistos hasta esa sesión.
 *
 *   ANTHROPIC_API_KEY=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
 *     node scripts/09_generar_lecturas.mjs [--desde 1] [--hasta 20] [--modelo claude-opus-5]
 *
 * Es reanudable: salta las sesiones que ya tienen lectura guardada.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const DESDE = Number(arg("desde", 1));
const HASTA = Number(arg("hasta", 9999));
const MODELO = arg("modelo", "claude-opus-5");
const A_LA_VEZ = Number(arg("paralelo", 3));
const VENTANA = 10;   // sesiones recientes cuyo vocabulario se lista explícitamente

const leer = (n) => JSON.parse(readFileSync(new URL(`../data/dist/${n}.json`, import.meta.url), "utf8"));
const niveles = leer("niveles");
const vocab = new Map(leer("vocabulario").map((v) => [v.id, v]));
const gram = new Map(leer("gramatica").map((g) => [g.id, g]));

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY,
                        { auth: { persistSession: false } });
const claude = new Anthropic();

const Lectura = z.object({
  titulo: z.string().describe("Título en japonés, breve"),
  cuerpo: z.string().describe("El texto en japonés. Cada palabra con kanji va envuelta en <ruby>漢字<rt>かんじ</rt></ruby>. Sin romaji."),
  traduccion: z.string().describe("Traducción completa al español"),
  preguntas: z.array(z.object({
    p: z.string().describe("Pregunta en japonés"),
    opciones: z.array(z.string()).describe("Tres opciones en japonés"),
    correcta: z.number().describe("Índice (0-2) de la opción correcta"),
  })),
});

const INSTRUCCIONES = `Eres profesor de japonés y escribes textos de lectura graduada para un
estudiante hispanohablante que prepara el JLPT N2.

Reglas, sin excepción:
- El texto va ÍNTEGRAMENTE en japonés: kanji, hiragana y katakana. Nunca romaji.
- Usa sobre todo el vocabulario y la gramática que te doy. Puedes apoyarte en
  vocabulario básico de N5/N4 (partículas, verbos comunes, números), pero no
  metas palabras avanzadas que el estudiante no ha visto.
- Cada palabra que lleve kanji va con furigana: <ruby>漢字<rt>かんじ</rt></ruby>.
  El <rt> lleva SÓLO la lectura en kana de esos kanji.
- De 4 a 6 frases, entre 90 y 160 caracteres japoneses. Una escena concreta y
  cotidiana, no una lista de ejemplos.
- Incluye de forma natural los puntos de gramática que te indico.
- La traducción al español debe ser natural, no literal.
- Tres preguntas de comprensión en japonés, cada una con tres opciones.`;

const compacta = (v) => `${v.escritura}（${v.lectura}）${v.es || v.en}`;

async function generar(nivel) {
  const idx = niveles.findIndex((n) => n.id === nivel.id);
  const recientes = niveles.slice(Math.max(0, idx - VENTANA + 1), idx + 1);
  const palabras = recientes.flatMap((n) => n.palabras).map((i) => vocab.get(i)).filter(Boolean);
  const gramVistas = niveles.slice(0, idx + 1).flatMap((n) => n.gramatica).map((i) => gram.get(i)).filter(Boolean);
  const gramNueva = nivel.gramatica.map((i) => gram.get(i)).filter(Boolean);

  const contenido = [
    `Tema de la sesión: ${nivel.titulo_ja} (${nivel.titulo_es}). Sesión ${nivel.numero}.`,
    ``,
    `VOCABULARIO DISPONIBLE (últimas ${recientes.length} sesiones):`,
    palabras.map(compacta).join("\n"),
    ``,
    `GRAMÁTICA YA VISTA (${gramVistas.length} puntos):`,
    gramVistas.map((g) => `${g.forma} = ${g.es}`).join("\n"),
    ``,
    gramNueva.length
      ? `USA OBLIGATORIAMENTE en el texto: ${gramNueva.map((g) => g.forma).join(", ")}`
      : `No hay gramática nueva en esta sesión: repasa la de sesiones anteriores.`,
  ].join("\n");

  const r = await claude.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    system: [{ type: "text", text: INSTRUCCIONES, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: contenido }],
    output_config: { format: zodOutputFormat(Lectura), effort: "medium" },
  });

  if (!r.parsed_output) throw new Error("la respuesta no se pudo interpretar");
  return { ...r.parsed_output, uso: r.usage };
}

const objetivo = niveles.filter((n) => n.numero >= DESDE && n.numero <= HASTA);
const { data: yaHechas } = await sb.from("lecturas").select("nivel_id");
const hechas = new Set((yaHechas ?? []).map((r) => r.nivel_id));
const pendientes = objetivo.filter((n) => !hechas.has(n.id));

console.log(`sesiones objetivo: ${objetivo.length} | ya generadas: ${objetivo.length - pendientes.length} | por generar: ${pendientes.length}`);
console.log(`modelo: ${MODELO}`);

let entrada = 0, salida = 0, errores = 0;

for (let i = 0; i < pendientes.length; i += A_LA_VEZ) {
  const tanda = pendientes.slice(i, i + A_LA_VEZ);
  await Promise.all(tanda.map(async (nivel) => {
    try {
      const l = await generar(nivel);
      entrada += l.uso.input_tokens ?? 0;
      salida += l.uso.output_tokens ?? 0;
      const { error } = await sb.from("lecturas").upsert({
        nivel_id: nivel.id, titulo: l.titulo, cuerpo: l.cuerpo,
        traduccion: l.traduccion, preguntas: l.preguntas, modelo: MODELO,
      });
      if (error) throw new Error(error.message);
      console.log(`  ✓ ${nivel.id} (sesión ${nivel.numero}) — ${l.titulo}`);
    } catch (e) {
      errores++;
      console.error(`  ✗ ${nivel.id}: ${e.message}`);
    }
  }));
}

const costo = (entrada / 1e6) * 5 + (salida / 1e6) * 25;   // tarifa de Claude Opus 5
console.log(`\nhechas: ${pendientes.length - errores} | fallidas: ${errores}`);
console.log(`tokens: ${entrada} entrada / ${salida} salida  ≈ $${costo.toFixed(2)} USD`);
