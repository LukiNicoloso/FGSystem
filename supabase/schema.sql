-- =============================================
-- FGSystem - Schema de base de datos
-- =============================================

-- Consultorios
CREATE TABLE consultorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Recordatorio de turnos por WhatsApp.
  -- direccion y recordatorio_firma viajan como variables de la plantilla aprobada;
  -- el texto del mensaje no se edita desde la app porque cada edicion de una
  -- plantilla de WhatsApp vuelve a revision de Meta.
  direccion TEXT,
  -- Un switch por tipo de turno: no todos los consultorios avisan de las dos cosas.
  recordatorio_estudio_activo BOOLEAN NOT NULL DEFAULT FALSE,
  recordatorio_entrega_activo BOOLEAN NOT NULL DEFAULT FALSE,
  -- En NULL se firma con FIRMA_POR_DEFECTO (lib/recordatorios.ts). El default no
  -- se pone aca para no tener el mismo texto en dos lugares que se desincronizan.
  recordatorio_firma TEXT,
  -- A donde se avisa cuando un paciente rechaza el turno. Vacio = no se avisa.
  telefono_avisos TEXT
);

-- Pacientes
CREATE TABLE pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  celular TEXT NOT NULL,
  -- El mismo celular en formato internacional (+5491156207854). Es la unica forma
  -- de cruzar una respuesta de WhatsApp con su paciente: Twilio solo nos manda el
  -- numero. Lo escribe lib/telefono.ts al guardar.
  celular_e164 TEXT,
  consultorio_id UUID REFERENCES consultorios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turnos
CREATE TYPE estado_turno AS ENUM ('pendiente', 'confirmado', 'cancelado', 'completado');

CREATE TABLE turnos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  consultorio_id UUID REFERENCES consultorios(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado estado_turno DEFAULT 'pendiente',
  -- Define que plantilla de WhatsApp se manda: la de estudio o la de entrega.
  tipo TEXT NOT NULL DEFAULT 'estudio' CHECK (tipo = ANY (ARRAY['estudio', 'entrega'])),
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  recordatorio_enviado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plantillas
CREATE TYPE estado_plantilla AS ENUM ('en_taller', 'lista_para_entrega', 'entregada', 'renovacion_pendiente');

CREATE TABLE plantillas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  turno_id UUID REFERENCES turnos(id) ON DELETE SET NULL,
  estado estado_plantilla DEFAULT 'en_taller',
  foto_url TEXT,
  fecha_entrega DATE,
  fecha_renovacion DATE,
  recordatorio_renovacion_enviado BOOLEAN DEFAULT FALSE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Seguimiento de renovaciones.
  -- estado_contacto en NULL es lo que hace que la plantilla aparezca en la pantalla
  -- de Seguimiento; cualquiera de los valores permitidos la saca de la lista.
  -- 'renovado' lo escribe crearPlantilla al registrar una renovacion.
  estado_contacto TEXT CHECK (
    estado_contacto = ANY (ARRAY['contactado', 'agendado', 'no_interesado', 'renovado'])
  ),
  fecha_contactado DATE,
  fecha_agendado DATE,
  es_renovacion BOOLEAN DEFAULT FALSE
);

-- =============================================
-- Trigger para actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX pacientes_celular_e164_idx ON pacientes (celular_e164);

CREATE TRIGGER pacientes_updated_at BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER turnos_updated_at BEFORE UPDATE ON turnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER plantillas_updated_at BEFORE UPDATE ON plantillas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS (Row Level Security) - habilitar para producción
-- =============================================
ALTER TABLE consultorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas por ahora (ajustar cuando haya autenticación)
CREATE POLICY "allow_all_consultorios" ON consultorios FOR ALL USING (true);
CREATE POLICY "allow_all_pacientes" ON pacientes FOR ALL USING (true);
CREATE POLICY "allow_all_turnos" ON turnos FOR ALL USING (true);
CREATE POLICY "allow_all_plantillas" ON plantillas FOR ALL USING (true);
