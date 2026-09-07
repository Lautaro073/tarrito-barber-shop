# Notificaciones de disponibilidad

Variables del servidor en `.env.local` y Vercel:

- `FIREBASE_CLIENT_EMAIL`: client_email de la cuenta de servicio del mismo proyecto Firebase.
- `FIREBASE_PRIVATE_KEY`: private_key de esa cuenta. Se admiten saltos de linea escapados como `\n`.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: proyecto existente.
- `NEXT_FIREBASE_VAPID_KEY`: clave publica Web Push existente.
- `CRON_SECRET`: secreto existente para las tareas programadas.

Las credenciales Admin se obtienen en Firebase, Configuracion del proyecto > Cuentas de servicio. Nunca usar un prefijo NEXT_PUBLIC para la clave privada. La cuenta debe poder acceder a Firestore y enviar FCM; Cloud Messaging API debe estar habilitada.

## Eventos

- Apertura semanal: domingo 16:00 Argentina, cron `GET /api/notificaciones/disponibilidad` (19:00 UTC). Emite un anuncio de apertura semanal.
- Cambios de horarios: registra disponibilidad antes y despues de guardar, para los proximos 14 dias.
- Reservas individuales y multiples: avisa al pasar de mas de dos lugares libres a uno o dos; no repite al pasar de dos a uno.
- Dia completo: pasa de lugares libres a cero.
- Cancelacion o restauracion de una cita: recalcula la fecha; si pasa de cero a lugares libres, anuncia que volvio a haber disponibilidad.
- Confirmar o completar una cita no cambia la capacidad ni genera avisos.

El conteo reproduce la grilla actual: franjas, duracion de servicios activos, tolerancia de cierre de 30 minutos, horarios ocupados y anticipacion de 30 minutos para hoy. Los inicios iguales de distintos servicios se cuentan una sola vez. No se anuncia un dia completo simplemente porque ya paso su ultimo horario.

## Persistencia y reintentos

`pushSubscriptions` contiene los Firebase Installation IDs registrados. `pushAvailability` guarda el estado por fecha. Una transaccion crea en `pushEvents` cada cambio junto con su nueva revision. Los envios se procesan despues de responder a la reserva mediante Next.js `after`.

Los eventos pendientes se reintentan en el siguiente cambio de disponibilidad o invocacion del endpoint protegido. Las entregas confirmadas se guardan en la subcoleccion `deliveries`; tokens invalidos se eliminan. No se promete entrega exactamente una vez si el proceso muere entre FCM y el registro de la entrega. El tag estable evita acumular el mismo aviso en el dispositivo.

Se descartan eventos reemplazados por otra revision y los de mas de seis horas. El cron semanal no sustituye un servicio de reintentos frecuentes: si se necesita esa garantia, invocar el endpoint protegido con mayor frecuencia usando un scheduler compatible con el plan de Vercel.

No se vinculan dispositivos con nombres, telefonos o reservas: estos cuatro avisos son generales para todos los suscriptores.

## Verificacion

`node --test tests/*.test.mjs` y `npm run build`.

La prueba real requiere desplegar con las variables anteriores, registrar una PWA y efectuar cambios controlados de disponibilidad. No ejecutar esa prueba contra todos los suscriptores sin coordinarla con el dueno.
