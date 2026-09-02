import { Cabecera } from "@/components/Cabecera";
import { Legal } from "@/components/Legal";

export const metadata = {
  title: "Borrar tu cuenta — jlptest",
  description: "Cómo borrar tu cuenta de jlptest y qué datos se eliminan.",
};

export default function Pagina() {
  return (
    <>
      <Cabecera atras="/perfil" titulo="Perfil" />
      <main className="envoltorio"><Legal cual="borrar-cuenta" /></main>
    </>
  );
}
