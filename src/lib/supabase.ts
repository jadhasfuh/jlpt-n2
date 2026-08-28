import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

/** Devuelve null si Supabase todavía no está configurado: la app sigue andando. */
export function supabaseServidor(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cliente = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cliente;
}

let clienteNavegador: SupabaseClient | null | undefined;

export function supabaseNavegador(): SupabaseClient | null {
  if (clienteNavegador !== undefined) return clienteNavegador;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  clienteNavegador = url && key ? createClient(url, key) : null;
  return clienteNavegador;
}
