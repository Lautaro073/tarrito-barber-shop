import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { sendEmail, BARBER_EMAIL } from '@/lib/email-config';
import { nuevoTurnoEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { servicioId, fecha, hora, nombre, telefono, email } = body;

    // Validación básica
    if (!servicioId || !fecha || !hora || !nombre || !telefono) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Obtener información del servicio
    const serviciosRef = collection(db, 'servicios');
    const serviciosSnapshot = await getDocs(serviciosRef);
    const servicio = serviciosSnapshot.docs.find(doc => doc.id === servicioId);
    const servicioNombre = servicio ? `${servicio.data().icono} ${servicio.data().nombre}` : 'Servicio';

    // Guardar en Firebase
    const citaRef = await addDoc(collection(db, 'citas'), {
      servicioId,
      fecha,
      hora,
      nombre,
      telefono,
      email: email || null,
      estado: 'pendiente',
      createdAt: serverTimestamp(),
    });

    // Enviar email al barbero
    try {
      const emailHtml = nuevoTurnoEmail({
        nombreCliente: nombre,
        telefono,
        email,
        servicio: servicioNombre,
        fecha,
        hora,
      });

      await sendEmail({
        to: BARBER_EMAIL,
        subject: `💈 Nuevo turno reservado - ${new Date(fecha).toLocaleDateString('es-AR')} ${hora}hs`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Error al enviar email (turno creado exitosamente):', emailError);
      // No falla la creación del turno si el email falla
    }

    return NextResponse.json(
      {
        success: true,
        citaId: citaRef.id,
        message: 'Turno reservado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear cita:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get('fecha');

    if (!fecha) {
      return NextResponse.json(
        { error: 'Falta parámetro de fecha' },
        { status: 400 }
      );
    }

    // Consultar citas para la fecha especificada (excluyendo cancelados)
    const citasRef = collection(db, 'citas');
    const q = query(citasRef, where('fecha', '>=', fecha + 'T00:00:00'), where('fecha', '<=', fecha + 'T23:59:59'));
    const querySnapshot = await getDocs(q);

    // Filtrar solo citas que no están canceladas (para liberar horarios cancelados)
    const citas = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as any)
      .filter((cita: any) => cita.estado !== 'cancelado');

    return NextResponse.json({ citas }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    );
  }
}
