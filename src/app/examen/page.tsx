import { Cabecera } from "@/components/Cabecera";
import { ExamenAjustes } from "@/components/ExamenAjustes";
import { alDia, perfil } from "@/lib/sesion";
import { accesoAbierto } from "@/lib/acceso-servidor";

export const metadata = { title: "Mini examen — jlptest" };

export default async function Pagina() {
  // Mientras el acceso esté abierto no hay nada que ofrecer aparte: los
  // exámenes funcionan para todo el mundo.
  const abierto = accesoAbierto();
  const tiene = abierto || alDia(await perfil());
  return (
    <>
      <Cabecera />
      <main className="envoltorio"><ExamenAjustes alDia={tiene} /></main>
    </>
  );
}
