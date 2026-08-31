-- Cuentas de verdad y estado de membresía.
--
-- Hasta ahora `progreso` tenía una política abierta de par en par ("using (true)"):
-- servía mientras nadie escribía en ella, pero con cuentas reales cualquiera con
-- la llave pública podría leer y pisar el progreso ajeno. Aquí se cierra.

alter table perfiles add column if not exists email        text;
alter table perfiles add column if not exists membresia    text not null default 'libre';
alter table perfiles add column if not exists vence_en     timestamptz;
alter table perfiles add column if not exists origen       text;
alter table perfiles add column if not exists cliente_pago text;
alter table perfiles add column if not exists actualizado  timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'perfiles_membresia_check') then
    alter table perfiles add constraint perfiles_membresia_check
      check (membresia in ('libre','activa','cancelada','caducada'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'perfiles_origen_check') then
    alter table perfiles add constraint perfiles_origen_check
      check (origen is null or origen in ('web','apple','google'));
  end if;
end $$;

-- «Activa» no basta: una cancelada sigue valiendo hasta que se acaba lo pagado.
create or replace function public.membresia_al_dia(p perfiles) returns boolean
language sql stable as $$
  select p.membresia in ('activa','cancelada') and (p.vence_en is null or p.vence_en > now());
$$;

-- El progreso se guarda con el id del usuario como clave.
create index if not exists progreso_perfil_idx on progreso (perfil);

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    -- Cada cuenta nueva estrena perfil sola: si dependiera de que la app lo
    -- pida, un fallo de red dejaría usuarios sin fila.
    create or replace function public.crear_perfil() returns trigger
    language plpgsql security definer set search_path = public as $f$
    begin
      insert into perfiles (id, email, nombre)
      values (new.id, new.email,
              coalesce(new.raw_user_meta_data->>'name',
                       new.raw_user_meta_data->>'full_name',
                       split_part(coalesce(new.email,''), '@', 1)))
      on conflict (id) do nothing;
      return new;
    end $f$;

    drop trigger if exists al_crear_usuario on auth.users;
    create trigger al_crear_usuario after insert on auth.users
      for each row execute function public.crear_perfil();

    -- Perfiles: cada quien lee el suyo. La membresía sólo la toca el servidor
    -- con la llave secreta, para que nadie se regale una suscripción.
    drop policy if exists "perfil propio" on perfiles;
    drop policy if exists "perfil propio: leer" on perfiles;
    create policy "perfil propio: leer" on perfiles
      for select using (id = auth.uid());

    -- Progreso: sólo el tuyo, y sólo si has iniciado sesión. Sin cuenta se
    -- sigue guardando en el navegador y no toca la base.
    drop policy if exists "progreso propio" on progreso;
    create policy "progreso propio" on progreso
      for all using (perfil = auth.uid()::text)
             with check (perfil = auth.uid()::text);
  end if;
end $$;
