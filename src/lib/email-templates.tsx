interface NuevoTurnoEmailProps {
  nombreCliente: string;
  telefono: string;
  email?: string;
  servicio: string;
  fecha: string;
  hora: string;
  cantidadPersonas: number;
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

interface MultipleTurnosEmailProps {
  nombreCliente: string;
  telefono: string;
  email?: string;
  cantidadPersonas: number;
  turnos: Array<{
    servicio: string;
    fecha: string;
    hora: string;
  }>;
}

export const nuevoTurnoEmail = ({ nombreCliente, telefono, email, servicio, fecha, hora, cantidadPersonas }: NuevoTurnoEmailProps) => `
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
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 5px 0;">Este es un email automático de Tarrito Barber Shop</p>
    </div>
  </div>
</body>
</html>
`;

export const multipleTurnosEmail = ({ nombreCliente, telefono, email, turnos, cantidadPersonas }: MultipleTurnosEmailProps) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 30px; }
    .cliente-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .info-row { padding: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: bold; color: #555; }
    .info-value { color: #333; }
    .turnos-list { margin: 20px 0; }
    .turno-item { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 15px; margin: 10px 0; }
    .turno-item h3 { margin: 0 0 10px 0; color: #667eea; font-size: 18px; }
    .turno-detail { padding: 5px 0; color: #555; }
    .badge { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
    .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px; }
    .whatsapp-btn { display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: bold; }
    .whatsapp-btn:hover { background: #20BA5A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💈 ${turnos.length} Nuevos Turnos Reservados</h1>
      <p>Tarrito Barber Shop</p>
    </div>
    
    <div class="content">
      <p>¡Hola! Un cliente ha reservado <strong>${turnos.length} turnos</strong>:</p>
      
      <div class="cliente-info">
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
          <span class="info-label">👥 Cantidad:</span>
          <span class="info-value">${cantidadPersonas} persona${cantidadPersonas > 1 ? 's' : ''}</span>
        </div>
      </div>

      <h2 style="color: #667eea; margin-top: 30px;">📋 Turnos Reservados:</h2>
      
      <div class="turnos-list">
        ${turnos.map((turno, index) => `
          <div class="turno-item">
            <span class="badge">Turno ${index + 1}</span>
            <h3>${turno.servicio}</h3>
            <div class="turno-detail">
              📅 <strong>Fecha:</strong> ${new Date(turno.fecha).toLocaleDateString('es-AR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
            </div>
            <div class="turno-detail">
              🕐 <strong>Hora:</strong> ${turno.hora} hs
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: center;">
        <a href="https://wa.me/${telefono.replace(/\D/g, '')}" class="whatsapp-btn">
          💬 Contactar por WhatsApp
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este es un email automático de Tarrito Barber Shop</p>
    </div>
  </div>
</body>
</html>
`;
