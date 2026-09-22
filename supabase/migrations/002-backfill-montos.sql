-- Completa las altas historicas que no tienen monto.
--
-- Hasta el 2026-09-21 el monto no se registraba, asi que las 553 altas
-- anteriores quedaban fuera de los numeros del mes. Se decidio asumir un par por
-- alta y el precio del consultorio: es un piso, no el numero exacto, pero es mucho
-- mas cerca de la realidad que dejarlas en cero.
--
-- Solo toca filas donde monto_cobrado ES NULL, asi que se puede correr de nuevo
-- sin pisar nada de lo que se cargue a mano de aca en adelante.

UPDATE plantillas p
SET pares = 1,
    monto_cobrado = c.precio_por_par
FROM pacientes pa
JOIN consultorios c ON c.id = pa.consultorio_id
WHERE p.paciente_id = pa.id
  AND p.monto_cobrado IS NULL
  AND c.precio_por_par IS NOT NULL;

-- Quedan afuera las altas de los consultorios sin precio cargado y las de
-- pacientes sin consultorio: no hay de donde sacarles el monto. La pantalla las
-- muestra aparte en vez de contarlas como cero.
