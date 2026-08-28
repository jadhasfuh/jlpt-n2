import { curso, totales } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { Inicio } from "@/components/Inicio";

export default function Pagina() {
  const niveles = curso().map((n) => ({
    id: n.id, palabras: n.palabras, gramatica: n.gramatica,
    unidades: n.unidades, secciones: n.secciones.length,
  }));
  return (
    <>
      <Cabecera />
      <main className="envoltorio">
        <Inicio niveles={niveles} totales={totales} />
      </main>
    </>
  );
}
