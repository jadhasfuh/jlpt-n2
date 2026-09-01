import { curso, totales } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { Inicio } from "@/components/Inicio";
import { usuario } from "@/lib/sesion";

export default async function Pagina() {
  // Si hay sesión no se ofrece el test de prueba: quien ya está dentro no
  // necesita medirse con una muestra, y ocuparía sitio a lo que sí usa.
  const dentro = Boolean(await usuario());
  const niveles = curso().map((n) => ({
    id: n.id, palabras: n.palabras, gramatica: n.gramatica,
    unidades: n.unidades, secciones: n.secciones.length,
  }));

  return (
    <>
      <Cabecera />
      <main className="envoltorio">
        <Inicio niveles={niveles} totales={totales} dentro={dentro} />
      </main>
    </>
  );
}
