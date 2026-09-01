# El correo de acceso (Resend + Supabase)

El código de seis cifras es **la única forma de entrar** a la app. Si el correo
no llega, no hay login; y sin login no hay suscripción que valga. Por eso esto
va antes que Paddle.

## Por qué hace falta

El mailer que trae Supabase está limitado a **2 correos por hora** y su propia
documentación dice que no es para producción: comparte reputación con todos los
proyectos gratuitos, así que acaba en la carpeta de spam con facilidad.

## Los pasos

**1. Crear la cuenta en resend.com** y añadir el dominio `jlptest.org`.

**2. Resend da entre tres y cuatro registros DNS.** Se copian tal cual en
Hostinger → Registros DNS. Tienen esta forma:

| Tipo | Nombre | Para qué |
|---|---|---|
| TXT | `send` (o `@`) | SPF — dice qué servidores pueden enviar en tu nombre |
| TXT | `resend._domainkey` | DKIM — la firma que prueba que el correo es tuyo |
| MX | `send` | los rebotes vuelven a Resend |
| TXT | `_dmarc` | qué hacer con lo que no cuadre (opcional pero conviene) |

Los valores exactos los da Resend y son únicos de la cuenta: hay que copiarlos
del panel, no inventarlos. La verificación tarda entre minutos y una hora.

**3. Crear una API key** en Resend (Settings → API Keys). Permiso de envío
basta; no le des acceso completo.

**4. En Supabase → Authentication → SMTP Settings**, activar SMTP propio:

```
Host      smtp.resend.com
Port      465          (SSL directo; 587 también vale, con STARTTLS)
Username  resend       ← literalmente eso, no el correo
Password  la API key de Resend
Sender    hola@jlptest.org        (el dominio tiene que ser el verificado)
Sender name  jlptest
```

**5. El paso que se olvida siempre.** Al activar SMTP propio, Supabase impone
un límite nuevo de **30 correos por hora** para proteger la reputación del
servicio recién creado. Hay que subirlo a mano en
**Authentication → Rate Limits**. Con 30/hora, treinta personas entrando a la
vez dejan fuera a la siguiente.

**6. Las plantillas — en plural.** En Authentication → Emails → Templates hay
que pegar `docs/correo/otp.html` en **dos** sitios:

- **Confirm signup** — el que recibe quien entra por primera vez
- **Magic Link** — el de quien ya tiene cuenta

Con una sola no basta, y es un error fácil de cometer: `signInWithOtp` manda la
de *Confirm signup* cuando el usuario todavía no existe, o sea que es la que ve
**todo el mundo** al empezar. Si sólo se cambia Magic Link, el primer correo de
cada persona sigue siendo el de fábrica, en inglés y con un enlace en vez del
código.

Cambia también el **asunto** de las dos a algo que diga qué hay dentro:
`Tu código de acceso a jlptest`. El de fábrica («Confirm your email address»)
es literalmente el asunto que usan la mitad de los correos de phishing.

La plantilla es bilingüe (español primero) porque Supabase no sabe en qué
idioma está la app cuando manda el correo, y lleva todo el estilo en línea
porque los clientes de correo tiran las hojas de estilo.

**7. Probarlo de verdad**: entrar en la app con una dirección de Gmail y otra
de Outlook, y mirar si cae en Recibidos o en Spam. Es la única prueba que
cuenta.

## Si cae en «no deseado»

Es lo normal las primeras semanas y **no es cosmético**: si el código va a
spam, la mayoría de la gente no lo busca y sencillamente no puede entrar. Con
un login por correo, spam es lo mismo que la puerta cerrada.

Cuando el DNS ya está bien —SPF, DKIM, DMARC y los MX de rebote— lo que queda
es reputación, y la reputación se construye:

- **Antigüedad.** Un dominio comprado esta semana no tiene historial. Hotmail
  y Outlook son los más duros con eso; Gmail perdona más. Mejora solo en dos o
  tres semanas de envíos normales.
- **Forma del correo.** Un mensaje cuyo único contenido es un enlace tiene la
  silueta exacta de un phishing. Por eso la plantilla pone el código grande y
  no incluye ningún enlace: además de ser más cómodo en el móvil, es lo que
  menos se parece a un fraude.
- **Marcarlo como «no es spam»** en tu propia cuenta y responder al correo una
  vez. Cuenta más de lo que parece: los filtros aprenden de las interacciones
  del dominio.
- **Reenvío en el dominio.** Que `hola@jlptest.org` reciba de verdad (reenviado
  a tu buzón) ayuda: los filtros desconfían de los remitentes que nunca
  reciben nada.
- **DMARC en `p=none`** está bien ahora. Subirlo a `quarantine` antes de tener
  historial hace más daño que bien.

Lo que **no** hay que hacer: mandarte correos a ti mismo cincuenta veces para
«calentar» el dominio. Eso lo detectan y penaliza.

## Los límites, para saber cuándo duele

| | gratis | Pro ($20/mes) |
|---|---|---|
| al mes | 3.000 | 50.000 |
| al día | **100** | sin tope diario |
| dominios | 3 | 10 |

El tope de **100 al día** es el que aprieta primero. Cada intento de entrada
gasta uno, y la gente pide el código dos veces cuando tarda. Con unos cincuenta
usuarios activos al día ya conviene pasar a Pro.

## Cuando funcione

Volver a poner el correo de contacto de las páginas legales en
`hola@jlptest.org` en vez del personal: `src/components/Legal.tsx`. Una
dirección propia en una página pública recoge menos spam y se puede reenviar
adonde haga falta sin tocar la app.
