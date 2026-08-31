import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

/**
 * Cliente con la llave secreta: salta el RLS, así que **sólo** puede vivir en
 * el servidor. Está en su propio archivo con `server-only` para que importarlo
 * desde un componente de cliente falle en el build y no en producción.
 *
 * Devuelve null si Supabase todavía no está configurado: la app sigue andando.
 */
export function supabaseServidor(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase renombró las llaves: publishable/secret sustituyen a anon/service_role.
  // Aceptamos ambos nombres para no romper nada al migrar.
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cliente = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cliente;
}
