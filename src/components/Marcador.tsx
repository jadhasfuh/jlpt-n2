import { supabaseServidor } from "@/lib/supabase-servidor";
import { t as trad, type Idioma } from "@/lib/idioma";
import type { Abierto } from "@/lib/test-libre";

/**
 * El marcador del test abierto.
 *
 * Se enseña sólo a partir de unas cuantas filas: una tabla con dos nombres
 * transmite lo contrario de lo que pretende, así que mientras no haya
 * suficientes es mejor que no exista.
 *
 * Los nombres los escribe cualquiera sin cuenta, así que aquí se tratan como
 * texto ajeno: se pintan como texto plano y nada más.
 */
const MIN_FILAS = 5;
const DIAS = 7;

type Fila = { id: number; nombre: string; aciertos: number; total: number; creado: string };

function cuandoFue(iso: string, idioma: Idioma): string {
  const min = Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return trad("mar.ahora", idioma);
  const horas = Math.floor(min / 60);
  return horas < 24
    ? trad("mar.haceHoras", idioma, { n: String(horas) })
    : trad("mar.haceDias", idioma, { n: String(Math.floor(horas / 24)) });
}

export async function Marcador({ nivel, idioma }: { nivel: Abierto; idioma: Idioma }) {
  const sb = supabaseServidor();
  if (!sb) return null;

  const desde = new Date(Date.now() - DIAS * 86400_000).toISOString();
  const [top, ultimos] = await Promise.all([
    sb.from("marcador").select("id, nombre, aciertos, total, creado")
      .eq("nivel", nivel).gte("creado", desde)
      .order("aciertos", { ascending: false }).order("creado", { ascending: false }).limit(8),
    sb.from("marcador").select("id, nombre, aciertos, total, creado")
      .eq("nivel", nivel).order("creado", { ascending: false }).limit(5),
  ]);

  const mejores = (top.data ?? []) as Fila[];
  if (mejores.length < MIN_FILAS) return null;
  const recientes = (ultimos.data ?? []) as Fila[];

  return (
    <section style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--linea)" }}>
      <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 4px" }}>
        {trad("mar.titulo", idioma, { n: nivel })}
      </h2>
      <p className="tenue" style={{ margin: "0 0 14px" }}>{trad("mar.ultimos7", idioma)}</p>

      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {mejores.map((f, i) => {
          const pct = Math.round((f.aciertos / f.total) * 100);
          return (
            <li key={f.id} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "9px 12px",
              borderRadius: "var(--radio)", marginBottom: 4,
              background: i < 3 ? "color-mix(in srgb, var(--acento) 8%, transparent)" : "transparent",
            }}>
              <span style={{
                flex: "0 0 auto", width: 24, textAlign: "center", fontSize: 13,
                fontWeight: i < 3 ? 700 : 400,
                color: i < 3 ? "var(--acento)" : "var(--tinta-2)",
              }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14.5, overflow: "hidden",
                             textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</span>
              <span className="tenue" style={{ fontSize: 12 }}>{cuandoFue(f.creado, idioma)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 42, textAlign: "right",
                             color: pct >= 60 ? "var(--acento)" : "var(--tinta-2)" }}>{pct}%</span>
            </li>
          );
        })}
      </ol>

      {recientes.length > 0 && (
        <>
          <p className="tenue" style={{ margin: "18px 0 8px" }}>{trad("mar.recientes", idioma)}</p>
          <div className="filtros" style={{ gap: 6 }}>
            {recientes.map((f) => (
              <span key={f.id} className="pastilla" style={{ fontSize: 12 }}>
                {f.nombre} · {Math.round((f.aciertos / f.total) * 100)}%
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
