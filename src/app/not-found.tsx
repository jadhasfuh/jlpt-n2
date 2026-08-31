import Link from "next/link";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad, type Clave } from "@/lib/idioma";

export default async function NoEncontrada() {
  const idioma = await idiomaActual();
  const t = (k: Clave) => trad(k, idioma);
  return (
    <div className="tarjeta" style={{ marginTop: 64, textAlign: "center", padding: 40 }}>
      <span className="jp" style={{ fontSize: 34, fontWeight: 500, color: "var(--acento)" }}>迷子</span>
      <p style={{ fontSize: 16, marginBottom: 2 }}>{t("err.perdido")}</p>
      <p className="silencio" style={{ marginTop: 0 }}>{t("err.perdidoSub")}</p>
      <Link className="btn primario" href="/">{t("err.inicio")}</Link>
    </div>
  );
}
