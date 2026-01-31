import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function GET() {
  try {
    const citasRef = collection(db, 'citas');
    const q = query(citasRef, orderBy('fecha', 'desc'));
    const querySnapshot = await getDocs(q);

    const turnos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ turnos }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json(
      { error: 'Error al obtener turnos' },
      { status: 500 }
    );
  }
}
