import { Cabecera } from "@/components/Cabecera";
import { SesionRapida } from "@/components/SesionRapida";
export const metadata = { title: "Cinco minutos — jlptest" };
export default function Pagina() {
  return (
    <>
      <Cabecera atras="/" titulo="Curso" />
      <main className="envoltorio"><SesionRapida /></main>
    </>
  );
}
