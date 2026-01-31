'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { es } from 'date-fns/locale';
import { getServicios } from '@/lib/servicios-cache';

interface Servicio {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    duracionMinutos: number;
    icono: string;
    activo: boolean;
}

// Función para generar horarios disponibles basados en configuración
const generarHorarios = (horaInicio: string, horaFin: string, duracionMinutos: number = 40): string[] => {
    const horarios: string[] = [];
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFinal, minFinal] = horaFin.split(':').map(Number);

    let minutoActual = horaIni * 60 + minIni;
    const minutoFin = horaFinal * 60 + minFinal;

    while (minutoActual + duracionMinutos <= minutoFin) {
        const horas = Math.floor(minutoActual / 60);
        const minutos = minutoActual % 60;
        horarios.push(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
        minutoActual += duracionMinutos;
    }

    return horarios;
};

export default function ServiceSelector() {
    const searchParams = useSearchParams();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargandoServicios, setCargandoServicios] = useState(true);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
    const [configuracionHorarios, setConfiguracionHorarios] = useState<any>(null);
    const [mostrarAlerta, setMostrarAlerta] = useState(false);
    const [mostrarDialogoConfirmacion, setMostrarDialogoConfirmacion] = useState(false);

    // Cargar servicios desde Firebase con caché
    useEffect(() => {
        const cargarServicios = async () => {
            setCargandoServicios(true);
            const data = await getServicios();
            setServicios(data);
            setCargandoServicios(false);

            // Pre-seleccionar servicio si viene en la URL
            const servicioId = searchParams.get('servicio');
            if (servicioId && data.find(s => s.id === servicioId)) {
                setSelectedService(servicioId);
            }
        };
        cargarServicios();
    }, [searchParams]);

    // Cargar configuración de horarios desde Firebase
    useEffect(() => {
        const cargarConfiguracion = async () => {
            try {
                const response = await fetch('/api/horarios');
                const data = await response.json();
                setConfiguracionHorarios(data.horarios);
            } catch (error) {
                console.error('Error al cargar configuración:', error);
            }
        };
        cargarConfiguracion();
    }, []);

    // Actualizar horarios disponibles cuando cambia la fecha
    useEffect(() => {
        const cargarHorariosDisponibles = async () => {
            if (!selectedDate || !configuracionHorarios) {
                setHorariosDisponibles([]);
                setMostrarAlerta(false);
                return;
            }

            const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()];
            const configDia = configuracionHorarios.find((d: any) => d.dia === diaSemana);

            if (configDia && configDia.activo) {
                const servicioSeleccionado = servicios.find(s => s.id === selectedService);
                const duracion = servicioSeleccionado?.duracionMinutos || 40;
                const horariosGenerados = generarHorarios(configDia.horaInicio, configDia.horaFin, duracion);

                // Consultar citas ya agendadas para esta fecha
                try {
                    const fechaStr = selectedDate.toISOString().split('T')[0];
                    const response = await fetch(`/api/citas?fecha=${fechaStr}`);
                    const data = await response.json();

                    // Filtrar horarios ocupados
                    const horariosOcupados = data.citas?.map((cita: any) => cita.hora) || [];
                    const horariosLibres = horariosGenerados.filter(h => !horariosOcupados.includes(h));

                    setHorariosDisponibles(horariosLibres);

                    // Mostrar alerta si no hay turnos disponibles
                    if (horariosLibres.length === 0 && horariosGenerados.length > 0) {
                        setMostrarAlerta(true);
                    } else {
                        setMostrarAlerta(false);
                    }
                } catch (error) {
                    console.error('Error al cargar citas:', error);
                    setHorariosDisponibles(horariosGenerados);
                    setMostrarAlerta(false);
                }
            } else {
                setHorariosDisponibles([]);
                if (selectedDate) {
                    setMostrarAlerta(true);
                } else {
                    setMostrarAlerta(false);
                }
            }

            // Limpiar selección de hora si la fecha cambia
            setSelectedTime(null);
        };

        cargarHorariosDisponibles();
    }, [selectedDate, configuracionHorarios, selectedService]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMostrarDialogoConfirmacion(true);
    };

    const confirmarReserva = async () => {
        setMostrarDialogoConfirmacion(false);

        try {
            const response = await fetch('/api/citas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    servicioId: selectedService,
                    fecha: selectedDate?.toISOString(),
                    hora: selectedTime,
                    nombre,
                    telefono,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al reservar turno');
            }

            // Éxito - Mostrar toast
            toast.success('¡Turno reservado exitosamente! 🎉', {
                description: `Fecha: ${selectedDate?.toLocaleDateString('es-AR')} - Hora: ${selectedTime}`,
                duration: 5000,
            });

            // Limpiar formulario
            setSelectedService(null);
            setSelectedDate(new Date());
            setSelectedTime(null);
            setNombre('');
            setTelefono('');
            setMostrarAlerta(false);

        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al reservar turno', {
                description: 'Por favor intentá nuevamente.',
            });
        }
    };

    const isFormValid = selectedService && selectedDate && selectedTime && nombre && telefono;

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            {/* 1. Servicio */}
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Elegí tu servicio</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {cargandoServicios ? (
                        // Skeleton loader
                        [...Array(2)].map((_, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-muted rounded animate-pulse w-3/4"></div>
                                        <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                                        <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        servicios.map((servicio) => (
                            <Card
                                key={servicio.id}
                                className={`p-4 cursor-pointer transition-all ${selectedService === servicio.id
                                    ? 'ring-2 ring-primary bg-accent'
                                    : 'hover:border-primary/50'
                                    }`}
                                onClick={() => setSelectedService(servicio.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">{servicio.icono}</div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground">{servicio.nombre}</h3>
                                        {servicio.descripcion && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {servicio.descripcion}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground mt-1">
                                            ${servicio.precio.toLocaleString('es-AR')} ARS · {servicio.duracionMinutos} min
                                        </p>
                                    </div>
                                    {selectedService === servicio.id && <Badge>✓</Badge>}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* 2. Fecha */}
            {selectedService && (
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Seleccioná fecha y hora</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center md:items-start">
                            <Label className="mb-2 block">Fecha</Label>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today || date.getDay() === 0;
                                }}
                                locale={es}
                                className="rounded-md border mx-auto md:mx-0"
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block">Horario disponible</Label>
                            {mostrarAlerta && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Lo sentimos, no hay turnos disponibles para este día. Por favor seleccioná otra fecha.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {horariosDisponibles.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {horariosDisponibles.map((hora) => (
                                        <Button
                                            key={hora}
                                            type="button"
                                            variant={selectedTime === hora ? 'default' : 'outline'}
                                            className="w-full"
                                            onClick={() => setSelectedTime(hora)}
                                        >
                                            {hora}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                !mostrarAlerta && (
                                    <p className="text-sm text-muted-foreground p-4 border rounded-md">
                                        {selectedDate
                                            ? 'Cargando horarios...'
                                            : 'Seleccioná una fecha primero'}
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Datos personales */}
            {selectedDate && selectedTime && (
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Tus datos</h2>
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="nombre">Nombre completo</Label>
                                <Input
                                    id="nombre"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Juan Pérez"
                                    className="mt-1.5"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="telefono">Teléfono/WhatsApp</Label>
                                <Input
                                    id="telefono"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    placeholder="3865123456"
                                    className="mt-1.5"
                                    required
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Botón de confirmar */}
            {isFormValid && (
                <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full md:w-auto md:px-12">
                        Confirmar Turno
                    </Button>
                </div>
            )}

            {/* Diálogo de confirmación con políticas */}
            <Dialog open={mostrarDialogoConfirmacion} onOpenChange={setMostrarDialogoConfirmacion}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Turno</DialogTitle>
                        <DialogDescription>
                            Estás por reservar un turno para:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-accent p-4 rounded-lg space-y-2">
                            <p className="font-semibold text-foreground">
                                {servicios.find(s => s.id === selectedService)?.nombre}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                📅 {selectedDate?.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-sm text-muted-foreground">🕐 {selectedTime} hs</p>
                        </div>

                        <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-3">
                            <p className="font-semibold text-sm flex items-center gap-2 text-foreground">
                                <AlertCircle className="h-4 w-4" />
                                Políticas importantes:
                            </p>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                                    <span>Cancelaciones: Avisá con <strong>30 minutos de anticipación</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                                    <span>Llegá entre <strong>10 y 5 minutos antes</strong> del turno</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                                    <span>Tiempo de espera: <strong>máximo 5 minutos</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMostrarDialogoConfirmacion(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="button" onClick={confirmarReserva}>
                            Confirmar Reserva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
