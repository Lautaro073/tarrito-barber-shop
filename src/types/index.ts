// Tipos principales de la aplicación

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Horario {
  id: string;
  diaSemana: number; // 0=Domingo, 1=Lunes, etc.
  horaInicio: string; // Formato: "09:00"
  horaFin: string;    // Formato: "19:00"
  activo: boolean;
}

export interface Cita {
  id: string;
  servicioId: string;
  servicio?: Servicio; // Populated
  fecha: string; // Formato: "2026-01-30"
  horaInicio: string; // Formato: "14:00"
  horaFin: string;    // Formato: "14:30"
  clienteNombre: string;
  clienteCelular: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  notificacionEnviada: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaBloqueado {
  id: string;
  fecha: string; // Formato: "2026-12-25"
  motivo: string;
}

export interface Configuracion {
  emailBarbero: string;
  whatsappBarbero: string;
  nombreNegocio: string;
  logoUrl?: string;
}

export interface TimeSlot {
  hora: string;
  disponible: boolean;
  motivo?: string; // Si no está disponible
}

// Formulario de reserva
export interface ReservaFormData {
  servicioId: string;
  fecha: string;
  horaInicio: string;
  clienteNombre: string;
  clienteCelular: string;
}
