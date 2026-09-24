-- Turnos que son una ventana y no una hora.
--
-- En Kinest el paciente no tiene hora: pasa a retirar sus plantillas cuando puede,
-- dentro de una franja (sabados de 08:30 a 11:00, martes de 11:30 a 15:30).
--
-- hora_fin en NULL es un turno normal con hora exacta, que es como funcionan todos
-- los demas. Cuando tiene valor, hora es el comienzo de la ventana y hora_fin el
-- final, y el recordatorio le dice al paciente el rango en vez de una hora.
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS hora_fin TIME;
