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

    // Permitir turnos que excedan hasta 30 min la hora de cierre
    while (minutoActual + duracionMinutos <= minutoFin + 30) {
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
    const [mostrarDialogoExito, setMostrarDialogoExito] = useState(false);
    const [mostrarDialogoError, setMostrarDialogoError] = useState(false);
    const [mensajeError, setMensajeError] = useState('');
    const [confirmando, setConfirmando] = useState(false);
    const [datosReserva, setDatosReserva] = useState<{ fecha: string, hora: string, servicio: string } | null>(null);

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

                // Generar horarios para todas las franjas del día
                let horariosGenerados: string[] = [];
                if (configDia.franjas && Array.isArray(configDia.franjas)) {
                    // Nuevo formato con múltiples franjas
                    configDia.franjas.forEach((franja: any) => {
                        const horariosFramja = generarHorarios(franja.horaInicio, franja.horaFin, duracion);
                        horariosGenerados = [...horariosGenerados, ...horariosFramja];
                    });
                } else {
                    // Formato antiguo (compatibilidad hacia atrás)
                    horariosGenerados = generarHorarios(configDia.horaInicio, configDia.horaFin, duracion);
                }

                // Consultar citas ya agendadas para esta fecha
                try {
                    const fechaStr = selectedDate.toISOString().split('T')[0];
                    const response = await fetch(`/api/citas?fecha=${fechaStr}`);
                    const data = await response.json();

                    // Filtrar horarios ocupados
                    const horariosOcupados = data.citas?.map((cita: any) => cita.hora) || [];
                    let horariosLibres = horariosGenerados.filter(h => !horariosOcupados.includes(h));

                    // Si es HOY, filtrar horarios que ya pasaron
                    const hoy = new Date();
                    const esHoy = selectedDate.toDateString() === hoy.toDateString();

                    if (esHoy) {
                        const horaActual = hoy.getHours();
                        const minutosActuales = hoy.getMinutes();
                        const tiempoActualEnMinutos = horaActual * 60 + minutosActuales;

                        horariosLibres = horariosLibres.filter(horario => {
                            const [hora, minutos] = horario.split(':').map(Number);
                            const tiempoHorarioEnMinutos = hora * 60 + minutos;
                            // Agregar 30 minutos de margen para dar tiempo de reservar
                            return tiempoHorarioEnMinutos > tiempoActualEnMinutos + 30;
                        });
                    }

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
        setConfirmando(true);

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
                // Manejar error con diálogo visual
                if (data.code === 'HORARIO_OCUPADO') {
                    // Error específico de horario ocupado
                    setMensajeError(data.error);
                    setMostrarDialogoError(true);
                    // Recargar horarios disponibles
                    const cargarHorariosDisponibles = async () => {
                        if (selectedDate && configuracionHorarios && selectedService) {
                            const fechaStr = selectedDate.toISOString().split('T')[0];
                            const response = await fetch(`/api/citas?fecha=${fechaStr}`);
                            const citasData = await response.json();
                            const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()];
                            const configDia = configuracionHorarios.find((d: any) => d.dia === diaSemana);
                            if (configDia && configDia.activo) {
                                const servicioSeleccionado = servicios.find(s => s.id === selectedService);
                                const duracion = servicioSeleccionado?.duracionMinutos || 40;
                                let horariosGenerados: string[] = [];
                                if (configDia.franjas && Array.isArray(configDia.franjas)) {
                                    configDia.franjas.forEach((franja: any) => {
                                        const horariosFramja = generarHorarios(franja.horaInicio, franja.horaFin, duracion);
                                        horariosGenerados = [...horariosGenerados, ...horariosFramja];
                                    });
                                } else {
                                    horariosGenerados = generarHorarios(configDia.horaInicio, configDia.horaFin, duracion);
                                }
                                const horariosOcupados = citasData.citas?.map((cita: any) => cita.hora) || [];
                                let horariosLibres = horariosGenerados.filter(h => !horariosOcupados.includes(h));
                                const hoy = new Date();
                                const esHoy = selectedDate.toDateString() === hoy.toDateString();
                                if (esHoy) {
                                    const horaActual = hoy.getHours();
                                    const minutosActuales = hoy.getMinutes();
                                    const tiempoActualEnMinutos = horaActual * 60 + minutosActuales;
                                    horariosLibres = horariosLibres.filter(horario => {
                                        const [hora, minutos] = horario.split(':').map(Number);
                                        const tiempoHorarioEnMinutos = hora * 60 + minutos;
                                        return tiempoHorarioEnMinutos > tiempoActualEnMinutos + 30;
                                    });
                                }
                                setHorariosDisponibles(horariosLibres);
                            }
                        }
                    };
                    cargarHorariosDisponibles();
                } else {
                    // Otros errores
                    setMensajeError(data.error || 'Error al reservar turno. Por favor intentá nuevamente.');
                    setMostrarDialogoError(true);
                }
                return;
            }

            // Éxito - Mostrar dialog con animación
            const servicioNombre = servicios.find(s => s.id === selectedService)?.nombre || 'Servicio';
            setDatosReserva({
                fecha: selectedDate?.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || '',
                hora: selectedTime || '',
                servicio: servicioNombre
            });
            setMostrarDialogoExito(true);
            setMostrarDialogoConfirmacion(false);

            // Limpiar formulario
            setSelectedService(null);
            setSelectedDate(new Date());
            setSelectedTime(null);
            setNombre('');
            setTelefono('');
            setMostrarAlerta(false);
            setConfirmando(false);

        } catch (error) {
            console.error('Error:', error);
            setMensajeError('Error de conexión. Por favor verificá tu internet e intentá nuevamente.');
            setMostrarDialogoError(true);
            setMostrarDialogoConfirmacion(false);
            setConfirmando(false);
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

                                    // Deshabilitar fechas pasadas
                                    if (date < today) return true;

                                    // Deshabilitar domingos
                                    if (date.getDay() === 0) return true;

                                    // Lógica de habilitación semanal
                                    const diaSemana = date.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
                                    const ahora = new Date();
                                    const horaActual = ahora.getHours();
                                    const diaActual = ahora.getDay();

                                    // Calcular inicio de semana actual (lunes)
                                    const inicioSemanaActual = new Date(today);
                                    const diasDesdeInicio = today.getDay() === 0 ? 6 : today.getDay() - 1;
                                    inicioSemanaActual.setDate(today.getDate() - diasDesdeInicio);

                                    // Calcular fin de semana actual (domingo)
                                    const finSemanaActual = new Date(inicioSemanaActual);
                                    finSemanaActual.setDate(inicioSemanaActual.getDate() + 6);

                                    // Calcular inicio de próxima semana
                                    const inicioProximaSemana = new Date(finSemanaActual);
                                    inicioProximaSemana.setDate(finSemanaActual.getDate() + 1);

                                    // Calcular fin de próxima semana
                                    const finProximaSemana = new Date(inicioProximaSemana);
                                    finProximaSemana.setDate(inicioProximaSemana.getDate() + 6);

                                    // Viernes (5) y Sábado (6): siempre habilitados (sin restricción)
                                    if (diaSemana === 5 || diaSemana === 6) {
                                        return false;
                                    }

                                    // Lunes a Jueves (1-4): solo semana actual
                                    if (diaSemana >= 1 && diaSemana <= 4) {
                                        // Verificar si es domingo >= 16:00 para habilitar próxima semana
                                        const esPostDomingo16 = diaActual === 0 && horaActual >= 16;

                                        if (esPostDomingo16) {
                                            // Habilitar próxima semana (lunes a jueves)
                                            if (date >= inicioProximaSemana && date <= finProximaSemana) {
                                                return false;
                                            }
                                        }

                                        // Habilitar semana actual
                                        if (date >= inicioSemanaActual && date <= finSemanaActual) {
                                            return false;
                                        }

                                        // Bloquear cualquier otra fecha
                                        return true;
                                    }

                                    return false;
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
                    <DialogFooter className="gap-3 sm:gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMostrarDialogoConfirmacion(false)}
                            disabled={confirmando}
                        >
                            Cancelar
                        </Button>
                        <Button type="button" onClick={confirmarReserva} disabled={confirmando}>
                            {confirmando ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Confirmando...
                                </>
                            ) : (
                                'Confirmar Reserva'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de éxito */}
            <Dialog open={mostrarDialogoExito} onOpenChange={setMostrarDialogoExito}>
                <DialogContent className="max-w-md text-center">
                    <DialogHeader>
                        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 animate-in zoom-in duration-300" />
                        </div>
                        <DialogTitle className="text-2xl">¡Turno Reservado!</DialogTitle>
                        <DialogDescription className="text-base">
                            Tu turno ha sido confirmado exitosamente
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <div className="bg-accent p-4 rounded-lg space-y-2 text-left">
                            <p className="font-semibold text-foreground">
                                ✂️ {datosReserva?.servicio}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                📅 {datosReserva?.fecha}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                🕐 {datosReserva?.hora} hs
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Recordá llegar entre 10 y 5 minutos antes de tu turno
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            className="w-full"
                            onClick={() => setMostrarDialogoExito(false)}
                        >
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de error */}
            <Dialog open={mostrarDialogoError} onOpenChange={setMostrarDialogoError}>
                <DialogContent className="max-w-md text-center">
                    <DialogHeader>
                        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 animate-in zoom-in duration-300" />
                        </div>
                        <DialogTitle className="text-2xl">¡Ups! Hubo un problema</DialogTitle>
                        <DialogDescription className="text-base">
                            {mensajeError}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-muted p-4 rounded-lg text-left">
                            <p className="text-sm text-muted-foreground">
                                💡 <strong>Sugerencias:</strong>
                            </p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                                <li>• Elegí otro horario disponible</li>
                                <li>• Probá con otra fecha</li>
                                <li>• Si el problema persiste, contactanos por WhatsApp</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            className="w-full"
                            onClick={() => {
                                setMostrarDialogoError(false);
                                setSelectedTime(null); // Limpiar hora seleccionada
                            }}
                        >
                            Elegir otro horario
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
