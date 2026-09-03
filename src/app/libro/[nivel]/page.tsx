import { notFound, redirect } from "next/navigation";
import {
  capitulos, gramaticas, gramaticaDeFuera, lectura, palabras, palabrasDeFuera,
} from "@/lib/contenido";
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
          gramatica={gramaticas(u.gramatica).map((g) => ({
            id: g.id, forma: g.forma, lectura: g.lectura, es: g.es, en: g.en,
          }))}
          // Las que salen en el texto pero se estudian en otro capítulo: sin
          // esto, 山 aparece en el capítulo 1 y no está en ninguna lista hasta
          // el 95.
          deFuera={l ? palabrasDeFuera(l.cuerpo, nivel, u.palabras).map((x) => ({
            id: x.palabra.id, escritura: x.palabra.escritura,
            lectura: x.palabra.lectura, es: x.palabra.es, en: x.palabra.en,
            jlpt: x.palabra.jlpt, capitulo: x.capitulo,
          })) : []}
          // N5 tiene 84 puntos de gramática y 103 capítulos: 19 se quedaban
          // sin nada que enseñar. Ninguno está limpio de gramática, sólo que
          // la suya se enseña en otro capítulo; se dice cuál.
          gramaticaFuera={l ? gramaticaDeFuera(l.cuerpo, nivel, u.gramatica).map((x) => ({
            id: x.punto.id, forma: x.punto.forma, lectura: x.punto.lectura,
            es: x.punto.es, en: x.punto.en, capitulo: x.capitulo,
          })) : []}
          lectura={l}
        />
      </main>
    </>
  );
}
