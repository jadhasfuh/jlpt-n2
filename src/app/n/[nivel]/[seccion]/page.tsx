import { notFound, redirect } from "next/navigation";
import { curso, gramaticas, kanjiDeSeccion, nivelCurso, seccionCurso, unidad } from "@/lib/contenido";
import { puedeVer } from "@/lib/acceso-servidor";
import { Cabecera } from "@/components/Cabecera";
import { ListaUnidades } from "@/components/ListaUnidades";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad, type Clave } from "@/lib/idioma";

export function generateStaticParams() {
  return curso().flatMap((n) =>
    n.secciones.map((s) => ({ nivel: n.id, seccion: s.id })));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string; seccion: string }> }) {
  const { nivel, seccion } = await params;
  if (!(await puedeVer(seccion))) redirect("/suscripcion?desde=contenido");
  const n = nivelCurso(nivel);
  const s = seccionCurso(nivel, seccion);
  if (!n || !s) notFound();

  // La gramática que aparece en esta sección, para el interruptor.
  const ids = s.unidades.flatMap((m) => unidad(m.id)?.gramatica ?? []);
  const gram = gramaticas(ids);
  const kanji = kanjiDeSeccion(nivel, seccion);
  const idioma = await idiomaActual();
  const t = (k: Clave, v?: Record<string, string | number>) => trad(k, idioma, v);

  return (
    <>
      <Cabecera atras={`/n/${nivel}`} titulo={nivel} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 14px" }}>
          <span className={`pastilla ${nivel.toLowerCase()}`}>{nivel}</span>
          <h1 className="jp" style={{ fontSize: 27, margin: "8px 0 0" }}>{s.ja}</h1>
          <p className="silencio" style={{ margin: 0 }}>{idioma === "en" ? s.en : s.es}</p>
          <p className="tenue" style={{ margin: "4px 0 0" }}>
            {t("cur.seccionSub", {
              palabras: s.palabras, unidades: s.unidades.length, kanji: kanji.length,
            })}
            {gram.length ? t("cur.masGram", { n: gram.length }) : ""}
          </p>
        </section>
        <ListaUnidades nivel={nivel} seccion={seccion} unidades={s.unidades}
                       gramatica={gram} kanji={kanji} />
      </main>
    </>
  );
}
