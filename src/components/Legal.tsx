"use client";
import Link from "next/link";
import { useAjustes } from "./Ajustes";

type Bloque = { t: string; p: string[] };

/**
 * Términos y privacidad. Se escriben aquí, en los dos idiomas, porque describen
 * lo que la app hace **de verdad** hoy: sin publicidad, sin rastreo, sin pagos
 * todavía. Cuando eso cambie, este archivo cambia con ello.
 */
const TERMINOS: Record<"es" | "en", { titulo: string; intro: string; bloques: Bloque[] }> = {
  es: {
    titulo: "Términos de uso",
    intro: "Al usar jlptest aceptas lo que sigue. Está escrito en lenguaje llano a propósito.",
    bloques: [
      { t: "Qué es jlptest", p: [
        "Una aplicación para estudiar japonés de cara al examen JLPT (niveles N5 a N1): vocabulario, kanji, gramática, lecturas y exámenes de práctica.",
        "No está afiliada, patrocinada ni aprobada por la Japan Foundation ni por Japan Educational Exchanges and Services, que son quienes organizan el JLPT. «JLPT» se usa aquí sólo para describir a qué examen se dirige el material.",
      ]},
      { t: "El contenido", p: [
        "Todo el material de estudio de jlptest es original. La estructura del examen (qué tipos de pregunta hay y en qué proporción) es información funcional publicada por los organizadores; los exámenes reales están protegidos por derechos de autor y aquí no se reproduce ninguno.",
        "Las listas de vocabulario y kanji proceden de recopilaciones públicas; las definiciones, traducciones, lecturas y preguntas son elaboración propia.",
        "Puedes usar el contenido para estudiar. No puedes revenderlo, redistribuirlo ni usarlo para entrenar modelos sin permiso.",
      ]},
      { t: "Tu cuenta", p: [
        "Puedes estudiar sin cuenta. Si creas una, es para guardar tu progreso y llevarlo entre aparatos.",
        "Eres responsable de mantener el acceso a tu correo, que es la única vía de entrada.",
        "Puedes borrar tu cuenta cuando quieras escribiendo a la dirección de contacto. Se borra también tu progreso.",
      ]},
      { t: "Lo que no prometemos", p: [
        "jlptest no garantiza que apruebes el examen. Es material de estudio, no una preparación oficial.",
        "El servicio se ofrece «tal cual». Hacemos lo posible por que esté disponible y sea correcto, pero puede haber errores en el contenido y cortes en el servicio.",
        "Si encuentras un error en una pregunta o una traducción, avísanos: se corrige.",
      ]},
      { t: "Cambios", p: [
        "Si estos términos cambian de forma relevante, se avisa dentro de la aplicación antes de que se apliquen.",
      ]},
    ],
  },
  en: {
    titulo: "Terms of use",
    intro: "By using jlptest you accept the following. It is deliberately written in plain language.",
    bloques: [
      { t: "What jlptest is", p: [
        "An app for studying Japanese for the JLPT exam (levels N5 to N1): vocabulary, kanji, grammar, reading passages and practice exams.",
        "It is not affiliated with, sponsored by or endorsed by the Japan Foundation or Japan Educational Exchanges and Services, who run the JLPT. “JLPT” is used here only to describe which exam the material is aimed at.",
      ]},
      { t: "The content", p: [
        "All study material in jlptest is original. The exam structure (which question types exist and in what proportion) is functional information published by the organisers; the real exams are copyrighted and none is reproduced here.",
        "Vocabulary and kanji lists come from public compilations; the definitions, translations, readings and questions are our own work.",
        "You may use the content to study. You may not resell it, redistribute it or use it to train models without permission.",
      ]},
      { t: "Your account", p: [
        "You can study without an account. If you create one, it is to save your progress and carry it between devices.",
        "You are responsible for keeping access to your email, which is the only way in.",
        "You can delete your account at any time by writing to the contact address. Your progress is deleted with it.",
      ]},
      { t: "What we don't promise", p: [
        "jlptest does not guarantee that you will pass the exam. It is study material, not official preparation.",
        "The service is provided “as is”. We do our best to keep it available and correct, but there may be mistakes in the content and interruptions in the service.",
        "If you find an error in a question or a translation, tell us and it gets fixed.",
      ]},
      { t: "Changes", p: [
        "If these terms change in any meaningful way, you will be told inside the app before they take effect.",
      ]},
    ],
  },
};

const PRIVACIDAD: Record<"es" | "en", { titulo: string; intro: string; bloques: Bloque[] }> = {
  es: {
    titulo: "Privacidad",
    intro: "Lo corto: no vendemos tus datos, no hay publicidad y no hay rastreadores de terceros.",
    bloques: [
      { t: "Sin cuenta", p: [
        "Si estudias sin cuenta, tu progreso se guarda sólo en el almacenamiento de tu navegador o de tu aparato. No sale de ahí y nosotros no lo vemos.",
        "Si borras los datos del navegador o desinstalas la aplicación, ese progreso se pierde. No tenemos copia.",
      ]},
      { t: "Con cuenta", p: [
        "Guardamos tu dirección de correo y tu progreso de estudio (qué palabras has visto, cuándo toca repasarlas, resultados de exámenes).",
        "El correo se usa para enviarte el código de acceso y, si hiciera falta, para avisarte de algo importante sobre tu cuenta. No enviamos publicidad.",
        "Los datos se guardan en Supabase (infraestructura sobre Amazon Web Services, región Oeste de EE. UU.).",
      ]},
      { t: "Qué NO recogemos", p: [
        "No usamos Google Analytics ni ningún rastreador publicitario.",
        "No recogemos tu ubicación, tu agenda de contactos ni el contenido de otras aplicaciones.",
        "No hay perfilado publicitario ni venta de datos a terceros. Nunca.",
      ]},
      { t: "Tus derechos", p: [
        "Puedes pedir una copia de tus datos, corregirlos o borrarlos escribiendo a la dirección de contacto.",
        "Borrar la cuenta borra el correo y todo el progreso asociado. Es inmediato y no se puede deshacer.",
      ]},
      { t: "Menores", p: [
        "jlptest no está dirigido a menores de 13 años y no recogemos datos de forma consciente de esa edad.",
      ]},
    ],
  },
  en: {
    titulo: "Privacy",
    intro: "The short version: we don't sell your data, there are no ads and there are no third-party trackers.",
    bloques: [
      { t: "Without an account", p: [
        "If you study without an account, your progress is stored only in your browser or device storage. It never leaves it and we cannot see it.",
        "If you clear your browser data or uninstall the app, that progress is lost. We have no copy.",
      ]},
      { t: "With an account", p: [
        "We store your email address and your study progress (which words you've seen, when they are due, exam results).",
        "The email is used to send you the sign-in code and, if needed, to tell you something important about your account. We do not send marketing.",
        "Data is stored on Supabase (infrastructure on Amazon Web Services, US West region).",
      ]},
      { t: "What we do NOT collect", p: [
        "We don't use Google Analytics or any advertising tracker.",
        "We don't collect your location, your contacts or the contents of other apps.",
        "There is no advertising profiling and no selling of data to third parties. Ever.",
      ]},
      { t: "Your rights", p: [
        "You can request a copy of your data, correct it or delete it by writing to the contact address.",
        "Deleting your account deletes the email and all associated progress. It is immediate and cannot be undone.",
      ]},
      { t: "Minors", p: [
        "jlptest is not aimed at children under 13 and we do not knowingly collect data from that age group.",
      ]},
    ],
  },
};

export function Legal({ cual }: { cual: "terminos" | "privacidad" }) {
  const { idioma } = useAjustes();
  const d = (cual === "terminos" ? TERMINOS : PRIVACIDAD)[idioma];
  const otra = cual === "terminos" ? "privacidad" : "terminos";
  const nombreOtra = (cual === "terminos" ? PRIVACIDAD : TERMINOS)[idioma].titulo;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 6px" }}>{d.titulo}</h1>
      <p style={{ margin: "0 0 6px", fontSize: 13.5, color: "var(--tinta-2)" }}>{d.intro}</p>
      <p className="tenue" style={{ marginTop: 0 }}>
        {idioma === "es" ? "Última actualización" : "Last updated"}: 2026-08-31
      </p>

      {d.bloques.map((b) => (
        <section key={b.t} style={{ marginTop: 22 }}>
          <h2 className="enc-seccion">{b.t}</h2>
          {b.p.map((x, i) => (
            <p key={i} style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--tinta-2)", margin: "0 0 10px" }}>
              {x}
            </p>
          ))}
        </section>
      ))}

      <section style={{ marginTop: 22 }}>
        <h2 className="enc-seccion">{idioma === "es" ? "Contacto" : "Contact"}</h2>
        <p style={{ fontSize: 13.5, color: "var(--tinta-2)" }}>
          {/* Correo real de contacto. Cuando el dominio tenga reenvío se
              puede volver a una dirección @jlptest.org que apunte aquí. */}
          <a href="mailto:adriancar75@hotmail.com" style={{ color: "var(--acento)" }}>
            adriancar75@hotmail.com
          </a>
        </p>
      </section>

      <Link href={`/legal/${otra}`} className="btn" style={{ width: "100%", margin: "24px 0 12px" }}>
        {nombreOtra}
      </Link>
    </div>
  );
}
