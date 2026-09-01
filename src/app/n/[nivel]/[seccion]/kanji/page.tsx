import { notFound, redirect } from "next/navigation";
import { curso, kanjiDeSeccion, seccionCurso } from "@/lib/contenido";
import { puedeVer } from "@/lib/acceso-servidor";
import { Cabecera } from "@/components/Cabecera";
import { PanelKanji } from "@/components/PanelKanji";
import { BotonesRapidos } from "@/components/Ajustes";

export function generateStaticParams() {
  return curso().flatMap((n) => n.secciones.map((s) => ({ nivel: n.id, seccion: s.id })));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string; seccion: string }> }) {
  const { nivel, seccion } = await params;
  if (!(await puedeVer(seccion))) redirect("/suscripcion?desde=contenido");
  const s = seccionCurso(nivel, seccion);
  if (!s) notFound();
  const kanji = kanjiDeSeccion(nivel, seccion);

  return (
    <>
      <Cabecera atras={`/n/${nivel}/${seccion}`} titulo={s.es} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 10px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className={`pastilla ${nivel.toLowerCase()}`}>{nivel}</span>
            <h1 className="jp" style={{ fontSize: 26, margin: "8px 0 0" }}>{s.ja} · 漢字</h1>
            <p className="silencio" style={{ margin: 0 }}>
              Los {kanji.length} kanji que salen en esta sección
            </p>
          </div>
          <div className="crecer" style={{ flex: 1 }} />
          <BotonesRapidos compacto />
        </section>
        <PanelKanji kanji={kanji} titulo={`${s.ja} · ${nivel}`} />
      </main>
    </>
  );
}
