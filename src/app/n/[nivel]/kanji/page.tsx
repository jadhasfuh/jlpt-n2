import { notFound } from "next/navigation";
import { curso, kanjiDeNivel, nivelCurso } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { PanelKanji } from "@/components/PanelKanji";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad, type Clave } from "@/lib/idioma";

export function generateStaticParams() {
  return curso().map((n) => ({ nivel: n.id }));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel } = await params;
  const n = nivelCurso(nivel);
  if (!n) notFound();
  const kanji = kanjiDeNivel(nivel);
  const idioma = await idiomaActual();
  const t = (k: Clave, v?: Record<string, string | number>) => trad(k, idioma, v);

  return (
    <>
      <Cabecera atras={`/n/${nivel}`} titulo={nivel} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 10px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className={`pastilla ${nivel.toLowerCase()}`}>{nivel}</span>
            <h1 className="jp" style={{ fontSize: 27, margin: "8px 0 0" }}>漢字</h1>
            <p className="silencio" style={{ margin: 0 }}>
              {t("cur.kanjiNivel", { n: kanji.length })}
            </p>
          </div>
          <div className="crecer" style={{ flex: 1 }} />
        </section>
        <PanelKanji kanji={kanji} titulo={`nivel ${nivel}`} />
      </main>
    </>
  );
}
