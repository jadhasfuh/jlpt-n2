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
        "Puedes borrar tu cuenta cuando quieras desde tu perfil, sin pedírnoslo. Se borra también tu progreso y tus resultados, y no hay vuelta atrás.",
      ]},
      { t: "Suscripción, cobro y reembolsos", p: [
        "Parte de jlptest se usa gratis y sin cuenta. El acceso completo a los cinco niveles se vende como suscripción mensual, con el precio indicado en la página de suscripción antes de pagar. El precio se muestra en pesos mexicanos; si tu país aplica impuestos sobre el servicio, se añaden en el momento del pago.",
        "El cobro lo gestiona Paddle.com, que actúa como vendedor autorizado (merchant of record) y emite la factura. No guardamos ni vemos los datos de tu tarjeta.",
        "La suscripción se renueva automáticamente cada mes hasta que la canceles. Puedes cancelarla en cualquier momento desde tu perfil, en dos toques y sin dar explicaciones. Al cancelar conservas el acceso hasta el final del periodo que ya has pagado; no se cobra nada más después.",
        "Si algo no funciona como esperabas, escríbenos dentro de los 14 días siguientes al cobro y te devolvemos el dinero de ese periodo, sin preguntas. Pasado ese plazo se estudia caso por caso. Las devoluciones las tramita Paddle y vuelven al mismo medio de pago.",
        "Si borras tu cuenta, la suscripción NO se cancela sola: cancélala antes, o escríbenos y lo hacemos nosotros.",
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
        "You can delete your account at any time from your profile, without asking us. Your progress and results go with it, and there is no undo.",
      ]},
      { t: "Subscription, billing and refunds", p: [
        "Part of jlptest is free and needs no account. Full access to all five levels is sold as a monthly subscription, with the price shown on the subscription page before you pay. Prices are shown in Mexican pesos; if your country charges tax on the service, it is added at checkout.",
        "Billing is handled by Paddle.com, acting as the authorised reseller (merchant of record) and issuing the invoice. We never store or see your card details.",
        "The subscription renews automatically each month until you cancel. You can cancel at any time from your profile, in two taps and without giving a reason. When you cancel you keep access until the end of the period you already paid for; nothing is charged after that.",
        "If it isn't what you expected, write to us within 14 days of the charge and we refund that period, no questions asked. After that we look at it case by case. Refunds are processed by Paddle and go back to the same payment method.",
        "Deleting your account does NOT cancel the subscription: cancel it first, or write to us and we'll do it.",
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


/**
 * Reembolsos, en página propia.
 *
 * Lo mismo está dentro de los términos, pero Paddle pide una URL separada para
 * cada una de las tres políticas antes de verificar el dominio, y un enlace a
 * un apartado en mitad de otro documento no siempre se lo dan por bueno. Al
 * comprador tampoco le viene mal encontrarlo sin tener que leer los términos
 * enteros: si busca esto, es porque ya tiene una duda concreta.
 */
const REEMBOLSOS: Record<"es" | "en", { titulo: string; intro: string; bloques: Bloque[] }> = {
  es: {
    titulo: "Reembolsos y cancelación",
    intro: "Cómo se cobra, cómo se cancela y cómo se devuelve el dinero. En lenguaje llano.",
    bloques: [
      { t: "Qué se cobra", p: [
        "El acceso completo a los cinco niveles cuesta 79 pesos mexicanos al mes. El precio aparece en la página de suscripción antes de pagar.",
        "Si tu país aplica impuestos sobre el servicio, se añaden en el momento del pago y se ven antes de confirmar.",
        "El cobro lo gestiona Paddle.com, que actúa como vendedor autorizado y emite la factura. No guardamos ni vemos los datos de tu tarjeta.",
      ]},
      { t: "Renovación", p: [
        "La suscripción se renueva automáticamente cada mes hasta que la canceles. No hay permanencia mínima.",
        "El cobro se hace el mismo día de cada mes. Paddle te envía la factura por correo.",
      ]},
      { t: "Cancelar", p: [
        "Puedes cancelar en cualquier momento desde tu perfil, en dos toques y sin dar explicaciones. No hay que escribir a nadie ni esperar respuesta.",
        "Al cancelar conservas el acceso hasta el final del periodo que ya has pagado. No se cobra nada después.",
        "Si borras tu cuenta, la suscripción NO se cancela sola: cancélala antes, o escríbenos y lo hacemos nosotros.",
      ]},
      { t: "Devoluciones", p: [
        "Si la app no es lo que esperabas, escríbenos dentro de los 14 días siguientes al cobro y te devolvemos el dinero de ese periodo, sin preguntas.",
        "Pasado ese plazo lo estudiamos caso por caso. Si algo ha fallado por nuestra parte, se devuelve.",
        "Las devoluciones las tramita Paddle y vuelven al mismo medio de pago. Suelen tardar entre 3 y 10 días hábiles según el banco.",
      ]},
      { t: "Cómo pedirlo", p: [
        "Escríbenos a la dirección de contacto que aparece abajo, desde el mismo correo con el que tienes la cuenta. No hace falta más.",
        "Contestamos en un plazo máximo de 48 horas.",
      ]},
    ],
  },
  en: {
    titulo: "Refunds and cancellation",
    intro: "How billing, cancellation and refunds work. In plain language.",
    bloques: [
      { t: "What you pay", p: [
        "Full access to all five levels costs MX$79 per month. The price is shown on the subscription page before you pay.",
        "If your country charges tax on the service, it is added at checkout and shown before you confirm.",
        "Billing is handled by Paddle.com, acting as the authorised reseller and issuing the invoice. We never store or see your card details.",
      ]},
      { t: "Renewal", p: [
        "The subscription renews automatically each month until you cancel. There is no minimum term.",
        "You are charged on the same day each month. Paddle emails you the invoice.",
      ]},
      { t: "Cancelling", p: [
        "You can cancel at any time from your profile, in two taps and without giving a reason. You don't have to write to anyone or wait for a reply.",
        "When you cancel you keep access until the end of the period you already paid for. Nothing is charged after that.",
        "Deleting your account does NOT cancel the subscription: cancel it first, or write to us and we'll do it.",
      ]},
      { t: "Refunds", p: [
        "If the app isn't what you expected, write to us within 14 days of the charge and we refund that period, no questions asked.",
        "After that we look at it case by case. If something went wrong on our side, we refund it.",
        "Refunds are processed by Paddle and go back to the same payment method. They usually take 3 to 10 working days depending on your bank.",
      ]},
      { t: "How to ask", p: [
        "Write to the contact address below, from the same email address your account uses. That's all we need.",
        "We reply within 48 hours at the latest.",
      ]},
    ],
  },
};

type Cual = "terminos" | "privacidad" | "reembolsos";
const DOCS = { terminos: TERMINOS, privacidad: PRIVACIDAD, reembolsos: REEMBOLSOS };
// Las tres se enlazan en rueda, para poder llegar a cualquiera desde cualquiera.
const SIGUIENTE: Record<Cual, Cual> = {
  terminos: "privacidad", privacidad: "reembolsos", reembolsos: "terminos",
};

export function Legal({ cual }: { cual: Cual }) {
  const { idioma } = useAjustes();
  const d = DOCS[cual][idioma];
  const otra = SIGUIENTE[cual];
  const nombreOtra = DOCS[otra][idioma].titulo;

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
