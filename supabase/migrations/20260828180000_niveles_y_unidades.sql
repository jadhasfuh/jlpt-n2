-- Reestructura: el curso pasa de 250 sesiones lineales a
-- nivel JLPT (N5..N1) -> sección -> unidad de ~20 palabras.
-- También deja preparada la tabla de perfiles para cuando entre el login.

-- 0) el vocabulario gana la columna de registro (cortés, coloquial…) --------
alter table vocabulario add column if not exists registro text[] not null default '{}';
alter table vocabulario alter column es_origen drop not null;
alter table vocabulario alter column es_origen set default '';
-- el esquema inicial sólo contemplaba N5/N4/N2; ahora están los cinco niveles
alter table vocabulario drop constraint if exists vocabulario_jlpt_check;
alter table vocabulario add constraint vocabulario_jlpt_check
  check (jlpt in ('N5','N4','N3','N2','N1'));

-- 1) unidades sustituye a niveles ------------------------------------------
create table if not exists unidades (
  id          text primary key,           -- "N5/hito/familia-1"
  tipo        text not null default 'vocabulario',
  nivel       text not null check (nivel in ('N5','N4','N3','N2','N1')),
  seccion     text not null references secciones(id),
  subgrupo    text not null,
  parte       int  not null,
  partes      int  not null,
  ja          text not null,
  es          text not null,
  palabras    int[]  not null default '{}',
  gramatica   text[] not null default '{}'
);
create index if not exists unidades_nivel_idx on unidades (nivel, seccion);

-- 2) las lecturas cuelgan de la unidad, no de la sesión ---------------------
alter table lecturas add column if not exists unidad_id text;
update lecturas set unidad_id = nivel_id where unidad_id is null;
delete from lecturas where unidad_id not in (select id from unidades);
alter table lecturas drop constraint if exists lecturas_pkey;
alter table lecturas drop column if exists nivel_id;
alter table lecturas alter column unidad_id set not null;
alter table lecturas add primary key (unidad_id);
alter table lecturas add constraint lecturas_unidad_fk
  foreign key (unidad_id) references unidades(id) on delete cascade;

drop table if exists niveles;

-- 3) perfiles: el enganche con Supabase Auth cuando llegue el login ---------
-- Los usuarios en sí los guarda Supabase en el esquema `auth` (auth.users),
-- que no aparece en el editor de tablas. Esto es sólo lo nuestro.
-- El esquema `auth` sólo existe en Supabase; el guard permite probar esta
-- migración en un Postgres local antes de tocar producción.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    create table if not exists perfiles (
      id     uuid primary key references auth.users(id) on delete cascade,
      nombre text,
      creado timestamptz not null default now());
    alter table progreso add column if not exists usuario uuid references auth.users(id) on delete cascade;
  else
    create table if not exists perfiles (
      id     uuid primary key,
      nombre text,
      creado timestamptz not null default now());
    alter table progreso add column if not exists usuario uuid;
  end if;
end $$;
create index if not exists progreso_usuario_idx on progreso (usuario);

-- 4) RLS -------------------------------------------------------------------
alter table unidades enable row level security;
alter table perfiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='unidades' and policyname='lectura publica') then
    create policy "lectura publica" on unidades for select using (true);
  end if;
  if exists (select 1 from information_schema.schemata where schema_name = 'auth')
     and not exists (select 1 from pg_policies where tablename='perfiles' and policyname='perfil propio') then
    execute $p$create policy "perfil propio" on perfiles for all
      using (auth.uid() = id) with check (auth.uid() = id)$p$;
  end if;
end $$;
