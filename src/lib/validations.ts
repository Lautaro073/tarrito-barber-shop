import { z } from 'zod';

// Validación para crear una cita
export const citaSchema = z.object({
  servicioId: z.string().min(1, 'Debes seleccionar un servicio'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  clienteNombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  clienteCelular: z.string()
    .regex(/^\+?\d{10,15}$/, 'Número de celular inválido (10-15 dígitos)'),
});

// Validación para servicio
export const servicioSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  precio: z.number().min(0, 'El precio debe ser mayor a 0'),
  duracionMinutos: z.number().min(5, 'La duración mínima es 5 minutos').max(480, 'La duración máxima es 8 horas'),
  activo: z.boolean().default(true),
});

// Validación para horario
export const horarioSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  activo: z.boolean().default(true),
});

// Validación para configuración
export const configuracionSchema = z.object({
  emailBarbero: z.string().email('Email inválido'),
  whatsappBarbero: z.string().regex(/^\+?\d{10,15}$/, 'Número de WhatsApp inválido'),
  nombreNegocio: z.string().min(3, 'El nombre del negocio debe tener al menos 3 caracteres'),
  logoUrl: z.string().url('URL de logo inválida').optional(),
});

export type CitaInput = z.infer<typeof citaSchema>;
export type ServicioInput = z.infer<typeof servicioSchema>;
export type HorarioInput = z.infer<typeof horarioSchema>;
export type ConfiguracionInput = z.infer<typeof configuracionSchema>;
