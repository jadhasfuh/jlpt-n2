import { Cabecera } from "@/components/Cabecera";
import { Legal } from "@/components/Legal";

export const metadata = { title: "Términos de uso — jlptest" };

export default function Pagina() {
  return (
    <>
      <Cabecera atras="/perfil" titulo="Perfil" />
      <main className="envoltorio"><Legal cual="terminos" /></main>
    </>
  );
}
