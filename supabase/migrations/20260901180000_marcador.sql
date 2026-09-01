-- Marcador del test abierto de /test/n5 y /test/n4.
--
-- Cuelga del test gratuito, no de los mini exámenes de la suscripción: su
-- función es dar prueba social a quien todavía no es cliente. Metido detrás
-- del muro sólo lo verían los que ya pagan, que es justo al revés.
--
-- No hay cuenta detrás, así que aquí no se guarda nada que identifique a
-- nadie: un nombre que la persona escribe sabiendo que se verá, el nivel y el
-- número de aciertos. Ni correo, ni IP, ni id de perfil.

create table if not exists marcador (
  id        bigserial primary key,
  nivel     text not null,
  -- Lo escribe quien hace el test y se muestra en público. Se recorta a 20 en
  -- el endpoint; el límite de aquí es la última defensa, no la primera.
  nombre    text not null,
  aciertos  smallint not null,
  total     smallint not null,
  creado    timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'marcador_nivel_check') then
    alter table marcador add constraint marcador_nivel_check check (nivel in ('N5','N4'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'marcador_nombre_check') then
    alter table marcador add constraint marcador_nombre_check
      check (char_length(nombre) between 1 and 20);
  end if;
  -- La nota no puede salirse del examen que se hizo. Sin esto, un fallo del
  -- endpoint dejaría un 40 de 25 presidiendo la tabla para siempre.
  if not exists (select 1 from pg_constraint where conname = 'marcador_rango_check') then
    alter table marcador add constraint marcador_rango_check
      check (total between 1 and 100 and aciertos between 0 and total);
  end if;
end $$;

-- Lo que se pinta es «los mejores de los últimos siete días» y «los últimos
-- en pasar», así que los dos índices van por ahí.
create index if not exists marcador_top_idx on marcador (nivel, aciertos desc, creado desc);
create index if not exists marcador_creado_idx on marcador (creado desc);

alter table marcador enable row level security;
-- Sin políticas, igual que en reportes: se lee y se escribe desde el servidor
-- con la llave secreta. La nota no viaja nunca desde el navegador —el
-- endpoint vuelve a corregir las respuestas contra la base— y así el marcador
-- no se llena de cien por cien inventados.
