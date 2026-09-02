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
        "Si te suscribes, el pago lo procesa Paddle, que actúa como vendedor autorizado: ellos reciben tus datos de pago y de facturación, nosotros no los vemos ni los guardamos. Nos devuelven sólo tu correo y el estado de la suscripción.",
      ]},
      { t: "Qué NO recogemos", p: [
        "No usamos Google Analytics ni ningún rastreador publicitario.",
        "No recogemos tu ubicación, tu agenda de contactos ni el contenido de otras aplicaciones.",
        "No hay perfilado publicitario ni venta de datos a terceros. Nunca.",
      ]},
      { t: "Tus derechos", p: [
        "Puedes borrar tu cuenta tú mismo, sin pedir permiso a nadie: entra en Perfil y pulsa «Borrar la cuenta». Borra el correo y todo el progreso asociado, es inmediato y no se puede deshacer.",
        "Si prefieres que lo hagamos nosotros, o quieres una copia de tus datos o corregirlos, escribe a la dirección de contacto y lo resolvemos.",
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
        "If you subscribe, the payment is processed by Paddle, acting as the authorised reseller: they receive your payment and billing details, and we neither see nor store them. All they pass back to us is your email and the state of the subscription.",
      ]},
      { t: "What we do NOT collect", p: [
        "We don't use Google Analytics or any advertising tracker.",
        "We don't collect your location, your contacts or the contents of other apps.",
        "There is no advertising profiling and no selling of data to third parties. Ever.",
      ]},
      { t: "Your rights", p: [
        "You can delete your account yourself, without asking anyone: go to Profile and tap «Delete account». It deletes the email and all associated progress, it is immediate and cannot be undone.",
        "If you would rather we did it, or you want a copy of your data or a correction, write to the contact address and we will sort it out.",
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

/**
 * Cómo borrar la cuenta, en página propia.
 *
 * Google Play exige un enlace público, alcanzable sin instalar la app y sin
 * iniciar sesión, que nombre la app, enumere los pasos y diga qué se borra y
 * qué se conserva. Esa lista de requisitos es la que manda aquí: por eso está
 * separada de la política de privacidad, aunque se repitan cosas.
 */
const BORRAR: Record<"es" | "en", { titulo: string; intro: string; bloques: Bloque[] }> = {
  es: {
    titulo: "Borrar tus datos o tu cuenta de jlptest",
    intro: "Puedes borrar tu avance, o la cuenta entera, tú mismo y en cualquier momento. Son dos cosas distintas y aquí están las dos.",
    bloques: [
      { t: "Borrar sólo tu avance, conservando la cuenta", p: [
        "1. Abre jlptest y entra con tu correo.",
        "2. Ve a Perfil y pulsa «Borrar mi avance».",
        "3. Confirma. Se borra en éste y en el resto de tus aparatos, no sólo en el que estás usando.",
        "Se borra todo tu historial de estudio: qué palabras y qué puntos de gramática has visto, la etapa de repaso de cada uno, la racha, los XP y los resultados de tus tests y exámenes. Es inmediato y no se puede deshacer.",
        "Se conservan tu cuenta, tu dirección de correo y tu suscripción si la tienes. Vuelves a empezar de cero con la misma cuenta.",
      ]},
      { t: "Borrar la cuenta entera, desde la aplicación", p: [
        "1. Abre jlptest y entra con tu correo (recibirás un código de seis cifras; jlptest no usa contraseña).",
        "2. Ve a Perfil, abajo del todo.",
        "3. Pulsa «Borrar la cuenta» y confirma. El borrado es inmediato y no se puede deshacer.",
      ]},
      { t: "Si prefieres que lo hagamos nosotros", p: [
        "Escribe a adriancar75@hotmail.com desde la misma dirección de correo con la que abriste la cuenta, pidiendo que la borremos. Lo hacemos en un plazo máximo de 30 días y te contestamos cuando esté hecho.",
        "Pedimos que escribas desde esa dirección porque es la única forma que tenemos de saber que la cuenta es tuya.",
      ]},
      { t: "Qué se borra", p: [
        "Tu dirección de correo y tu cuenta de acceso.",
        "Todo tu progreso de estudio: qué palabras y qué puntos de gramática has visto, en qué etapa de repaso está cada uno, tu racha y tus XP.",
        "Los resultados de todos tus tests y exámenes.",
        "Cualquier acceso de cortesía asociado a tu correo.",
        "Los avisos de errata que hayas enviado se conservan sin tu identificador, porque sirven para corregir el contenido y, una vez desligados de ti, no dicen quién los mandó.",
      ]},
      { t: "Qué se conserva, y por cuánto tiempo", p: [
        "Si alguna vez pagaste una suscripción, la factura la conserva Paddle.com, que es quien la emitió como vendedor autorizado. La ley fiscal obliga a guardar las facturas —del orden de cinco años según el país—, así que ese registro no se puede borrar a petición. Nosotros no guardamos datos de tu tarjeta: nunca los hemos visto.",
        "En nuestros servidores no queda ninguna copia de tu cuenta ni de tu progreso después del borrado.",
        "El nombre que hayas escrito en el marcador del test gratuito no está ligado a ninguna cuenta, porque ese test se hace sin registrarse. Si quieres que lo quitemos, dinos qué nombre es y lo borramos.",
      ]},
      { t: "Antes de borrar, si tienes suscripción", p: [
        "Cancela primero la suscripción desde tu perfil, o pídenoslo. Borrar la cuenta no cancela el cobro por sí solo, y no queremos cobrarte por algo que ya no puedes usar.",
      ]},
    ],
  },
  en: {
    titulo: "Deleting your jlptest data or account",
    intro: "You can delete your progress, or the whole account, yourself and at any time. They are two different things and both are covered here.",
    bloques: [
      { t: "Deleting only your progress, keeping the account", p: [
        "1. Open jlptest and sign in with your email.",
        "2. Go to Profile and tap «Delete my progress».",
        "3. Confirm. It is deleted on this and on all your other devices, not just the one you are using.",
        "Your whole study history goes: which words and grammar points you have seen, the review stage of each one, your streak, your XP and the results of your tests and exams. It is immediate and cannot be undone.",
        "Your account, your email address and your subscription, if you have one, are kept. You start again from scratch with the same account.",
      ]},
      { t: "Deleting the whole account, from the app", p: [
        "1. Open jlptest and sign in with your email (you will get a six-digit code; jlptest has no passwords).",
        "2. Go to Profile, at the bottom.",
        "3. Tap «Delete account» and confirm. Deletion is immediate and cannot be undone.",
      ]},
      { t: "If you would rather we did it", p: [
        "Write to adriancar75@hotmail.com from the same email address you signed up with, asking us to delete it. We do it within 30 days at the latest and reply when it is done.",
        "We ask you to write from that address because it is the only way we have of knowing the account is yours.",
      ]},
      { t: "What gets deleted", p: [
        "Your email address and your sign-in account.",
        "All your study progress: which words and grammar points you have seen, what review stage each one is at, your streak and your XP.",
        "The results of all your tests and exams.",
        "Any courtesy access attached to your email.",
        "Any content-error reports you sent are kept without your identifier, because they are used to fix the content and, once detached from you, they say nothing about who sent them.",
      ]},
      { t: "What is kept, and for how long", p: [
        "If you ever paid for a subscription, the invoice is kept by Paddle.com, who issued it as the merchant of record. Tax law requires invoices to be kept — around five years depending on the country — so that record cannot be deleted on request. We do not store your card details: we have never seen them.",
        "No copy of your account or your progress remains on our servers after deletion.",
        "The name you may have typed into the free test leaderboard is not attached to any account, because that test is taken without signing up. If you want it removed, tell us which name it is and we will delete it.",
      ]},
      { t: "Before deleting, if you have a subscription", p: [
        "Cancel the subscription first from your profile, or ask us to. Deleting the account does not cancel the billing by itself, and we do not want to charge you for something you can no longer use.",
      ]},
    ],
  },
};

type Cual = "terminos" | "privacidad" | "reembolsos" | "borrar-cuenta";
const DOCS = { terminos: TERMINOS, privacidad: PRIVACIDAD, reembolsos: REEMBOLSOS,
               "borrar-cuenta": BORRAR };
// Se enlazan en rueda, para poder llegar a cualquiera desde cualquiera.
const SIGUIENTE: Record<Cual, Cual> = {
  terminos: "privacidad", privacidad: "borrar-cuenta",
  "borrar-cuenta": "reembolsos", reembolsos: "terminos",
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
