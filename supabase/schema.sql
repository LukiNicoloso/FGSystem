-- =============================================
-- FGSystem - Schema de base de datos
-- =============================================

-- Consultorios
CREATE TABLE consultorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pacientes
CREATE TABLE pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  celular TEXT NOT NULL,
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
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
