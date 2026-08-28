import { notFound } from "next/navigation";
import { gramaticas, nivel, niveles, palabras } from "@/lib/contenido";
import { Sesion } from "@/components/Sesion";

export function generateStaticParams() {
  return niveles().map((n) => ({ id: n.id }));
}

export default async function PaginaNivel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = nivel(id);
  if (!n) notFound();

  const todos = niveles();
  const idx = todos.findIndex((x) => x.id === n.id);

  return (
    <Sesion
      nivel={n}
      palabras={palabras(n.palabras)}
      gramatica={gramaticas(n.gramatica)}
      siguiente={todos[idx + 1]?.id ?? null}
    />
  );
}
