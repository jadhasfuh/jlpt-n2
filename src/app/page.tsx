import { curso, totales } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { Inicio } from "@/components/Inicio";

export default function Pagina() {
  const niveles = curso().map((n) => ({
    id: n.id, palabras: n.palabras, gramatica: n.gramatica,
    unidades: n.unidades, secciones: n.secciones.length,
  }));

  // Lista compacta y en orden, para que la portada pueda decir qué toca hoy.
  const orden = curso().flatMap((n) =>
    n.secciones.flatMap((sec) =>
      sec.unidades.map((u) => ({
        id: u.id, ja: u.ja, es: u.es, nivel: n.id,
        p: u.items, k: u.kanji, g: u.gramatica,
      }))));

  return (
    <>
      <Cabecera />
      <main className="envoltorio">
        <Inicio niveles={niveles} totales={totales} orden={orden} />
      </main>
    </>
  );
}
