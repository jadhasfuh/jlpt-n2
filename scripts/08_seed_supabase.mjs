/**
 * Carga el contenido (secciones, vocabulario, gramática, niveles) en Supabase.
 * Es idempotente: se puede volver a correr después de regenerar los datos.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/08_seed_supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const leer = (n) => JSON.parse(readFileSync(new URL(`../data/dist/${n}.json`, import.meta.url), "utf8"));

async function cargar(tabla, filas, tamano = 500) {
  for (let i = 0; i < filas.length; i += tamano) {
    const { error } = await sb.from(tabla).upsert(filas.slice(i, i + tamano));
    if (error) throw new Error(`${tabla}: ${error.message}`);
    process.stdout.write(`\r  ${tabla}: ${Math.min(i + tamano, filas.length)}/${filas.length}`);
  }
  console.log();
}

const secciones = leer("secciones");
const vocabulario = leer("vocabulario");
const gramatica = leer("gramatica");
const niveles = leer("niveles");

// El orden importa: vocabulario y niveles apuntan a secciones.
await cargar("secciones", secciones.map((s, i) => ({
  id: s.id, ja: s.ja, es: s.es, orden: i + 1, subgrupos: s.subgrupos,
})));

await cargar("vocabulario", vocabulario);

await cargar("gramatica", gramatica.map((g, i) => ({ ...g, orden: i + 1 })));

await cargar("niveles", niveles.map((n) => ({
  id: n.id, numero: n.numero, seccion: n.seccion,
  titulo_ja: n.titulo_ja, titulo_es: n.titulo_es,
  palabras: n.palabras, gramatica: n.gramatica,
})));

// Las lecturas escritas a mano; las generadas las sube scripts/09.
const lecturas = leer("lecturas");
if (lecturas.length) await cargar("lecturas", lecturas);

console.log("\nListo.");
