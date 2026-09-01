-- Cuentas regaladas: acceso completo sin pasar por Paddle.
--
-- Va en su propia tabla y **por correo**, no como una columna de `perfiles`,
-- por dos razones:
--
--   1. Se puede regalar antes de que la persona se registre. Si dependiera de
--      la fila del perfil habría que acordarse de volver a darlo cuando entre.
--   2. Paddle no lo puede pisar. `membresia` y `vence_en` los escribe el
--      webhook; si el regalo viviera ahí, el primer aviso lo borraría.
--
-- CUENTAS_LIBRES, la variable de entorno, sigue siendo otra cosa: es para las
-- cuentas nuestras de administración y prueba, que no caducan ni se apuntan.

create table if not exists cortesias (
  -- En minúsculas siempre; quien escribe aquí es el script, no un formulario.
  email   text primary key,
  -- Hasta cuándo vale. Sin fecha no se regala nada: una cortesía sin fin es
  -- una suscripción gratis para siempre que nadie recuerda haber dado.
  hasta   timestamptz not null,
  -- Para acordarse dentro de un año de por qué está esta persona aquí.
  nota    text,
  creado  timestamptz not null default now()
);

create index if not exists cortesias_vigentes_idx on cortesias (hasta desc);

alter table cortesias enable row level security;
-- Sin políticas: se lee y se escribe desde el servidor con la llave secreta.
