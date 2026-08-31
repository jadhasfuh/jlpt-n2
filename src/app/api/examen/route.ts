import { NextResponse } from "next/server";
import { armarExamen } from "@/lib/banco";
import type { Ajuste, Seccion } from "@/lib/examen";
import { NIVELES, type Nivel } from "@/lib/tipos";

const SECCIONES: Seccion[] = ["moji_goi", "bunpou", "dokkai", "choukai"];
const MINUTOS = [5, 10, 15, 30, 105];

/**
 * Limpia lo que llega. El cliente sólo manda combinaciones válidas, pero esto
 * es un endpoint público: un `minutos: 99999` sin filtrar pediría un examen
 * de miles de preguntas y tumbaría la consulta.
 */
function sanear(x: unknown): Ajuste | null {
  if (!x || typeof x !== "object") return null;
  const a = x as Record<string, unknown>;
  if (!NIVELES.includes(a.nivel as Nivel)) return null;
  if (!MINUTOS.includes(a.minutos as number)) return null;
  const secciones = Array.isArray(a.secciones)
    ? [...new Set(a.secciones)].filter((s): s is Seccion => SECCIONES.includes(s as Seccion))
    : [];
  return {
    nivel: a.nivel as Nivel,
    secciones,
    minutos: a.minutos as Ajuste["minutos"],
    correccion: a.correccion === "al momento" ? "al momento" : "al final",
  };
}

/** Arma un mini examen. `vistos` va de lo más reciente a lo más antiguo. */
export async function POST(req: Request) {
  let cuerpo: { ajuste?: unknown; vistos?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo ilegible" }, { status: 400 });
  }

  const ajuste = sanear(cuerpo.ajuste);
  if (!ajuste) return NextResponse.json({ error: "ajuste inválido" }, { status: 400 });

  const vistos = Array.isArray(cuerpo.vistos)
    ? cuerpo.vistos.filter((v): v is string => typeof v === "string").slice(0, 800)
    : [];

  const items = await armarExamen(ajuste, vistos);
  return NextResponse.json({ items });
}
