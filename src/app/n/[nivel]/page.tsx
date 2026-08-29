import Link from "next/link";
import { notFound } from "next/navigation";
import { curso, nivelCurso } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { ListaSecciones } from "@/components/ListaSecciones";
import { DESC_NIVEL, type Nivel } from "@/lib/tipos";

export function generateStaticParams() {
  return curso().map((n) => ({ nivel: n.id }));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel } = await params;
  const n = nivelCurso(nivel);
  if (!n) notFound();
  return (
    <>
      <Cabecera atras="/" titulo="Niveles" />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 14px" }}>
          <span className={`pastilla ${n.id.toLowerCase()}`}>{n.id}</span>
          <h1 style={{ fontSize: 24, margin: "8px 0 2px" }}>{DESC_NIVEL[n.id as Nivel]}</h1>
          <p className="tenue" style={{ margin: 0 }}>
            {n.palabras.toLocaleString("es")} palabras · {n.unidades} unidades
          </p>
        </section>
        <Link href={`/n/${n.id}/kanji`} className="fila" style={{ marginBottom: 12 }}>
          <div className="anillo" style={{ ["--pct" as string]: 100, ["--tono" as string]: "var(--tinta-3)" }}>
            <span className="jp" style={{ fontSize: 15 }}>漢</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Todos los kanji del nivel</div>
            <div className="tenue">{n.kanji} kanji · lista y test</div>
          </div>
          <span className="flecha">›</span>
        </Link>
        {n.gramatica > 0 && (
          <Link href={`/n/${n.id}/gramatica`} className="fila" style={{ marginBottom: 12 }}>
            <div className="anillo" style={{ ["--pct" as string]: 100, ["--tono" as string]: "var(--tinta-3)" }}>
              <span className="jp" style={{ fontSize: 15 }}>文</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Toda la gramática del nivel</div>
              <div className="tenue">{n.gramatica} puntos, de simple a complejo</div>
            </div>
            <span className="flecha">›</span>
          </Link>
        )}
        <ListaSecciones nivel={n.id} secciones={n.secciones.map((s) => ({
          id: s.id, ja: s.ja, es: s.es, palabras: s.palabras,
          gramatica: s.gramatica, unidades: s.unidades.length,
        }))} />
      </main>
    </>
  );
}
