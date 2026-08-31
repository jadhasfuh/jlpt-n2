-- La gramática deja de ser sólo la del N2: entran los cinco niveles (846
-- puntos), y cada uno necesita saber a cuál pertenece.
alter table gramatica add column if not exists nivel text;

update gramatica set nivel = 'N2' where nivel is null;

alter table gramatica alter column nivel set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gramatica_nivel_check'
  ) then
    alter table gramatica add constraint gramatica_nivel_check
      check (nivel in ('N5','N4','N3','N2','N1'));
  end if;
end $$;

create index if not exists gramatica_nivel_idx on gramatica (nivel);
