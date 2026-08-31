import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clienteNavegador: SupabaseClient | null | undefined;

/**
 * Cliente del navegador: sólo la llave publishable, que es pública por diseño.
 * Todo lo que haga pasa por las políticas RLS.
 *
 * El cliente con la llave secreta vive aparte, en `supabase-servidor.ts`.
 */
export function supabaseNavegador(): SupabaseClient | null {
  if (clienteNavegador !== undefined) return clienteNavegador;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  clienteNavegador = url && key ? createClient(url, key) : null;
  return clienteNavegador;
}
