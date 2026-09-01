import { NextResponse } from "next/server";
import { supabaseSesion } from "@/lib/sesion";
import { origenPublico } from "@/lib/sitio";

export async function POST(req: Request) {
  const sb = await supabaseSesion();
  await sb?.auth.signOut();
  // El origen sale de la cabecera Host y no de req.url: ver origenPublico().
  return NextResponse.redirect(new URL("/", origenPublico(req)), { status: 303 });
}
