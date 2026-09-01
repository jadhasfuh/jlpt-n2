-- Avisos de los usuarios sobre una traducción o un dato que está mal.
--
-- La app tiene 7.614 palabras, 846 gramáticas y 276 preguntas, todas
-- traducidas sin que nadie las haya revisado una a una. Quien estudia es el
-- primero que se topa con un error, y hasta ahora no tenía dónde decirlo.

create table if not exists reportes (
  id        bigserial primary key,
  -- Qué se reporta. `ref` es texto porque los ids no son homogéneos: el
  -- vocabulario los tiene numéricos y la gramática, los exámenes y las
  -- lecturas los tienen en texto.
  tipo      text not null,
  ref       text not null,
  -- Lo que se veía en pantalla cuando se reportó. Sin esto, si la traducción
  -- cambia entre el aviso y la revisión, no hay forma de saber qué se estaba
  -- señalando.
  visto     text,
  idioma    text not null default 'es',
  motivo    text not null,
  sugerencia text,
  perfil    uuid,
  estado    text not null default 'abierto',
  creado    timestamptz not null default now(),
  resuelto  timestamptz
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reportes_tipo_check') then
    alter table reportes add constraint reportes_tipo_check
      check (tipo in ('vocabulario','gramatica','lectura','item'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reportes_estado_check') then
    alter table reportes add constraint reportes_estado_check
      check (estado in ('abierto','arreglado','descartado'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reportes_motivo_check') then
    alter table reportes add constraint reportes_motivo_check
      check (motivo in ('traduccion','lectura','ejemplo','otro'));
  end if;
end $$;

-- Lo que se consulta es «qué queda por mirar», así que el índice va por ahí.
create index if not exists reportes_abiertos_idx
  on reportes (tipo, ref) where estado = 'abierto';
create index if not exists reportes_creado_idx on reportes (creado desc);

alter table reportes enable row level security;
-- Sin políticas a propósito: se escribe desde el servidor con la llave
-- secreta, nunca desde el navegador. Así nadie puede leer los avisos ajenos
-- ni llenar la tabla saltándose la validación del endpoint.
