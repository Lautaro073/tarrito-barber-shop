'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatShortDate } from '@/lib/chat-turnos-utils';

type Draft = {
  servicioId?: string | null;
  fecha?: string | null;
  hora?: string | null;
  nombre?: string | null;
  telefono?: string | null;
  cantidadPersonas?: number | null;
  rango?: 'manana' | 'mediodia' | 'tarde' | null;
  action?: 'book' | 'lookup' | 'cancel' | null;
};

type SuggestedSlot = {
  fecha: string;
  hora: string;
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

type ChatResponse = {
  intent?: string;
  reply: string;
  draft: Draft;
  suggestedSlots: SuggestedSlot[];
  turnos?: TurnoChat[];
  readyToConfirm: boolean;
  canCancel?: boolean;
  error?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export default function ChatTurnos() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hola, soy el asistente de turnos Tarrito. Conmigo podés agendar, consultar o cancelar tu turno.' },
  ]);
  const [draft, setDraft] = useState<Draft>({});
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);
  const [turnos, setTurnos] = useState<TurnoChat[]>([]);
  const [canCancel, setCanCancel] = useState(false);
  const [readyToConfirm, setReadyToConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading, suggestedSlots, turnos, readyToConfirm]);

  if (pathname?.startsWith('/tarritobarbershop2023')) return null;

  const sendMessage = async (text: string, draftOverride = draft) => {
    if (!text.trim() || loading) return;

    const nextCancelMode = cancelMode || /\b(cancelar|cancela|anular|borrar)\b/i.test(text);
    setCancelMode(nextCancelMode);
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', text }]);
    setInput('');

    try {
      const response = await fetch('/api/chat-turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          draft: nextCancelMode ? { ...draftOverride, action: 'cancel' } : draftOverride,
        }),
      });
      const data = (await response.json()) as ChatResponse;

      if (!response.ok) {
        throw new Error(data.error || 'No pude procesar el mensaje.');
      }

      setDraft(data.draft || {});
      setSuggestedSlots(data.draft?.hora ? [] : data.suggestedSlots || []);
      setTurnos(data.turnos || []);
      setCanCancel(Boolean(data.canCancel || data.intent === 'cancel_appointment' || (nextCancelMode && data.turnos?.length)));
      setReadyToConfirm(Boolean(data.readyToConfirm));
      setMessages((current) => [...current, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'No pude conectar con el asistente. Probá de nuevo.',
        },
      ]);
    } finally {
      setLoading(false);
      // Mantener el foco en el input para que el teclado no se cierre en móvil
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleSlotClick = (slot: SuggestedSlot) => {
    const nextDraft = { ...draft, fecha: slot.fecha, hora: slot.hora };
    setDraft(nextDraft);
    setSuggestedSlots([]);
    setTurnos([]);
    setCanCancel(false);
    sendMessage(`Elijo ${slot.hora}`, nextDraft);
  };

  const cancelarTurno = async (turnoId: string) => {
    if (confirming) return;

    setConfirming(true);

    try {
      const responseCancel = await fetch(`/api/citas/${turnoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado', canceladoPorCliente: true }),
      });

      if (!responseCancel.ok) {
        throw new Error('No pude cancelar el turno.');
      }

      const turno = turnos.find((item) => item.id === turnoId);
      const detalle = turno ? ` para ${formatShortDate(turno.fecha)} a las ${turno.hora}` : '';
      setMessages((current) => [...current, { role: 'assistant', text: `Listo, cancelé ese turno${detalle}.` }]);
      setTurnos([]);
      setCanCancel(false);
      setCancelMode(false);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: error instanceof Error ? error.message : 'No pude cancelar el turno.' },
      ]);
    } finally {
      setConfirming(false);
    }
  };

  const confirmarTurno = async () => {
    if (!draft.servicioId || !draft.fecha || !draft.hora || !draft.nombre || !draft.telefono || confirming) return;

    setConfirming(true);

    try {
      const fecha = draft.fecha;
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicioId: draft.servicioId,
          fecha: new Date(`${fecha}T00:00:00-03:00`).toISOString(),
          hora: draft.hora,
          nombre: draft.nombre,
          telefono: draft.telefono,
          cantidadPersonas: draft.cantidadPersonas || 1,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No pude registrar el turno.');
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', text: `Turno registrado para ${formatShortDate(fecha)} a las ${draft.hora}. Te esperamos.` },
      ]);
      setDraft({});
      setSuggestedSlots([]);
      setReadyToConfirm(false);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'No pude confirmar el turno. Probá otro horario.',
        },
      ]);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
      {open && (
        <section className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <Bot className="h-5 w-5" />
              Asistente de turnos
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar chat">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'ml-8 bg-primary text-primary-foreground'
                    : 'mr-8 bg-muted text-foreground'
                }`}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pensando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {suggestedSlots.length > 0 && (
            <div className="border-t px-4 py-3">
              <div className="grid grid-cols-3 gap-2">
                {suggestedSlots.map((slot) => (
                  <Button
                    key={`${slot.fecha}-${slot.hora}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSlotClick(slot)}
                    disabled={loading}
                  >
                    {slot.hora}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {turnos.length > 0 && (
            <div className="space-y-2 border-t px-4 py-3">
              {turnos.map((turno) => (
                <div key={turno.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-semibold">{turno.servicioNombre}</p>
                  <p className="text-muted-foreground">
                    {formatShortDate(turno.fecha)} · {turno.hora} hs
                  </p>
                  <p className="text-muted-foreground">{turno.nombre}</p>
                  {canCancel && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => cancelarTurno(turno.id)}
                      disabled={confirming}
                    >
                      Cancelar este turno
                    </Button>
                  )}
                  {!canCancel && (
                    <p className="mt-2 text-xs text-muted-foreground">Este es el turno encontrado.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {readyToConfirm && (
            <div className="border-t px-4 py-3">
              <Button type="button" className="w-full" onClick={confirmarTurno} disabled={confirming}>
                {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar turno
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ej: mañana a la tarde"
              readOnly={loading}
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Enviar mensaje">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}

      <Button
        type="button"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir chat de turnos"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
