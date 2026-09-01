import { NextResponse } from "next/server";

/**
 * Digital Asset Links: lo que le dice a Android que esta web y esa app son de
 * la misma persona.
 *
 * Sin esto, la TWA arranca con la barra del navegador encima —la app parece un
 * atajo a una página, no una app—, así que es requisito para que valga la pena
 * publicarla.
 *
 * La huella va en una variable de entorno y no escrita aquí por una razón de
 * orden: con App Signing, la huella buena no existe hasta que Play recibe el
 * primer envío y firma con SU clave. Escribirla en el código obligaría a un
 * commit y un despliegue justo en mitad del alta; así se pega en Railway y
 * listo.
 *
 * Admite varias separadas por comas: durante las pruebas conviven la de subida
 * (la del llavero local) y la que Play genera al firmar.
 */
export const dynamic = "force-dynamic";

const PAQUETE = process.env.ANDROID_PAQUETE || "org.jlptest.twa";

export function GET() {
  const huellas = (process.env.ANDROID_HUELLAS ?? "")
    .split(",").map((h) => h.trim().toUpperCase()).filter(Boolean);

  const cuerpo = huellas.map((huella) => ({
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: PAQUETE,
      sha256_cert_fingerprints: [huella],
    },
  }));

  // Sin huellas se devuelve una lista vacía, que es JSON válido: Android lo
  // lee, no encuentra la suya y deja la barra. Es lo correcto mientras la app
  // no exista, y evita servir un 404 que confunde al verificador.
  return NextResponse.json(cuerpo, {
    headers: { "content-type": "application/json" },
  });
}
