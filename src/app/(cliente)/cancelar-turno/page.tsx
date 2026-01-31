'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Phone, User, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface TurnoEncontrado {
    id: string;
    servicioNombre: string;
    fecha: string;
    hora: string;
    nombre: string;
    telefono: string;
    estado: string;
}

export default function CancelarTurnoPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        fecha: '',
    });
    const [turnosEncontrados, setTurnosEncontrados] = useState<TurnoEncontrado[]>([]);
    const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoEncontrado | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'No se encontró un turno con esos datos');
                setLoading(false);
                return;
            }

            setTurnosEncontrados(data.turnos || []);

            // Si solo hay uno, seleccionarlo automáticamente
            if (data.turnos && data.turnos.length === 1) {
                setTurnoSeleccionado(data.turnos[0]);
            }
        } catch (err) {
            setError('Error al buscar el turno. Intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelar = async () => {
        if (!turnoSeleccionado) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/citas/${turnoSeleccionado.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estado: 'cancelado',
                    canceladoPorCliente: true,
                }),
            });

            if (!response.ok) {
                throw new Error('Error al cancelar el turno');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err) {
            setError('Error al cancelar el turno. Intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">¡Turno Cancelado!</CardTitle>
                        <CardDescription>
                            Tu turno ha sido cancelado exitosamente. El barbero ha sido notificado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Redirigiendo a la página principal...
                        </p>
                        <Link href="/">
                            <Button className="w-full">Volver al Inicio</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Cancelar Turno</h1>
                    <p className="text-muted-foreground">
                        Ingresá tus datos para buscar y cancelar tu turno
                    </p>
                </div>

                {turnosEncontrados.length === 0 ? (
                    /* Formulario de búsqueda */
                    <Card>
                        <CardHeader>
                            <CardTitle>Buscar mi Turno</CardTitle>
                            <CardDescription>
                                Ingresá los datos que usaste al reservar
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
                                            placeholder="Juan Pérez"
                                            className="pl-10"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            required
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
                                            required
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
                                            required
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
                                    <Button type="submit" disabled={loading} className="flex-1">
                                        {loading ? 'Buscando...' : 'Buscar Turno'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : turnosEncontrados.length > 1 && !turnoSeleccionado ? (
                    /* Selector cuando hay múltiples turnos */
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Turnos Encontrados ({turnosEncontrados.length})</CardTitle>
                                <CardDescription>
                                    Tenés varios turnos para ese día. Hacé click en el que querés cancelar.
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
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{turno.hora} hs</CardTitle>
                                            <CardDescription className="mt-1">{turno.servicioNombre}</CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${turno.estado === 'pendiente'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {turno.estado.toUpperCase()}
                                            </span>
                                            <Button variant="outline" size="sm">
                                                Cancelar este turno
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">📅 Fecha:</span>
                                            <span className="font-medium">
                                                {new Date(turno.fecha).toLocaleDateString('es-AR', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">👤 Cliente:</span>
                                            <span className="font-medium">{turno.nombre}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">📞 Teléfono:</span>
                                            <span className="font-medium">{turno.telefono}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Button
                            variant="outline"
                            onClick={() => {
                                setTurnosEncontrados([]);
                                setTurnoSeleccionado(null);
                            }}
                            className="w-full"
                        >
                            ← Volver a Buscar
                        </Button>
                    </div>
                ) : turnoSeleccionado ? (
                    /* Confirmación de cancelación */
                    <Card>
                        <CardHeader>
                            <CardTitle>Turno Encontrado</CardTitle>
                            <CardDescription>
                                Confirmá que querés cancelar este turno
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Servicio:</span>
                                    <span className="font-semibold">{turnoSeleccionado.servicioNombre}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span className="font-semibold">
                                        {new Date(turnoSeleccionado.fecha).toLocaleDateString('es-AR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Hora:</span>
                                    <span className="font-semibold">{turnoSeleccionado.hora} hs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cliente:</span>
                                    <span className="font-semibold">{turnoSeleccionado.nombre}</span>
                                </div>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Esta acción no se puede deshacer. El barbero será notificado automáticamente.
                                </AlertDescription>
                            </Alert>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setTurnoSeleccionado(null);
                                        // Si hay múltiples turnos, volver a la selección
                                        if (turnosEncontrados.length <= 1) {
                                            setTurnosEncontrados([]);
                                        }
                                    }}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Volver
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelar}
                                    disabled={loading}
                                    className="flex-1 gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    {loading ? 'Cancelando...' : 'Cancelar Turno'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </div>
    );
}
