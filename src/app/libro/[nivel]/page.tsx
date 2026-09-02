import { notFound, redirect } from "next/navigation";
import { capitulos, lectura, palabras } from "@/lib/contenido";
import { puedeVer } from "@/lib/acceso-servidor";
import { Cabecera } from "@/components/Cabecera";
import { Libro } from "@/components/Libro";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad } from "@/lib/idioma";
import { NIVELES_CON_LIBRO, type Nivel } from "@/lib/tipos";

/**
 * El libro: las lecturas del nivel, seguidas y en orden.
 *
 * Las mismas lecturas que hay dentro de cada unidad, pero leídas del tirón y
 * con el vocabulario delante, que es como está pensada la historia: una
 * página enseña las palabras y la siguiente las usa.
 */
export default async function Pagina(
  { params, searchParams }: {
    params: Promise<{ nivel: string }>;
    searchParams: Promise<{ c?: string }>;
  },
) {
  const { nivel } = await params;
  // Sólo los niveles con historia escrita. En el resto no hay libro que
  // leer, así que la página no existe en vez de existir vacía.
  if (!NIVELES_CON_LIBRO.includes(nivel as Nivel)) notFound();

  const lista = capitulos(nivel);
  if (!lista.length) notFound();

  const { c } = await searchParams;
  const n = Math.min(Math.max(0, Number(c) || 0), lista.length - 1);
  const u = lista[n];

  // El libro respeta el mismo candado que la unidad: si esa sección está
  // cerrada, no se lee aquí por la puerta de atrás.
  if (!(await puedeVer(u.seccion))) redirect("/suscripcion?desde=contenido");

  const idioma = await idiomaActual();
  const l = await lectura(u.id);

  return (
    <>
      <Cabecera atras={`/n/${nivel}`} titulo={trad("lib2.titulo", idioma, { n: nivel })} />
      <main className="envoltorio">
        <Libro
          nivel={nivel}
          n={n}
          total={lista.length}
          unidad={{ id: u.id, ja: u.ja, es: u.es, en: u.en, seccion: u.seccion }}
          vocabulario={palabras(u.palabras).map((w) => ({
            id: w.id, escritura: w.escritura, lectura: w.lectura, es: w.es, en: w.en,
          }))}
          lectura={l}
        />
      </main>
    </>
  );
}
