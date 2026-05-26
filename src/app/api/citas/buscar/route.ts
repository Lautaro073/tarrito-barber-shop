import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizePhone = (value = '') => value.replace(/\D/g, '');

const levenshteinDistance = (a: string, b: string) => {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
    }
  }

  return matrix[b.length][a.length];
};

const isSimilarName = (storedName = '', inputName = '') => {
  const stored = normalizeText(storedName);
  const input = normalizeText(inputName);

  if (!input) return false;
  if (stored.includes(input) || input.includes(stored)) return true;

  const inputTokens = input.split(' ').filter(Boolean);
  const storedTokens = stored.split(' ').filter(Boolean);

  if (inputTokens.length > 0 && inputTokens.every(token =>
    storedTokens.some(storedToken => storedToken.includes(token))
  )) {
    return true;
  }

  const maxDistance = input.length <= 5 ? 1 : 2;
  return levenshteinDistance(stored, input) <= maxDistance;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre = '',
      telefono = '',
      fecha = '',
      flexible = false,
    } = body;

    if (!flexible && (!nombre || !telefono || !fecha)) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    if (flexible && !nombre.trim() && !telefono.trim() && !fecha.trim()) {
      return NextResponse.json(
        { error: 'Ingresá al menos un dato para buscar tu turno' },
        { status: 400 }
      );
    }

    const citasRef = collection(db, 'citas');
    const allCitasSnapshot = await getDocs(citasRef);

    const turnosEncontrados = allCitasSnapshot.docs.filter(doc => {
      const data = doc.data();
      const estadoValido = ['pendiente', 'confirmado'].includes(data.estado);

      if (!estadoValido) return false;

      const nombreMatch = flexible
        ? isSimilarName(data.nombre, nombre)
        : normalizeText(data.nombre || '') === normalizeText(nombre);

      const telefonoBuscado = normalizePhone(telefono);
      const telefonoGuardado = normalizePhone(data.telefono || '');
      const telefonoMatch = flexible
        ? Boolean(telefonoBuscado) && telefonoGuardado.includes(telefonoBuscado)
        : telefonoGuardado === telefonoBuscado;

      const dataFecha = data.fecha?.substring(0, 10) || data.fecha;
      const fechaMatch = dataFecha === fecha;

      if (!flexible) {
        return nombreMatch && telefonoMatch && fechaMatch;
      }

      const criteriosCompletados = [
        Boolean(nombre.trim()),
        Boolean(telefono.trim()),
        Boolean(fecha),
      ];
      const coincidencias = [
        nombreMatch,
        telefonoMatch,
        fechaMatch,
      ];

      return criteriosCompletados.every((criterioCompletado, index) =>
        !criterioCompletado || coincidencias[index]
      );
    });

    if (turnosEncontrados.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró un turno con esos datos o ya fue cancelado' },
        { status: 404 }
      );
    }

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
