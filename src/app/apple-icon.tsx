import { ImageResponse } from "next/og";

// iOS no admite SVG como icono de pantalla de inicio, así que este se genera
// como PNG en el build. Misma construcción que icon.svg, a escala 180/56:
// cuadrado neutral-900, «jt» centrado y el disco rojo arriba a la derecha.
// (Sin esquinas redondeadas: iOS aplica su propia máscara.)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          alignItems: "center", justifyContent: "center", position: "relative",
          background: "#292b31", color: "#e4e7f5",
        }}
      >
        <div style={{ fontSize: 71, fontWeight: 600, letterSpacing: -3.5, lineHeight: 1 }}>jt</div>
        <div style={{
          position: "absolute", top: 42, right: 35,
          width: 29, height: 29, borderRadius: 29, background: "#d7263d",
        }} />
      </div>
    ),
    size,
  );
}
