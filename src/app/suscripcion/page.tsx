import { Cabecera } from "@/components/Cabecera";
import { Suscripcion } from "@/components/Suscripcion";
import { alDia, motivoAcceso, perfil } from "@/lib/sesion";
import { ajustesNavegador, tarifas } from "@/lib/paddle";
import { idiomaActual } from "@/lib/idioma-servidor";
import { enLaApp } from "@/lib/tienda";
import { t as trad } from "@/lib/idioma";

export const metadata = { title: "Suscripción — jlptest" };

export default async function Pagina(
  { searchParams }: { searchParams: Promise<{ desde?: string }> },
) {
  const idioma = await idiomaActual();
  // Quien llega redirigido desde una sección bloqueada necesita saber por qué
  // ha acabado aquí; si no, parece que la app le ha echado sin motivo.
  const { desde } = await searchParams;
  const enApp = await enLaApp();
  // Dentro de la app ni siquiera se piden las tarifas a Paddle: lo que no se
  // consulta no se puede enseñar por descuido.
  const [p, tarifa] = await Promise.all([
    perfil(),
    enApp ? Promise.resolve({ mensual: null, anual: null }) : tarifas(idioma),
  ]);
  // Del perfil sólo baja lo que la pantalla necesita: los ids del proveedor de
  // pago se quedan en el servidor.
  const cuenta = p && {
    correo: p.email, id: p.id, alDia: alDia(p), membresia: p.membresia,
    vence: p.vence_en, tienePago: Boolean(p.cliente_pago),
    cortesia: p.cortesia_hasta ?? null,
    motivo: motivoAcceso(p),
  };

  return (
    <>
      <Cabecera atras="/perfil" titulo={trad("per.cuenta", idioma)} />
      <main className="envoltorio">
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 4px" }}>
          {trad(enApp ? "app.tuCuenta" : "sus.titulo", idioma)}
        </h1>
        {!enApp && (
          <p className="entradilla" style={{ margin: "0 0 6px", fontSize: 13, color: "var(--tinta-2)" }}>
            {trad("sus.sub", idioma)}
          </p>
        )}
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
        {/* En la app de Play esta pantalla no vende: enseña en qué estado está
            la cuenta y dice que se gestiona desde el navegador. Su política de
            pagos prohíbe llevar al usuario a pagar fuera de su facturación, y
            nombra expresamente los webviews y los botones. */}
        {enApp ? (
          <div className="tarjeta" style={{ marginTop: 26, padding: 22 }}>
            <p style={{ fontSize: 15, margin: "0 0 6px" }}>
              {trad(cuenta?.alDia ? "sus.gracias" : "app.soloCuenta", idioma)}
            </p>
            <p className="tenue" style={{ margin: 0 }}>{trad("app.gestionFuera", idioma)}</p>
          </div>
        ) : (
          <Suscripcion ajustes={ajustesNavegador()} cuenta={cuenta} tarifa={tarifa} />
        )}
      </main>
    </>
  );
}
