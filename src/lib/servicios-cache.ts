interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  icono: string;
  activo: boolean;
}

let serviciosCache: Servicio[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function getServicios(): Promise<Servicio[]> {
  // Verificar si hay caché válido
  if (serviciosCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return serviciosCache;
  }

  // Cargar desde API
  try {
    const response = await fetch('/api/servicios');
    const data = await response.json();
    const servicios = data.servicios?.filter((s: Servicio) => s.activo) || [];
    
    // Guardar en caché
    serviciosCache = servicios;
    cacheTimestamp = Date.now();
    
    return servicios;
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    return serviciosCache || [];
  }
}

export function clearServiciosCache() {
  serviciosCache = null;
  cacheTimestamp = null;
}
