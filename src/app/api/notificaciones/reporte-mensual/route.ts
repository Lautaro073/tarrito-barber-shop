import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendEmail, BARBER_EMAIL } from '@/lib/email-config';

async function generarYEnviarReporte(mes?: number, anio?: number) {
  // Si no se especifica mes/año, usar el mes anterior
  const hoy = new Date();
  const mesReporte = mes || hoy.getMonth(); // Mes anterior (0-11)
  const anioReporte = anio || (mesReporte === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear());

  // Calcular inicio y fin del mes
  const inicioMes = new Date(anioReporte, mesReporte - 1, 1);
  const finMes = new Date(anioReporte, mesReporte, 0);
  const inicioStr = inicioMes.toISOString().split('T')[0];
  const finStr = finMes.toISOString().split('T')[0];

    // Obtener todas las citas del mes
    const citasRef = collection(db, 'citas');
    const q = query(
      citasRef,
      where('fecha', '>=', inicioStr + 'T00:00:00'),
      where('fecha', '<=', finStr + 'T23:59:59')
    );
    const citasSnapshot = await getDocs(q);
    const citas = citasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Obtener servicios para calcular precios
    const serviciosRef = collection(db, 'servicios');
    const serviciosSnapshot = await getDocs(serviciosRef);
    const servicios = serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Calcular estadísticas
    const citasCompletadas = citas.filter((c: any) => c.estado === 'completado');
    const citasCanceladas = citas.filter((c: any) => c.estado === 'cancelado');
    const citasPendientes = citas.filter((c: any) => c.estado === 'pendiente');

    const gananciaTotal = citasCompletadas.reduce((total: number, cita: any) => {
      const servicio = servicios.find((s: any) => s.id === cita.servicioId);
      return total + (servicio?.precio || 0);
    }, 0);

    // Servicios más populares
    const serviciosCount = citasCompletadas.reduce((acc: any, cita: any) => {
      acc[cita.servicioId] = (acc[cita.servicioId] || 0) + 1;
      return acc;
    }, {});

    const topServicios = Object.entries(serviciosCount)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([servicioId, count]) => {
        const servicio = servicios.find((s: any) => s.id === servicioId);
        return {
          nombre: servicio?.nombre || 'Servicio',
          icono: servicio?.icono || '✂️',
          cantidad: count
        };
      });

    // Crear HTML del email
    const nombreMes = new Date(anioReporte, mesReporte - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .stat-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-label { color: #6b7280; font-size: 14px; margin-bottom: 5px; }
          .stat-value { font-size: 32px; font-weight: bold; color: #10b981; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .summary-item { background: white; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-item .label { color: #6b7280; font-size: 12px; }
          .summary-item .value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          .services-list { list-style: none; padding: 0; }
          .services-list li { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💈 Reporte Mensual</h1>
            <p style="margin: 0; opacity: 0.9;">${nombreMes}</p>
          </div>
          
          <div class="content">
            <div class="stat-card">
              <div class="stat-label">💰 Ganancia Total del Mes</div>
              <div class="stat-value">$${gananciaTotal.toLocaleString('es-AR')}</div>
            </div>

            <h3 style="color: #1f2937; margin-top: 30px;">📊 Resumen de Turnos</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="label">Total de Turnos</div>
                <div class="value" style="color: #3b82f6;">${citas.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Completados</div>
                <div class="value" style="color: #10b981;">${citasCompletadas.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Cancelados</div>
                <div class="value" style="color: #ef4444;">${citasCanceladas.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Pendientes</div>
                <div class="value" style="color: #f59e0b;">${citasPendientes.length}</div>
              </div>
            </div>

            ${topServicios.length > 0 ? `
            <h3 style="color: #1f2937; margin-top: 30px;">🏆 Servicios Más Solicitados</h3>
            <ul class="services-list">
              ${topServicios.map((s: any, i: number) => `
                <li>
                  <span>${i + 1}. ${s.icono} ${s.nombre}</span>
                  <strong>${s.cantidad} veces</strong>
                </li>
              `).join('')}
            </ul>
            ` : ''}

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; border-radius: 4px;">
              <p style="margin: 0; color: #92400e;">
                💡 <strong>Consejo:</strong> Este reporte se genera automáticamente cada mes. 
                Revisá estas métricas para identificar tendencias y oportunidades de mejora.
              </p>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">Tarrito Barber Shop</p>
            <p style="margin: 5px 0 0 0; opacity: 0.7; font-size: 12px;">
              Sistema de Gestión de Turnos
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email
    await sendEmail({
      to: BARBER_EMAIL,
      subject: `📊 Reporte Mensual - ${nombreMes} - Ganancia: $${gananciaTotal.toLocaleString('es-AR')}`,
      html: emailHtml,
    });

  return {
    success: true,
    message: 'Reporte enviado exitosamente',
    gananciaTotal,
    totalTurnos: citas.length
  };
}

// GET - Para cron job automático (ejecutado el 1er día de cada mes)
export async function GET(request: NextRequest) {
  try {
    // Verificar que sea llamado desde Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resultado = await generarYEnviarReporte();
    
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Error al enviar reporte mensual automático:', error);
    return NextResponse.json(
      { error: 'Error al generar el reporte automático' },
      { status: 500 }
    );
  }
}

// POST - Para envío manual desde el panel admin
export async function POST(request: NextRequest) {
  try {
    const { mes, anio } = await request.json();

    if (!mes || !anio) {
      return NextResponse.json(
        { error: 'Mes y año son requeridos' },
        { status: 400 }
      );
    }

    const resultado = await generarYEnviarReporte(mes, anio);

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Error en POST reporte-mensual:', error);
    return NextResponse.json(
      { error: 'Error al enviar el reporte mensual' },
      { status: 500 }
    );
  }
}
