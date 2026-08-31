import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Membresia = "libre" | "activa" | "cancelada" | "caducada";

export type Perfil = {
  id: string;
  nombre: string | null;
  email: string | null;
  membresia: Membresia;
  vence_en: string | null;
  origen: "web" | "apple" | "google" | null;
};

/**
 * Cliente de Supabase atado a las cookies de la petición. Es el que sabe quién
 * ha iniciado sesión: la llave publishable más la cookie de sesión, de modo que
 * las políticas RLS se aplican como al usuario, no como al servidor.
 */
export async function supabaseSesion(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
           || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const tarro = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => tarro.getAll(),
      setAll: (nuevas) => {
        try {
          for (const { name, value, options } of nuevas) tarro.set(name, value, options);
        } catch {
          // En un Server Component no se puede escribir cookies. No pasa nada:
          // el middleware ya refrescó la sesión antes de llegar aquí.
        }
      },
    },
  });
}

/** Quién está dentro, o null. */
export async function usuario() {
  const sb = await supabaseSesion();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

/** El perfil con su membresía. Se lee con la llave secreta porque el perfil
 *  incluye campos que el usuario no debe poder tocar. */
export async function perfil(): Promise<Perfil | null> {
  const u = await usuario();
  if (!u) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !secreta) return null;
  const admin = createClient(url, secreta, { auth: { persistSession: false } });
  const { data } = await admin
    .from("perfiles")
    .select("id, nombre, email, membresia, vence_en, origen")
    .eq("id", u.id)
    .maybeSingle();
  return (data as Perfil) ?? null;
}

/** Cancelada sigue valiendo hasta que se acaba lo pagado: no se corta a media semana. */
export function alDia(p: Perfil | null): boolean {
  if (!p) return false;
  if (p.membresia !== "activa" && p.membresia !== "cancelada") return false;
  return !p.vence_en || new Date(p.vence_en) > new Date();
}
