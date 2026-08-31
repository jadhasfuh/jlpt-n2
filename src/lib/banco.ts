import "server-only";
import { supabaseServidor } from "./supabase-servidor";
import { armarReparto, SECCION_DE, type Ajuste, type Item, type TipoItem } from "./examen";
import { usuario } from "./sesion";

/**
 * Lo que ya ha visto esta persona según el servidor, de lo más reciente a lo
 * más antiguo. Sin cuenta devuelve nada: la rotación se queda en el aparato.
 */
async function vistosDeLaNube(): Promise<string[]> {
  const u = await usuario();
  if (!u) return [];
  const sb = supabaseServidor();
  if (!sb) return [];
  const { data } = await sb
    .from("resultados").select("item_id")
    .eq("perfil", u.id).order("creado", { ascending: false }).limit(800);
  return (data ?? []).map((r) => r.item_id as string);
}

function mezclar<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** Una pregunta suelta, o un texto largo con las suyas: se reparten juntas. */
type Bloque = { items: Item[]; visto: number };

/**
 * Arma un mini examen.
 *
 * La rotación es lo que hace que no parezca siempre el mismo examen: `vistos`
 * llega ordenado de lo más reciente a lo más antiguo, y las preguntas que no
 * están en esa lista salen primero. Cuando el banco todavía es pequeño y no
 * hay bastantes nuevas, se repescan las **más antiguas**, nunca las de la
 * sesión anterior.
 */
export async function armarExamen(a: Ajuste, vistos: string[]): Promise<Item[]> {
  const sb = supabaseServidor();
  if (!sb) return [];

  // El aparato sabe lo de esta sesión; el servidor, lo de los demás aparatos.
  // Los del aparato van delante porque son los más frescos de los dos.
  const nube = await vistosDeLaNube();
  vistos = [...new Set([...vistos, ...nube])].slice(0, 800);

  const reparto = armarReparto(a);
  const tipos = Object.keys(reparto) as TipoItem[];
  if (!tipos.length) return [];

  const { data } = await sb
    .from("items").select("*").eq("nivel", a.nivel).in("tipo", tipos);
  const todos = (data ?? []) as Item[];

  // Cuanto más atrás en `vistos`, más antigua: −1 significa que no se ha visto.
  const antiguedad = new Map(vistos.map((id, i) => [id, i]));
  const cuandoSeVio = (it: Item) => antiguedad.get(it.id) ?? -1;

  const salida: Item[] = [];
  for (const tipo of tipos) {
    const cuantas = reparto[tipo] ?? 0;
    if (!cuantas) continue;

    // Agrupar: un texto de 中文 con sus tres preguntas es un solo bloque.
    const porGrupo = new Map<string, Item[]>();
    for (const it of todos.filter((x) => x.tipo === tipo)) {
      const clave = (it as Item & { grupo?: string }).grupo ?? `solo:${it.id}`;
      const lista = porGrupo.get(clave);
      if (lista) lista.push(it); else porGrupo.set(clave, [it]);
    }

    const bloques: Bloque[] = [...porGrupo.values()].map((items) => {
      items.sort((x, y) =>
        ((x as Item & { orden_grupo?: number }).orden_grupo ?? 0) -
        ((y as Item & { orden_grupo?: number }).orden_grupo ?? 0));
      // Un bloque es «nuevo» si ninguna de sus preguntas se ha visto.
      const vistas = items.map(cuandoSeVio).filter((v) => v >= 0);
      return { items, visto: vistas.length ? Math.min(...vistas) : -1 };
    });

    // Primero las que no se han visto (barajadas, para que no salgan siempre
    // en el mismo orden); después las más antiguas.
    const nuevos = mezclar(bloques.filter((b) => b.visto < 0));
    const repesca = bloques.filter((b) => b.visto >= 0).sort((x, y) => y.visto - x.visto);

    let puestas = 0;
    for (const b of [...nuevos, ...repesca]) {
      if (puestas >= cuantas) break;
      salida.push(...b.items);
      puestas += b.items.length;
    }
  }

  // El examen real va por secciones, en este orden.
  const orden = ["moji_goi", "bunpou", "dokkai", "choukai"];
  return salida.sort(
    (x, y) => orden.indexOf(SECCION_DE[x.tipo]) - orden.indexOf(SECCION_DE[y.tipo]));
}
