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

**6. La plantilla.** En Authentication → Email Templates → *Magic Link*, pegar
el contenido de `docs/correo/otp.html`. Es bilingüe (español primero) porque
Supabase no sabe en qué idioma está la app cuando manda el correo, y lleva todo
el estilo en línea porque los clientes de correo tiran las hojas de estilo.

**7. Probarlo de verdad**: entrar en la app con una dirección de Gmail y otra
de Outlook, y mirar si cae en Recibidos o en Spam. Es la única prueba que
cuenta.

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
