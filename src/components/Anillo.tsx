export function Anillo({ pct, tono, texto }: { pct: number; tono: string; texto?: string }) {
  return (
    <div className="anillo" style={{ ["--pct" as string]: Math.round(pct * 100), ["--tono" as string]: tono }}>
      <span>{texto ?? `${Math.round(pct * 100)}`}</span>
    </div>
  );
}
