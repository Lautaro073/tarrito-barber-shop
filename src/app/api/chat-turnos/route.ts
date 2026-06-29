import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  acceptsSuggestion,
  addDaysToDateKey,
  ChatDraft,
  filtrarHorariosPorRango,
  formatShortDate,
  generarHorarios,
  getArgentinaDateKey,
  getArgentinaMinutes,
  getArgentinaWeekday,
  getMissingFields,
  hasSimilarToken,
  levenshteinDistance,
  mergeDraft,
  messageHasNameCue,
  normalizeText,
  parseBookingHints,
  parseLookupName,
  parseNameFromMessage,
  SuggestedSlot,
} from '@/lib/chat-turnos-utils';


type Servicio = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracionMinutos: number;
  icono?: string;
  activo: boolean;
};

type HorarioConfig = {
  dia: string;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
  franjas?: Array<{ horaInicio: string; horaFin: string }>;
};

type AiResult = {
  intent: 'book_appointment' | 'ask_business_info' | 'out_of_scope';
  reply: string;
  draft: ChatDraft;
};

type TurnoChat = {
  id: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  nombre: string;
  telefono: string;
  estado: string;
};

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com';

const defaultServicios: Servicio[] = [
  {
    id: '1',
    nombre: 'Corte de Cabello',
    descripcion: 'Corte moderno y profesional',
    precio: 150,
    duracionMinutos: 40,
    icono: '✂️',
    activo: true,
  },
  {
    id: '2',
    nombre: 'Combo Completo',
    descripcion: 'Corte + Barba',
    precio: 250,
    duracionMinutos: 40,
    icono: '💈',
    activo: true,
  },
];

const defaultHorarios: HorarioConfig[] = [
  { dia: 'Lunes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
  { dia: 'Martes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
  { dia: 'Miércoles', activo: true, horaInicio: '09:00', horaFin: '19:00' },
  { dia: 'Jueves', activo: true, horaInicio: '09:00', horaFin: '19:00' },
  { dia: 'Viernes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
  { dia: 'Sábado', activo: true, horaInicio: '09:00', horaFin: '15:00' },
  { dia: 'Domingo', activo: false, horaInicio: '', horaFin: '' },
];

const chatSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['intent', 'reply', 'draft'],
  properties: {
    intent: { type: 'string', enum: ['book_appointment', 'ask_business_info', 'out_of_scope'] },
    reply: { type: 'string' },
    draft: {
      type: 'object',
      additionalProperties: false,
      required: ['servicioId', 'fecha', 'hora', 'nombre', 'telefono', 'cantidadPersonas', 'rango'],
      properties: {
        servicioId: { type: ['string', 'null'] },
        fecha: { type: ['string', 'null'] },
        hora: { type: ['string', 'null'] },
        nombre: { type: ['string', 'null'] },
        telefono: { type: ['string', 'null'] },
        cantidadPersonas: { type: ['number', 'null'] },
        rango: { type: ['string', 'null'], enum: ['manana', 'tarde', 'noche', null] },
      },
    },
  },
};

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const isBookingRelated = (message: string, draft: ChatDraft) => {
  const text = normalizeText(message);
  return Boolean(
    draft.fecha ||
    draft.hora ||
    draft.telefono ||
    /\b(turno|agendar|reservar|corte|barba|combo|horario|hora|hoy|manana|tarde|siesta|mediodia|noche)\b/.test(text)
  );
};

const getAction = (message: string) => {
  const text = normalizeText(message);
  if (/\b(cancelar|cancela|borrar|anular)\b/.test(text)) return 'cancel';
  if (/\b(ver|buscar|consultar|recordar|olvide|olvido|cuando|mi turno)\b/.test(text)) return 'lookup';
  return 'book';
};

const getServicios = async () => {
  const snapshot = await getDocs(query(collection(db, 'servicios'), orderBy('orden', 'asc')));
  if (snapshot.empty) return defaultServicios;

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Servicio)
    .filter((servicio) => servicio.activo);
};

const getHorarios = async () => {
  const snapshot = await getDocs(query(collection(db, 'horarios')));
  if (snapshot.empty) return defaultHorarios;

  return (snapshot.docs[0].data().horarios || defaultHorarios) as HorarioConfig[];
};

const inferServicioId = (message: string, servicios: Servicio[]) => {
  const text = normalizeText(message);
  return servicios.find((servicio) => {
    const nombre = normalizeText(servicio.nombre);
    const descripcion = normalizeText(servicio.descripcion || '');
    const serviceTokens = `${nombre} ${descripcion} pelo cabello cortar cortarme`.split(' ');
    const isCombo = nombre.includes('combo') && (hasSimilarToken(text, 'combo') || hasSimilarToken(text, 'completo'));
    return isCombo
      || text.includes(nombre)
      || serviceTokens.some((token) => token.length > 3 && hasSimilarToken(text, token));
  })?.id;
};

const getCitasOcupadas = async (fecha: string) => {
  const q = query(
    collection(db, 'citas'),
    where('fecha', '>=', `${fecha}T00:00:00`),
    where('fecha', '<=', `${fecha}T23:59:59`)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => doc.data())
    .filter((cita) => cita.estado !== 'cancelado')
    .map((cita) => cita.hora as string);
};

const isSimilarName = (storedName = '', inputName = '') => {
  const stored = normalizeText(storedName);
  const input = normalizeText(inputName);

  if (!input) return false;
  if (stored.includes(input) || input.includes(stored)) return true;

  const inputTokens = input.split(' ').filter(Boolean);
  const storedTokens = stored.split(' ').filter(Boolean);

  if (inputTokens.length > 0 && inputTokens.every((token) =>
    storedTokens.some((storedToken) => storedToken.includes(token))
  )) {
    return true;
  }

  const maxDistance = input.length <= 5 ? 1 : 2;
  return levenshteinDistance(stored, input) <= maxDistance;
};

const findTurnos = async (draft: ChatDraft): Promise<TurnoChat[]> => {
  const citasSnapshot = await getDocs(collection(db, 'citas'));
  const serviciosSnapshot = await getDocs(collection(db, 'servicios'));
  const nombre = draft.nombre || '';
  const telefono = (draft.telefono || '').replace(/\D/g, '');
  const fecha = draft.fecha?.substring(0, 10);

  const turnos = citasSnapshot.docs
    .map((citaDoc) => {
      const data = citaDoc.data();
      const servicio = serviciosSnapshot.docs.find((servicioDoc) => servicioDoc.id === data.servicioId);
      return {
        id: citaDoc.id,
        servicioNombre: servicio ? `${servicio.data().icono} ${servicio.data().nombre}` : 'Servicio',
        fecha: data.fecha,
        hora: data.hora,
        nombre: data.nombre,
        telefono: data.telefono,
        estado: data.estado,
      } as TurnoChat;
    })
    .filter((turno) => ['pendiente', 'confirmado'].includes(turno.estado))
    .filter((turno) => {
      const turnoFecha = turno.fecha?.substring(0, 10);
      const turnoTelefono = (turno.telefono || '').replace(/\D/g, '');
      const nombreOk = !nombre.trim() || isSimilarName(turno.nombre, nombre);
      const telefonoOk = !telefono || turnoTelefono.includes(telefono);
      const fechaOk = !fecha || turnoFecha === fecha;
      return nombreOk && telefonoOk && fechaOk;
    })
    .slice(0, 5);

  if (turnos.length === 0 && telefono) {
    return citasSnapshot.docs
      .map((citaDoc) => {
        const data = citaDoc.data();
        const servicio = serviciosSnapshot.docs.find((servicioDoc) => servicioDoc.id === data.servicioId);
        return {
          id: citaDoc.id,
          servicioNombre: servicio ? `${servicio.data().icono} ${servicio.data().nombre}` : 'Servicio',
          fecha: data.fecha,
          hora: data.hora,
          nombre: data.nombre,
          telefono: data.telefono,
          estado: data.estado,
        } as TurnoChat;
      })
      .filter((turno) => ['pendiente', 'confirmado'].includes(turno.estado))
      .filter((turno) => (turno.telefono || '').replace(/\D/g, '').includes(telefono))
      .slice(0, 5);
  }

  return turnos;
};


const formatTurno = (turno: TurnoChat) =>
  `${turno.servicioNombre} para ${formatShortDate(turno.fecha)} a las ${turno.hora}`;

const getAvailableSlots = async (
  draft: ChatDraft,
  servicios: Servicio[],
  horarios: HorarioConfig[],
  now = new Date(),
  limit = 8
): Promise<SuggestedSlot[]> => {
  if (!draft.fecha || !draft.servicioId) return [];

  const servicio = servicios.find((item) => item.id === draft.servicioId);
  if (!servicio) return [];

  const dia = dayNames[getArgentinaWeekday(draft.fecha)];
  const configDia = horarios.find((item) => normalizeText(item.dia) === normalizeText(dia));
  if (!configDia?.activo) return [];

  const franjas = configDia.franjas?.length
    ? configDia.franjas
    : [{ horaInicio: configDia.horaInicio, horaFin: configDia.horaFin }];

  const generados = franjas.flatMap((franja) =>
    generarHorarios(franja.horaInicio, franja.horaFin, servicio.duracionMinutos || 40)
  );
  const ocupados = await getCitasOcupadas(draft.fecha);
  let libres = generados.filter((hora) => !ocupados.includes(hora));

  if (draft.fecha === getArgentinaDateKey(now)) {
    const limite = getArgentinaMinutes(now) + 30;
    libres = libres.filter((hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m > limite;
    });
  }

  libres = filtrarHorariosPorRango(libres, draft.rango || null);

  const cantidad = Math.max(1, Math.min(10, draft.cantidadPersonas || 1));
  if (cantidad > 1) {
    libres = libres.filter((hora) => {
      const [h, m] = hora.split(':').map(Number);
      let minuto = h * 60 + m;

      for (let i = 0; i < cantidad; i++) {
        const slot = `${Math.floor(minuto / 60).toString().padStart(2, '0')}:${(minuto % 60).toString().padStart(2, '0')}`;
        if (!libres.includes(slot)) return false;
        minuto += servicio.duracionMinutos || 40;
      }

      return true;
    });
  }

  return libres.slice(0, limit).map((hora) => ({ fecha: draft.fecha!, hora }));
};

const findNextAvailableDate = async (
  fromFecha: string,
  servicios: Servicio[],
  horarios: HorarioConfig[],
  rango: ChatDraft['rango']
) => {
  const servicioId = servicios[0]?.id;
  if (!servicioId) return null;

  for (let i = 1; i <= 14; i++) {
    const fecha = addDaysToDateKey(fromFecha, i);
    const slots = await getAvailableSlots({ fecha, servicioId, rango }, servicios, horarios, new Date(), 1);
    if (slots.length > 0) return { fecha, slots };
  }

  return null;
};

const callNvidia = async (
  message: string,
  draft: ChatDraft,
  servicios: Servicio[]
): Promise<AiResult> => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY no configurada');
  }

  const baseUrl = process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 350,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'chat_turnos',
          strict: true,
          schema: chatSchema,
        },
      },
      messages: [
        {
          role: 'system',
          content: `Sos el asistente de Tarrito Barber Shop. Respondé en español tucumano/neutro, claro y breve. Devolvé solo JSON válido con el schema pedido. Solo ayudás con turnos, servicios, horarios, disponibilidad y datos de reserva. Si preguntan otra cosa, intent out_of_scope y no respondas el tema. No inventes horarios ni confirmes reservas. Extraé datos al JSON. Servicios válidos: ${servicios.map((s) => `${s.id}: ${s.nombre}`).join(', ')}.`,
        },
        {
          role: 'user',
          content: JSON.stringify({ mensaje: message, reservaActual: draft }),
        },
      ],
      nvext: {
        guided_json: chatSchema,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`NVIDIA respondió ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('NVIDIA no devolvió contenido');

  const jsonText = String(content).replace(/^```json\s*|\s*```$/g, '').trim();
  return JSON.parse(jsonText) as AiResult;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body.message || '').trim();
    const previousDraft = (body.draft || {}) as ChatDraft;

    if (!message) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    const [servicios, horarios] = await Promise.all([getServicios(), getHorarios()]);
    const hints = parseBookingHints(message);
    const inferredServicioId = inferServicioId(message, servicios);
    const baseDraft = mergeDraft(previousDraft, hints, inferredServicioId ? { servicioId: inferredServicioId } : null);
    const action = previousDraft.action || getAction(message);

    if (action === 'lookup' || action === 'cancel') {
      const lookupDraft = mergeDraft(previousDraft, hints, { action });
      if (!lookupDraft.nombre && !messageHasNameCue(message)) {
        lookupDraft.nombre = parseLookupName(message) || parseNameFromMessage(message, true);
      }

      if (!lookupDraft.nombre && !lookupDraft.telefono && !lookupDraft.fecha) {
        return NextResponse.json({
          intent: 'lookup_appointment',
          reply: 'Pasame tu nombre, teléfono o el día del turno y lo busco.',
          draft: lookupDraft,
          missing: ['nombre'],
          suggestedSlots: [],
          turnos: [],
          readyToConfirm: false,
          canCancel: false,
        });
      }

      const turnos = await findTurnos(lookupDraft);
      const wantsCancel = getAction(message) === 'cancel';
      const reply = turnos.length === 0
        ? 'No encontré un turno activo con esos datos. Probá con tu teléfono o el día.'
        : turnos.length === 1
          ? `${wantsCancel ? 'Encontré este turno' : 'Tu turno es'}: ${formatTurno(turnos[0])}.`
          : `Encontré ${turnos.length} turnos. Elegí cuál querés ${wantsCancel ? 'cancelar' : 'ver'}.`;

      return NextResponse.json({
        intent: wantsCancel ? 'cancel_appointment' : 'lookup_appointment',
        reply,
        draft: { ...lookupDraft, action },
        missing: [],
        suggestedSlots: [],
        turnos,
        readyToConfirm: false,
        canCancel: wantsCancel && turnos.length > 0,
      });
    }

    let ai: AiResult;
    try {
      ai = await callNvidia(message, baseDraft, servicios);
    } catch (error) {
      console.error('Error en chat IA:', error);
      ai = {
        intent: isBookingRelated(message, baseDraft) ? 'book_appointment' : 'out_of_scope',
        reply: '',
        draft: baseDraft,
      };
    }

    const bookingRelated = isBookingRelated(message, baseDraft);

    if (ai.intent === 'out_of_scope' && !bookingRelated) {
      return NextResponse.json({
        intent: ai.intent,
        reply: 'Solo te puedo ayudar a sacar o preparar un turno en Tarrito Barber Shop.',
        draft: previousDraft,
        missing: getMissingFields(previousDraft),
        suggestedSlots: [],
        readyToConfirm: false,
      });
    }
    if (ai.intent === 'out_of_scope' && bookingRelated) {
      ai.intent = 'book_appointment';
    }

    const draft = mergeDraft(
      previousDraft,
      ai.draft,
      hints,
      inferredServicioId ? { servicioId: inferredServicioId } : null
    );

    if (!draft.fecha && previousDraft.fecha && acceptsSuggestion(message)) {
      draft.fecha = previousDraft.fecha;
    }
    if (acceptsSuggestion(message) && !hints.rango) {
      draft.rango = null;
    }

    if (!previousDraft.nombre && !messageHasNameCue(message)) {
      draft.nombre = null;
    }
    if (!draft.nombre) {
      const waitingForContact = Boolean(draft.servicioId && draft.fecha && draft.hora);
      draft.nombre = parseNameFromMessage(message, waitingForContact);
    }
    if (!previousDraft.telefono && !hints.telefono) {
      draft.telefono = null;
    }
    if (!previousDraft.rango && !hints.rango) {
      draft.rango = null;
    }
    if (!previousDraft.servicioId && !inferredServicioId) {
      draft.servicioId = null;
    }
    if (!draft.servicioId) {
      draft.hora = null;
    }

    draft.cantidadPersonas = Math.max(1, Math.min(10, draft.cantidadPersonas || 1));

    const servicioValido = servicios.some((servicio) => servicio.id === draft.servicioId);
    if (draft.servicioId && !servicioValido) draft.servicioId = null;

    if (draft.fecha && !draft.servicioId) {
      const estimatedServiceId = servicios[0]?.id;
      const estimatedSlots = estimatedServiceId
        ? await getAvailableSlots({ ...draft, servicioId: estimatedServiceId }, servicios, horarios)
        : [];

      if (estimatedSlots.length === 0) {
        const next = await findNextAvailableDate(draft.fecha, servicios, horarios, null);
        const nextDraft = next ? { ...draft, fecha: next.fecha, hora: null, rango: null } : { ...draft, hora: null };

        return NextResponse.json({
          intent: 'book_appointment',
          reply: next
            ? `Mirá, para ${formatShortDate(draft.fecha)} no hay turnos libres, pero hay horarios disponibles para ${formatShortDate(next.fecha)}. ¿Te sirve?`
            : `Mirá, para ${formatShortDate(draft.fecha)} no hay turnos libres. Probemos con otra fecha.`,
          draft: nextDraft,
          missing: getMissingFields(nextDraft),
          suggestedSlots: [],
          readyToConfirm: false,
        });
      }
    }

    let suggestedSlots = await getAvailableSlots(draft, servicios, horarios);
    if (draft.hora && !suggestedSlots.some((slot) => slot.hora === draft.hora)) {
      const allDaySlots = await getAvailableSlots({ ...draft, rango: null, hora: null }, servicios, horarios, new Date(), 100);
      const horaDisponible = allDaySlots.some((slot) => slot.hora === draft.hora);
      if (!horaDisponible) {
        draft.hora = null;
        suggestedSlots = allDaySlots.slice(0, 8);
      }
    }
    if (draft.hora) {
      suggestedSlots = [];
    }

    const missing = getMissingFields(draft);
    const readyToConfirm = missing.length === 0;
    let reply = ai.reply;

    if (!draft.servicioId) {
      reply = `Dale, ¿qué servicio querés? Tenemos ${servicios.map((s) => s.nombre).join(' o ')}.`;
    } else if (draft.fecha && !draft.hora) {
      reply = suggestedSlots.length
        ? `Para ese momento tengo estos horarios libres. Elegí uno y seguimos.`
        : 'Para ese momento no me quedan horarios libres. Probemos con otra fecha u otro momento.';
    } else if (draft.fecha && draft.hora && (!draft.nombre || !draft.telefono)) {
      reply = 'Listo, pasame tu nombre y número de teléfono para dejar preparado el turno.';
    } else if (readyToConfirm) {
      const servicio = servicios.find((item) => item.id === draft.servicioId);
      reply = `Tengo todo: ${servicio?.nombre || 'servicio'} para ${formatShortDate(draft.fecha!)} a las ${draft.hora}. Confirmá y lo registro.`;
    }

    return NextResponse.json({
      intent: ai.intent,
      reply,
      draft,
      missing,
      suggestedSlots,
      readyToConfirm,
    });
  } catch (error) {
    console.error('Error en /api/chat-turnos:', error);
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 });
  }
}
