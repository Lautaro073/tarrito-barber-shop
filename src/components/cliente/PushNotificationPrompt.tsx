'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PUSH_SNOOZE_KEY, PUSH_SNOOZE_MS, shouldPromptPush } from '@/lib/push-policy';
import { toPushDiagnostic } from '@/lib/push-diagnostics';

export default function PushNotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const vapid = useRef('');

  useEffect(() => {
    let disposed = false;
    const initialize = async () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      if (!standalone || !('Notification' in window) || Notification.permission === 'denied') return;
      try {
        const { isSupported } = await import('firebase/messaging');
        if (!await isSupported() || disposed) return;
        const response = await fetch('/api/push/config', { signal: AbortSignal.timeout(10000) });
        if (!response.ok) return;
        const config = await response.json();
        if (!config.vapidKey || disposed) return;
        vapid.current = config.vapidKey;
        if (Notification.permission === 'granted') {
          const { registerPushDevice } = await import('@/lib/push-client');
          await registerPushDevice(vapid.current);
          return;
        }
        let snoozed = null;
        try { snoozed = localStorage.getItem(PUSH_SNOOZE_KEY); } catch {}
        if (!disposed) setOpen(shouldPromptPush(standalone, Notification.permission, snoozed));
      } catch {
        // Retry when connectivity returns or the installed app opens again.
      }
    };
    void initialize();
    window.addEventListener('online', initialize);
    return () => { disposed = true; window.removeEventListener('online', initialize); };
  }, []);

  const postpone = () => {
    if (busy) return;
    try { localStorage.setItem(PUSH_SNOOZE_KEY, String(Date.now() + PUSH_SNOOZE_MS)); } catch {}
    setOpen(false);
  };

  const activate = async () => {
    setBusy(true);
    setError('');
    try {
      // Keep the native prompt directly inside the user gesture, before imports.
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setError('Las notificaciones quedaron bloqueadas. Podés habilitarlas desde los ajustes de tu dispositivo.');
        return;
      }
      if (permission !== 'granted') return;
      const { registerPushDevice } = await import('@/lib/push-client');
      await registerPushDevice(vapid.current);
      setOpen(false);
    } catch (registrationError) {
      const diagnostic = toPushDiagnostic('unknown', registrationError);
      try {
        await fetch('/api/push/diagnostics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diagnostic),
          keepalive: true,
        });
      } catch {}
      setError(`No pudimos activar las notificaciones. Código: ${diagnostic.stage}/${diagnostic.code}`);
    } finally {
      setBusy(false);
    }
  };

  return <Dialog open={open} onOpenChange={(value) => { if (!value) postpone(); }}>
    <DialogContent className="sm:max-w-sm" showCloseButton={!busy}>
      <DialogHeader>
        <Bell className="mb-2 h-7 w-7 self-center text-primary" aria-hidden="true" />
        <DialogTitle>Activá las notificaciones</DialogTitle>
        <DialogDescription>¿Querés recibir notificaciones de Tarrito Barber Shop en este dispositivo?</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={postpone} disabled={busy}>Ahora no</Button>
        <Button onClick={activate} disabled={busy}>
          <Bell aria-hidden="true" />{busy ? 'Activando...' : 'Activar notificaciones'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
