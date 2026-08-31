import { Cabecera } from "@/components/Cabecera";
import { Suscripcion } from "@/components/Suscripcion";
import { alDia, perfil } from "@/lib/sesion";
import { ajustesNavegador, precio } from "@/lib/paddle";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad } from "@/lib/idioma";

export const metadata = { title: "Suscripción — jlptest" };

export default async function Pagina() {
  const idioma = await idiomaActual();
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
        <Suscripcion ajustes={ajustesNavegador()} cuenta={cuenta} tarifa={tarifa} />
      </main>
    </>
  );
}
