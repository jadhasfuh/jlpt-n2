import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase-servidor";
import { corregir, esAbierto } from "@/lib/test-libre";

type Cuerpo = { nivel?: string; nombre?: string; respuestas?: Record<string, number> };

/**
 * Limpia el nombre que se verá en público.
 *
 * Se quitan los caracteres de control y los saltos de línea, que sirven para
 * romper la maquetación de la tabla, y se recorta a veinte. No es un filtro de
 * contenido: eso no se puede resolver con una expresión regular, y lo honesto
 * es decir en pantalla que el nombre se publica y poder borrar filas a mano.
 */
function limpiarNombre(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const n = v.replace(/[\p{C}\p{Zl}\p{Zp}]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 20);
  return n.length ? n : null;
}

/**
 * Guarda una nota del test abierto en el marcador.
 *
 * La nota **no viaja desde el navegador**: llegan las respuestas y el servidor
 * vuelve a corregirlas contra la base. Aceptar el número que mande el cliente
 * sería dejar que cualquiera presidiera la tabla con un cien por cien
 * inventado, que es exactamente lo que hace inútil un marcador.
 *
 * No se guarda nada que identifique a nadie: ni correo, ni IP, ni perfil.
 */
export async function POST(req: Request) {
  let c: Cuerpo;
  try {
    c = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo ilegible" }, { status: 400 });
  }

  const nivel = typeof c.nivel === "string" ? c.nivel.toUpperCase() : "";
  const nombre = limpiarNombre(c.nombre);
  if (!esAbierto(nivel) || !nombre || !c.respuestas || typeof c.respuestas !== "object") {
    return NextResponse.json({ error: "faltan datos" }, { status: 400 });
  }

  const nota = await corregir(nivel, c.respuestas);
  if (!nota) return NextResponse.json({ error: "sin test" }, { status: 500 });

  const sb = supabaseServidor();
  if (!sb) return NextResponse.json({ error: "sin base" }, { status: 500 });

  // Sin cuenta no hay a quién limitar, así que se frena lo único que se puede
  // reconocer: el mismo nombre repitiendo en el mismo minuto. Para un script
  // decidido no es una barrera, pero evita que un doble clic deje dos filas.
  const haceUnMinuto = new Date(Date.now() - 60_000).toISOString();
  const { data: ya } = await sb.from("marcador")
    .select("id").eq("nivel", nivel).eq("nombre", nombre)
    .gte("creado", haceUnMinuto).limit(1);
  if (ya?.length) return NextResponse.json({ ok: true, ...nota, repetido: true });

  const { error } = await sb.from("marcador").insert({ nivel, nombre, ...nota });
  if (error) {
    console.error("marcador:", error.message);
    return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...nota });
}
