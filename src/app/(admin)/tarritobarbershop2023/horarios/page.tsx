'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

type FranjaHoraria = {
    horaInicio: string;
    horaFin: string;
};

type DiaSemana = {
    dia: string;
    activo: boolean;
    franjas: FranjaHoraria[];
};

const diasIniciales: DiaSemana[] = [
    { dia: 'Lunes', activo: true, franjas: [{ horaInicio: '09:00', horaFin: '19:00' }] },
    { dia: 'Martes', activo: true, franjas: [{ horaInicio: '09:00', horaFin: '19:00' }] },
    { dia: 'Miércoles', activo: true, franjas: [{ horaInicio: '09:00', horaFin: '19:00' }] },
    { dia: 'Jueves', activo: true, franjas: [{ horaInicio: '09:00', horaFin: '19:00' }] },
    { dia: 'Viernes', activo: true, franjas: [{ horaInicio: '09:00', horaFin: '19:00' }] },
    { dia: 'Sábado', activo: true, franjas: [{ horaInicio: '09:00', horaFin: '15:00' }] },
    { dia: 'Domingo', activo: false, franjas: [] },
];

export default function HorariosPage() {
    const [dias, setDias] = useState<DiaSemana[]>(diasIniciales);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);

    // Cargar horarios desde Firebase al montar el componente
    useEffect(() => {
        const cargarHorarios = async () => {
            try {
                const response = await fetch('/api/horarios');
                const data = await response.json();
                if (data.horarios) {
                    // Migrar formato antiguo al nuevo si es necesario
                    const horariosMigrados = data.horarios.map((dia: any) => {
                        if (!dia.franjas && dia.horaInicio && dia.horaFin) {
                            // Formato antiguo: convertir a nuevo formato con franjas
                            return {
                                dia: dia.dia,
                                activo: dia.activo,
                                franjas: dia.activo ? [{ horaInicio: dia.horaInicio, horaFin: dia.horaFin }] : []
                            };
                        }
                        // Ya está en formato nuevo o día inactivo
                        return {
                            dia: dia.dia,
                            activo: dia.activo,
                            franjas: dia.franjas || []
                        };
                    });
                    setDias(horariosMigrados);
                }
            } catch (error) {
                console.error('Error al cargar horarios:', error);
                toast.error('Error al cargar los horarios');
            } finally {
                setCargando(false);
            }
        };

        cargarHorarios();
    }, []);

    const toggleDia = (index: number) => {
        const nuevosDias = [...dias];
        nuevosDias[index].activo = !nuevosDias[index].activo;
        if (nuevosDias[index].activo && nuevosDias[index].franjas.length === 0) {
            nuevosDias[index].franjas = [{ horaInicio: '09:00', horaFin: '19:00' }];
        }
        setDias(nuevosDias);
    };

    const actualizarFranja = (diaIndex: number, franjaIndex: number, campo: 'horaInicio' | 'horaFin', valor: string) => {
        const nuevosDias = [...dias];
        nuevosDias[diaIndex].franjas[franjaIndex][campo] = valor;
        setDias(nuevosDias);
    };

    const agregarFranja = (diaIndex: number) => {
        const nuevosDias = [...dias];
        nuevosDias[diaIndex].franjas.push({ horaInicio: '09:00', horaFin: '19:00' });
        setDias(nuevosDias);
    };

    const eliminarFranja = (diaIndex: number, franjaIndex: number) => {
        const nuevosDias = [...dias];
        if (nuevosDias[diaIndex].franjas.length > 1) {
            nuevosDias[diaIndex].franjas.splice(franjaIndex, 1);
            setDias(nuevosDias);
        } else {
            toast.error('Debe haber al menos una franja horaria');
        }
    };

    const guardarHorarios = async () => {
        setGuardando(true);
        try {
            const response = await fetch('/api/horarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ horarios: dias }),
            });

            if (!response.ok) throw new Error('Error al guardar');

            toast.success('Horarios guardados exitosamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar los horarios');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Horarios de Trabajo</h1>
                <p className="text-muted-foreground">Configurá tus días y horarios de atención</p>
            </div>

            <Card className="p-6">
                <div className="space-y-4">
                    {dias.map((dia, diaIndex) => (
                        <div key={dia.dia} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={dia.activo}
                                    onChange={() => toggleDia(diaIndex)}
                                    className="w-5 h-5 rounded"
                                />
                                <span className="font-medium text-foreground text-lg">{dia.dia}</span>
                            </div>

                            {dia.activo && (
                                <div className="ml-8 space-y-3">
                                    {dia.franjas.map((franja, franjaIndex) => (
                                        <div key={franjaIndex} className="flex flex-col md:flex-row gap-3 items-start md:items-center p-3 bg-muted/30 rounded-lg">
                                            <div className="flex gap-3 flex-1">
                                                <div className="flex-1">
                                                    <Label htmlFor={`inicio-${diaIndex}-${franjaIndex}`} className="text-xs">Apertura</Label>
                                                    <Input
                                                        id={`inicio-${diaIndex}-${franjaIndex}`}
                                                        type="time"
                                                        value={franja.horaInicio}
                                                        onChange={(e) => actualizarFranja(diaIndex, franjaIndex, 'horaInicio', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label htmlFor={`fin-${diaIndex}-${franjaIndex}`} className="text-xs">Cierre</Label>
                                                    <Input
                                                        id={`fin-${diaIndex}-${franjaIndex}`}
                                                        type="time"
                                                        value={franja.horaFin}
                                                        onChange={(e) => actualizarFranja(diaIndex, franjaIndex, 'horaFin', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => eliminarFranja(diaIndex, franjaIndex)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => agregarFranja(diaIndex)}
                                        className="w-full md:w-auto"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar franja horaria
                                    </Button>
                                </div>
                            )}

                            {!dia.activo && (
                                <span className="ml-8 text-sm text-muted-foreground">Cerrado</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex gap-3">
                    <Button onClick={guardarHorarios} disabled={guardando} className="px-8">
                        {guardando ? 'Guardando...' : 'Guardar Horarios'}
                    </Button>
                </div>
            </Card>

            <Card className="p-6 bg-muted/30">
                <h3 className="font-bold text-foreground mb-2">💡 Información</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Podés agregar múltiples franjas horarias por día (ej: mañana y tarde)</li>
                    <li>• Los horarios se generan según la duración de los servicios</li>
                    <li>• Los turnos ocupados no se mostrarán a los clientes</li>
                    <li>• Podés modificar estos horarios en cualquier momento</li>
                </ul>
            </Card>
        </div>
    );
}
