import { Cabecera } from "@/components/Cabecera";
import { Suscripcion } from "@/components/Suscripcion";
import { alDia, perfil } from "@/lib/sesion";
import { ajustesNavegador, precio } from "@/lib/paddle";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad } from "@/lib/idioma";

export const metadata = { title: "Suscripción — jlptest" };

export default async function Pagina(
  { searchParams }: { searchParams: Promise<{ desde?: string }> },
) {
  const idioma = await idiomaActual();
  // Quien llega redirigido desde una sección bloqueada necesita saber por qué
  // ha acabado aquí; si no, parece que la app le ha echado sin motivo.
  const { desde } = await searchParams;
  const [p, tarifa] = await Promise.all([perfil(), precio(idioma)]);
  // Del perfil sólo baja lo que la pantalla necesita: los ids del proveedor de
  // pago se quedan en el servidor.
  const cuenta = p && {
    correo: p.email, id: p.id, alDia: alDia(p), membresia: p.membresia,
    vence: p.vence_en, tienePago: Boolean(p.cliente_pago),
  };

  return (
    <>
      <Cabecera atras="/perfil" titulo={trad("per.cuenta", idioma)} />
      <main className="envoltorio">
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 4px" }}>
          {trad("sus.titulo", idioma)}
        </h1>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--tinta-2)", maxWidth: "42ch" }}>
          {trad("sus.sub", idioma)}
        </p>
        {desde === "contenido" && (
          <p style={{
            margin: "14px 0 0", padding: "11px 14px", fontSize: 13.5, lineHeight: 1.6,
            borderRadius: "var(--radio)", color: "var(--tinta-2)",
            background: "color-mix(in srgb, var(--acento) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--acento) 26%, transparent)",
          }}>
            {trad("sus.veniasDe", idioma)}
          </p>
        )}
        <Suscripcion ajustes={ajustesNavegador()} cuenta={cuenta} tarifa={tarifa} />
      </main>
    </>
  );
}
