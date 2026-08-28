import { Cabecera } from "@/components/Cabecera";
import { Repaso } from "@/components/Repaso";
export const metadata = { title: "Repaso — jlptest" };
export default function Pagina() {
  return (
    <>
      <Cabecera />
      <main className="envoltorio"><Repaso /></main>
    </>
  );
}
