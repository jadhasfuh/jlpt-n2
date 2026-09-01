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

## Estado del cobro (1-sep-2026)

Probado de punta a punta contra la cuenta live, con una compra real de 79 MXN:

| | |
|---|---|
| ventana de pago | abre con el precio leído del catálogo de Paddle |
| cobro | 79,00 MXN — 68,10 de base + 10,90 de IVA, calculado por Paddle |
| extracto | `PADDLE.NET* JLPTEST` |
| webhook | llega a Railway, firma HMAC verificada, evento guardado |
| alta | `membresia: activa`, `vence_en` a un mes, ids de Paddle enganchados |
| cancelación | `membresia: cancelada`, **`vence_en` intacto** |
| reactivación | vuelve a `activa` |

Las cuatro transiciones, sin eventos duplicados.

Lo que Paddle se queda: su comisión es aproximadamente 5% + 0,50 USD por
transacción. A 79 MXN ese medio dólar fijo pesa más del 12%, así que de cada
79 llegan unos 55 netos. Si algún día importa, las dos palancas son un plan
anual (se paga la parte fija una vez en lugar de doce) o subir a 99, donde la
comisión fija pesa proporcionalmente menos.

Detalle conocido y aceptado: los botones «gestionar» y «cancelar» abren la
misma página del portal de Paddle, porque su API devuelve el mismo enlace para
las dos acciones. Desde ahí se cancela sin problema; el paso intermedio hace de
confirmación.

## Antes de cobrar a nadie

- Proveedor de correo propio (Resend o similar). El de Supabase está limitado
  y no aguanta un lanzamiento; y el correo es la única forma de entrar.
- Paddle como merchant of record: se ocupa del IVA de la UE, de UK y de Japón,
  que es exactamente lo que no queremos llevar nosotros.
- Poner `NEXT_PUBLIC_ACCESO_ABIERTO=0` el día que exista el cobro. Hoy está
  abierto a propósito.
