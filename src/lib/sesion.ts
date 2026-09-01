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
  /** Ids del proveedor de pago. Nunca llegan al navegador. */
  cliente_pago: string | null;
  suscripcion_id: string | null;
  /** Cuenta regalada: hasta cuándo. No lo escribe Paddle, lo ponemos nosotros. */
  cortesia_hasta?: string | null;
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
  const correo = u.email?.trim().toLowerCase() ?? null;
  // Las dos consultas van a la vez: la cortesía no debe costar una espera más.
  const [{ data }, cortesia] = await Promise.all([
    admin.from("perfiles")
      .select("id, nombre, email, membresia, vence_en, origen, cliente_pago, suscripcion_id")
      .eq("id", u.id).maybeSingle(),
    correo
      ? admin.from("cortesias").select("hasta").eq("email", correo).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!data) return null;
  return { ...(data as Perfil), cortesia_hasta: cortesia.data?.hasta ?? null };
}

/**
 * Cuentas con acceso permanente, separadas por comas en CUENTAS_LIBRES.
 *
 * Para las nuestras: la de administración y las de prueba. Se resuelve por
 * correo y fuera de la base a propósito — así ningún aviso de Paddle puede
 * quitarlo por accidente, que es justo lo que pasaría si se marcara con una
 * membresía o con una fecha lejana en `perfiles`.
 */
function siempreLibre(email: string | null): boolean {
  if (!email) return false;
  const lista = (process.env.CUENTAS_LIBRES ?? "")
    .split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return lista.includes(email.trim().toLowerCase());
}

/** Cancelada sigue valiendo hasta que se acaba lo pagado: no se corta a media semana. */
export function alDia(p: Perfil | null): boolean {
  if (!p) return false;
  if (siempreLibre(p.email)) return true;
  if (p.cortesia_hasta && new Date(p.cortesia_hasta) > new Date()) return true;
  if (p.membresia !== "activa" && p.membresia !== "cancelada") return false;
  return !p.vence_en || new Date(p.vence_en) > new Date();
}
