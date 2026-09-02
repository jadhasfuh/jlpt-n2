-- La traducción de apoyo de las lecturas, en inglés.
--
-- Hasta ahora sólo había una, en español, y quien tenía la app en inglés
-- recibía la ayuda en español. Se va añadiendo por niveles; mientras una
-- lectura no la tenga, el inglés cae a la española.
--
-- La app lee el JSON empaquetado, no esta tabla. La columna está aquí porque
-- la base es la copia de la que se recupera cuando la exportación se rompe:
-- si le falta un campo, ese campo no se puede recuperar.
alter table lecturas add column if not exists traduccion_en text;
