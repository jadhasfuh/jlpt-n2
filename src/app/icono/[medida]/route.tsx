import { ImageResponse } from "next/og";

/**
 * Los iconos PNG que pide Android.
 *
 * El manifiesto sólo traía un SVG y el de 180 de iOS, y con eso Play no pasa:
 * exige 192 y 512 en PNG, y un enmascarable aparte.
 *
 * Se generan aquí en vez de guardarse como ficheros para que no puedan
 * desacordarse del icono real: es la misma construcción que `icon.svg` —
 * cuadrado neutral-900, «jt» centrado y el disco rojo arriba a la derecha—,
 * escalada al tamaño que se pida.
 */
export const dynamic = "force-static";

const MEDIDAS: Record<string, { lado: number; seguro: boolean }> = {
  "192": { lado: 192, seguro: false },
  "512": { lado: 512, seguro: false },
  // Android recorta el icono enmascarable con la forma que le dé la gana, y
  // sólo garantiza el círculo central del 80 %. Así que aquí el dibujo se
  // encoge y el fondo llena todo: si no, el disco rojo acaba cortado.
  "maskable": { lado: 512, seguro: true },
};

export function generateStaticParams() {
  return Object.keys(MEDIDAS).map((medida) => ({ medida }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ medida: string }> }) {
  const { medida } = await params;
  const m = MEDIDAS[medida];
  if (!m) return new Response("no existe", { status: 404 });

  const { lado, seguro } = m;
  // Las proporciones son las de icon.svg, que está en un lienzo de 56:
  // texto centrado con la base en y=36 y cuerpo 22, y el disco en (40,5; 17,5)
  // con radio 4,5. Antes se colocaba «a ojo» con flex y no coincidían.
  //
  // El enmascarable encoge el conjunto al 80 % alrededor del centro: Android
  // sólo garantiza el círculo central, y sin esto el disco quedaba cortado.
  const k = seguro ? 0.8 : 1;
  const c = (v: number) => (0.5 + ((v / 56) - 0.5) * k) * lado;   // punto del lienzo
  const t = (v: number) => (v / 56) * k * lado;                    // tamaño

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        // Fondo del icono es el mismo que el del splash y el de la app (--papel, #161826). Con otro tono se veía el cuadrado del icono recortado sobre la pantalla de arranque de Android.
        background: "#161826", color: "#e4e7f5",
      }}>
        <div style={{
          position: "absolute", left: 0, top: c(36) - t(22), width: lado,
          display: "flex", justifyContent: "center",
          fontSize: t(22), letterSpacing: -t(1.1), lineHeight: 1,
        }}>jt</div>
        <div style={{
          position: "absolute",
          left: c(40.5) - t(4.5), top: c(17.5) - t(4.5),
          width: t(9), height: t(9), borderRadius: lado, background: "#d7263d",
        }} />
      </div>
    ),
    { width: lado, height: lado },
  );
}
