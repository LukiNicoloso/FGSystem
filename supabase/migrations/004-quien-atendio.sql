-- Quien atendio cada alta.
--
-- Va en la plantilla y no en el paciente porque la plata se cuenta por alta: un
-- mismo paciente puede tener el estudio hecho por una persona y la renovacion por
-- otra, y guardarlo en el paciente dejaria esa renovacion mal atribuida.
ALTER TABLE plantillas ADD COLUMN IF NOT EXISTS atendido_por TEXT
  CHECK (atendido_por = ANY (ARRAY['noe', 'nico']));

-- Todo lo anterior al 2026-09-24 se asigna a Noe: es lo mas cercano a la realidad
-- y evita que el panel filtrado por ella muestre cero hasta completarlas a mano.
UPDATE plantillas SET atendido_por = 'noe' WHERE atendido_por IS NULL;
