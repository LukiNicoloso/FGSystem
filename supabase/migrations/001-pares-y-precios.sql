-- Cuanto se cobro por cada alta de plantillas.
--
-- Hasta ahora el precio solo existia en la cabeza de Noemi: para saber cuanto se
-- gano habia que multiplicar a mano las altas de cada consultorio por un precio
-- de memoria. Estas tres columnas lo dejan registrado en el momento del alta.

-- El precio de UN par en este consultorio, hoy. Es el valor de referencia con el
-- que se sugiere el monto al cargar un alta; los montos ya cobrados no cambian
-- cuando este precio sube.
ALTER TABLE consultorios ADD COLUMN IF NOT EXISTS precio_por_par NUMERIC(12,2);

-- Un alta puede ser de uno o dos pares. En NULL quedan las altas viejas, donde
-- esto no se registraba: es "no sabemos", distinto de "fue un par".
ALTER TABLE plantillas ADD COLUMN IF NOT EXISTS pares SMALLINT CHECK (pares = ANY (ARRAY[1, 2]));

-- Lo que se cobro por esta alta, congelado. Se copia del precio del consultorio
-- al crearla y se puede corregir a mano: si el precio del consultorio cambia el
-- año que viene, los numeros del año pasado tienen que seguir dando igual.
ALTER TABLE plantillas ADD COLUMN IF NOT EXISTS monto_cobrado NUMERIC(12,2);

-- Los precios vigentes al 2026-09-21, segun lo que paga cada consultorio por par.
UPDATE consultorios SET precio_por_par = 40000  WHERE nombre ILIKE '%kinest%';
UPDATE consultorios SET precio_por_par = 100000 WHERE nombre ILIKE '%mariana%';
UPDATE consultorios SET precio_por_par = 100000 WHERE nombre ILIKE '%pezzi%';
UPDATE consultorios SET precio_por_par = 100000 WHERE nombre ILIKE '%ramos%';
UPDATE consultorios SET precio_por_par = 96000  WHERE nombre ILIKE '%justo%';
