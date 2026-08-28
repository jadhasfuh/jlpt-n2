import { NextResponse } from "next/server";
import { lectura } from "@/lib/contenido";

/** La lectura se pide en caliente: en cuanto se genera, aparece sin re-desplegar. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ lectura: await lectura(id) });
}
