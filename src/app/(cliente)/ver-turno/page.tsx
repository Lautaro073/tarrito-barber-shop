'use client';

import { useState } from 'react';
import { AlertCircle, Calendar, Phone, Search, User } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TurnoEncontrado {
  id: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  nombre: string;
  telefono: string;
  estado: string;
}

export default function VerTurnoPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    fecha: '',
  });
  const [turnosEncontrados, setTurnosEncontrados] = useState<TurnoEncontrado[]>([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoEncontrado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTurnosEncontrados([]);
    setTurnoSeleccionado(null);
    setLoading(true);

    try {
      const response = await fetch('/api/citas/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, flexible: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'No se encontró un turno con esos datos');
        return;
      }

      setTurnosEncontrados(data.turnos || []);

      if (data.turnos && data.turnos.length === 1) {
        setTurnoSeleccionado(data.turnos[0]);
      }
    } catch {
      setError('Error al buscar el turno. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetBusqueda = () => {
    setTurnosEncontrados([]);
    setTurnoSeleccionado(null);
    setError('');
  };

  const fechaFormateada = (fecha: string) => new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Ver Turno</h1>
          <p className="text-muted-foreground">
            Ingresá un dato de tu reserva para encontrar tu turno
          </p>
        </div>

        {turnosEncontrados.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Buscar mi Turno</CardTitle>
              <CardDescription>
                Podés buscar por nombre, teléfono o fecha. No hace falta completar todo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBuscar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="Pablo Jose"
                      className="pl-10"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      type="tel"
                      placeholder="+54 9 11 1234-5678"
                      className="pl-10"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha del Turno</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fecha"
                      type="date"
                      className="pl-10"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2">
                  <Link href="/" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Volver
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="flex-1 gap-2">
                    <Search className="w-4 h-4" />
                    {loading ? 'Buscando...' : 'Buscar Turno'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : turnosEncontrados.length > 1 && !turnoSeleccionado ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Turnos Encontrados ({turnosEncontrados.length})</CardTitle>
                <CardDescription>
                  Seleccioná el turno que querés ver.
                </CardDescription>
              </CardHeader>
            </Card>

            {turnosEncontrados.map((turno) => (
              <Card
                key={turno.id}
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                onClick={() => setTurnoSeleccionado(turno)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl">{turno.hora} hs</CardTitle>
                      <CardDescription className="mt-1">{turno.servicioNombre}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver este turno
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="font-medium text-right">{fechaFormateada(turno.fecha)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium text-right">{turno.nombre}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={resetBusqueda} className="w-full">
              Volver a Buscar
            </Button>
          </div>
        ) : turnoSeleccionado ? (
          <Card>
            <CardHeader>
              <CardTitle>Turno Encontrado</CardTitle>
              <CardDescription>
                Estos son los datos de tu reserva.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span className="font-semibold text-right">{turnoSeleccionado.servicioNombre}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-semibold text-right">{fechaFormateada(turnoSeleccionado.fecha)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Hora:</span>
                  <span className="font-semibold text-right">{turnoSeleccionado.hora} hs</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold text-right">{turnoSeleccionado.nombre}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Teléfono:</span>
                  <span className="font-semibold text-right">{turnoSeleccionado.telefono}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className="font-semibold text-right capitalize">{turnoSeleccionado.estado}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTurnoSeleccionado(null);
                    if (turnosEncontrados.length <= 1) {
                      setTurnosEncontrados([]);
                    }
                  }}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Link href="/reservar" className="flex-1">
                  <Button className="w-full">
                    Reservar otro turno
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
