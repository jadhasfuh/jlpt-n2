import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión en cada navegación. Sin esto el token caduca y el usuario
 * se ve expulsado a mitad de una sesión de estudio, que es justo cuando peor
 * sienta. Los Server Components no pueden escribir cookies; aquí sí.
 */
export async function middleware(req: NextRequest) {
  // Una sola dirección buena. Con www y sin www sirviendo lo mismo, Google ve
  // dos sitios y la sesión se guarda en el dominio por el que entraste: quien
  // llega por www no está identificado. Se redirige antes de tocar Supabase.
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const destino = new URL(req.url);
    destino.host = host.slice(4);
    return NextResponse.redirect(destino, 308);
  }

  const res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
           || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;

  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (nuevas) => {
        for (const { name, value, options } of nuevas) res.cookies.set(name, value, options);
      },
    },
  });
  await sb.auth.getUser();
  return res;
}

export const config = {
  // Ni ficheros estáticos ni iconos: sólo páginas.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
