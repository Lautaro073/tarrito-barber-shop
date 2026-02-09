import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, BARBER_EMAIL } from '@/lib/email-config';

// GET - Para ejecución automática vía cron (domingos 15:00)
export async function GET(request: NextRequest) {
  try {
    // Verificar que viene del cron de Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resultado = await enviarRecordatorio();
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Error en GET recordatorio-horarios:', error);
    return NextResponse.json(
      { error: 'Error al enviar recordatorio' },
      { status: 500 }
    );
  }
}

async function enviarRecordatorio() {
  // Calcular fecha de próxima semana
  const hoy = new Date();
  const proximoLunes = new Date(hoy);
  proximoLunes.setDate(hoy.getDate() + (8 - hoy.getDay())); // Próximo lunes
  
  const proximoDomingo = new Date(proximoLunes);
  proximoDomingo.setDate(proximoLunes.getDate() + 6);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .countdown { font-size: 48px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ ¡Recordatorio Importante!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Configurá los horarios de la próxima semana</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h2 style="margin-top: 0; color: #92400e;">⚠️ ¡En 1 hora se habilitan los turnos!</h2>
            <p style="margin-bottom: 0; color: #78350f;">
              Recordá configurar los horarios disponibles para la próxima semana antes de las <strong>16:00 hs</strong>.
            </p>
          </div>

          <div class="countdown">1h</div>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #374151;">📅 Semana a configurar:</h3>
            <p style="font-size: 18px; color: #6b7280; margin: 10px 0;">
              <strong>Desde:</strong> ${proximoLunes.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
              <strong>Hasta:</strong> ${proximoDomingo.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #374151;">📝 Pasos a seguir:</h3>
            <ol style="color: #6b7280; margin: 10px 0;">
              <li>Ingresá al panel de administración</li>
              <li>Andá a la sección "Horarios"</li>
              <li>Configurá los horarios disponibles para cada día (Lunes a Sábado)</li>
              <li>Guardá los cambios antes de las 16:00 hs</li>
            </ol>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tarritobarbershop2023/horarios" class="btn">
              Configurar Horarios Ahora
            </a>
          </div>

          <div class="info-box" style="background: #dbeafe; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af;">
              💡 <strong>Recordá:</strong> Los clientes podrán reservar turnos de lunes a jueves de la próxima semana 
              a partir de las 16:00 hs de hoy (viernes y sábado se pueden reservar siempre).
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">Este es un recordatorio automático del sistema de turnos</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">Tarrito Barber Shop - Sistema de Gestión</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: BARBER_EMAIL,
    subject: '⏰ Recordatorio: Configurá horarios de la próxima semana (en 1 hora)',
    html: emailHtml,
  });

  return {
    success: true,
    message: 'Recordatorio enviado exitosamente',
    proximaSemana: {
      inicio: proximoLunes.toISOString().split('T')[0],
      fin: proximoDomingo.toISOString().split('T')[0]
    }
  };
}
