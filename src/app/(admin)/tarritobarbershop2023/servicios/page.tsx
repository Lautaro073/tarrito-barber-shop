'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Servicio {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    duracionMinutos: number;
    icono: string;
    activo: boolean;
    orden: number;
}

export default function ServiciosAdmin() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        cargarServicios();
    }, []);

    const cargarServicios = async () => {
        try {
            const response = await fetch('/api/servicios');
            const data = await response.json();
            setServicios(data.servicios || []);
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            toast.error('Error al cargar servicios');
        } finally {
            setCargando(false);
        }
    };

    const agregarServicio = () => {
        const nuevoId = Date.now().toString();
        const nuevoServicio: Servicio = {
            id: nuevoId,
            nombre: '',
            descripcion: '',
            precio: 0,
            duracionMinutos: 40,
            icono: '✂️',
            activo: true,
            orden: servicios.length + 1,
        };
        setServicios([...servicios, nuevoServicio]);
    };

    const eliminarServicio = (id: string) => {
        setServicios(servicios.filter(s => s.id !== id));
    };

    const actualizarServicio = (id: string, campo: keyof Servicio, valor: any) => {
        setServicios(servicios.map(s =>
            s.id === id ? { ...s, [campo]: valor } : s
        ));
    };

    const toggleActivo = (id: string) => {
        setServicios(servicios.map(s =>
            s.id === id ? { ...s, activo: !s.activo } : s
        ));
    };

    const guardarServicios = async () => {
        // Validar que todos tengan nombre y precio
        const serviciosValidos = servicios.every(s =>
            s.nombre.trim() !== '' && s.precio > 0
        );

        if (!serviciosValidos) {
            toast.error('Todos los servicios deben tener nombre y precio válidos');
            return;
        }

        setGuardando(true);
        try {
            const response = await fetch('/api/servicios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ servicios }),
            });

            if (!response.ok) {
                throw new Error('Error al guardar');
            }

            toast.success('Servicios guardados exitosamente');
            await cargarServicios();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al guardar servicios');
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Cargando servicios...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Servicios</h1>
                    <p className="text-muted-foreground mt-1">
                        Configurá los servicios que ofrecés, sus precios y duración
                    </p>
                </div>
                <Button onClick={agregarServicio} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Servicio
                </Button>
            </div>

            <div className="grid gap-4">
                {servicios.map((servicio, index) => (
                    <Card key={servicio.id} className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{servicio.icono}</span>
                                    <Badge variant={servicio.activo ? 'default' : 'secondary'}>
                                        {servicio.activo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleActivo(servicio.id)}
                                    >
                                        {servicio.activo ? 'Desactivar' : 'Activar'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => eliminarServicio(servicio.id)}
                                        disabled={servicios.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`nombre-${servicio.id}`}>Nombre del servicio</Label>
                                    <Input
                                        id={`nombre-${servicio.id}`}
                                        value={servicio.nombre}
                                        onChange={(e) => actualizarServicio(servicio.id, 'nombre', e.target.value)}
                                        placeholder="Ej: Corte de Cabello"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor={`icono-${servicio.id}`}>Ícono (emoji)</Label>
                                    <Input
                                        id={`icono-${servicio.id}`}
                                        value={servicio.icono}
                                        onChange={(e) => actualizarServicio(servicio.id, 'icono', e.target.value)}
                                        placeholder="Ej: ✂️"
                                        className="mt-1.5"
                                        maxLength={2}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor={`descripcion-${servicio.id}`}>Descripción</Label>
                                    <Input
                                        id={`descripcion-${servicio.id}`}
                                        value={servicio.descripcion}
                                        onChange={(e) => actualizarServicio(servicio.id, 'descripcion', e.target.value)}
                                        placeholder="Ej: Corte moderno y profesional"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor={`precio-${servicio.id}`}>Precio (ARS)</Label>
                                    <Input
                                        id={`precio-${servicio.id}`}
                                        type="number"
                                        value={servicio.precio}
                                        onChange={(e) => actualizarServicio(servicio.id, 'precio', parseInt(e.target.value) || 0)}
                                        placeholder="150"
                                        className="mt-1.5"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor={`duracion-${servicio.id}`}>Duración (minutos)</Label>
                                    <Input
                                        id={`duracion-${servicio.id}`}
                                        type="number"
                                        value={servicio.duracionMinutos}
                                        onChange={(e) => actualizarServicio(servicio.id, 'duracionMinutos', parseInt(e.target.value) || 0)}
                                        placeholder="40"
                                        className="mt-1.5"
                                        min="5"
                                        step="5"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {servicios.length === 0 && (
                <Card className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">No hay servicios configurados</p>
                    <Button onClick={agregarServicio} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Agregar tu primer servicio
                    </Button>
                </Card>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button
                    onClick={guardarServicios}
                    disabled={guardando || servicios.length === 0}
                    size="lg"
                    className="gap-2"
                >
                    <Save className="h-4 w-4" />
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );
}
