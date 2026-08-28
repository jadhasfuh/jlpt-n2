import Link from "next/link";
import { niveles, secciones, totalPalabras, totalGramatica } from "@/lib/contenido";
import { Panel } from "@/components/Panel";

export default function Inicio() {
  const todos = niveles();
  const secs = secciones();
  return (
    <>
      <section style={{ padding: "48px 0 32px" }}>
        <p className="etiqueta">Curso completo · JLPT N2</p>
        <h1 className="jp" style={{ fontSize: 42, margin: "8px 0 4px", lineHeight: 1.3 }}>
          日本語能力試験 N2
        </h1>
        <p className="silencio" style={{ maxWidth: 560, fontSize: 16 }}>
          {todos.length} sesiones de 20 palabras nuevas, agrupadas por tema, con la
          gramática repartida de la más simple a la más compleja. Al final de cada
          sesión, una lectura que sólo usa lo que ya viste.
        </p>
        <div style={{ display: "flex", gap: 26, marginTop: 22, flexWrap: "wrap" }}>
          {[
            [totalPalabras().toLocaleString("es"), "palabras"],
            [String(totalGramatica()), "puntos de gramática"],
            [String(todos.length), "sesiones"],
            [String(secs.length), "secciones temáticas"],
          ].map(([n, t]) => (
            <div key={t}>
              <div style={{ fontSize: 26, fontWeight: 600 }}>{n}</div>
              <div className="tenue">{t}</div>
            </div>
          ))}
        </div>
      </section>

      <Panel niveles={todos} />

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Las secciones</h2>
        <div className="rejilla dos">
          {secs.map((s) => (
            <Link key={s.id} href={`/secciones#${s.id}`} className="tarjeta">
              <div className="jp" style={{ fontSize: 21 }}>{s.ja}</div>
              <div className="silencio" style={{ fontSize: 14 }}>{s.es}</div>
              <div className="tenue" style={{ marginTop: 8 }}>
                {s.palabras} palabras · {s.niveles} sesiones · {s.subgrupos.length} subgrupos
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
