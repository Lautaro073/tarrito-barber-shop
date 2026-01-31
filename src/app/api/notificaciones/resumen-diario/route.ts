import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendEmail, BARBER_EMAIL } from '@/lib/email-config';
import { resumenDiarioEmail } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  try {
    // Verificar token de autenticación para seguridad (opcional pero recomendado)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener fecha de hoy
    const hoy = new Date();
    const fechaStr = hoy.toISOString().split('T')[0];

    // Consultar turnos del día
    const citasRef = collection(db, 'citas');
    const q = query(
      citasRef, 
      where('fecha', '>=', fechaStr + 'T00:00:00'), 
      where('fecha', '<=', fechaStr + 'T23:59:59')
    );
    const querySnapshot = await getDocs(q);

    // Obtener servicios para mostrar nombres
    const serviciosSnapshot = await getDocs(collection(db, 'servicios'));
    const serviciosMap = new Map();
    serviciosSnapshot.docs.forEach(doc => {
      serviciosMap.set(doc.id, doc.data());
    });

    // Filtrar solo turnos no cancelados y ordenar por hora
    const turnos = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as any)
      .filter((t: any) => t.estado !== 'cancelado')
      .sort((a: any, b: any) => a.hora.localeCompare(b.hora))
      .map((turno: any) => {
        const servicio = serviciosMap.get(turno.servicioId);
        return {
          hora: turno.hora,
          servicio: servicio ? `${servicio.icono} ${servicio.nombre}` : 'Servicio',
          nombreCliente: turno.nombre,
          telefono: turno.telefono,
          estado: turno.estado,
        };
      });

    // Enviar email con el resumen
    const emailHtml = resumenDiarioEmail({
      fecha: fechaStr,
      turnos,
    });

    await sendEmail({
      to: BARBER_EMAIL,
      subject: `📅 Agenda del día - ${new Date(fechaStr).toLocaleDateString('es-AR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })}`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Resumen diario enviado exitosamente',
      turnosCount: turnos.length,
      fecha: fechaStr,
    });
  } catch (error) {
    console.error('Error al enviar resumen diario:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
