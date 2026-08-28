import { NextResponse } from "next/server";
import { palabras } from "@/lib/contenido";

/** Devuelve palabras por id (lo usa el repaso, que sólo guarda ids en el navegador). */
export async function GET(req: Request) {
  const bruto = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = bruto.split(",").map(Number).filter((n) => Number.isInteger(n)).slice(0, 200);
  return NextResponse.json({ palabras: palabras(ids) });
}
