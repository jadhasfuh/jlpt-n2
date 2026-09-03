import { notFound } from "next/navigation";
import { curso, gramaticas, nivelCurso, unidad } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { PanelGramatica } from "@/components/PanelGramatica";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad, type Clave } from "@/lib/idioma";

export function generateStaticParams() {
  return curso().filter((n) => n.gramatica > 0).map((n) => ({ nivel: n.id }));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel } = await params;
  const n = nivelCurso(nivel);
  if (!n || !n.gramatica) notFound();

  const ids = n.secciones.flatMap((s) => s.unidades.flatMap((m) => unidad(m.id)?.gramatica ?? []));
  const gram = gramaticas(ids).sort((a, b) => a.tier - b.tier || a.cat.localeCompare(b.cat));
  const idioma = await idiomaActual();
  const t = (k: Clave, v?: Record<string, string | number>) => trad(k, idioma, v);

  return (
    <>
      <Cabecera atras={`/n/${nivel}`} titulo={nivel} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 14px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className={`pastilla ${nivel.toLowerCase()}`}>{nivel}</span>
            <h1 className="jp" style={{ fontSize: 27, margin: "8px 0 0" }}>文法</h1>
            <p className="silencio" style={{ margin: 0 }}>
              {t("cur.gramNivel", { n: gram.length })}
            </p>
          </div>
          <div className="crecer" style={{ flex: 1 }} />
        </section>
        <PanelGramatica items={gram} agrupar />
      </main>
    </>
  );
}
