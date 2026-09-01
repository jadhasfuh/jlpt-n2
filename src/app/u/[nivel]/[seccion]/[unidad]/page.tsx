import { notFound, redirect } from "next/navigation";
import { gramaticas, kanjis, palabras, seccionCurso, unidad, vecinas } from "@/lib/contenido";
import { puedeVer } from "@/lib/acceso-servidor";
import { Cabecera } from "@/components/Cabecera";
import { VistaUnidad } from "@/components/VistaUnidad";

// A propósito sin generateStaticParams: son 602 unidades y prerenderizarlas
// dispara el coste del build. Se sirven bajo demanda desde el JSON empaquetado.

export default async function Pagina(
  { params }: { params: Promise<{ nivel: string; seccion: string; unidad: string }> },
) {
  const { nivel, seccion, unidad: parte } = await params;
  if (!(await puedeVer(seccion))) redirect("/suscripcion?desde=contenido");
  const u = unidad(`${nivel}/${seccion}/${parte}`);
  if (!u) notFound();
  const { siguiente, indice, total } = vecinas(u.id);
  const sec = seccionCurso(nivel, seccion);
  const sig = siguiente
    ? `/u/${siguiente.split("/")[0]}/${siguiente.split("/")[1]}/${siguiente.split("/")[2]}`
    : null;

  return (
    <>
      <Cabecera atras={`/n/${nivel}/${seccion}`} titulo={sec?.ja ?? "Sección"} />
      <VistaUnidad
        unidad={u}
        palabras={palabras(u.palabras)}
        gramatica={gramaticas(u.gramatica)}
        kanji={kanjis(u.kanji)}
        siguiente={sig}
        indice={indice}
        total={total}
      />
    </>
  );
}
