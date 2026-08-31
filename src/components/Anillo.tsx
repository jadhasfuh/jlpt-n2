export function Anillo({ pct, tono, texto, tam = 40 }: {
  pct: number; tono: string; texto?: string; tam?: number;
}) {
  return (
    <div
      className="anillo"
      style={{
        ["--pct" as string]: Math.round(pct * 100),
        ["--tono" as string]: tono,
        ["--tam" as string]: `${tam}px`,
      }}
    >
      <span>{texto ?? `${Math.round(pct * 100)}`}</span>
    </div>
  );
}
