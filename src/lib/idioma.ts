/**
 * Los textos de la interfaz, en español e inglés.
 *
 * Sin librería de i18n a propósito: son un par de cientos de cadenas y una
 * tabla se lee mejor que una cadena de herramientas. Añadir un idioma es
 * añadir una columna aquí.
 *
 * El **contenido** (significados de palabras, gramática y kanji) no pasa por
 * aquí: ya viene con sus campos `es` y `en` desde la base, y se elige con
 * `significado()`.
 */
export const IDIOMAS = [
  { id: "es", nombre: "Español" },
  { id: "en", nombre: "English" },
] as const;

export type Idioma = (typeof IDIOMAS)[number]["id"];
export const IDIOMA_POR_DEFECTO: Idioma = "es";
export const COOKIE_IDIOMA = "jlpt.idioma";

export function esIdioma(v: unknown): v is Idioma {
  return typeof v === "string" && IDIOMAS.some((i) => i.id === v);
}

/** Del encabezado Accept-Language del navegador al idioma que tengamos. */
export function idiomaDeCabecera(accept: string | null | undefined): Idioma {
  if (!accept) return IDIOMA_POR_DEFECTO;
  for (const trozo of accept.split(",")) {
    const cod = trozo.split(";")[0].trim().toLowerCase();
    if (cod.startsWith("es")) return "es";
    if (cod.startsWith("en")) return "en";
  }
  // Un japonés estudiando japonés no quiere la app en español: al inglés.
  return "en";
}

type Entrada = Record<Idioma, string>;

const T = {
  // ---------------------------------------------------------------- general
  "app.lema": { es: "Vocabulario y gramática del JLPT, del N5 al N1, en unidades de 20 palabras.",
                en: "JLPT vocabulary and grammar, N5 to N1, in units of 20 words." },
  "nav.curso":   { es: "Curso",       en: "Course" },
  "nav.repaso":  { es: "Repaso",      en: "Review" },
  "nav.perfil":  { es: "Perfil",      en: "Profile" },
  "nav.dicc":    { es: "Diccionario", en: "Dictionary" },
  "nav.examen":  { es: "Examen", en: "Exam" },
  "com.atras":     { es: "Atrás",     en: "Back" },
  "com.seccion":   { es: "Sección",   en: "Section" },
  "com.cerrar":    { es: "Cerrar",    en: "Close" },
  "com.siguiente": { es: "Siguiente", en: "Next" },
  "com.volver":    { es: "Volver",    en: "Back" },
  "com.cargando":  { es: "Cargando…", en: "Loading…" },
  "err.perdido":   { es: "Esta página no existe.", en: "This page doesn't exist." },
  "err.perdidoSub":{ es: "Quizá cambió de sitio, o el enlace venía torcido.",
                     en: "It may have moved, or the link was wrong." },
  "err.roto":      { es: "Algo se ha roto por aquí.", en: "Something broke here." },
  "err.rotoSub":   { es: "No es culpa tuya. Tu progreso está a salvo.",
                     en: "Not your fault. Your progress is safe." },
  "err.reintentar":{ es: "Reintentar", en: "Try again" },
  "err.inicio":    { es: "Ir al inicio", en: "Go home" },
  "com.buscar":    { es: "Buscar una palabra", en: "Search for a word" },
  "com.buscarDicc": { es: "Buscar en el diccionario", en: "Search the dictionary" },
  "com.tema":      { es: "Tema {v}; pulsa para cambiarlo", en: "{v} theme; tap to change" },
  "tema.claro":  { es: "claro",      en: "light" },
  "tema.oscuro": { es: "oscuro",     en: "dark" },
  "tema.auto":   { es: "automático", en: "automatic" },
  "com.escuchar": { es: "Escuchar", en: "Listen" },
  "com.pausar":   { es: "Pausar",   en: "Pause" },
  "com.seguir":   { es: "Seguir",   en: "Resume" },
  "com.detener":  { es: "Detener",  en: "Stop" },
  "com.reproducir": { es: "Reproducir", en: "Play" },
  "com.otraVez":  { es: "Otra vez", en: "Again" },

  // ------------------------------------------------------------------ inicio
  "inicio.sub": { es: "{palabras} palabras y {gramatica} puntos de gramática, en unidades de 20. Elige por dónde empezar.",
                  en: "{palabras} words and {gramatica} grammar points, in units of 20. Pick where to start." },
  "inicio.xp":        { es: "XP",         en: "XP" },
  "inicio.dias":      { es: "días",       en: "days" },
  "inicio.dominadas": { es: "dominadas",  en: "mastered" },
  "inicio.unidades":  { es: "unidades",   en: "units" },
  "inicio.niveles":   { es: "Niveles",    en: "Levels" },
  "inicio.tocaRepasar": { es: "Te toca repasar", en: "Time to review" },
  "inicio.vencidas_1":  { es: "{n} palabra vencida",  en: "{n} word due" },
  "inicio.vencidas_n":  { es: "{n} palabras vencidas", en: "{n} words due" },
  "inicio.masHoy":      { es: " · {n} más hoy", en: " · {n} more today" },
  "inicio.examen":      { es: "Mini examen", en: "Mini exam" },
  "inicio.examenSub":   { es: "Con la estructura del JLPT, de 5 a 105 minutos",
                          en: "Real JLPT structure, from 5 to 105 minutes" },
  "inicio.cincoMin":    { es: "Cinco minutos", en: "Five minutes" },
  "inicio.cincoMinSub": { es: "Repaso corto de lo que tienes más flojo",
                          en: "A short review of your weakest words" },
  "inicio.resumenNivel": { es: "{palabras} palabras · {secciones} secciones",
                           en: "{palabras} words · {secciones} sections" },
  "inicio.libre": { es: "La sección 人と体 de cada nivel es libre. Para el resto hará falta una cuenta.",
                    en: "The 人と体 section of every level is free. The rest needs an account." },

  // ------------------------------------------------------------------ niveles
  "nivel.N5": { es: "Los primeros pasos",  en: "First steps" },
  "nivel.N4": { es: "Base cotidiana",      en: "Everyday basics" },
  "nivel.N3": { es: "El salto intermedio", en: "The intermediate jump" },
  "nivel.N2": { es: "Nivel avanzado",      en: "Advanced level" },
  "nivel.N1": { es: "El nivel más alto",   en: "The highest level" },

  // ------------------------------------------------------------------ unidad
  "uni.unidadDe":  { es: "unidad {i} de {n}", en: "unit {i} of {n}" },
  "uni.practicada":{ es: "practicada", en: "practised" },
  "uni.mejorTest": { es: " · mejor test {n}%", en: " · best test {n}%" },
  "uni.practicar": { es: "Practicar", en: "Practise" },
  "uni.test":      { es: "Test",      en: "Test" },
  "uni.escucha":   { es: "Ejercicio de oído", en: "Listening exercise" },
  "uni.verSig":    { es: "ver significado", en: "show meaning" },
  "uni.siguienteUnidad": { es: "Siguiente unidad", en: "Next unit" },
  "uni.est.dominada":    { es: "dominada", en: "mastered" },
  "uni.est.aprendiendo": { es: "en curso", en: "learning" },
  "uni.est.nueva":       { es: "nueva",    en: "new" },
  "uni.est.vencida":     { es: "vencida",  en: "due" },

  // ---------------------------------------------------------------- práctica
  "pra.verSig":     { es: "Ver significado", en: "Show meaning" },
  "pra.noSabia":    { es: "No la sabía", en: "Didn't know it" },
  "pra.siSabia":    { es: "La sabía",    en: "Knew it" },
  "pra.vuelven":    { es: "Las que falles vuelven antes de cerrar la sesión",
                      en: "The ones you miss come back before the session ends" },
  "pra.porAfianzar":{ es: "Quedan {n} por afianzar", en: "{n} left to nail down" },
  "pra.vuelvenAhora": { es: "Las que no te salieron vuelven ahora, antes de cerrar.",
                        en: "The ones you missed come back now, before we finish." },
  "pra.repasarlas": { es: "Repasarlas", en: "Review them" },
  "pra.terminada":  { es: "Práctica terminada", en: "Practice finished" },
  "pra.resumen":    { es: "{n} tarjetas · +{xp} XP", en: "{n} cards · +{xp} XP" },
  "pra.paraProxima":{ es: " · {n} para la próxima", en: " · {n} for next time" },
  "pra.volverUnidad": { es: "Volver a la unidad", en: "Back to the unit" },

  // -------------------------------------------------------------------- test
  "test.queSignifica": { es: "¿Qué significa?", en: "What does it mean?" },
  "test.correcta":     { es: "correcta", en: "correct" },
  "test.tuRespuesta":  { es: "tu respuesta", en: "your answer" },
  "test.vuelveEn":     { es: "Vuelve dentro de {t}.", en: "Comes back in {t}." },
  "test.vuelveYa":     { es: "Vuelve en este mismo repaso.", en: "Comes back in this same review." },
  "test.sinDefinicion":{ es: "Esta unidad no tiene palabras con definición.",
                         en: "This unit has no words with a definition." },
  "test.deN":          { es: "{a} de {n}", en: "{a} of {n}" },
  "test.aprobado":     { es: " · ¡aprobado!", en: " · passed!" },
  "test.repasa":       { es: " · repasa y vuelve a intentarlo", en: " · review and try again" },
  "test.vuelvenPronto_1": { es: "{n} palabra vuelve pronto en Repaso",
                            en: "{n} word comes back soon in Review" },
  "test.vuelvenPronto_n": { es: "{n} palabras vuelven pronto en Repaso",
                            en: "{n} words come back soon in Review" },

  // ------------------------------------------------------------------ repaso
  "rep.titulo":   { es: "Repaso", en: "Review" },
  "rep.hoyTocan": { es: "Hoy te tocan {n} de las {vivas} que llevas vivas.",
                    en: "Today you have {n} of the {vivas} you have in play." },
  "rep.yaLlevas": { es: " Ya llevas {n} hechas.", en: " You've done {n} already." },
  "rep.tuCola":   { es: "Tu cola de hoy", en: "Today's queue" },
  "rep.nVencidas":{ es: "{n} vencidas", en: "{n} due" },
  "rep.nHoy":     { es: "{n} tocan hoy", en: "{n} come up today" },
  "rep.empezar_1":{ es: "Empezar · {n} tarjeta", en: "Start · {n} card" },
  "rep.empezar_n":{ es: "Empezar · {n} tarjetas", en: "Start · {n} cards" },
  "rep.sieteDias":{ es: "Próximos siete días", en: "Next seven days" },
  "rep.masFlojo": { es: "Lo más flojo", en: "Weakest words" },
  "rep.fallos_1": { es: "{n} fallo",  en: "{n} miss" },
  "rep.fallos_n": { es: "{n} fallos", en: "{n} misses" },
  "rep.todos":    { es: "Todos", en: "All" },
  "rep.nadaVencido": { es: "Nada vencido ahora mismo.", en: "Nothing due right now." },
  "rep.proxima":  { es: "La próxima palabra vuelve en {t}. Cada acierto la manda más lejos.",
                    en: "The next word returns in {t}. Every hit pushes it further out." },
  "rep.sinNada":  { es: "Haz una sesión y las palabras irán entrando aquí solas.",
                    en: "Do a session and words will start showing up here on their own." },
  "rep.irAlCurso":{ es: "Ir al curso", en: "Go to the course" },
  "rep.terminado":{ es: "Repaso del día terminado: {n} palabras.",
                    en: "Today's review finished: {n} words." },
  "rep.quedan":   { es: "Quedan {n} vencidas para mañana. El tope de hoy era {tope}, calculado sobre tu ritmo de la última semana.",
                    en: "{n} due words are left for tomorrow. Today's cap was {tope}, worked out from your pace over the last week." },
  "rep.dejarlo":  { es: "Dejarlo por hoy", en: "Stop for today" },
  "rep.dias":     { es: "dom,lun,mar,mié,jue,vie,sáb", en: "Sun,Mon,Tue,Wed,Thu,Fri,Sat" },
  "rep.hoy":      { es: "hoy", en: "today" },

  // ----------------------------------------------------------------- escucha
  "esc.elegirSig": { es: "Escucha y elige el significado", en: "Listen and pick the meaning" },
  "esc.elegirPal": { es: "Escucha y elige la palabra",     en: "Listen and pick the word" },
  "esc.noReconozco": { es: "No la reconozco · verla escrita",
                       en: "I don't recognise it · show it written" },
  "esc.deOido":    { es: "{a} de {n} de oído", en: "{a} of {n} by ear" },
  "esc.sinVoz":    { es: "Este dispositivo no tiene voz japonesa",
                     en: "This device has no Japanese voice" },
  "esc.sinVozSub": { es: "En iPhone y Mac suele venir instalada. En Android se añade desde Ajustes → Idiomas → Salida de texto a voz, descargando el paquete de japonés.",
                     en: "iPhone and Mac usually have one. On Android add it in Settings → Languages → Text-to-speech output, downloading the Japanese pack." },

  // ------------------------------------------------------------------ perfil
  "per.tuAvance":  { es: "Tu avance", en: "Your progress" },
  "per.xpAcum":    { es: "XP acumulado", en: "XP earned" },
  "per.diasSeguidos": { es: "días seguidos", en: "day streak" },
  "per.palDominadas": { es: "palabras dominadas", en: "words mastered" },
  "per.palVistas":    { es: "palabras vistas", en: "words seen" },
  "per.uniPracticadas": { es: "unidades practicadas", en: "units practised" },
  "per.pctVocab":  { es: "{pct}% del vocabulario de los cinco niveles ({total} palabras)",
                     en: "{pct}% of the vocabulary across the five levels ({total} words)" },
  "per.ajustes":   { es: "Ajustes", en: "Settings" },
  "per.idioma":    { es: "Idioma", en: "Language" },
  "per.repasosDia":{ es: "Repasos por día", en: "Reviews per day" },
  "per.topeHoy":   { es: "Hoy te enseñará como máximo {n} repasos.",
                     en: "Today it will show you at most {n} reviews." },
  "per.topeAuto":  { es: "En automático sale de tu propio ritmo de la última semana, con un suelo de 40. Así, si dejas la app unos días, no te encuentras un muro de trescientos repasos.",
                     en: "On automatic it follows your own pace over the last week, with a floor of 40. That way, if you skip a few days, you don't come back to a wall of three hundred reviews." },
  "per.automatico":{ es: "Automático", en: "Automatic" },
  "per.sinTope":   { es: "Sin tope", en: "No cap" },
  "per.cuenta":    { es: "Cuenta", en: "Account" },
  "per.tuCuenta":  { es: "Tu cuenta", en: "Your account" },
  "per.accesoCompleto": { es: "acceso completo", en: "full access" },
  "per.gratuita":  { es: "gratuita", en: "free" },
  "per.renueva":   { es: "Se renueva el {fecha}.", en: "Renews on {fecha}." },
  "per.cancelada": { es: "Cancelada; te dura hasta el {fecha}.",
                     en: "Cancelled; yours until {fecha}." },
  "per.salir":     { es: "Salir de la cuenta", en: "Sign out" },
  "per.sinCuenta": { es: "Sin cuenta, tu avance se guarda sólo en este navegador{abierto}. Si lo borras o cambias de aparato, se pierde.",
                     en: "Without an account your progress lives only in this browser{abierto}. Clear it or switch devices and it's gone." },
  "per.todoAbierto": { es: " y todo el contenido está abierto", en: " and all the content is open" },
  "per.entrar":    { es: "Entrar o crear cuenta", en: "Sign in or create an account" },
  "per.borrar":    { es: "Borrar mi avance", en: "Delete my progress" },
  "per.terminos":  { es: "Términos de uso", en: "Terms of use" },
  "per.reembolsos":{ es: "Reembolsos", en: "Refunds" },
  "per.privacidad":{ es: "Privacidad", en: "Privacy" },
  "per.borrarConf":{ es: "¿Borrar todo tu avance en este dispositivo?",
                     en: "Delete all your progress on this device?" },

  // ------------------------------------------------------------------ entrar
  "ent.titulo":    { es: "Entrar o crear cuenta", en: "Sign in or create an account" },
  "ent.sub":       { es: "La cuenta guarda tu progreso y lo lleva de un aparato a otro.",
                     en: "An account saves your progress and carries it between devices." },
  "ent.miraCorreo":{ es: "Mira tu correo", en: "Check your email" },
  "ent.enviamos":  { es: "Enviamos seis cifras a {correo}.", en: "We sent six digits to {correo}." },
  "ent.tuCorreo":  { es: "Tu correo", en: "Your email" },
  "ent.seguir":    { es: "Seguir", en: "Continue" },
  "ent.enviando":  { es: "Enviando…", en: "Sending…" },
  "ent.comprobando": { es: "Comprobando…", en: "Checking…" },
  "ent.entrar":    { es: "Entrar", en: "Sign in" },
  "ent.codigo":    { es: "Código", en: "Code" },
  "ent.otroCorreo":{ es: "Usar otro correo", en: "Use another email" },
  "ent.malCodigo": { es: "Ese código no vale. Mira que no haya caducado.",
                     en: "That code isn't valid. Check that it hasn't expired." },
  "ent.sinCuenta": { es: "Sin cuenta también se puede estudiar: el progreso se queda en este navegador.",
                     en: "You can study without an account too: progress stays in this browser." },



  // ------------------------------------------------------------------ examen
  "ex.titulo":      { es: "Mini examen", en: "Mini exam" },
  "ex.sub":         { es: "Con la estructura del JLPT de verdad: los mismos tipos de pregunta y en la misma proporción.",
                      en: "Built on the real JLPT structure: the same question types, in the same proportion." },
  "ex.nivel":       { es: "Nivel", en: "Level" },
  "ex.queEntra":    { es: "Qué entra", en: "What's included" },
  "ex.todo":        { es: "Todo", en: "Everything" },
  "ex.duracion":    { es: "Duración", en: "Length" },
  "ex.min":         { es: "{n} min", en: "{n} min" },
  "ex.completo":    { es: "Completo", en: "Full exam" },
  "ex.correccion":  { es: "Corrección", en: "Marking" },
  "ex.alMomento":   { es: "Al momento", en: "As I go" },
  "ex.alFinal":     { es: "Al final", en: "At the end" },
  "ex.alMomentoAyuda": { es: "Ves si acertaste después de cada pregunta.",
                         en: "You see whether you got it right after each question." },
  "ex.alFinalAyuda":   { es: "Como en el examen de verdad: todo al terminar.",
                         en: "Like the real exam: everything once you finish." },
  "ex.empezar":     { es: "Empezar · {n} preguntas", en: "Start · {n} questions" },
  "ex.empezar_1":   { es: "Empezar · 1 pregunta", en: "Start · 1 question" },
  "ex.preparando":  { es: "Preparando…", en: "Getting it ready…" },
  "ex.sinPreguntas":{ es: "Todavía no hay preguntas de eso. El banco se va llenando.",
                      en: "No questions for that yet. The bank is still filling up." },
  "ex.bancoCorto":  { es: "El banco tiene {n} preguntas de esto por ahora, así que el examen saldrá algo más corto.",
                      en: "The bank has {n} questions of this kind so far, so the exam will come out a bit shorter." },
  "ex.responder":   { es: "Responder", en: "Answer" },
  "ex.saltar":      { es: "Saltar", en: "Skip" },
  "ex.terminar":    { es: "Terminar", en: "Finish" },
  "ex.seAcabo":     { es: "Se acabó el tiempo", en: "Time's up" },
  "ex.resultado":   { es: "Resultado", en: "Result" },
  "ex.puntos":      { es: "{n} de {total} puntos", en: "{n} of {total} points" },
  "ex.aciertos":    { es: "{a} de {n} preguntas", en: "{a} of {n} questions" },
  "ex.porSeccion":  { es: "Por sección", en: "By section" },
  "ex.repasar":     { es: "Repasar las falladas", en: "Go over the misses" },
  "ex.otroExamen":  { es: "Otro examen", en: "Another exam" },
  "ex.escuchar":    { es: "Escuchar", en: "Play" },
  "ex.sinResponder":{ es: "sin responder", en: "unanswered" },
  "ex.porQue":      { es: "Por qué", en: "Why" },
  "ex.queDice":     { es: "Qué dice la instrucción", en: "What the instruction says" },
  "ex.notaEscala":  { es: "El JLPT puntúa sobre 180, con 60 por bloque: una pregunta de lectura pesa mucho más que una de vocabulario. Aquí se aplica la misma escala.",
                      en: "The JLPT scores out of 180, 60 per block: a reading question weighs far more than a vocabulary one. The same scale applies here." },
  "ex.abandonar":   { es: "¿Dejar el examen? Se pierde lo respondido.",
                      en: "Leave the exam? Your answers will be lost." },


  // --------------------------------------------- lectura, kanji y ordenar
  "lec.sinLectura": { es: "Esta unidad todavía no tiene lectura.",
                      en: "This unit doesn't have a passage yet." },
  "lec.comprension":{ es: "Comprensión", en: "Comprehension" },
  "lec.verTexto":   { es: "Ver el texto", en: "Show the text" },
  "lec.sinLeer":    { es: "Escuchar sin leer", en: "Listen without reading" },
  "lec.frase":      { es: "frase {i} de {n}", en: "sentence {i} of {n}" },
  "lec.anterior":   { es: "anterior", en: "previous" },
  "lec.siguiente":  { es: "siguiente", en: "next" },
  "lec.todoSeguido":{ es: "escuchar todo seguido", en: "listen straight through" },
  "lec.verTrad":    { es: "Ver traducción", en: "Show translation" },
  "lec.ocultarTrad":{ es: "Ocultar traducción", en: "Hide translation" },
  "kan.sinKanji":   { es: "Aquí no hay kanji todavía.", en: "No kanji here yet." },
  "kan.sinTest":    { es: "No hay kanji suficientes para un test.",
                      en: "There aren't enough kanji for a test." },
  "kan.trazos":     { es: "trazos", en: "strokes" },
  "kan.lista":      { es: "Lista", en: "List" },
  "kan.test":       { es: "Test", en: "Test" },
  "ord.corta":      { es: "Esta frase es demasiado corta para ordenarla.",
                      en: "This sentence is too short to reorder." },
  "ord.recons":     { es: "Reconstruye la frase con las fichas.",
                      en: "Rebuild the sentence with the tiles." },
  "ord.toca":       { es: "Toca las fichas de abajo…", en: "Tap the tiles below…" },
  "ord.otraVez":    { es: "Otra vez", en: "Again" },
  "ord.siguiente":  { es: "Siguiente frase", en: "Next sentence" },
  "ord.correcto":   { es: "correcto", en: "correct" },
  "ord.noEraAsi":   { es: "no era ese orden", en: "that wasn't the order" },
  "rap.nada":       { es: "Todavía no hay nada que repasar.", en: "Nothing to review yet." },
  "rap.seLlena":    { es: "Haz una unidad y esto se llena solo.",
                      en: "Do a unit and this fills up by itself." },
  "rap.seguir":     { es: "Seguir repasando", en: "Keep reviewing" },


  // ------------------------------------------------------------- suscripción
  "sus.titulo":     { es: "Suscripción", en: "Subscription" },
  "sus.sub":        { es: "Acceso completo a los cinco niveles, los exámenes y el repaso. Se cancela cuando quieras.",
                      en: "Full access to all five levels, the exams and reviews. Cancel whenever you like." },
  "sus.alMes":      { es: "al mes", en: "per month" },
  "sus.alAno":      { es: "al año", en: "per year" },
  "sus.queIncluye": { es: "Qué incluye", en: "What you get" },
  "sus.p1":         { es: "Los cinco niveles completos, del N5 al N1.",
                      en: "All five levels, N5 through N1." },
  "sus.p2":         { es: "Mini exámenes con preguntas que van rotando.",
                      en: "Mini exams with questions that rotate." },
  "sus.p3":         { es: "Repaso espaciado con tu progreso en todos tus aparatos.",
                      en: "Spaced review, with your progress on every device." },
  "sus.p4":         { es: "Sin anuncios y sin rastreadores. Nunca.",
                      en: "No ads and no trackers. Ever." },
  "sus.suscribirse":{ es: "Suscribirme", en: "Subscribe" },
  "sus.activa":     { es: "Suscripción activa", en: "Active subscription" },
  "sus.cancelada":  { es: "Cancelada", en: "Cancelled" },
  "sus.gracias":    { es: "Tienes acceso completo. Gracias por sostener esto.",
                      en: "You have full access. Thank you for supporting this." },
  "sus.renuevaEl":  { es: "Se renueva el {f}.", en: "Renews on {f}." },
  "sus.valeHasta":  { es: "Sigue valiendo hasta el {f}.", en: "Still valid until {f}." },
  "sus.gestionar":  { es: "Gestionar el pago", en: "Manage billing" },
  "sus.cancelar":   { es: "Cancelar la suscripción", en: "Cancel subscription" },
  "sus.cancelarNota": { es: "Al cancelar sigues teniendo acceso hasta el final del periodo ya pagado.",
                        en: "If you cancel you keep access until the end of the period you already paid for." },
  "sus.entraPrimero": { es: "Necesitas una cuenta para suscribirte. Crearla lleva un minuto y sólo pide tu correo.",
                        en: "You need an account to subscribe. It takes a minute and only asks for your email." },
  "sus.aunNo":      { es: "Este es el precio de la suscripción. El cobro se abre en los próximos días; mientras tanto la app está entera y gratis.",
                      en: "This is the subscription price. Payments open in the coming days; in the meantime the whole app is free." },
  "sus.letraPequena": { es: "El cobro lo gestiona Paddle, que actúa como vendedor y se ocupa de los impuestos de tu país. No guardamos tu tarjeta.",
                        en: "Payments are handled by Paddle, acting as merchant of record and taking care of the taxes in your country. We never store your card." },
  "sus.errorCarga": { es: "No se ha podido cargar la pasarela de pago.",
                      en: "The payment window couldn't load." },
  "sus.errorPortal":{ es: "No se ha podido abrir el portal. Inténtalo otra vez.",
                      en: "The portal couldn't open. Please try again." },
  "per.suscripcion":{ es: "Suscripción", en: "Subscription" },
  "per.borrarCuenta": { es: "Borrar mi cuenta", en: "Delete my account" },
  "per.borrarAviso": { es: "Se borra tu cuenta, tu progreso y tus resultados. No hay vuelta atrás. Si tienes una suscripción activa, cancélala antes.",
                       en: "This deletes your account, your progress and your results. There's no undo. If you have an active subscription, cancel it first." },
  "per.borrarConfirmar": { es: "Sí, borrarlo todo", en: "Yes, delete everything" },
  "per.borrando":   { es: "Borrando…", en: "Deleting…" },


  // ------------------------------------------------------------ reportes
  "com.verSig":    { es: "ver significado", en: "show meaning" },
  "rep2.aria":     { es: "Avisar de un error", en: "Report a mistake" },
  "rep2.titulo":   { es: "¿Hay algo mal aquí?", en: "Something wrong here?" },
  "rep2.sub":      { es: "Lo revisamos y lo corregimos. No hace falta cuenta.",
                     en: "We'll check it and fix it. No account needed." },
  "rep2.m.traduccion": { es: "La traducción", en: "The translation" },
  "rep2.m.lectura":    { es: "La lectura",    en: "The reading" },
  "rep2.m.ejemplo":    { es: "El ejemplo",    en: "The example" },
  "rep2.m.otro":       { es: "Otra cosa",     en: "Something else" },
  "rep2.marcador": { es: "¿Qué debería decir? (opcional)",
                     en: "What should it say? (optional)" },
  "rep2.enviar":   { es: "Enviar el aviso", en: "Send report" },
  "rep2.enviando": { es: "Enviando…", en: "Sending…" },
  "rep2.gracias":  { es: "Gracias", en: "Thank you" },
  "rep2.error":    { es: "No se ha podido enviar. Inténtalo otra vez.",
                     en: "Couldn't send it. Please try again." },

  // ------------------------------------------------------------- diccionario
  "dic.marcador":  { es: "漢字, かな o español…", en: "漢字, かな or English…" },
  "dic.sinResultados": { es: "Sin resultados.", en: "No results." },

  // ------------------------------------------------------------------ ajustes
  "aj.furigana": { es: "Mostrar u ocultar la lectura en kana",
                   en: "Show or hide the kana reading" },
  "aj.significado": { es: "Mostrar u ocultar el significado", en: "Show or hide the meaning" },
  "aj.colores":  { es: "Colorear los kanji según su nivel JLPT",
                   en: "Colour kanji by their JLPT level" },
  "aj.significadoLargo": { es: "significado", en: "meaning" },
  "aj.nivelKanji": { es: "nivel de cada kanji", en: "each kanji's level" },
} satisfies Record<string, Entrada>;

export type Clave = keyof typeof T;

/** Traduce, sustituyendo {marcadores} por sus valores. */
export function t(clave: Clave, idioma: Idioma, vars?: Record<string, string | number>): string {
  const texto = T[clave][idioma] ?? T[clave][IDIOMA_POR_DEFECTO];
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (todo, k) =>
    k in vars ? String(vars[k]) : todo);
}

/** El significado del contenido, que ya viene bilingüe de la base. */
export function significado(
  item: { es?: string | null; en?: string | string[] | null },
  idioma: Idioma,
): string {
  const en = Array.isArray(item.en) ? item.en.join(", ") : (item.en ?? "");
  if (idioma === "en") return en || item.es || "";
  return item.es || en;
}

/** El otro idioma, para enseñarlo debajo en letra pequeña. */
export function significadoSecundario(
  item: { es?: string | null; en?: string | string[] | null },
  idioma: Idioma,
): string {
  const en = Array.isArray(item.en) ? item.en.join(", ") : (item.en ?? "");
  const otro = idioma === "en" ? (item.es || "") : en;
  // Si falta la traducción, `significado` cae al otro idioma y aquí saldría lo
  // mismo dos veces, una debajo de otra. Mejor no enseñar nada.
  return otro === significado(item, idioma) ? "" : otro;
}
