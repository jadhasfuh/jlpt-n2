-- Lo que hace falta para cobrar: qué cliente y qué suscripción es de quién.
--
-- El id de cliente y el de suscripción vienen del proveedor de pago (Paddle).
-- Se guardan aquí para poder abrir el portal de cancelación sin pedirle nada
-- al usuario, y para que el webhook sepa a qué perfil aplicar cada aviso.

alter table perfiles add column if not exists suscripcion_id text;
create index if not exists perfiles_cliente_pago_idx on perfiles (cliente_pago)
  where cliente_pago is not null;
create index if not exists perfiles_suscripcion_idx on perfiles (suscripcion_id)
  where suscripcion_id is not null;

-- Bitácora de avisos del proveedor. Sirve para dos cosas: poder reconstruir
-- por qué una cuenta acabó en un estado, y descartar reenvíos — Paddle
-- reintenta un webhook que no respondió 200, y aplicar dos veces el mismo
-- evento podría alargar una suscripción que nadie pagó dos veces.
create table if not exists eventos_pago (
  id         text primary key,          -- el event_id del proveedor
  tipo       text not null,
  perfil     uuid,
  cuerpo     jsonb not null,
  recibido   timestamptz not null default now()
);
create index if not exists eventos_pago_perfil_idx on eventos_pago (perfil, recibido desc);

alter table eventos_pago enable row level security;
-- Sin políticas: sólo el servidor con la llave secreta entra aquí. Un usuario
-- no tiene por qué leer los avisos de facturación, ni los suyos.
