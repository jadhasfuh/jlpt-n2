import Link from "next/link";

/**
 * La marca: «jlptest» con un disco rojo apoyado en la línea base.
 *
 * El disco es puntuación, no un icono: nunca se agranda respecto al texto, ni
 * se recolorea, ni se mueve. Su diámetro es la mitad de la altura de x, así que
 * se deriva del cuerpo de letra y el lockup aguanta a cualquier tamaño.
 */
export function Marca({ tam = 19, enlace = true }: { tam?: number; enlace?: boolean }) {
  const d = Math.round(tam * 0.37);
  const dentro = (
    <>
      jlp<span>test</span>
      <i className="marca-punto" style={{ width: d, height: d, marginBottom: d * 0.45 }} />
    </>
  );
  if (!enlace) return <span className="marca" style={{ fontSize: tam }}>{dentro}</span>;
  return (
    <Link href="/" className="marca" style={{ fontSize: tam }} aria-label="jlptest, ir al inicio">
      {dentro}
    </Link>
  );
}
