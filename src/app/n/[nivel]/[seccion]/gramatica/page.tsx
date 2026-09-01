import { notFound, redirect } from "next/navigation";
import { curso, gramaticas, seccionCurso, unidad } from "@/lib/contenido";
import { puedeVer } from "@/lib/acceso-servidor";
import { Cabecera } from "@/components/Cabecera";
import { PanelGramatica } from "@/components/PanelGramatica";
import { BotonesRapidos } from "@/components/Ajustes";

export function generateStaticParams() {
  return curso().flatMap((n) =>
    n.secciones.filter((s) => s.gramatica > 0).map((s) => ({ nivel: n.id, seccion: s.id })));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string; seccion: string }> }) {
  const { nivel, seccion } = await params;
  if (!(await puedeVer(seccion))) redirect("/suscripcion");
  const s = seccionCurso(nivel, seccion);
  if (!s) notFound();
  const gram = gramaticas(s.unidades.flatMap((m) => unidad(m.id)?.gramatica ?? []));
  if (!gram.length) notFound();

  return (
    <>
      <Cabecera atras={`/n/${nivel}/${seccion}`} titulo={s.es} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 10px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className={`pastilla ${nivel.toLowerCase()}`}>{nivel}</span>
            <h1 className="jp" style={{ fontSize: 26, margin: "8px 0 0" }}>{s.ja} · 文法</h1>
            <p className="silencio" style={{ margin: 0 }}>
              Los {gram.length} puntos que aparecen en esta sección
            </p>
          </div>
          <div className="crecer" style={{ flex: 1 }} />
          <BotonesRapidos compacto />
        </section>
        <PanelGramatica items={gram} agrupar />
      </main>
    </>
  );
}
