'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type DiaSemana = {
    dia: string;
    activo: boolean;
    horaInicio: string;
    horaFin: string;
};

const diasIniciales: DiaSemana[] = [
    { dia: 'Lunes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
    { dia: 'Martes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
    { dia: 'Miércoles', activo: true, horaInicio: '09:00', horaFin: '19:00' },
    { dia: 'Jueves', activo: true, horaInicio: '09:00', horaFin: '19:00' },
    { dia: 'Viernes', activo: true, horaInicio: '09:00', horaFin: '19:00' },
    { dia: 'Sábado', activo: true, horaInicio: '09:00', horaFin: '15:00' },
    { dia: 'Domingo', activo: false, horaInicio: '', horaFin: '' },
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
                    setDias(data.horarios);
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
        setDias(nuevosDias);
    };

    const actualizarHorario = (index: number, campo: 'horaInicio' | 'horaFin', valor: string) => {
        const nuevosDias = [...dias];
        nuevosDias[index][campo] = valor;
        setDias(nuevosDias);
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
                    {dias.map((dia, index) => (
                        <div key={dia.dia} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-3 md:w-40">
                                <input
                                    type="checkbox"
                                    checked={dia.activo}
                                    onChange={() => toggleDia(index)}
                                    className="w-5 h-5 rounded"
                                />
                                <span className="font-medium text-foreground">{dia.dia}</span>
                            </div>

                            {dia.activo && (
                                <div className="flex gap-4 flex-1">
                                    <div className="flex-1">
                                        <Label htmlFor={`inicio-${index}`} className="text-xs">Apertura</Label>
                                        <Input
                                            id={`inicio-${index}`}
                                            type="time"
                                            value={dia.horaInicio}
                                            onChange={(e) => actualizarHorario(index, 'horaInicio', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor={`fin-${index}`} className="text-xs">Cierre</Label>
                                        <Input
                                            id={`fin-${index}`}
                                            type="time"
                                            value={dia.horaFin}
                                            onChange={(e) => actualizarHorario(index, 'horaFin', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {!dia.activo && (
                                <span className="text-sm text-muted-foreground">Cerrado</span>
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
                    <li>• Los horarios se generan según la duración de los servicios</li>
                    <li>• Los turnos ocupados no se mostrarán a los clientes</li>
                    <li>• Podés modificar estos horarios en cualquier momento</li>
                </ul>
            </Card>
        </div>
    );
}
