interface NuevoTurnoEmailProps {
    nombreCliente: string;
    telefono: string;
    email?: string;
    servicio: string;
    fecha: string;
    hora: string;
}

interface TurnoCanceladoEmailProps {
    nombreCliente: string;
    telefono: string;
    servicio: string;
    fecha: string;
    hora: string;
}

interface ResumenDiarioEmailProps {
    fecha: string;
    turnos: Array<{
        hora: string;
        servicio: string;
        nombreCliente: string;
        telefono: string;
        estado: string;
    }>;
}

export const nuevoTurnoEmail = ({ nombreCliente, telefono, email, servicio, fecha, hora }: NuevoTurnoEmailProps) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: bold; color: #555; }
    .info-value { color: #333; }
    .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💈 Nuevo Turno Reservado</h1>
      <p>Tarrito Barber Shop</p>
    </div>
    <div class="content">
      <p>¡Hola! Se ha reservado un nuevo turno:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">👤 Cliente:</span>
          <span class="info-value">${nombreCliente}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📞 Teléfono:</span>
          <span class="info-value">${telefono}</span>
        </div>
        ${email ? `
        <div class="info-row">
          <span class="info-label">📧 Email:</span>
          <span class="info-value">${email}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">✂️ Servicio:</span>
          <span class="info-value">${servicio}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Fecha:</span>
          <span class="info-value">${new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">🕐 Hora:</span>
          <span class="info-value">${hora} hs</span>
        </div>
      </div>
      
      <p>Podés contactar al cliente por WhatsApp haciendo clic <a href="https://wa.me/${telefono.replace(/\D/g, '')}" style="color: #667eea; text-decoration: none; font-weight: bold;">aquí</a>.</p>
    </div>
    <div class="footer">
      <p>Este es un email automático de Tarrito Barber Shop</p>
    </div>
  </div>
</body>
</html>
`;

export const turnoCanceladoEmail = ({ nombreCliente, telefono, servicio, fecha, hora }: TurnoCanceladoEmailProps) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444; border-radius: 5px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: bold; color: #555; }
    .info-value { color: #333; }
    .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚫 Turno Cancelado</h1>
      <p>Tarrito Barber Shop</p>
    </div>
    <div class="content">
      <div class="alert">
        <p style="margin: 0; color: #991b1b;"><strong>⚠️ Un cliente ha cancelado su turno</strong></p>
      </div>
      
      <p>El siguiente turno fue cancelado por el cliente:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">👤 Cliente:</span>
          <span class="info-value">${nombreCliente}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📞 Teléfono:</span>
          <span class="info-value">${telefono}</span>
        </div>
        <div class="info-row">
          <span class="info-label">✂️ Servicio:</span>
          <span class="info-value">${servicio}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Fecha:</span>
          <span class="info-value">${new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">🕐 Hora:</span>
          <span class="info-value">${hora} hs</span>
        </div>
      </div>
      
      <p style="color: #059669; font-weight: bold;">✅ Este horario ya está disponible para nuevas reservas</p>
    </div>
    <div class="footer">
      <p>Este es un email automático de Tarrito Barber Shop</p>
    </div>
  </div>
</body>
</html>
`;

export const resumenDiarioEmail = ({ fecha, turnos }: ResumenDiarioEmailProps) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .summary { background: white; padding: 15px; margin-bottom: 20px; border-radius: 5px; text-align: center; }
    .turno-card { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 5px; }
    .turno-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .hora { font-size: 24px; font-weight: bold; color: #667eea; }
    .estado { padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .estado-pendiente { background: #fef3c7; color: #92400e; }
    .estado-confirmado { background: #dbeafe; color: #1e40af; }
    .turno-info { color: #555; font-size: 14px; }
    .no-turnos { text-align: center; padding: 40px; color: #999; }
    .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Agenda del Día</h1>
      <p>Tarrito Barber Shop</p>
    </div>
    <div class="content">
      <div class="summary">
        <h2 style="margin: 0; color: #667eea;">${new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}</h2>
        <p style="margin: 10px 0 0 0; color: #777;">Total de turnos: <strong>${turnos.length}</strong></p>
      </div>
      
      ${turnos.length === 0 ? `
        <div class="no-turnos">
          <p style="font-size: 48px; margin: 0;">😊</p>
          <p>No tenés turnos programados para hoy</p>
          <p style="color: #999; font-size: 14px;">¡Disfrutá tu día libre!</p>
        </div>
      ` : turnos.map(turno => `
        <div class="turno-card">
          <div class="turno-header">
            <span class="hora">${turno.hora} hs</span>
            <span class="estado estado-${turno.estado}">${turno.estado.toUpperCase()}</span>
          </div>
          <div class="turno-info">
            <p style="margin: 5px 0;"><strong>✂️ ${turno.servicio}</strong></p>
            <p style="margin: 5px 0;">👤 ${turno.nombreCliente}</p>
            <p style="margin: 5px 0;">
              📞 <a href="https://wa.me/${turno.telefono.replace(/\D/g, '')}" style="color: #667eea; text-decoration: none;">${turno.telefono}</a>
            </p>
          </div>
        </div>
      `).join('')}
      
      ${turnos.length > 0 ? `
        <p style="margin-top: 30px; text-align: center; color: #555;">
          ¡Que tengas un excelente día de trabajo! 💪
        </p>
      ` : ''}
    </div>
    <div class="footer">
      <p>Este es un email automático de Tarrito Barber Shop</p>
    </div>
  </div>
</body>
</html>
`;
