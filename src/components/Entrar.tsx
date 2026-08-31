"use client";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase";
import { Marca } from "./Marca";
import { IcBien, IcDerecha } from "./Iconos";

/**
 * Entrar con correo (código de seis cifras) o con Google.
 *
 * El código va antes que el enlace mágico a propósito: en el móvil, salir al
 * correo y volver rompe la sesión del navegador con demasiada frecuencia, y
 * teclear seis cifras se hace sin salir de aquí.
 */
export function Entrar({ destino = "/perfil" }: { destino?: string }) {
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
    if (error) return setError("Ese código no vale. Mira que no haya caducado.");
    window.location.href = destino;
  };

  const conGoogle = async () => {
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}` },
    });
  };

  return (
    <div style={{ maxWidth: 360, margin: "48px auto 0" }}>
      <Marca tam={26} enlace={false} />
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "20px 0 4px" }}>
        {fase === "correo" ? "Entrar o crear cuenta" : "Mira tu correo"}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--tinta-2)" }}>
        {fase === "correo"
          ? "La cuenta guarda tu progreso y lo lleva de un aparato a otro."
          : `Enviamos seis cifras a ${correo}.`}
      </p>

      {fase === "correo" ? (
        <>
          <form onSubmit={pedirCodigo}>
            <input
              type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com" autoComplete="email" aria-label="Tu correo"
              style={campo}
            />
            <button className="btn primario" disabled={cargando}
                    style={{ width: "100%", marginTop: 10, minHeight: 46 }}>
              {cargando ? "Enviando…" : <>Seguir <IcDerecha size={15} /></>}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <i style={{ flex: 1, height: 1, background: "var(--linea)" }} />
            <span className="tenue">o</span>
            <i style={{ flex: 1, height: 1, background: "var(--linea)" }} />
          </div>

          <button className="btn" style={{ width: "100%", minHeight: 46 }} onClick={conGoogle}>
            Entrar con Google
          </button>
        </>
      ) : (
        <form onSubmit={comprobar}>
          <input
            inputMode="numeric" required value={codigo} onChange={(e) => setCodigo(e.target.value)}
            placeholder="000000" maxLength={8} autoComplete="one-time-code" aria-label="Código"
            style={{ ...campo, letterSpacing: ".3em", textAlign: "center", fontSize: 20 }}
          />
          <button className="btn primario" disabled={cargando}
                  style={{ width: "100%", marginTop: 10, minHeight: 46 }}>
            {cargando ? "Comprobando…" : <><IcBien size={15} /> Entrar</>}
          </button>
          <button type="button" className="btn fantasma" style={{ width: "100%", marginTop: 6 }}
                  onClick={() => { setFase("correo"); setCodigo(""); setError(""); }}>
            Usar otro correo
          </button>
        </form>
      )}

      {error && (
        <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--rojo)" }}>{error}</p>
      )}

      <p className="tenue" style={{ marginTop: 22 }}>
        Sin cuenta también se puede estudiar: el progreso se queda en este navegador.
      </p>
    </div>
  );
}

const campo: React.CSSProperties = {
  width: "100%", padding: "12px 14px", fontSize: 15,
  background: "transparent", color: "var(--tinta)",
  border: "1px solid var(--linea)", borderRadius: "var(--radio-sm)",
};
