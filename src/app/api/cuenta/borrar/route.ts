import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { usuario } from "@/lib/sesion";

/**
 * Borrar la cuenta y todo lo asociado.
 *
 * Google Play y Apple exigen que se pueda borrar la cuenta desde la propia
 * app, no sólo escribiendo un correo. Sin esto el envío se rechaza.
 *
 * Se borra al usuario de `auth.users`; el progreso y el perfil caen detrás por
 * las claves foráneas. Lo que NO se cancela sola es la suscripción: eso se
 * avisa en la pantalla, porque borrar la cuenta y seguir cobrando sería lo
 * peor que podríamos hacerle a alguien.
 */
export async function POST() {
  const u = await usuario();
  if (!u) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !secreta) return NextResponse.json({ error: "sin base" }, { status: 500 });

  const admin = createClient(url, secreta, { auth: { persistSession: false } });

  // Primero lo que cuelga del usuario, por si las claves foráneas no cascadean.
  await admin.from("progreso").delete().eq("perfil", u.id);
  await admin.from("resultados").delete().eq("perfil", u.id);
  await admin.from("perfiles").delete().eq("id", u.id);

  // La cortesía va por correo y no por id, así que no cae con el perfil. Se
  // borra igual: la página de privacidad dice que al borrar la cuenta no
  // queda nada, y un correo guardado en otra tabla es algo. Si esa persona
  // vuelve, se le regala otra vez; es una línea de comando.
  if (u.email) await admin.from("cortesias").delete().eq("email", u.email.toLowerCase());

  // El aviso de errata sirve para corregir el contenido, así que se queda;
  // lo que se va es el rastro de quién lo mandó. Borrarlo entero castigaría
  // al resto de estudiantes por un error que ya está señalado.
  await admin.from("reportes").update({ perfil: null }).eq("perfil", u.id);

  // El registro del webhook de Paddle lleva dentro el correo y la dirección de
  // facturación, así que es una copia de datos personales y no puede sobrevivir
  // al borrado. La factura la conserva Paddle, que es quien la emitió y a quien
  // obliga la ley fiscal; nuestra copia no hace falta para nada.
  await admin.from("eventos_pago").delete().eq("perfil", u.id);

  const { error } = await admin.auth.admin.deleteUser(u.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
