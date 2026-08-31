-- Banco de preguntas de examen y respuestas de cada quien.
--
-- Los ítems son originales: la estructura del JLPT es información funcional
-- publicada, pero los exámenes pasados tienen derechos y no se copia ninguno.

create table if not exists items (
  id                  text primary key,
  nivel               text not null,
  tipo                text not null,
  -- Los textos largos (lecturas, guiones de audio) se comparten entre varias
  -- preguntas: las del mismo grupo salen siempre juntas y en orden.
  grupo               text,
  orden_grupo         int  not null default 0,
  instruccion_ja      text not null,
  enunciado           text not null,
  objetivo            text,
  opciones            jsonb not null,
  respuesta           int  not null,
  logica_distractores jsonb,
  explicacion         jsonb not null,          -- {"es": "…", "en": "…"}
  puntos              jsonb,                   -- frase clave → reformulación
  pasaje              jsonb,                   -- {texto, notas[], cita}
  guion               jsonb,                   -- {intro, turnos[], pregunta}
  audio               text,
  etiquetas           jsonb,
  dificultad          int,
  creado              timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'items_nivel_check') then
    alter table items add constraint items_nivel_check
      check (nivel in ('N5','N4','N3','N2','N1'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'items_respuesta_check') then
    alter table items add constraint items_respuesta_check
      check (respuesta >= 0 and respuesta < jsonb_array_length(opciones));
  end if;
end $$;

create index if not exists items_nivel_tipo_idx on items (nivel, tipo);
create index if not exists items_grupo_idx on items (grupo) where grupo is not null;

-- Qué ha contestado cada quien: alimenta la rotación (no repetir preguntas de
-- un mini examen al siguiente) y el «genera más de lo que fallas».
create table if not exists resultados (
  id       bigserial primary key,
  perfil   text not null,
  item_id  text not null references items(id) on delete cascade,
  acierto  boolean not null,
  segundos int,
  creado   timestamptz not null default now()
);
create index if not exists resultados_perfil_idx on resultados (perfil, creado desc);
create index if not exists resultados_perfil_item_idx on resultados (perfil, item_id);

alter table items      enable row level security;
alter table resultados enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='items' and policyname='lectura publica') then
    create policy "lectura publica" on items for select using (true);
  end if;

  if exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    drop policy if exists "resultados propios" on resultados;
    create policy "resultados propios" on resultados
      for all using (perfil = auth.uid()::text)
             with check (perfil = auth.uid()::text);
  end if;
end $$;
