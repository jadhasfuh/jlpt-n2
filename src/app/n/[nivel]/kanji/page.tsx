import { notFound } from "next/navigation";
import { curso, kanjiDeNivel, nivelCurso } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { PanelKanji } from "@/components/PanelKanji";
import { BotonesRapidos } from "@/components/Ajustes";

export function generateStaticParams() {
  return curso().map((n) => ({ nivel: n.id }));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel } = await params;
  const n = nivelCurso(nivel);
  if (!n) notFound();
  const kanji = kanjiDeNivel(nivel);

  return (
    <>
      <Cabecera atras={`/n/${nivel}`} titulo={nivel} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 10px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className={`pastilla ${nivel.toLowerCase()}`}>{nivel}</span>
            <h1 className="jp" style={{ fontSize: 27, margin: "8px 0 0" }}>漢字</h1>
            <p className="silencio" style={{ margin: 0 }}>
              Los {kanji.length} kanji del nivel, de los más frecuentes a los más raros
            </p>
          </div>
          <div className="crecer" style={{ flex: 1 }} />
          <BotonesRapidos compacto />
        </section>
        <PanelKanji kanji={kanji} titulo={`nivel ${nivel}`} />
      </main>
    </>
  );
}
