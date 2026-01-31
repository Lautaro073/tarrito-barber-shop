# Sistema de Notificaciones por Email con Nodemailer + Gmail

## 🎯 Configuración (100% GRATIS)

### 1. Habilitar App Password en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú izquierdo, selecciona **Seguridad**
3. Activa la **Verificación en 2 pasos** (si no la tenés activada)
4. Una vez activada, busca **Contraseñas de aplicaciones**
5. Genera una nueva contraseña de aplicación:
   - Nombre: "Tarrito Barber Shop"
   - Google te dará un código de 16 dígitos (algo como: `abcd efgh ijkl mnop`)

### 2. Configurar Variables de Entorno

Abrí el archivo `.env.local` y actualizá estas variables:

```env
# Gmail Configuration (Nodemailer - 100% GRATIS)
GMAIL_USER=staingosanchez@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
BARBER_EMAIL=staingosanchez@gmail.com
```

**Importante:** 
- `GMAIL_USER`: Tu email de Gmail
- `GMAIL_APP_PASSWORD`: La contraseña de 16 dígitos que generaste (sin espacios)
- `BARBER_EMAIL`: El email donde querés recibir las notificaciones (puede ser el mismo o diferente)

### 3. Variables del Cron Job

```env
CRON_SECRET=vivaperon
```

## 📧 Tipos de Emails

### 1. Nuevo Turno Reservado
Se envía **automáticamente** cuando un cliente reserva un turno.

**Contenido:**
- Nombre del cliente
- Teléfono (con link a WhatsApp)
- Servicio reservado
- Fecha y hora
- Diseño profesional con gradientes

### 2. Resumen Diario
Se envía **todos los días a las 7:00 AM** con la agenda del día.

**Contenido:**
- Lista de todos los turnos del día
- Estado de cada turno (Pendiente/Confirmado/Completado)
- Resumen de estadísticas
- Servicios de cada turno

## 🧪 Probar el Sistema

### Probar Email de Nuevo Turno

1. Andá a http://localhost:3000/reservar
2. Seleccioná un servicio
3. Completá el formulario
4. Reservá el turno
5. Revisá tu bandeja de entrada

### Probar Email de Resumen Diario

Podés probar el endpoint manualmente:

```bash
curl -X GET "http://localhost:3000/api/notificaciones/resumen-diario" \
  -H "Authorization: Bearer vivaperon"
```

O con PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/notificaciones/resumen-diario" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer vivaperon" }
```

## ⏰ Configuración del Cron Job (Vercel)

El archivo `vercel.json` ya está configurado:

```json
{
  "crons": [
    {
      "path": "/api/notificaciones/resumen-diario",
      "schedule": "0 7 * * *"
    }
  ]
}
```

**Importante:** Los cron jobs solo funcionan en **producción** (cuando deployás a Vercel), no en desarrollo local.

### Deployar a Vercel

1. Subí el código a GitHub
2. Conectá el repo en Vercel
3. Agregá las variables de entorno en el dashboard de Vercel:
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `BARBER_EMAIL`
   - `CRON_SECRET`
   - (Más todas las de Firebase)

4. Vercel automáticamente detectará el `vercel.json` y configurará el cron

## 🔧 Troubleshooting

### Error: "Invalid login"
- Asegurate de haber activado la verificación en 2 pasos
- Verificá que la App Password esté copiada sin espacios
- La App Password debe ser de 16 caracteres

### No llegan los emails
- Revisá la carpeta de Spam
- Verificá que `GMAIL_USER` y `GMAIL_APP_PASSWORD` estén configurados
- Mirá los logs en la terminal para ver errores

### Error: "Missing credentials"
- Falta `GMAIL_USER` o `GMAIL_APP_PASSWORD` en `.env.local`
- Reiniciá el servidor de desarrollo después de cambiar `.env.local`

### El cron job no funciona
- Recordá que los cron jobs **solo funcionan en producción** en Vercel
- En desarrollo, podés testearlo manualmente con curl/PowerShell

## 🎨 Personalizar Templates

Los templates de email están en: `src/lib/email-templates.tsx`

Podés modificar:
- Colores (variables CSS en `<style>`)
- Estructura del HTML
- Textos y mensajes
- Imágenes o logos

## ✅ Ventajas de Nodemailer + Gmail

- ✅ **Completamente gratis** (no hay límites en Gmail)
- ✅ Envía a cualquier email
- ✅ No requiere dominio verificado
- ✅ Configuración simple
- ✅ Más confiable que servicios gratuitos de terceros
- ✅ Sin restricciones de "testing only"

## 📝 Notas

- Gmail tiene un límite de ~500 emails/día para cuentas normales
- Si necesitás más, podés usar Google Workspace (de pago)
- Las App Passwords son más seguras que usar tu contraseña real
- Podés revocar la App Password en cualquier momento
