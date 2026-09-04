# Publicar en Google Play

Lo que hay hecho, lo que falta y en qué orden. El detalle de por qué TWA y no
React Native está en `TIENDAS.md`; esto es el procedimiento.

## Ya está hecho

- **Manifiesto** con `start_url: "/?app=1"` y los iconos que Play exige:
  192 y 512 en PNG, más el enmascarable. Se generan en `/icono/192`,
  `/icono/512` y `/icono/maskable`.
- **`assetlinks.json`** servido en `/.well-known/assetlinks.json`, alimentado
  por la variable `ANDROID_HUELLAS`. Sin huellas devuelve `[]`.
- **Nada de pagos dentro de la app** (ver más abajo, es lo que más rechazos
  causa).
- **`android/twa-manifest.json`** con todos los valores puestos.

## Lo que falta, en orden

### 1. Crear el llavero de firma

**Esta clave es para siempre.** Play sólo acepta actualizaciones firmadas con
la misma; si se pierde, la app no se puede volver a actualizar nunca y hay que
publicar otra desde cero, con otra ficha y sin los usuarios. Guárdala fuera del
ordenador de trabajo y con copia. No va al repositorio: `android/.gitignore`
la excluye.

```bash
cd android
keytool -genkeypair -v -keystore android.keystore -alias jlptest \
        -keyalg RSA -keysize 2048 -validity 10000
```

Pide una contraseña. Apúntala donde apuntas las demás cosas privadas.

### 2. Generar el paquete

```bash
cd android
bubblewrap build          # la primera vez se baja el JDK y el SDK de Android
```

Sale `app-release-bundle.aab`, que es lo que se sube.

> Bubblewrap pregunta cosas por consola, así que hay que ejecutarlo en una
> terminal de verdad. Desde esta sesión se puede con `! bubblewrap build`.

### 3. Subirlo a Play Console

Cuenta de desarrollador: 25 USD, pago único. Ficha de la aplicación, capturas,
descripción, política de privacidad (ya está en `/legal/privacidad`) y el
cuestionario de contenido.

### 3b. Rellenar la ficha

Todo lo que Play pide de la ficha está escrito en `android/play/`. No hay que
redactar nada: es copiar y pegar. En Play Console va en dos sitios distintos, y
es lo que más se busca:

**Crecimiento → Presencia en Play Store → Ficha de Play Store principal**
—los textos y las imágenes:

| Campo de Play | De dónde sale |
|---|---|
| Nombre, descripción breve y completa | `play/ficha-es.txt` |
| Lo mismo en inglés (añadir el idioma primero) | `play/ficha-en.txt` |
| Icono de la app, 512 × 512 | `play/icono-512.png` |
| Gráfico destacado, 1024 × 500 | `play/grafico-destacado-1024x500.png` |
| Capturas de teléfono, 1080 × 1920 | `play/capturas/` (las cuatro, en orden) |

**Política → Contenido de la aplicación** —los cuestionarios:

| Cuestionario | De dónde sale |
|---|---|
| Seguridad de los datos | `play/seguridad-datos.txt` |
| Acceso a la app (cuenta de revisión) | `play/acceso-app.txt` |
| Política de privacidad (URL) | `https://jlptest.org/legal/privacidad` |

Y las notas de la versión, al subir cada AAB, en `play/notas-version.txt`.

> Google mueve estos menús de sitio cada pocos meses. Si no aparecen con esos
> nombres, están en la barra de la izquierda dentro de la app, no en la portada
> de la consola: los textos y las imágenes por un lado y los cuestionarios de
> política por otro, que es lo que no cambia.

La lista de los doce probadores que Play exige antes de publicar es aparte, en
`play/probadores.txt`.

### 4. Poner la huella y verificar el dominio

Al recibir el primer envío, Play firma con **su** clave y enseña la huella
SHA-256 en *Configuración → Integridad de la aplicación → Firma de apps*.

Esa es la que vale, no la del llavero local. Se pega en Railway:

```
ANDROID_HUELLAS=AA:BB:…:99
```

Se pueden poner las dos separadas por comas mientras se prueba: la de subida
(la del llavero) y la de Play.

Sin este paso la app arranca **con la barra del navegador encima** y parece un
atajo a una página, no una app.

## Lo que hace que la rechacen

La política de pagos de Play prohíbe que una app lleve al usuario a pagar fuera
de su facturación, y lo dice nombrando webviews, botones y flujos de registro.
Aquí se cobra en la web a propósito, para no ceder el 15-30 %.

Por eso la app **detecta que es la app** —el `?app=1` del `start_url` deja una
cookie en la primera navegación— y esconde todo lo de suscripción: el botón del
muro, el enlace del perfil, el del test abierto y la pantalla de suscripción
entera, que además ni siquiera consulta las tarifas a Paddle.

Lo que sí se ve: qué hace falta para abrir esa parte, y que la cuenta se
gestiona desde el navegador. Sin precios y sin decir dónde se paga.

**Al tocar cualquiera de esas pantallas, comprobar que sigue limpio:**

```bash
curl -s -H 'Cookie: jlpt.app=1' https://jlptest.org/suscripcion \
  | sed 's/<script[^>]*>.*<\/script>//g' \
  | grep -E 'href="/suscripcion"|al mes|al año|MX\$' && echo "MAL" || echo "limpio"
```

## Lo otro que suelen mirar

- **Usable sin registrarse.** Lo está: la sección 人と体 de cada nivel es libre,
  y `/test/n5` y `/test/n4` funcionan enteros sin cuenta.
- **Borrar la cuenta desde dentro.** Requisito desde 2024. Está en el perfil, y
  además `/api/cuenta/borrar` borra progreso, resultados, perfil y cortesía.
- **Política de privacidad enlazada** desde la ficha. `/legal/privacidad`.
