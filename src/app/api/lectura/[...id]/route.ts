import { NextResponse } from "next/server";
import { lectura } from "@/lib/contenido";

/** El id de unidad lleva barras ("N2/hito/familia-1"), por eso es catch-all. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string[] }> }) {
  const { id } = await params;
  return NextResponse.json({ lectura: await lectura(id.join("/")) });
}
