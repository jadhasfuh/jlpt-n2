-- El idioma preferido, guardado en la cuenta y no sólo en la cookie.
--
-- La cookie es de este navegador: quien elegía inglés en el ordenador y luego
-- entraba desde el móvil se encontraba la web otra vez en español. Guardarlo
-- en el perfil hace que la preferencia viaje con la cuenta.
--
-- Vacío = nunca lo ha elegido, y entonces manda el idioma del navegador.
alter table perfiles add column if not exists idioma text not null default ''
  check (idioma in ('', 'es', 'en'));
