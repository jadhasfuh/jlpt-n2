import { redirect } from "next/navigation";
import { Cabecera } from "@/components/Cabecera";
import { Entrar } from "@/components/Entrar";
import { usuario } from "@/lib/sesion";

export const metadata = { title: "Entrar — jlptest" };

export default async function Pagina(
  { searchParams }: { searchParams: Promise<{ next?: string }> },
) {
  const { next } = await searchParams;
  if (await usuario()) redirect(next || "/perfil");
  return (
    <>
      <Cabecera atras="/" titulo="Curso" />
      <main className="envoltorio"><Entrar destino={next || "/perfil"} /></main>
    </>
  );
}
