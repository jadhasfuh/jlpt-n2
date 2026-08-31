"use client";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase";
import { Marca } from "./Marca";
import { IcBien, IcDerecha } from "./Iconos";
import { useAjustes } from "./Ajustes";

/**
 * Entrar con un código de seis cifras enviado al correo.
 *
 * Sólo correo, sin proveedores externos: es una cosa menos que mantener y una
 * dependencia menos de terceros. El código va antes que el enlace mágico
 * porque en el móvil salir al correo y volver rompe la sesión del navegador
 * con demasiada frecuencia; seis cifras se teclean sin salir de aquí.
 */
export function Entrar({ destino = "/perfil" }: { destino?: string }) {
  const { t } = useAjustes();
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [fase, setFase] = useState<"correo" | "codigo">("correo");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const sb = supabaseNavegador();

  const pedirCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return setError("Falta configurar Supabase.");
    setCargando(true); setError("");
    const { error } = await sb.auth.signInWithOtp({
      email: correo.trim(),
      options: { shouldCreateUser: true },
    });
    setCargando(false);
    if (error) return setError(error.message);
    setFase("codigo");
  };

  const comprobar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    setCargando(true); setError("");
    const { error } = await sb.auth.verifyOtp({
      email: correo.trim(), token: codigo.trim(), type: "email",
    });
    setCargando(false);
    if (error) return setError(t("ent.malCodigo"));
    window.location.href = destino;
  };

  return (
    <div style={{ maxWidth: 360, margin: "48px auto 0" }}>
      <Marca tam={26} enlace={false} />
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "20px 0 4px" }}>
        {fase === "correo" ? t("ent.titulo") : t("ent.miraCorreo")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--tinta-2)" }}>
        {fase === "correo" ? t("ent.sub") : t("ent.enviamos", { correo })}
      </p>

      {fase === "correo" ? (
        <>
          <form onSubmit={pedirCodigo}>
            <input
              type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com" autoComplete="email" aria-label={t("ent.tuCorreo")}
              style={campo}
            />
            <button className="btn primario" disabled={cargando}
                    style={{ width: "100%", marginTop: 10, minHeight: 46 }}>
              {cargando ? t("ent.enviando") : <>{t("ent.seguir")} <IcDerecha size={15} /></>}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={comprobar}>
          <input
            inputMode="numeric" required value={codigo} onChange={(e) => setCodigo(e.target.value)}
            placeholder="000000" maxLength={8} autoComplete="one-time-code" aria-label={t("ent.codigo")}
            style={{ ...campo, letterSpacing: ".3em", textAlign: "center", fontSize: 20 }}
          />
          <button className="btn primario" disabled={cargando}
                  style={{ width: "100%", marginTop: 10, minHeight: 46 }}>
            {cargando ? t("ent.comprobando") : <><IcBien size={15} /> {t("ent.entrar")}</>}
          </button>
          <button type="button" className="btn fantasma" style={{ width: "100%", marginTop: 6 }}
                  onClick={() => { setFase("correo"); setCodigo(""); setError(""); }}>
            {t("ent.otroCorreo")}
          </button>
        </form>
      )}

      {error && (
        <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--rojo)" }}>{error}</p>
      )}

      <p className="tenue" style={{ marginTop: 22 }}>
        {t("ent.sinCuenta")}
      </p>
    </div>
  );
}

const campo: React.CSSProperties = {
  width: "100%", padding: "12px 14px", fontSize: 15,
  background: "transparent", color: "var(--tinta)",
  border: "1px solid var(--linea)", borderRadius: "var(--radio-sm)",
};
