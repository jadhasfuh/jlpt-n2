import Link from "next/link";
import { secciones, niveles } from "@/lib/contenido";

export const metadata = { title: "Secciones — 日本語 N2" };

export default function Secciones() {
  const secs = secciones();
  const todos = niveles();

  return (
    <>
      <h1 style={{ fontSize: 24, margin: "36px 0 6px" }}>Secciones y subgrupos</h1>
      <p className="silencio" style={{ marginTop: 0 }}>
        El vocabulario está repartido en {secs.length} secciones temáticas; cada una
        se divide en subgrupos, y cada sesión toma 20 palabras siguiendo ese orden.
      </p>

      {secs.map((s) => {
        const suyos = todos.filter((n) => n.seccion === s.id);
        return (
          <section key={s.id} id={s.id} style={{ marginTop: 30, scrollMarginTop: 80 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 className="jp" style={{ fontSize: 26, margin: 0 }}>{s.ja}</h2>
              <span className="silencio">{s.es}</span>
              <div style={{ flex: 1 }} />
              <span className="tenue">
                sesiones {suyos[0]?.numero}–{suyos[suyos.length - 1]?.numero}
              </span>
            </div>

            <div className="tarjeta" style={{ marginTop: 10, padding: "6px 20px" }}>
              <table className="tabla-vocab">
                <tbody>
                  {s.subgrupos.map((g) => (
                    <tr key={g.id}>
                      <td className="jp" style={{ fontSize: 18, width: "38%" }}>{g.ja}</td>
                      <td className="silencio">{g.es}</td>
                      <td className="tenue" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {g.palabras} palabras
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {suyos.map((n) => (
                <Link key={n.id} href={`/nivel/${n.id}`} className="btn" style={{ padding: "4px 11px", fontSize: 12.5 }}>
                  {n.numero}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
