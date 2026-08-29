import { notFound } from "next/navigation";
import { curso, gramaticas, kanjiDeSeccion, nivelCurso, seccionCurso, unidad } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { ListaUnidades } from "@/components/ListaUnidades";

export function generateStaticParams() {
  return curso().flatMap((n) =>
    n.secciones.map((s) => ({ nivel: n.id, seccion: s.id })));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string; seccion: string }> }) {
  const { nivel, seccion } = await params;
  const n = nivelCurso(nivel);
  const s = seccionCurso(nivel, seccion);
  if (!n || !s) notFound();

  // La gramática que aparece en esta sección, para el interruptor.
  const ids = s.unidades.flatMap((m) => unidad(m.id)?.gramatica ?? []);
  const gram = gramaticas(ids);
  const kanji = kanjiDeSeccion(nivel, seccion);

  return (
    <>
      <Cabecera atras={`/n/${nivel}`} titulo={nivel} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 14px" }}>
          <span className={`pastilla ${nivel.toLowerCase()}`}>{nivel}</span>
          <h1 className="jp" style={{ fontSize: 27, margin: "8px 0 0" }}>{s.ja}</h1>
          <p className="silencio" style={{ margin: 0 }}>{s.es}</p>
          <p className="tenue" style={{ margin: "4px 0 0" }}>
            {s.palabras} palabras en {s.unidades.length} unidades · {kanji.length} kanji
            {gram.length ? ` · ${gram.length} puntos de gramática` : ""}
          </p>
        </section>
        <ListaUnidades nivel={nivel} unidades={s.unidades} gramatica={gram} kanji={kanji}
                       titulo={`${s.ja} · ${nivel}`} />
      </main>
    </>
  );
}
