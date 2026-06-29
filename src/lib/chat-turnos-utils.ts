export type RangoHorario = 'manana' | 'tarde' | 'noche' | null;

export type ChatDraft = {
  servicioId?: string | null;
  fecha?: string | null;
  hora?: string | null;
  nombre?: string | null;
  telefono?: string | null;
  cantidadPersonas?: number | null;
  rango?: RangoHorario;
  action?: 'book' | 'lookup' | 'cancel' | null;
};

export type SuggestedSlot = {
  fecha: string;
  hora: string;
};

const rangoMinutos: Record<Exclude<RangoHorario, null>, [number, number]> = {
  manana: [9 * 60, 12 * 60],        // 09:00 – 11:59
  tarde: [12 * 60, 20 * 60],        // 12:00 – 19:59
  noche: [18 * 60, 24 * 60],        // 18:00 en adelante (días que cierran a las 21:00)
};

export const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const argentinaParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
};

export const getArgentinaDateKey = (date = new Date()) => {
  const { year, month, day } = argentinaParts(date);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

export const addDaysToDateKey = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T12:00:00-03:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

export const getArgentinaWeekday = (dateKey: string) =>
  new Date(`${dateKey}T12:00:00-03:00`).getUTCDay();

export const getArgentinaMinutes = (date = new Date()) => {
  const { hour, minute } = argentinaParts(date);
  return hour * 60 + minute;
};

const weekdays = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const levenshteinDistance = (a: string, b: string) => {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }

  return matrix[b.length][a.length];
};

export const hasSimilarToken = (message: string, target: string) => {
  const normalizedTarget = normalizeText(target);
  const tokens = normalizeText(message).split(' ').filter((token) => token.length >= 4);

  return tokens.some((token) => {
    if (token.includes(normalizedTarget) || normalizedTarget.includes(token)) return true;
    if (token.slice(0, 4) === normalizedTarget.slice(0, 4)) return true;
    const maxDistance = normalizedTarget.length <= 5 ? 1 : 2;
    return levenshteinDistance(token, normalizedTarget) <= maxDistance;
  });
};

export const generarHorarios = (
  horaInicio: string,
  horaFin: string,
  duracionMinutos = 40
): string[] => {
  const horarios: string[] = [];
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFinal, minFinal] = horaFin.split(':').map(Number);
  let minutoActual = horaIni * 60 + minIni;
  const minutoFin = horaFinal * 60 + minFinal;

  while (minutoActual + duracionMinutos <= minutoFin + 30) {
    const horas = Math.floor(minutoActual / 60);
    const minutos = minutoActual % 60;
    horarios.push(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
    minutoActual += duracionMinutos;
  }

  return horarios;
};

export const parseBookingHints = (message: string, now = new Date()): ChatDraft => {
  const text = normalizeText(message);
  const draft: ChatDraft = {};

  if (/\bmanana\b/.test(text)) {
    draft.fecha = addDaysToDateKey(getArgentinaDateKey(now), 1);
  } else if (/\bhoy\b/.test(text)) {
    draft.fecha = getArgentinaDateKey(now);
  } else {
    const weekdayIndex = weekdays.findIndex((day) => new RegExp(`\\b${day}\\b`).test(text));
    if (weekdayIndex >= 0) {
      const today = getArgentinaDateKey(now);
      const daysUntil = (weekdayIndex - getArgentinaWeekday(today) + 7) % 7 || 7;
      draft.fecha = addDaysToDateKey(today, daysUntil);
    }

    const dateMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (dateMatch) draft.fecha = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }

  if (/\b(tarde|siesta|mediodia)\b/.test(text)) draft.rango = 'tarde';
  else if (/\bnoche\b/.test(text)) draft.rango = 'noche';
  else if (/\bmanana\b/.test(text) && !draft.rango) draft.rango = 'manana';

  const horaMatch = text.match(/\b([01]?\d|2[0-3])(?::|\.|h)?([0-5]\d)?\b/);
  if (horaMatch && !['hoy', 'manana'].includes(horaMatch[0])) {
    draft.hora = `${horaMatch[1].padStart(2, '0')}:${horaMatch[2] || '00'}`;
  }

  const phoneMatch = message.match(/(?:\+?\d[\d\s-]{7,}\d)/);
  if (phoneMatch) draft.telefono = phoneMatch[0].replace(/[^\d+]/g, '');

  return draft;
};

export const filtrarHorariosPorRango = (horarios: string[], rango: RangoHorario) => {
  if (!rango) return horarios;
  const [inicio, fin] = rangoMinutos[rango];

  return horarios.filter((horario) => {
    const [hora, minutos] = horario.split(':').map(Number);
    const total = hora * 60 + minutos;
    return total >= inicio && total < fin;
  });
};

export const formatShortDate = (fecha: string) => {
  const date = new Date(`${fecha.substring(0, 10)}T12:00:00`);
  const weekday = date.toLocaleDateString('es-AR', { weekday: 'long' });
  const day = fecha.substring(8, 10);
  const month = fecha.substring(5, 7);
  return `${weekday} ${day}/${month}`;
};

export const getMissingFields = (draft: ChatDraft) => {
  const missing: Array<keyof Pick<ChatDraft, 'servicioId' | 'fecha' | 'hora' | 'nombre' | 'telefono'>> = [];

  if (!draft.servicioId) missing.push('servicioId');
  if (!draft.fecha) missing.push('fecha');
  if (!draft.hora) missing.push('hora');
  if (!draft.nombre?.trim()) missing.push('nombre');
  if (!draft.telefono?.trim()) missing.push('telefono');

  return missing;
};

export const messageHasNameCue = (message: string) => {
  const text = normalizeText(message);
  return /\b(soy|me llamo|mi nombre es|nombre)\b/.test(text);
};

const looksLikeBookingRequest = (message: string) => {
  const text = normalizeText(message);
  return /\b(turno|agendar|reservar|corte|cortar|pelo|barba|combo|horario|hora|hoy|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|tarde|siesta|mediodia|noche)\b/.test(text);
};

export const parseNameFromMessage = (message: string, allowBareName = false) => {
  const withoutPhone = message.replace(/(?:\+?\d[\d\s-]{7,}\d)/g, ' ');
  const cueMatch = withoutPhone.match(/\b(?:soy|me llamo|mi nombre es|nombre)\s+([^,.;\n]+)/i);
  const bareCandidate = withoutPhone.replace(/[^\p{L}\s'.-]/gu, ' ').replace(/\s+/g, ' ').trim();
  const name = cueMatch?.[1]?.replace(/\s+/g, ' ').trim()
    || (message !== withoutPhone && bareCandidate)
    || (allowBareName && !looksLikeBookingRequest(message) ? bareCandidate : null);

  return name && name.length >= 3 ? name : null;
};

export const parseLookupName = (message: string) => {
  const cleaned = message
    .replace(/(?:\+?\d[\d\s-]{7,}\d)/g, ' ')
    .replace(/\b(ver|buscar|consultar|recordar|olvide|olvido|cancelar|cancela|borrar|anular|mi|el|la|turno)\b/gi, ' ')
    .replace(/[^\p{L}\s'.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length >= 3 ? cleaned : null;
};

export const acceptsSuggestion = (message: string) =>
  /\b(si|sí|dale|bueno|ok|okay|joya|ese|esa|va|listo)\b/.test(normalizeText(message));

export const mergeDraft = (...drafts: Array<ChatDraft | undefined | null>): ChatDraft =>
  drafts.reduce<ChatDraft>((acc, draft) => {
    if (!draft) return acc;

    Object.entries(draft).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key as keyof ChatDraft] = value as never;
      }
    });

    return acc;
  }, {});
