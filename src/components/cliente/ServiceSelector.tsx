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

const generarHorarios = (horaInicio: string, horaFin: string, duracionMinutos: number = 40): string[] => {
    const horarios: string[] = [];
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFinal, minFinal] = horaFin.split(':').map(Number);
    let minutoActual = horaIni * 60 + minIni;
    const minutoFin = horaFinal * 60 + minFinal;
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
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string[] }>({});
    const [fechaActiva, setFechaActiva] = useState<Date | null>(null);
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [cantidadPersonas, setCantidadPersonas] = useState(1);
    const [horariosDisponiblesPorFecha, setHorariosDisponiblesPorFecha] = useState<{ [key: string]: string[] }>({});
    const [configuracionHorarios, setConfiguracionHorarios] = useState<any>(null);
    const [mostrarAlerta, setMostrarAlerta] = useState(false);
    const [fechasSinHorario, setFechasSinHorario] = useState<Date[]>([]);
    const [mostrarDialogoConfirmacion, setMostrarDialogoConfirmacion] = useState(false);
    const [mostrarDialogoExito, setMostrarDialogoExito] = useState(false);
    const [mostrarDialogoError, setMostrarDialogoError] = useState(false);
    const [mensajeError, setMensajeError] = useState('');
    const [confirmando, setConfirmando] = useState(false);
    const [datosReservas, setDatosReservas] = useState<Array<{ fecha: string, hora: string, servicio: string }>>([]);

    useEffect(() => {
        const cargarServicios = async () => {
            setCargandoServicios(true);
            const data = await getServicios();
            setServicios(data);
            setCargandoServicios(false);
            const servicioId = searchParams.get('servicio');
            if (servicioId && data.find(s => s.id === servicioId)) {
                setSelectedService(servicioId);
            }
        };
        cargarServicios();
    }, [searchParams]);

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

    useEffect(() => {
        setSelectedTimes({});
    }, [cantidadPersonas]);

    const verificarHorariosDisponibles = async (fecha: Date): Promise<string[]> => {
        if (!configuracionHorarios) return [];

        const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
        const configDia = configuracionHorarios.find((d: any) => d.dia === diaSemana);

        if (!configDia || !configDia.activo) return [];

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

        try {
            const fechaStr = fecha.toISOString().split('T')[0];
            const response = await fetch(`/api/citas?fecha=${fechaStr}`);
            const data = await response.json();
            const horariosOcupados = data.citas?.map((cita: any) => cita.hora) || [];
            let horariosLibres = horariosGenerados.filter(h => !horariosOcupados.includes(h));

            const hoy = new Date();
            const esHoy = fecha.toDateString() === hoy.toDateString();
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

            if (cantidadPersonas > 1) {
                horariosLibres = horariosLibres.filter(horario => {
                    const [hora, minutos] = horario.split(':').map(Number);
                    let tiempoInicial = hora * 60 + minutos;
                    for (let i = 0; i < cantidadPersonas; i++) {
                        const horas = Math.floor(tiempoInicial / 60);
                        const mins = tiempoInicial % 60;
                        const horarioConsecutivo = `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                        if (!horariosLibres.includes(horarioConsecutivo)) {
                            return false;
                        }
                        tiempoInicial += duracion;
                    }
                    return true;
                });
            }

            return horariosLibres;
        } catch (error) {
            console.error('Error al cargar citas:', error);
            return horariosGenerados;
        }
    };

    useEffect(() => {
        const cargarHorariosDisponibles = async () => {
            if (selectedDates.length === 0 || !configuracionHorarios) {
                setHorariosDisponiblesPorFecha({});
                setMostrarAlerta(false);
                return;
            }

            // Cargar horarios para cada fecha seleccionada
            const horariosPorFecha: { [key: string]: string[] } = {};

            for (const fecha of selectedDates) {
                const fechaKey = fecha.toISOString().split('T')[0];
                const horariosDeEstaFecha = await verificarHorariosDisponibles(fecha);
                horariosPorFecha[fechaKey] = horariosDeEstaFecha;
            }

            setHorariosDisponiblesPorFecha(horariosPorFecha);

            const hayAlgunHorario = Object.values(horariosPorFecha).some(h => h.length > 0);
            setMostrarAlerta(!hayAlgunHorario);
        };
        cargarHorariosDisponibles();
    }, [selectedDates, configuracionHorarios, selectedService, cantidadPersonas, servicios]);

    const handleDateSelect = async (dates: Date[] | undefined) => {
        if (!dates || dates.length === 0) {
            setSelectedDates([]);
            setFechaActiva(null);
            setSelectedTimes({});
            setFechasSinHorario([]);
            return;
        }

        // Limpiar horarios de fechas que fueron deseleccionadas
        const newSelectedTimes = { ...selectedTimes };
        const fechasKeys = dates.map(d => d.toISOString().split('T')[0]);

        // Encontrar horarios que están seleccionados actualmente
        const horariosExistentes = Object.values(newSelectedTimes).find(horas => horas.length > 0);

        // Eliminar horarios de fechas que ya no están seleccionadas
        Object.keys(newSelectedTimes).forEach(fechaKey => {
            if (!fechasKeys.includes(fechaKey)) {
                delete newSelectedTimes[fechaKey];
            }
        });

        // Si hay horarios seleccionados, verificar disponibilidad en nuevas fechas
        const fechasNoDisponibles: Date[] = [];
        if (horariosExistentes && horariosExistentes.length > 0) {
            for (const fechaKey of fechasKeys) {
                if (!newSelectedTimes[fechaKey]) {
                    // Nueva fecha, verificar si el horario está disponible
                    const fecha = new Date(fechaKey + 'T00:00:00');
                    const disponibles = await verificarHorariosDisponibles(fecha);

                    // Verificar si todos los horarios consecutivos están disponibles
                    const todosDisponibles = horariosExistentes.every(h => disponibles.includes(h));

                    if (todosDisponibles) {
                        newSelectedTimes[fechaKey] = [...horariosExistentes];
                    } else {
                        fechasNoDisponibles.push(fecha);
                    }
                }
            }
        }

        setFechasSinHorario(fechasNoDisponibles);
        setSelectedTimes(newSelectedTimes);
        setSelectedDates(dates);
        setFechaActiva(dates[dates.length - 1]);
    };

    const handleTimeSelect = async (fecha: Date, hora: string) => {
        const servicioSeleccionado = servicios.find(s => s.id === selectedService);
        const duracion = servicioSeleccionado?.duracionMinutos || 40;
        const horariosConsecutivos: string[] = [];
        const [h, m] = hora.split(':').map(Number);
        let tiempoActual = h * 60 + m;
        for (let i = 0; i < cantidadPersonas; i++) {
            const horas = Math.floor(tiempoActual / 60);
            const minutos = tiempoActual % 60;
            horariosConsecutivos.push(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
            tiempoActual += duracion;
        }

        const newSelectedTimes = { ...selectedTimes };
        const fechaKey = fecha.toISOString().split('T')[0];
        const horasActuales = newSelectedTimes[fechaKey] || [];
        const estaSeleccionado = horariosConsecutivos.every(h => horasActuales.includes(h));

        if (estaSeleccionado) {
            // Deseleccionar
            newSelectedTimes[fechaKey] = [];
        } else {
            // Seleccionar
            newSelectedTimes[fechaKey] = [...horariosConsecutivos];
        }

        setSelectedTimes(newSelectedTimes);
        setFechasSinHorario([]);
    };

    const handleMultipleTimeSelect = (fechas: Date[], hora: string) => {
        const servicioSeleccionado = servicios.find(s => s.id === selectedService);
        const duracion = servicioSeleccionado?.duracionMinutos || 40;
        const horariosConsecutivos: string[] = [];
        const [h, m] = hora.split(':').map(Number);
        let tiempoActual = h * 60 + m;
        for (let i = 0; i < cantidadPersonas; i++) {
            const horas = Math.floor(tiempoActual / 60);
            const minutos = tiempoActual % 60;
            horariosConsecutivos.push(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
            tiempoActual += duracion;
        }

        const newSelectedTimes = { ...selectedTimes };

        // Verificar si todas las fechas tienen este horario seleccionado
        const todasSeleccionadas = fechas.every(fecha => {
            const fechaKey = fecha.toISOString().split('T')[0];
            const horasActuales = newSelectedTimes[fechaKey] || [];
            return horariosConsecutivos.every(h => horasActuales.includes(h));
        });

        // Seleccionar o deseleccionar para todas las fechas
        fechas.forEach(fecha => {
            const fechaKey = fecha.toISOString().split('T')[0];
            if (todasSeleccionadas) {
                newSelectedTimes[fechaKey] = [];
            } else {
                newSelectedTimes[fechaKey] = [...horariosConsecutivos];
            }
        });

        setSelectedTimes(newSelectedTimes);
        setFechasSinHorario([]);
    };

    const getTotalTurnos = () => {
        return Object.values(selectedTimes).reduce((total, horas) => total + horas.length, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMostrarDialogoConfirmacion(true);
    };

    const confirmarReserva = async () => {
        setConfirmando(true);
        try {
            const reservas = [];
            for (const [fechaKey, horas] of Object.entries(selectedTimes)) {
                for (const hora of horas) {
                    const fecha = new Date(fechaKey + 'T00:00:00');
                    reservas.push({
                        servicioId: selectedService,
                        fecha: fecha.toISOString(),
                        hora,
                        nombre,
                        telefono,
                        cantidadPersonas: cantidadPersonas
                    });
                }
            }
            if (reservas.length > 1) {
                const response = await fetch('/api/citas/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ citas: reservas, cantidadPersonas }),
                });
                const data = await response.json();
                if (!response.ok) {
                    if (data.code === 'HORARIO_OCUPADO') {
                        setMensajeError(`Algunos horarios ya fueron ocupados. Por favor recargá y seleccioná otros turnos.`);
                    } else {
                        setMensajeError(data.error || 'Error al reservar algunos turnos.');
                    }
                    setMostrarDialogoError(true);
                    setMostrarDialogoConfirmacion(false);
                    setConfirmando(false);
                    return;
                }
            } else {
                const response = await fetch('/api/citas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reservas[0]),
                });
                const data = await response.json();
                if (!response.ok) {
                    if (data.code === 'HORARIO_OCUPADO') {
                        setMensajeError(data.error);
                    } else {
                        setMensajeError(data.error || 'Error al reservar el turno.');
                    }
                    setMostrarDialogoError(true);
                    setMostrarDialogoConfirmacion(false);
                    setConfirmando(false);
                    return;
                }
            }
            const servicioNombre = servicios.find(s => s.id === selectedService)?.nombre || 'Servicio';
            const reservasExitosas = reservas.map(r => ({
                fecha: new Date(r.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
                hora: r.hora,
                servicio: servicioNombre
            }));
            setDatosReservas(reservasExitosas);
            setMostrarDialogoExito(true);
            setMostrarDialogoConfirmacion(false);
            setSelectedService(null);
            setSelectedDates([]);
            setSelectedTimes({});
            setFechaActiva(null);
            setNombre('');
            setTelefono('');
            setCantidadPersonas(1);
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

    const isFormValid = selectedService && getTotalTurnos() > 0 && nombre && telefono;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8 max-w-4xl mx-auto px-3 sm:px-0">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">1. Elegí tu servicio</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {cargandoServicios ? (
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
                                className={`p-3 sm:p-4 cursor-pointer transition-all ${selectedService === servicio.id ? 'ring-2 ring-primary bg-accent' : 'hover:border-primary/50'}`}
                                onClick={() => setSelectedService(servicio.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">{servicio.icono}</div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground">{servicio.nombre}</h3>
                                        {servicio.descripcion && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{servicio.descripcion}</p>
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

            {selectedService && (
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">2. Seleccioná fecha y hora</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center md:items-start">
                            <Label className="mb-2 block">Fechas (podés seleccionar varias)</Label>
                            <Calendar
                                mode="multiple"
                                selected={selectedDates}
                                onSelect={handleDateSelect}
                                disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (date < today) return true;
                                    if (date.getDay() === 0) return true;
                                    const diaSemana = date.getDay();
                                    const ahora = new Date();
                                    const horaActual = ahora.getHours();
                                    const diaActual = ahora.getDay();
                                    const inicioSemanaActual = new Date(today);
                                    const diasDesdeInicio = today.getDay() === 0 ? 6 : today.getDay() - 1;
                                    inicioSemanaActual.setDate(today.getDate() - diasDesdeInicio);
                                    const finSemanaActual = new Date(inicioSemanaActual);
                                    finSemanaActual.setDate(inicioSemanaActual.getDate() + 6);
                                    const inicioProximaSemana = new Date(finSemanaActual);
                                    inicioProximaSemana.setDate(finSemanaActual.getDate() + 1);
                                    const finProximaSemana = new Date(inicioProximaSemana);
                                    finProximaSemana.setDate(inicioProximaSemana.getDate() + 6);
                                    if (diaSemana === 5 || diaSemana === 6) {
                                        return false;
                                    }
                                    if (diaSemana >= 1 && diaSemana <= 4) {
                                        const esPostDomingo16 = diaActual === 0 && horaActual >= 16;
                                        if (esPostDomingo16) {
                                            if (date >= inicioProximaSemana && date <= finProximaSemana) {
                                                return false;
                                            }
                                        }
                                        if (date >= inicioSemanaActual && date <= finSemanaActual) {
                                            return false;
                                        }
                                        return true;
                                    }
                                    return false;
                                }}
                                locale={es}
                                className="rounded-md border mx-auto md:mx-0"
                            />
                            {selectedDates.length > 0 && (
                                <div className="mt-4 p-3 bg-accent rounded-lg w-full">
                                    <p className="text-sm font-medium mb-2">📅 {selectedDates.length} fecha(s) seleccionada(s):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDates.map((date, i) => (
                                            <Badge key={i} variant="secondary">
                                                {date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label className="mb-2 block">
                                Horarios disponibles
                            </Label>
                            {cantidadPersonas > 1 && (
                                <Alert className="mb-3 sm:mb-4 py-2 sm:py-3">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs sm:text-sm">
                                        Cada botón muestra el rango completo. Se reservarán {cantidadPersonas} turnos consecutivos.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {fechasSinHorario.length > 0 && (
                                <Alert className="mb-3 sm:mb-4 py-2 sm:py-3 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <AlertDescription className="text-xs sm:text-sm text-orange-800 dark:text-orange-200">
                                        ⚠️ El horario no está disponible para: {fechasSinHorario.map(f => f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })).join(', ')}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {mostrarAlerta && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4" />
                                    <AlertDescription>
                                        Lo sentimos, no hay turnos disponibles. Por favor seleccioná otra fecha.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {selectedDates.length > 0 ? (
                                <div className="space-y-4">
                                    {(() => {
                                        // Agrupar fechas por día de la semana y horarios disponibles
                                        const gruposPorDia: { [key: string]: { fechas: Date[], horarios: string[] } } = {};

                                        selectedDates.forEach(fecha => {
                                            const diaSemana = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
                                            const fechaKey = fecha.toISOString().split('T')[0];
                                            const horariosDisponibles = horariosDisponiblesPorFecha[fechaKey] || [];

                                            if (!gruposPorDia[diaSemana]) {
                                                gruposPorDia[diaSemana] = { fechas: [], horarios: horariosDisponibles };
                                            } else {
                                                // Calcular intersección de horarios
                                                gruposPorDia[diaSemana].horarios = gruposPorDia[diaSemana].horarios.filter(h =>
                                                    horariosDisponibles.includes(h)
                                                );
                                            }
                                            gruposPorDia[diaSemana].fechas.push(fecha);
                                        });

                                        const servicioSeleccionado = servicios.find(s => s.id === selectedService);
                                        const duracion = servicioSeleccionado?.duracionMinutos || 40;

                                        return Object.entries(gruposPorDia).map(([diaSemana, { fechas, horarios }]) => {
                                            const esMismoDia = fechas.length > 1;
                                            const primerFecha = fechas[0];

                                            return (
                                                <div key={diaSemana} className="border rounded-lg p-3 sm:p-4 bg-card">
                                                    <h4 className="font-semibold text-sm mb-3">
                                                        {esMismoDia
                                                            ? `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} (${fechas.length} fechas)`
                                                            : primerFecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
                                                        }
                                                    </h4>
                                                    {esMismoDia && (
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {fechas.map(f => f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })).join(', ')}
                                                        </p>
                                                    )}
                                                    {horarios.length > 0 ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                                                            {horarios.map((hora) => {
                                                                const horariosConsecutivos: string[] = [];
                                                                const [h, m] = hora.split(':').map(Number);
                                                                let tiempoActual = h * 60 + m;
                                                                for (let i = 0; i < cantidadPersonas; i++) {
                                                                    const horas = Math.floor(tiempoActual / 60);
                                                                    const minutos = tiempoActual % 60;
                                                                    horariosConsecutivos.push(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
                                                                    tiempoActual += duracion;
                                                                }

                                                                // Verificar si está seleccionado en todas las fechas del grupo
                                                                const todasSeleccionadas = fechas.every(fecha => {
                                                                    const fechaKey = fecha.toISOString().split('T')[0];
                                                                    const horasSeleccionadas = selectedTimes[fechaKey] || [];
                                                                    return horariosConsecutivos.every(h => horasSeleccionadas.includes(h));
                                                                });
                                                                const ultimoHorario = horariosConsecutivos[horariosConsecutivos.length - 1];

                                                                return (
                                                                    <Button
                                                                        key={hora}
                                                                        type="button"
                                                                        variant={todasSeleccionadas ? 'default' : 'outline'}
                                                                        className={cantidadPersonas > 1 ? "w-full text-[10px] sm:text-xs py-3 sm:py-4 col-span-2" : "w-full text-xs sm:text-sm py-2"}
                                                                        onClick={() => {
                                                                            if (fechas.length > 1) {
                                                                                handleMultipleTimeSelect(fechas, hora);
                                                                            } else {
                                                                                handleTimeSelect(fechas[0], hora);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {cantidadPersonas > 1 ? (
                                                                            <span className="flex flex-col items-center leading-tight">
                                                                                <span className="font-semibold">{hora} - {ultimoHorario}</span>
                                                                                <span className="text-[9px] sm:text-[10px] opacity-70">({cantidadPersonas}p)</span>
                                                                            </span>
                                                                        ) : hora}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">No hay horarios disponibles en común</p>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                    {getTotalTurnos() > 0 && (
                                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                ✅ {getTotalTurnos()} turno(s) seleccionado(s)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 border rounded-md">
                                    Seleccioná al menos una fecha primero
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedService && selectedDates.length > 0 && (
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">3. Tus datos</h2>
                    <Card className="p-4 sm:p-6">
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
                            <div>
                                <Label htmlFor="cantidadPersonas">¿Cuántas personas van? 👥</Label>
                                <Input
                                    id="cantidadPersonas"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={cantidadPersonas}
                                    onChange={(e) => {
                                        const valor = parseInt(e.target.value) || 1;
                                        setCantidadPersonas(Math.max(1, Math.min(10, valor)));
                                    }}
                                    className="mt-1.5"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    {cantidadPersonas > 1 ? (
                                        <span className="font-medium text-orange-600 dark:text-orange-400">
                                            ⚠️ Al seleccionar un horario, se reservarán {cantidadPersonas} turnos consecutivos automáticamente
                                        </span>
                                    ) : 'Si van varias personas, indicá la cantidad'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {isFormValid && (
                <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full md:w-auto md:px-12">
                        Confirmar {getTotalTurnos()} Turno{getTotalTurnos() > 1 ? 's' : ''}
                    </Button>
                </div>
            )}

            <Dialog open={mostrarDialogoConfirmacion} onOpenChange={setMostrarDialogoConfirmacion}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Confirmar {getTotalTurnos()} Turno{getTotalTurnos() > 1 ? 's' : ''}</DialogTitle>
                        <DialogDescription>Estás por reservar los siguientes turnos:</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {Object.entries(selectedTimes).map(([fechaKey, horas]) => {
                                const fecha = new Date(fechaKey + 'T00:00:00');
                                return horas.map((hora) => (
                                    <div key={`${fechaKey}-${hora}`} className="bg-accent p-3 rounded-lg">
                                        <p className="font-semibold text-foreground text-sm">
                                            {servicios.find(s => s.id === selectedService)?.nombre}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            📅 {fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · 🕐 {hora} hs
                                        </p>
                                    </div>
                                ));
                            })}
                        </div>
                        <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-3">
                            <p className="font-semibold text-sm flex items-center gap-2 text-foreground">
                                <AlertCircle className="h-4 w-4" />
                                Políticas importantes:
                            </p>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                                    <span>Cancelaciones: con <strong>2 horas de anticipación</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                                    <span>Llegá entre <strong>10 y 5 minutos antes</strong> del turno</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                                    <span>Tiempo de espera: <strong>máximo 5 minutos</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:gap-4">
                        <Button type="button" variant="outline" onClick={() => setMostrarDialogoConfirmacion(false)} disabled={confirmando}>
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
                            ) : 'Confirmar Reserva'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={mostrarDialogoExito} onOpenChange={setMostrarDialogoExito}>
                <DialogContent className="max-w-md text-center max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 animate-in zoom-in duration-300" />
                        </div>
                        <DialogTitle className="text-2xl">¡Turno{datosReservas.length > 1 ? 's' : ''} Reservado{datosReservas.length > 1 ? 's' : ''}!</DialogTitle>
                        <DialogDescription className="text-base">
                            {datosReservas.length > 1 ? 'Tus turnos han sido' : 'Tu turno ha sido'} confirmado{datosReservas.length > 1 ? 's' : ''} exitosamente
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {datosReservas.map((reserva, i) => (
                                <div key={i} className="bg-accent p-4 rounded-lg space-y-2 text-left">
                                    <p className="font-semibold text-foreground">✂️ {reserva.servicio}</p>
                                    <p className="text-sm text-muted-foreground">📅 {reserva.fecha}</p>
                                    <p className="text-sm text-muted-foreground">🕐 {reserva.hora} hs</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Recordá llegar entre 10 y 5 minutos antes de {datosReservas.length > 1 ? 'cada turno' : 'tu turno'}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" className="w-full" onClick={() => setMostrarDialogoExito(false)}>
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={mostrarDialogoError} onOpenChange={setMostrarDialogoError}>
                <DialogContent className="max-w-md text-center">
                    <DialogHeader>
                        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 animate-in zoom-in duration-300" />
                        </div>
                        <DialogTitle className="text-2xl">¡Ups! Hubo un problema</DialogTitle>
                        <DialogDescription className="text-base">{mensajeError}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-muted p-4 rounded-lg text-left">
                            <p className="text-sm text-muted-foreground">💡 <strong>Sugerencias:</strong></p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                                <li>• Elegí otro horario disponible</li>
                                <li>• Probá con otra fecha</li>
                                <li>• Si el problema persiste, contactanos por WhatsApp</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" className="w-full" onClick={() => setMostrarDialogoError(false)}>
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
