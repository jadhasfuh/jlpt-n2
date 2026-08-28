import { Cabecera } from "@/components/Cabecera";
import { Perfil } from "@/components/Perfil";
import { totales } from "@/lib/contenido";

export const metadata = { title: "Perfil — jlptest" };

export default function Pagina() {
  return (
    <>
      <Cabecera />
      <main className="envoltorio"><Perfil totalPalabras={totales.palabras} /></main>
    </>
  );
}
