import { NextResponse } from "next/server";
import { supabaseSesion } from "@/lib/sesion";
import { origenPublico } from "@/lib/sitio";
import { COOKIE_IDIOMA, esIdioma } from "@/lib/idioma";

/** Vuelta del correo o de Google: se canjea el código por una sesión. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Mismo motivo que en /auth/salir: url.origin es la dirección interna.
  const origen = origenPublico(req);
  const codigo = url.searchParams.get("code");
  const destino = url.searchParams.get("next") || "/perfil";

  if (codigo) {
    const sb = await supabaseSesion();
    const { data, error } = (await sb?.auth.exchangeCodeForSession(codigo))
      ?? { data: null, error: null };
    if (!error) {
      const res = NextResponse.redirect(new URL(destino, origen));
      // Entrar en un aparato nuevo trae consigo el idioma de la cuenta. Es
      // aquí y no en el layout porque una página de servidor no puede poner
      // cookies, y aquí ya estamos en una ruta que responde.
      const id = data?.user?.id;
      if (id && sb) {
        const { data: p } = await sb.from("perfiles").select("idioma").eq("id", id).maybeSingle();
        const guardado = (p as { idioma?: string } | null)?.idioma;
        if (esIdioma(guardado)) {
          res.cookies.set(COOKIE_IDIOMA, guardado, {
            path: "/", maxAge: 31536000, sameSite: "lax",
          });
        }
      }
      return res;
    }
  }
  return NextResponse.redirect(new URL("/entrar?error=1", origen));
}
