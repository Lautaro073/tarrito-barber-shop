export interface ScheduleDay {
  dia: string;
  activo: boolean;
  horaInicio?: string;
  horaFin?: string;
  franjas?: { horaInicio: string; horaFin: string }[];
}
export interface Availability { enabled: boolean; remaining: number }
export type AvailabilityEvent = 'opened' | 'low' | 'full' | 'reopened';

export const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const argentinaFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ARGENTINA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function transition(before: Availability, after: Availability): AvailabilityEvent | null {
  if (!after.enabled) return null;
  if (!before.enabled) return after.remaining > 0 ? 'opened' : null;
  if (before.remaining === 0 && after.remaining > 0) return 'reopened';
  if (before.remaining > 0 && after.remaining === 0) return 'full';
  if (before.remaining > 2 && after.remaining > 0 && after.remaining <= 2) return 'low';
  return null;
}

export function argentinaClock(now = new Date()) {
  const parts = Object.fromEntries(argentinaFormatter.formatToParts(now).map(part => [part.type, part.value]));
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
    day: weekdays[parts.weekday],
  };
}

export function upcomingDates(now = new Date()) {
  const { date } = argentinaClock(now);
  return Array.from({ length: 14 }, (_, i) => new Date(Date.parse(date + 'T12:00:00Z') + i * 86400000).toISOString().slice(0, 10));
}

export function availability(date: string, schedules: ScheduleDay[], durations: number[], appointments: { hora: string; estado: string }[], now = new Date()): Availability {
  const clock = argentinaClock(now);
  const target = new Date(date + 'T12:00:00Z');
  const weekday = target.getUTCDay();
  const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const config = schedules.find(day => day.dia === names[weekday]);
  const daysFromMonday = clock.day === 0 ? 6 : clock.day - 1;
  const monday = Date.parse(clock.date + 'T12:00:00Z') - daysFromMonday * 86400000;
  const end = monday + ((clock.day === 0 && clock.minute >= 960) ? 14 : 7) * 86400000;
  const enabled = date >= clock.date && Boolean(config?.activo) &&
    (weekday === 5 || weekday === 6 || target.getTime() < end);
  if (!enabled || !config) return { enabled: false, remaining: 0 };
  const slots = new Set<string>();
  const occupied = new Set(appointments.filter(cita => cita.estado !== 'cancelado').map(cita => cita.hora));
  const ranges = config.franjas || [{ horaInicio: config.horaInicio || '', horaFin: config.horaFin || '' }];
  for (const duration of durations.filter(d => Number.isFinite(d) && d > 0)) {
    for (const range of ranges) {
      const minutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
      // Match the booking screen's existing 30-minute closing tolerance.
      for (let minute = minutes(range.horaInicio); minute + duration <= minutes(range.horaFin) + 30; minute += duration) {
        const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
        if (!occupied.has(time) && (date !== clock.date || minute > clock.minute + 30)) slots.add(time);
      }
    }
  }
  return { enabled: true, remaining: slots.size };
}

export function availabilityMessage(type: AvailabilityEvent, date: string) {
  const label = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ARGENTINA_TIME_ZONE }).format(new Date(date + 'T12:00:00Z'));
  const messages = {
    opened: { title: 'Turnos habilitados', body: `Ya podés reservar para el ${label}.` },
    low: { title: 'Quedan pocos turnos', body: `Al ${label} le quedan solo uno o dos turnos disponibles.` },
    full: { title: 'Día completo', body: `El ${label} se quedó sin turnos disponibles.` },
    reopened: { title: 'Se liberó un turno', body: `Volvió a haber turnos disponibles para el ${label}.` },
  };
  return messages[type];
}
