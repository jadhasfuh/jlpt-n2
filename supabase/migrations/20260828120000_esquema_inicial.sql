-- Esquema del curso N2. Se corre una vez sobre el proyecto de Supabase.
-- El contenido (vocabulario, gramática, niveles) se carga con: npm run seed

create table if not exists secciones (
  id          text primary key,
  ja          text not null,
  es          text not null,
  orden       int  not null,
  subgrupos   jsonb not null default '[]'::jsonb
);

create table if not exists vocabulario (
  id          int  primary key,
  kana        text not null,
  kanji       text not null default '',
  escritura   text not null,
  lectura     text not null,
  pos         text not null default '',
  en          text not null default '',
  es          text not null default '',
  es_origen   text not null default '',
  seccion     text not null references secciones(id),
  subgrupo    text not null,
  jlpt        text not null check (jlpt in ('N5','N4','N2'))
);
create index if not exists vocabulario_seccion_idx  on vocabulario (seccion, subgrupo);
create index if not exists vocabulario_escritura_idx on vocabulario (escritura);
create index if not exists vocabulario_kana_idx      on vocabulario (kana);

create table if not exists gramatica (
  id          text primary key,   -- identificador interno; nunca se muestra
  forma       text not null,
  lectura     text not null default '',
  en          text not null,
  es          text not null,
  tier        int  not null,      -- 1 simple … 4 compleja
  cat         text not null,
  orden       int  not null
);

create table if not exists niveles (
  id          text primary key,
  numero      int  not null unique,
  seccion     text not null references secciones(id),
  titulo_ja   text not null,
  titulo_es   text not null,
  palabras    int[]  not null default '{}',
  gramatica   text[] not null default '{}'
);

create table if not exists lecturas (
  nivel_id    text primary key references niveles(id) on delete cascade,
  titulo      text not null,
  cuerpo      text not null,      -- japonés con <ruby> para el furigana
  traduccion  text not null,
  preguntas   jsonb not null default '[]'::jsonb,
  modelo      text,
  generada    timestamptz not null default now()
);

create table if not exists progreso (
  perfil      text primary key,   -- id local del navegador; auth real, más adelante
  datos       jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);

-- Lectura pública del contenido; el progreso lo escribe cualquiera con su propio id.
alter table secciones   enable row level security;
alter table vocabulario enable row level security;
alter table gramatica   enable row level security;
alter table niveles     enable row level security;
alter table lecturas    enable row level security;
alter table progreso    enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='secciones' and policyname='lectura publica') then
    create policy "lectura publica" on secciones   for select using (true);
    create policy "lectura publica" on vocabulario for select using (true);
    create policy "lectura publica" on gramatica   for select using (true);
    create policy "lectura publica" on niveles     for select using (true);
    create policy "lectura publica" on lecturas    for select using (true);
    create policy "progreso propio" on progreso    for all using (true) with check (true);
  end if;
end $$;
