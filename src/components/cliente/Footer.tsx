'use client';

import { useState, useEffect } from 'react';
import { Instagram, MapPin, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FranjaHoraria {
  horaInicio: string;
  horaFin: string;
}

interface HorarioDia {
  dia: string;
  activo: boolean;
  franjas?: FranjaHoraria[];
  horaInicio?: string; // Compatibilidad hacia atrás
  horaFin?: string; // Compatibilidad hacia atrás
}

export default function Footer() {
  const whatsappNumber = "+5493865646068";
  const instagramHandle = "tarrito_barber";
  const direccion = "Vélez Sarsfield 1086, Aguilares, Tucumán, Argentina";
  const mapsUrl = "https://maps.app.goo.gl/4nPqJG9uUtdgLR6S8";
  const [horarios, setHorarios] = useState<HorarioDia[]>([]);

  useEffect(() => {
    const cargarHorarios = async () => {
      try {
        const response = await fetch('/api/horarios');
        const data = await response.json();
        setHorarios(data.horarios || []);
      } catch (error) {
        console.error('Error al cargar horarios:', error);
      }
    };
    cargarHorarios();
  }, []);

  // Agrupar días consecutivos con el mismo horario
  const agruparHorarios = () => {
    if (!horarios.length) return [];

    const grupos: { dias: string; horario: string }[] = [];
    const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    let grupoActual: string[] = [];
    let horarioActual = '';

    diasOrden.forEach((dia, index) => {
      const config = horarios.find(h => h.dia === dia);

      if (config?.activo) {
        let nuevoHorario = '';

        // Nuevo formato con múltiples franjas
        if (config.franjas && config.franjas.length > 0) {
          nuevoHorario = config.franjas.map(f => `${f.horaInicio} - ${f.horaFin}`).join(', ');
        }
        // Formato antiguo (compatibilidad hacia atrás)
        else if (config.horaInicio && config.horaFin) {
          nuevoHorario = `${config.horaInicio} - ${config.horaFin}`;
        }

        if (horarioActual === nuevoHorario) {
          grupoActual.push(dia);
        } else {
          if (grupoActual.length > 0) {
            grupos.push({
              dias: grupoActual.length > 1
                ? `${grupoActual[0]} - ${grupoActual[grupoActual.length - 1]}`
                : grupoActual[0],
              horario: horarioActual
            });
          }
          grupoActual = [dia];
          horarioActual = nuevoHorario;
        }
      } else {
        if (grupoActual.length > 0) {
          grupos.push({
            dias: grupoActual.length > 1
              ? `${grupoActual[0]} - ${grupoActual[grupoActual.length - 1]}`
              : grupoActual[0],
            horario: horarioActual
          });
          grupoActual = [];
          horarioActual = '';
        }
      }
    });

    // Agregar último grupo
    if (grupoActual.length > 0) {
      grupos.push({
        dias: grupoActual.length > 1
          ? `${grupoActual[0]} - ${grupoActual[grupoActual.length - 1]}`
          : grupoActual[0],
        horario: horarioActual
      });
    }

    // Agregar domingo cerrado si no está activo
    const domingoCerrado = !horarios.find(h => h.dia === 'Domingo')?.activo;
    if (domingoCerrado) {
      grupos.push({ dias: 'Domingo', horario: 'Cerrado' });
    }

    return grupos;
  };

  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <h3 className="font-bold text-foreground mb-3">💈 Tarrito Barber Shop</h3>
            <p className="text-sm text-muted-foreground">
              La mejor barbería de Aguilares, Tucumán.
            </p>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="font-bold text-foreground mb-3">Horarios</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {agruparHorarios().map((grupo, index) => (
                <li key={index}>
                  {grupo.dias}: {grupo.horario}
                </li>
              ))}
              {horarios.length === 0 && (
                <li className="text-muted-foreground/50">Cargando horarios...</li>
              )}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-bold text-foreground mb-3">Contacto</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{whatsappNumber}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>@{instagramHandle}</span>
                </a>
              </li>
              <li>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-foreground transition-colors"
                >
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{direccion}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6">
          <div className="flex justify-center mb-4">
            <Link href="/cancelar-turno">
              <Button variant="outline" className="gap-2">
                <X className="w-4 h-4" />
                Cancelar mi Turno
              </Button>
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Tarrito Barber Shop. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
