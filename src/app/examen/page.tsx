import { Cabecera } from "@/components/Cabecera";
import { ExamenAjustes } from "@/components/ExamenAjustes";

export const metadata = { title: "Mini examen — jlptest" };

export default function Pagina() {
  return (
    <>
      <Cabecera />
      <main className="envoltorio"><ExamenAjustes /></main>
    </>
  );
}
