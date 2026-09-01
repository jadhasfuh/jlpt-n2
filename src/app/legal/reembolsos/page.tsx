import { Cabecera } from "@/components/Cabecera";
import { Legal } from "@/components/Legal";

export const metadata = { title: "Reembolsos y cancelación — jlptest" };

export default function Pagina() {
  return (
    <>
      <Cabecera atras="/perfil" titulo="Perfil" />
      <main className="envoltorio"><Legal cual="reembolsos" /></main>
    </>
  );
}
