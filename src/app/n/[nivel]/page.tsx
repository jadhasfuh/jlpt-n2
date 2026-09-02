import Link from "next/link";
import { notFound } from "next/navigation";
import { curso, nivelCurso } from "@/lib/contenido";
import { Cabecera } from "@/components/Cabecera";
import { ListaSecciones } from "@/components/ListaSecciones";
import { DESC_NIVEL, NIVELES_CON_LIBRO, type Nivel } from "@/lib/tipos";
import { IcDerecha } from "@/components/Iconos";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad, type Clave } from "@/lib/idioma";

export function generateStaticParams() {
  return curso().map((n) => ({ nivel: n.id }));
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel } = await params;
  const n = nivelCurso(nivel);
  if (!n) notFound();
  const idioma = await idiomaActual();
  const t = (k: Clave, v?: Record<string, string | number>) => trad(k, idioma, v);
  return (
    <>
      <Cabecera atras="/" titulo={t("cur.niveles")} />
      <main className="envoltorio">
        <section style={{ padding: "18px 0 14px" }}>
          <span className={`pastilla ${n.id.toLowerCase()}`}>{n.id}</span>
          <h1 style={{ fontSize: 24, margin: "8px 0 2px" }}>{DESC_NIVEL[n.id as Nivel]}</h1>
          <p className="tenue" style={{ margin: 0 }}>
            {t("cur.nivelSub", {
              palabras: n.palabras.toLocaleString(idioma), unidades: n.unidades,
            })}
          </p>
        </section>
        {NIVELES_CON_LIBRO.includes(n.id as Nivel) && (
        <Link href={`/libro/${n.id}`} className="fila" style={{ marginBottom: 12 }}>
          <div className="anillo" style={{ ["--pct" as string]: 100, ["--tono" as string]: "var(--acento)" }}>
            <span className="jp" style={{ fontSize: 15 }}>読</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t("lib2.leer")}</div>
            <div className="tenue">{t("lib2.leerSub")}</div>
          </div>
          <span className="flecha"><IcDerecha size={14} /></span>
        </Link>
        )}
        <Link href={`/n/${n.id}/kanji`} className="fila" style={{ marginBottom: 12 }}>
          <div className="anillo" style={{ ["--pct" as string]: 100, ["--tono" as string]: "var(--tinta-3)" }}>
            <span className="jp" style={{ fontSize: 15 }}>漢</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t("cur.todoKanji")}</div>
            <div className="tenue">{t("cur.todoKanjiSub", { n: n.kanji })}</div>
          </div>
          <span className="flecha"><IcDerecha size={14} /></span>
        </Link>
        {n.gramatica > 0 && (
          <Link href={`/n/${n.id}/gramatica`} className="fila" style={{ marginBottom: 12 }}>
            <div className="anillo" style={{ ["--pct" as string]: 100, ["--tono" as string]: "var(--tinta-3)" }}>
              <span className="jp" style={{ fontSize: 15 }}>文</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{t("cur.todaGram")}</div>
              <div className="tenue">{t("cur.todaGramSub", { n: n.gramatica })}</div>
            </div>
            <span className="flecha"><IcDerecha size={14} /></span>
          </Link>
        )}
        <ListaSecciones nivel={n.id} secciones={n.secciones.map((s) => ({
          id: s.id, ja: s.ja, es: s.es, en: s.en, palabras: s.palabras,
          gramatica: s.gramatica, unidades: s.unidades.length,
        }))} />
      </main>
    </>
  );
}
