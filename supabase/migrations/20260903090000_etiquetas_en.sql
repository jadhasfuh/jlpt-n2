-- Etiquetas en inglés de secciones y unidades.
--
-- Los nombres del temario existían sólo en japonés y español, así que quien
-- tenía la interfaz en inglés navegaba el curso entero leyendo español: la
-- cabecera de la sección, el subtítulo de cada tema, el nombre de la unidad.
-- Salen de scripts/taxonomia.py, que ya las lleva en los tres idiomas.
alter table secciones add column if not exists en text not null default '';
alter table unidades  add column if not exists en text not null default '';
