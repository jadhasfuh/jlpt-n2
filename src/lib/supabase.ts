import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clienteNavegador: SupabaseClient | null | undefined;
let configurado: { url: string; key: string } | null = null;

/**
 * Le dice al navegador con qué credenciales hablar con Supabase.
 *
 * Existe porque las NEXT_PUBLIC_ se hornean durante el build y el Dockerfile
 * no ve las variables de Railway: el paquete salía con `undefined` dentro y
 * nadie podía iniciar sesión, con la app aparentemente sana. En vez de confiar
 * en que el build las reciba, el servidor las lee al arrancar y las baja hasta
 * aquí. La llave publishable es pública por diseño, así que viajar en el HTML
 * no le añade ningún riesgo.
 */
export function configurarSupabase(url?: string | null, key?: string | null) {
  if (!url || !key || configurado) return;
  configurado = { url, key };
  clienteNavegador = undefined;   // que se cree de nuevo con lo bueno
}

/**
 * Cliente del navegador: sólo la llave publishable. Todo lo que haga pasa por
 * las políticas RLS. El cliente con la llave secreta vive aparte, en
 * `supabase-servidor.ts`.
 */
export function supabaseNavegador(): SupabaseClient | null {
  if (clienteNavegador !== undefined) return clienteNavegador;
  // En desarrollo, Next sí lee .env.local y las variables llegan solas.
  const url = configurado?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = configurado?.key
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  clienteNavegador = url && key ? createClient(url, key) : null;
  return clienteNavegador;
}
