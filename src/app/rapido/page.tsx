import { Cabecera } from "@/components/Cabecera";
import { SesionRapida } from "@/components/SesionRapida";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad } from "@/lib/idioma";

export const metadata = { title: "Cinco minutos — jlptest" };

export default async function Pagina() {
  const idioma = await idiomaActual();
  return (
    <>
      <Cabecera atras="/" titulo={trad("cur.curso", idioma)} />
      <main className="envoltorio"><SesionRapida /></main>
    </>
  );
}
