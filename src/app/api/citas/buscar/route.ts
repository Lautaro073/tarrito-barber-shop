import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, telefono, fecha } = body;

    // Validación
    if (!nombre || !telefono || !fecha) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Buscar turno en Firebase (búsqueda más flexible)
    const citasRef = collection(db, 'citas');
    const allCitasSnapshot = await getDocs(citasRef);
    
    // Filtrar manualmente para mayor flexibilidad
    const turnosEncontrados = allCitasSnapshot.docs.filter(doc => {
      const data = doc.data();
      const nombreMatch = data.nombre?.toLowerCase().trim() === nombre.toLowerCase().trim();
      const telefonoMatch = data.telefono?.replace(/\D/g, '') === telefono.replace(/\D/g, '');
      
      // Comparar solo la parte de la fecha (YYYY-MM-DD)
      const dataFecha = data.fecha?.substring(0, 10) || data.fecha;
      const fechaMatch = dataFecha === fecha;
      
      const estadoValido = ['pendiente', 'confirmado'].includes(data.estado);
      
      return nombreMatch && telefonoMatch && fechaMatch && estadoValido;
    });

    if (turnosEncontrados.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró un turno con esos datos o ya fue cancelado' },
        { status: 404 }
      );
    }

    // Obtener información de todos los turnos encontrados
    const serviciosRef = collection(db, 'servicios');
    const serviciosSnapshot = await getDocs(serviciosRef);
    
    const turnosConDetalles = turnosEncontrados.map(turnoDoc => {
      const turnoData = turnoDoc.data();
      const servicio = serviciosSnapshot.docs.find(doc => doc.id === turnoData.servicioId);
      const servicioNombre = servicio 
        ? `${servicio.data().icono} ${servicio.data().nombre}` 
        : 'Servicio';

      return {
        id: turnoDoc.id,
        servicioNombre,
        fecha: turnoData.fecha,
        hora: turnoData.hora,
        nombre: turnoData.nombre,
        telefono: turnoData.telefono,
        estado: turnoData.estado,
      };
    });

    return NextResponse.json({
      turnos: turnosConDetalles,
      count: turnosConDetalles.length,
    });
  } catch (error) {
    console.error('Error al buscar turno:', error);
    return NextResponse.json(
      { error: 'Error al buscar el turno' },
      { status: 500 }
    );
  }
}
