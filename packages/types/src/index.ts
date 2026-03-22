// Pacientes
export interface Paciente {
  id: string;
  nombre: string;
  celular: string;
  consultorio_id: string;
  created_at: string;
  updated_at: string;
}

// Consultorios
export interface Consultorio {
  id: string;
  nombre: string;
  created_at: string;
}

// Turnos
export type EstadoTurno = "pendiente" | "confirmado" | "cancelado" | "completado";

export interface Turno {
  id: string;
  paciente_id: string;
  consultorio_id: string;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  recordatorio_enviado: boolean;
  created_at: string;
  updated_at: string;
}

// Plantillas
export type EstadoPlantilla =
  | "en_taller"
  | "lista_para_entrega"
  | "entregada"
  | "renovacion_pendiente";

export interface Plantilla {
  id: string;
  paciente_id: string;
  turno_id?: string;
  estado: EstadoPlantilla;
  foto_url?: string;
  fecha_entrega?: string;
  fecha_renovacion?: string;
  recordatorio_renovacion_enviado: boolean;
  notas?: string;
  created_at: string;
  updated_at: string;
}
