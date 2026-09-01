import "server-only";
import { cookies } from "next/headers";

/**
 * ¿Se está viendo esto dentro de la app de Google Play?
 *
 * La política de pagos de Play prohíbe que una app lleve al usuario a pagar
 * fuera de su facturación —lo dice nombrando webviews, botones y flujos de
 * registro—. Aquí se cobra en la web a propósito, para no ceder el 15-30 %,
 * así que dentro de la app no puede aparecer nada de suscripción: ni precio,
 * ni botón, ni una frase explicando dónde se paga.
 *
 * Lo marca el middleware con una cookie, a partir del `?app=1` del manifiesto.
 * Es una señal del cliente y se puede falsear, pero eso no importa: falsearla
 * sólo esconde cosas, nunca abre nada.
 */
export async function enLaApp(): Promise<boolean> {
  return (await cookies()).get("jlpt.app")?.value === "1";
}
