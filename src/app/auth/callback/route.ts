import { NextResponse } from "next/server";
import { supabaseSesion } from "@/lib/sesion";

/** Vuelta del correo o de Google: se canjea el código por una sesión. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const codigo = url.searchParams.get("code");
  const destino = url.searchParams.get("next") || "/perfil";

  if (codigo) {
    const sb = await supabaseSesion();
    const { error } = (await sb?.auth.exchangeCodeForSession(codigo)) ?? { error: null };
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }
  return NextResponse.redirect(new URL("/entrar?error=1", url.origin));
}
