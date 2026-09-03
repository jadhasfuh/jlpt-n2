# Avisos de repaso (web push)

Montado el 2026-09-03. Un aviso al día como mucho, y sólo si hay palabras
vencidas: «23 palabras te esperan».

## Cómo funciona

```
navegador  ──permiso──▶  suscripción (endpoint + 2 claves)
                              │
                              ▼  POST /api/avisos/suscribir
                        suscripciones_push          ← una fila por APARATO
                              │
   cron horario ─────────────▶│  POST /api/avisos/enviar
                              ▼
                     avisos_pendientes(hora, ahora_ms)   ← función en Postgres
                              │  (endpoint, claves, idioma, nº de vencidas)
                              ▼
                          web-push ──▶ FCM / Mozilla / Apple
```

**La cuenta la hace Postgres, no Node.** El avance de cada perfil es un jsonb
con miles de palabras y cada una con su `proximo`; traérselo entero al servidor
para contar los vencidos sería mover megas por nada. La función
`avisos_pendientes` devuelve ya sólo a quién avisar y con qué número.

**La hora se guarda en UTC.** El navegador convierte la hora local que elige el
usuario y manda `hora_utc`; el cron sólo compara con su propio reloj. Así no
hay husos horarios en el servidor, que es donde siempre se rompen. Un viaje o
el cambio de hora se arreglan solos la próxima vez que se toque el ajuste.

**Un aviso por aparato y día.** Lo garantiza `ultimo_aviso`, aunque el cron se
dispare dos veces o Railway reintente.

**Los aparatos muertos se limpian solos.** Si el servicio de push contesta 404
o 410 —desinstaló, borró los datos del sitio, revocó el permiso— la fila se
borra. Comprobado de verdad contra FCM: devuelve 410 y la suscripción
desaparece.

## Variables (Railway)

| | |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLICA` | La clave pública. Viaja al navegador, es pública por diseño. |
| `VAPID_PRIVADA` | **No sale del servidor.** Con ella se firma cada envío. |
| `VAPID_CONTACTO` | `mailto:` que los servicios de push usan para avisar de problemas. |
| `AVISOS_SECRETO` | Lo que protege `/api/avisos/enviar`. Sin él, cualquiera dispara los avisos. |

Las claves VAPID **no se regeneran nunca**: si cambian, todas las
suscripciones existentes dejan de valer y hay que volver a pedir permiso, que
es lo único que no se puede volver a pedir.

## El cron

En Railway, un servicio de tipo *Cron* con la expresión `0 * * * *` (cada hora
en punto) y este comando:

```sh
curl -fsS -X POST -H "authorization: Bearer $AVISOS_SECRETO" \
     https://jlptest.org/api/avisos/enviar
```

Contesta con lo que hizo, y eso queda en el log:

```json
{"hora":20,"candidatos":14,"enviados":13,"caducados":1,"fallos":{"410":1}}
```

`fallos` lleva los códigos: 404 y 410 son aparatos muertos (normal), un 401 o
403 sería cosa nuestra —clave VAPID mal puesta— y hay que mirarlo.

## Dónde funciona

| | |
|---|---|
| Android, la app de Play (TWA) | Sí — hereda el push de Chrome |
| Chrome, Edge, Firefox, Safari de escritorio | Sí |
| iPhone en Safari | Sólo si añaden la web a la pantalla de inicio (iOS 16.4+) |
| iOS con app propia | Haría falta Capacitor y avisos nativos; no está hecho |

## Lo que NO se hace, a propósito

**No se avisa de cobros.** Un «renueva tu suscripción» con enlace al pago es
una llamada a compra externa desde la app, y eso incumple las reglas de Play y
de Apple. Avisos de estudio, todos; de dinero, ninguno.

**No se pide el permiso al entrar.** El navegador sólo deja preguntar una vez
en la vida: si dicen que no, no hay segunda oportunidad ni recargando. Se
ofrece al terminar un repaso, cuando ya se ha visto para qué sirve, y en el
Perfil para quien lo busque.

**Un aviso al día.** Nada de recordatorios múltiples: eso desinstala apps.
