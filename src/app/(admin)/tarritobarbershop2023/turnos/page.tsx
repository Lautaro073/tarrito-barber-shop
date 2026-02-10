'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Search, Phone, Mail, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface Turno {
    id: string;
    servicioId: string;
    fecha: string;
    hora: string;
    nombre: string;
    telefono: string;
    email?: string;
    estado: 'pendiente' | 'confirmado' | 'completado' | 'cancelado';
    createdAt: any;
}

interface Servicio {
    id: string;
    nombre: string;
    icono: string;
}

export default function TurnosAdmin() {
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [filtroFecha, setFiltroFecha] = useState<string>('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            // Cargar servicios
            const serviciosRes = await fetch('/api/servicios');
            const serviciosData = await serviciosRes.json();
            setServicios(serviciosData.servicios || []);

            // Cargar turnos
            const turnosRes = await fetch('/api/citas/all');
            const turnosData = await turnosRes.json();
            setTurnos(turnosData.turnos || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar los turnos');
        } finally {
            setCargando(false);
        }
    };

    const cambiarEstado = async (turnoId: string, nuevoEstado: string) => {
        setActualizando(turnoId);
        try {
            const response = await fetch(`/api/citas/${turnoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            if (!response.ok) throw new Error('Error al actualizar');

            // Actualizar solo el turno específico en el estado local
            setTurnos(prevTurnos =>
                prevTurnos.map(turno =>
                    turno.id === turnoId
                        ? { ...turno, estado: nuevoEstado as any }
                        : turno
                )
            );

            toast.success('Estado actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar turno:', error);
            toast.error('Error al actualizar el turno');
        } finally {
            setActualizando(null);
        }
    };

    const getServicioNombre = (servicioId: string) => {
        const servicio = servicios.find(s => s.id === servicioId);
        return servicio ? `${servicio.icono} ${servicio.nombre}` : 'Servicio';
    };

    const getEstadoBadge = (estado: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            pendiente: { variant: 'secondary', label: 'Pendiente' },
            confirmado: { variant: 'default', label: 'Confirmado' },
            completado: { variant: 'outline', label: 'Completado' },
            cancelado: { variant: 'destructive', label: 'Cancelado' },
        };
        const config = variants[estado] || variants.pendiente;
        return <Badge variant={config.variant as any}>{config.label}</Badge>;
    };

    const turnosFiltrados = turnos.filter(turno => {
        const matchBusqueda = turno.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            turno.telefono.includes(busqueda);
        const matchEstado = filtroEstado === 'todos' || turno.estado === filtroEstado;
        const matchFecha = !filtroFecha || turno.fecha.startsWith(filtroFecha);
        return matchBusqueda && matchEstado && matchFecha;
    });

    const turnosHoy = turnos.filter(t => {
        const hoy = new Date().toISOString().split('T')[0];
        return t.fecha.startsWith(hoy);
    });

    if (cargando) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Gestión de Turnos</h1>
                        <p className="text-muted-foreground mt-1">Cargando turnos...</p>
                    </div>
                </div>

                {/* Stats skeleton */}
                <div className="grid md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-4">
                            <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-8 bg-muted rounded animate-pulse" />
                        </Card>
                    ))}
                </div>

                {/* Filters skeleton */}
                <Card className="p-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="h-10 bg-muted rounded animate-pulse" />
                        <div className="h-10 bg-muted rounded animate-pulse" />
                        <div className="h-10 bg-muted rounded animate-pulse" />
                    </div>
                </Card>

                {/* Turnos skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 flex-1">
                                    <div className="h-6 bg-muted rounded animate-pulse w-32" />
                                    <div className="h-4 bg-muted rounded animate-pulse w-48" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="h-4 bg-muted rounded animate-pulse" />
                                        <div className="h-4 bg-muted rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-9 bg-muted rounded animate-pulse w-24" />
                                    <div className="h-9 bg-muted rounded animate-pulse w-24" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Turnos</h1>
                    <p className="text-muted-foreground mt-1">
                        {turnos.length} turnos totales • {turnosHoy.length} hoy
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Hoy</p>
                    <p className="text-2xl font-bold">{turnosHoy.length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                    <p className="text-2xl font-bold">{turnos.filter(t => t.estado === 'pendiente').length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Confirmados</p>
                    <p className="text-2xl font-bold">{turnos.filter(t => t.estado === 'confirmado').length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Completados</p>
                    <p className="text-2xl font-bold">{turnos.filter(t => t.estado === 'completado').length}</p>
                </Card>
            </div>

            {/* Filtros */}
            <Card className="p-4">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o teléfono..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="relative">
                        {!filtroFecha && (
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        )}
                        <Input
                            type="date"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                            className={filtroFecha ? "" : "pl-10"}
                        />
                    </div>
                    <div>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="completado">Completado</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Lista de Turnos */}
            <div className="space-y-3">
                {turnosFiltrados.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-muted-foreground">No hay turnos que coincidan con los filtros</p>
                    </Card>
                ) : (
                    turnosFiltrados.map((turno) => (
                        <Card key={turno.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getEstadoBadge(turno.estado)}
                                                <span className="text-sm font-medium">{getServicioNombre(turno.servicioId)}</span>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-medium text-foreground">{turno.nombre}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Phone className="h-4 w-4" />
                                                    <a href={`https://wa.me/${turno.telefono.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:text-foreground hover:underline">
                                                        {turno.telefono}
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{new Date(turno.fecha).toLocaleDateString('es-AR', {
                                                        weekday: 'short',
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{turno.hora} hs</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-col gap-2">
                                    {turno.estado === 'pendiente' && (
                                        <Button
                                            size="sm"
                                            onClick={() => cambiarEstado(turno.id, 'confirmado')}
                                            disabled={actualizando === turno.id}
                                        >
                                            {actualizando === turno.id ? 'Actualizando...' : 'Confirmar'}
                                        </Button>
                                    )}
                                    {turno.estado === 'confirmado' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => cambiarEstado(turno.id, 'completado')}
                                            disabled={actualizando === turno.id}
                                        >
                                            {actualizando === turno.id ? 'Actualizando...' : 'Completar'}
                                        </Button>
                                    )}
                                    {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => cambiarEstado(turno.id, 'cancelado')}
                                            disabled={actualizando === turno.id}
                                        >
                                            {actualizando === turno.id ? 'Cancelando...' : 'Cancelar'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
