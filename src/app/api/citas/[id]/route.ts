import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { sendEmail, BARBER_EMAIL } from '@/lib/email-config';
import { turnoCanceladoEmail } from '@/lib/email-templates';
import { seedAvailability, notifyAvailability } from '@/lib/availability-notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado, canceladoPorCliente } = body;

    if (!estado) {
      return NextResponse.json(
        { error: 'Falta el estado' },
        { status: 400 }
      );
    }

    const citaRef = doc(db, 'citas', id);
    const previous = (await getDoc(citaRef)).data();
    const date = previous?.fecha?.slice(0, 10);
    const changesCapacity = (previous?.estado === 'cancelado') !== (estado === 'cancelado');
    if (date && changesCapacity) await seedAvailability([date]);
    await updateDoc(citaRef, {
      estado,
      updatedAt: new Date().toISOString(),
    });

    if (date && changesCapacity) notifyAvailability([date]);
    // Si fue cancelado por el cliente, enviar email al barbero
    if (estado === 'cancelado' && canceladoPorCliente) {
      try {
        // Obtener datos del turno
        const turnoDoc = await getDoc(citaRef);
        const turnoData = turnoDoc.data();

        if (turnoData) {
          // Obtener nombre del servicio
          const serviciosRef = collection(db, 'servicios');
          const serviciosSnapshot = await getDocs(serviciosRef);
          const servicio = serviciosSnapshot.docs.find(doc => doc.id === turnoData.servicioId);
          const servicioNombre = servicio 
            ? `${servicio.data().icono} ${servicio.data().nombre}` 
            : 'Servicio';

          const emailHtml = turnoCanceladoEmail({
            nombreCliente: turnoData.nombre,
            telefono: turnoData.telefono,
            servicio: servicioNombre,
            fecha: turnoData.fecha,
            hora: turnoData.hora,
          });

          await sendEmail({
            to: BARBER_EMAIL,
            subject: `🚫 Turno Cancelado - ${new Date(turnoData.fecha).toLocaleDateString('es-AR')} ${turnoData.hora}hs`,
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error('Error al enviar email de cancelación:', emailError);
        // No falla la cancelación si el email falla
      }
    }

    return NextResponse.json(
      { success: true, message: 'Turno actualizado' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    return NextResponse.json(
      { error: 'Error al actualizar turno' },
      { status: 500 }
    );
  }
}
