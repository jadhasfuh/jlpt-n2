import { Cabecera } from "@/components/Cabecera";
import { Perfil } from "@/components/Perfil";
import { totales } from "@/lib/contenido";
import { alDia, perfil } from "@/lib/sesion";

export const metadata = { title: "Perfil — jlptest" };

// La sesión vive en cookies, así que esta página no se puede prerenderizar.
export const dynamic = "force-dynamic";

export default async function Pagina() {
  const p = await perfil();
  return (
    <>
      <Cabecera />
      <main className="envoltorio">
        <Perfil totalPalabras={totales.palabras} cuenta={p} alDia={alDia(p)} />
      </main>
    </>
  );
}
