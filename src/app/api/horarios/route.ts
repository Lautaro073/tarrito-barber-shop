import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, deleteDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { horarios } = body;

    // Eliminar horarios anteriores
    const horariosRef = collection(db, 'horarios');
    const snapshot = await getDocs(query(horariosRef));
    await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'horarios', d.id))));

    // Guardar nuevos horarios
    await addDoc(horariosRef, {
      horarios,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al guardar horarios:', error);
    return NextResponse.json({ error: 'Error al guardar horarios' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const horariosRef = collection(db, 'horarios');
    const snapshot = await getDocs(query(horariosRef));
    
    if (snapshot.empty) {
      // Devolver horarios por defecto
      return NextResponse.json({
        horarios: [
          { dia: 'Lunes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
          { dia: 'Martes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
          { dia: 'Miércoles', activo: true, horaInicio: '09:00', horaFin: '19:00' },
          { dia: 'Jueves', activo: true, horaInicio: '09:00', horaFin: '19:00' },
          { dia: 'Viernes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
          { dia: 'Sábado', activo: true, horaInicio: '09:00', horaFin: '15:00' },
          { dia: 'Domingo', activo: false, horaInicio: '', horaFin: '' },
        ]
      });
    }

    const data = snapshot.docs[0].data();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
  }
}
