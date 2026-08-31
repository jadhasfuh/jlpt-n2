# Subir jlptest a las tiendas

Decidido el 2026-08-31. Si algo de esto se cambia, cámbialo aquí también.

## Por qué no React Native

La idea era reusar la lógica de los componentes. En la práctica no hay casi
nada que reusar: lo que se puede compartir entre web y React Native es el
código sin JSX — `src/lib/` entero (progreso y SRS, idioma, examen, banco,
voz, frases) — y eso ya está separado y no depende del DOM. Todo lo demás
son `<div>`, `className` y variables CSS: en React Native no existe ninguna
de las tres. Portar la interfaz no es adaptar, es reescribirla.

Y la app se pinta en el servidor. El curso, las unidades, las lecturas y el
diccionario salen de componentes de servidor que leen `data/dist/*.json` en
el momento. En React Native no hay servidor: habría que montar una API para
todo lo que hoy es una llamada de función, mantener dos clientes de Supabase
y dos capas de sesión. Es un segundo proyecto, no una segunda pantalla.

## Lo que sí se hace

**Android — TWA (Trusted Web Activity).** Es la propia web dentro de una
carcasa nativa, sin barra de navegador. Google Play la acepta desde hace años
y es lo que usan muchas apps de estudio. Hace falta:

1. `manifest.webmanifest` — hecho.
2. Service worker con algo de uso sin conexión — hecho.
3. HTTPS con dominio propio (el `*.up.railway.app` vale para probar, no para
   publicar: el Digital Asset Links tiene que vivir en un dominio nuestro).
4. `bubblewrap init` con la URL del manifiesto → genera el proyecto Android.
5. `.well-known/assetlinks.json` servido desde el dominio, con la huella SHA-256
   de la firma. Sin esto la app abre con barra de navegador y parece un chiste.
6. Cuenta de desarrollador de Google Play: 25 USD, pago único.

**iOS — más adelante, y con Capacitor.** Apple rechaza los envoltorios web por
la directriz 4.2 («minimum functionality»): una app que sólo abre un sitio no
pasa. Con Capacitor el HTML va empaquetado dentro de la app y se le añade algo
nativo de verdad — audio, avisos de repaso, contenido descargado — que es lo
que hace que la revisen como app. Cuenta de desarrollador: 99 USD al año.
No tiene sentido pagarlo hasta que la web venda.

## El cobro (esto es lo importante)

**Se vende en la web, no dentro de la app.** Si la suscripción se compra desde
la app, Apple y Google se llevan entre el 15 % y el 30 %. Si se compra en el
navegador y la app sólo sirve para entrar con la cuenta ya pagada, no se llevan
nada. Esa es la razón de que el orden sea: primero la web con Paddle, después
las tiendas.

Regla que hay que respetar: **la app de la tienda no puede llevar a la compra.**
Ni un botón «Suscribirse», ni un enlace a la web de pago, ni un texto que
explique dónde pagar. Sólo «Entrar». Es una regla incómoda pero clara, y
saltársela cuesta el rechazo del envío.

## Antes de cobrar a nadie

- Proveedor de correo propio (Resend o similar). El de Supabase está limitado
  y no aguanta un lanzamiento; y el correo es la única forma de entrar.
- Paddle como merchant of record: se ocupa del IVA de la UE, de UK y de Japón,
  que es exactamente lo que no queremos llevar nosotros.
- Poner `NEXT_PUBLIC_ACCESO_ABIERTO=0` el día que exista el cobro. Hoy está
  abierto a propósito.
