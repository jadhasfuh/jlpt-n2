"use client";
import { useEffect } from "react";

/**
 * Enchufa el service worker. Sólo en producción: en desarrollo se quedaría
 * sirviendo builds viejos y volvería loco a cualquiera.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const id = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* sin conexión sin conexión: la app funciona igual, sólo online */
      });
    }, 2000); // después de pintar, para no competir con la primera carga
    return () => clearTimeout(id);
  }, []);
  return null;
}
