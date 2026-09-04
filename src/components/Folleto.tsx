"use client";

/**
 * El pasaje de 情報検索, compuesto como el papel que imita.
 *
 * En el examen de verdad estos ítems no son un texto: son un folleto, un aviso
 * del ayuntamiento o un horario, y la pregunta se responde BUSCANDO el dato,
 * no leyendo de arriba abajo. Puesto como un párrafo corrido —que es como
 * estaba— el ejercicio se convierte en comprensión lectora y se pierde
 * justamente la destreza que mide.
 *
 * Y por eso esto es CSS y no un dibujo generado: un folleto es texto, y
 * nuestras ilustraciones tienen prohibido llevar texto. Lo que se dibuja es la
 * hoja; lo que se lee sigue siendo el texto del banco, con su furigana y su
 * tamaño, y se puede copiar, buscar y leer con un lector de pantalla.
 *
 * La estructura ya está en el propio texto, que usa las marcas de un impreso
 * japonés: 【…】 el título, ■ los apartados, ・ las viñetas, ※ las notas al
 * pie. Aquí sólo se reconocen y se pintan.
 */

type Linea =
  | { t: "titulo"; txt: string }
  | { t: "seccion"; txt: string }
  | { t: "punto"; txt: string }
  | { t: "nota"; txt: string }
  | { t: "texto"; txt: string };

function analiza(texto: string): Linea[] {
  const fuera: Linea[] = [];
  for (const bruto of texto.split("\n")) {
    // Sólo se quita el espacio ideográfico del PRINCIPIO, que es la sangría
    // del impreso y aquí la pone el CSS. Los de en medio se dejan tal cual:
    // son lo que alinea las columnas —「自転車　　　　　　600円」— y con ellos
    // se lee la tabla de un vistazo, que es de lo que va el ejercicio. El CSS
    // los conserva con white-space: pre-wrap.
    const s = bruto.replace(/^[　\s]+/, "").replace(/[　\s]+$/, "");
    if (!s) continue;
    const m = s.match(/^【(.+)】$/);
    if (m) fuera.push({ t: "titulo", txt: m[1] });
    else if (s.startsWith("■")) fuera.push({ t: "seccion", txt: s.slice(1).trim() });
    else if (s.startsWith("・")) fuera.push({ t: "punto", txt: s.slice(1).trim() });
    else if (s.startsWith("※")) fuera.push({ t: "nota", txt: s.slice(1).trim() });
    else fuera.push({ t: "texto", txt: s });
  }
  return fuera;
}

export function Folleto({ texto, notas }: {
  texto: string;
  notas?: { termino: string; glosa: string }[];
}) {
  const lineas = analiza(texto);
  // Si no trae ninguna marca de impreso no es un folleto —hay pasajes que son
  // prosa— y se deja como estaba, que es lo correcto para un texto seguido.
  if (!lineas.some((l) => l.t === "titulo" || l.t === "seccion")) {
    return (
      <div className="tarjeta" style={{ marginBottom: 12 }}>
        <div className="jp" style={{ fontSize: 14.5, lineHeight: 2, whiteSpace: "pre-wrap" }}>
          {texto}
        </div>
        <NotasAlPie notas={notas} />
      </div>
    );
  }

  return (
    <div className="folleto">
      {lineas.map((l, i) => {
        if (l.t === "titulo") return <h3 key={i} className="jp folleto-titulo">{l.txt}</h3>;
        if (l.t === "seccion") return <h4 key={i} className="jp folleto-seccion">{l.txt}</h4>;
        if (l.t === "punto") return <p key={i} className="jp folleto-punto">{l.txt}</p>;
        if (l.t === "nota") return <p key={i} className="jp folleto-nota">※ {l.txt}</p>;
        return <p key={i} className="jp folleto-texto">{l.txt}</p>;
      })}
      <NotasAlPie notas={notas} />
    </div>
  );
}

function NotasAlPie({ notas }: { notas?: { termino: string; glosa: string }[] }) {
  if (!notas || notas.length === 0) return null;
  return (
    <div className="folleto-glosario">
      {notas.map((nt, i) => (
        <div key={i} className="tenue">
          （注{i + 1}）<span className="jp">{nt.termino}</span>：<span className="jp">{nt.glosa}</span>
        </div>
      ))}
    </div>
  );
}
