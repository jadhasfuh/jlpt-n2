import { notFound } from "next/navigation";
import { gramaticas, palabras, unidad, unidades, vecinas } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { VistaUnidad } from "@/components/VistaUnidad";

export function generateStaticParams() {
  return unidades().map((u) => {
    const [nivel, seccion, resto] = u.id.split("/");
    return { nivel, seccion, unidad: resto };
  });
}

export default async function Pagina(
  { params }: { params: Promise<{ nivel: string; seccion: string; unidad: string }> },
) {
  const { nivel, seccion, unidad: parte } = await params;
  const u = unidad(`${nivel}/${seccion}/${parte}`);
  if (!u) notFound();
  const { siguiente } = vecinas(u.id);
  const sig = siguiente
    ? `/u/${siguiente.split("/")[0]}/${siguiente.split("/")[1]}/${siguiente.split("/")[2]}`
    : null;

  return (
    <>
      <Cabecera atras={`/n/${nivel}/${seccion}`} titulo="Sección" />
      <VistaUnidad
        unidad={u}
        palabras={palabras(u.palabras)}
        gramatica={gramaticas(u.gramatica)}
        siguiente={sig}
      />
    </>
  );
}
