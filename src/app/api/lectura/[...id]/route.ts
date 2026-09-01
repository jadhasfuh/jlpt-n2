import { NextResponse } from "next/server";
import { lectura } from "@/lib/contenido";
import { puedeVer } from "@/lib/acceso-servidor";

/** El id de unidad lleva barras ("N2/hito/familia-1"), por eso es catch-all. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string[] }> }) {
  const { id } = await params;
  // El id de unidad es "N2/hito/familia-1": la sección es el segundo trozo.
  if (!(await puedeVer(id[1] ?? ""))) {
    return NextResponse.json({ error: "hace falta suscripción" }, { status: 402 });
  }
  return NextResponse.json({ lectura: await lectura(id.join("/")) });
}
