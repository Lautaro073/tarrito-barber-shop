import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { sendEmail, BARBER_EMAIL } from '@/lib/email-config';
import { multipleTurnosEmail } from '@/lib/email-templates';
import { seedAvailability, notifyAvailability } from '@/lib/availability-notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { citas, cantidadPersonas } = body;

    // Validación básica
    if (!citas || !Array.isArray(citas) || citas.length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos una cita' },
        { status: 400 }
      );
    }

    // Validar que todas las citas tengan los datos necesarios
    for (const cita of citas) {
      if (!cita.servicioId || !cita.fecha || !cita.hora || !cita.nombre || !cita.telefono) {
        return NextResponse.json(
          { error: 'Faltan datos requeridos en una o más citas' },
          { status: 400 }
        );
      }
    }

    // Obtener información de servicios
    const serviciosRef = collection(db, 'servicios');
    const serviciosSnapshot = await getDocs(serviciosRef);
    const serviciosMap = new Map();
    serviciosSnapshot.docs.forEach(doc => {
      serviciosMap.set(doc.id, `${doc.data().icono} ${doc.data().nombre}`);
    });

    // Verificar disponibilidad de todos los horarios antes de crear cualquiera
    const citasRef = collection(db, 'citas');
    const horariosOcupados = [];

    for (const cita of citas) {
      const fechaStr = new Date(cita.fecha).toISOString().split('T')[0];
      const q = query(
        citasRef,
        where('fecha', '>=', fechaStr + 'T00:00:00'),
        where('fecha', '<=', fechaStr + 'T23:59:59')
      );
      const citasExistentes = await getDocs(q);
      
      const ocupado = citasExistentes.docs.some(doc => {
        const data = doc.data();
        return data.hora === cita.hora && data.estado !== 'cancelado';
      });

      if (ocupado) {
        horariosOcupados.push({
          fecha: fechaStr,
          hora: cita.hora
        });
      }
    }

    if (horariosOcupados.length > 0) {
      return NextResponse.json(
        { 
          error: 'Algunos horarios ya fueron reservados por otra persona. Por favor recargá y seleccioná otros turnos.',
          code: 'HORARIO_OCUPADO',
          horariosOcupados
        },
        { status: 409 }
      );
    }

    const affectedDates = citas.map((cita: { fecha: string }) => cita.fecha.slice(0, 10));
    await seedAvailability(affectedDates);
    // Crear todas las citas
    const citasCreadas = [];
    for (const cita of citas) {
      const citaRef = await addDoc(collection(db, 'citas'), {
        servicioId: cita.servicioId,
        fecha: cita.fecha,
        hora: cita.hora,
        nombre: cita.nombre,
        telefono: cita.telefono,
        email: cita.email || null,
        cantidadPersonas: cantidadPersonas || 1,
        estado: 'pendiente',
        createdAt: serverTimestamp(),
      });

      citasCreadas.push({
        id: citaRef.id,
        servicio: serviciosMap.get(cita.servicioId) || 'Servicio',
        fecha: cita.fecha,
        hora: cita.hora
      });
    }

    notifyAvailability(affectedDates);
    // Enviar UN SOLO email con todas las citas
    try {
      const emailHtml = multipleTurnosEmail({
        nombreCliente: citas[0].nombre,
        telefono: citas[0].telefono,
        email: citas[0].email,
        cantidadPersonas: cantidadPersonas || 1,
        turnos: citasCreadas
      });

      await sendEmail({
        to: BARBER_EMAIL,
        subject: `💈 ${citasCreadas.length} nuevos turnos reservados - ${citas[0].nombre}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Error al enviar email (turnos creados exitosamente):', emailError);
      // No falla la creación si el email falla
    }

    return NextResponse.json(
      {
        success: true,
        citasCreadas: citasCreadas.length,
        message: `${citasCreadas.length} turnos reservados exitosamente`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear citas:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
