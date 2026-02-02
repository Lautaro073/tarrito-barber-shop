'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

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
    precio: number;
    duracion: number;
}

export default function EstadisticasAdmin() {
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [fechaEspecifica, setFechaEspecifica] = useState('');
    const [semanaEspecifica, setSemanaEspecifica] = useState('');
    const [mesEspecifico, setMesEspecifico] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const serviciosRes = await fetch('/api/servicios');
            const serviciosData = await serviciosRes.json();
            setServicios(serviciosData.servicios || []);

            const turnosRes = await fetch('/api/citas/all');
            const turnosData = await turnosRes.json();
            setTurnos(turnosData.turnos || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar las estadísticas');
        } finally {
            setCargando(false);
        }
    };

    const calcularGanancia = (fechaInicio: string, fechaFin?: string) => {
        return turnos
            .filter(t => {
                const fechaTurno = t.fecha.split('T')[0];
                if (fechaFin) {
                    return fechaTurno >= fechaInicio && fechaTurno <= fechaFin && t.estado === 'completado';
                }
                return fechaTurno === fechaInicio && t.estado === 'completado';
            })
            .reduce((total, t) => {
                const servicio = servicios.find(s => s.id === t.servicioId);
                return total + (servicio?.precio || 0);
            }, 0);
    };

    if (cargando) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Estadísticas</h1>
                    <p className="text-muted-foreground mt-1">Cargando estadísticas...</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-4">
                            <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-8 bg-muted rounded animate-pulse" />
                        </Card>
                    ))}
                </div>
                <Card className="p-6">
                    <div className="h-6 bg-muted rounded animate-pulse w-48 mb-4" />
                    <div className="h-75 bg-muted rounded animate-pulse" />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">📊 Estadísticas y Ganancias</h1>
                <p className="text-muted-foreground mt-1">Visualizá el rendimiento de tu negocio</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">💰 Ganado Hoy</p>
                    <p className="text-2xl font-bold text-green-600">
                        ${(() => {
                            const hoy = new Date().toISOString().split('T')[0];
                            return turnos
                                .filter(t => t.fecha.startsWith(hoy) && t.estado === 'completado')
                                .reduce((total, t) => {
                                    const servicio = servicios.find(s => s.id === t.servicioId);
                                    return total + (servicio?.precio || 0);
                                }, 0)
                                .toLocaleString('es-AR');
                        })()}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">💰 Ganado esta Semana</p>
                    <p className="text-2xl font-bold text-green-600">
                        ${(() => {
                            const hoy = new Date();
                            const inicioSemana = new Date(hoy);
                            inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                            const inicioStr = inicioSemana.toISOString().split('T')[0];
                            return turnos
                                .filter(t => t.fecha >= inicioStr && t.estado === 'completado')
                                .reduce((total, t) => {
                                    const servicio = servicios.find(s => s.id === t.servicioId);
                                    return total + (servicio?.precio || 0);
                                }, 0)
                                .toLocaleString('es-AR');
                        })()}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">💰 Ganado este Mes</p>
                    <p className="text-2xl font-bold text-green-600">
                        ${(() => {
                            const hoy = new Date();
                            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                            const inicioStr = inicioMes.toISOString().split('T')[0];
                            return turnos
                                .filter(t => t.fecha >= inicioStr && t.estado === 'completado')
                                .reduce((total, t) => {
                                    const servicio = servicios.find(s => s.id === t.servicioId);
                                    return total + (servicio?.precio || 0);
                                }, 0)
                                .toLocaleString('es-AR');
                        })()}
                    </p>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">📈 Ganancias últimos 7 días</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(() => {
                        const datos = [];
                        for (let i = 6; i >= 0; i--) {
                            const fecha = new Date();
                            fecha.setDate(fecha.getDate() - i);
                            const fechaStr = fecha.toISOString().split('T')[0];
                            const ganancia = turnos
                                .filter(t => t.fecha.startsWith(fechaStr) && t.estado === 'completado')
                                .reduce((total, t) => {
                                    const servicio = servicios.find(s => s.id === t.servicioId);
                                    return total + (servicio?.precio || 0);
                                }, 0);
                            datos.push({
                                dia: fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
                                ganancia,
                            });
                        }
                        return datos;
                    })()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dia" />
                        <YAxis />
                        <Tooltip formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString('es-AR')}`, 'Ganancia']} />
                        <Bar dataKey="ganancia" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">📋 Resumen del Mes</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total de turnos:</span>
                            <span className="font-bold">{(() => {
                                const hoy = new Date();
                                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                                const inicioStr = inicioMes.toISOString().split('T')[0];
                                return turnos.filter(t => t.fecha >= inicioStr).length;
                            })()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Completados:</span>
                            <span className="font-bold text-green-600">{(() => {
                                const hoy = new Date();
                                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                                const inicioStr = inicioMes.toISOString().split('T')[0];
                                return turnos.filter(t => t.fecha >= inicioStr && t.estado === 'completado').length;
                            })()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cancelados:</span>
                            <span className="font-bold text-red-600">{(() => {
                                const hoy = new Date();
                                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                                const inicioStr = inicioMes.toISOString().split('T')[0];
                                return turnos.filter(t => t.fecha >= inicioStr && t.estado === 'cancelado').length;
                            })()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Pendientes:</span>
                            <span className="font-bold text-yellow-600">{(() => {
                                const hoy = new Date();
                                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                                const inicioStr = inicioMes.toISOString().split('T')[0];
                                return turnos.filter(t => t.fecha >= inicioStr && t.estado === 'pendiente').length;
                            })()}</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">🏆 Servicio Más Popular</h3>
                    <div className="space-y-3">
                        {(() => {
                            const servicioCount = turnos
                                .filter(t => t.estado === 'completado')
                                .reduce((acc, t) => {
                                    acc[t.servicioId] = (acc[t.servicioId] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>);
                            const topServicios = Object.entries(servicioCount)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3);
                            if (topServicios.length === 0) {
                                return <p className="text-muted-foreground text-sm">No hay servicios completados aún</p>;
                            }
                            return topServicios.map(([servicioId, count], index) => {
                                const servicio = servicios.find(s => s.id === servicioId);
                                return (
                                    <div key={servicioId} className="flex justify-between items-center">
                                        <span className="text-muted-foreground">
                                            {index + 1}. {servicio?.icono} {servicio?.nombre || 'Servicio'}
                                        </span>
                                        <span className="font-bold">{count} veces</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">📅 Consultar Ganancias Específicas</h3>
                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="fechaEspecifica" className="text-sm font-medium mb-2 block">Por Día</Label>
                            <Input id="fechaEspecifica" type="date" value={fechaEspecifica} onChange={(e) => setFechaEspecifica(e.target.value)} className="w-full" />
                        </div>
                        <div className="flex items-center">
                            {fechaEspecifica ? (
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full">
                                            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{new Date(fechaEspecifica + 'T00:00:00').toLocaleDateString('es-AR', {weekday: 'long',day: 'numeric',month: 'long'})}</p>
                                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">${calcularGanancia(fechaEspecifica).toLocaleString('es-AR')}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-muted/50 p-4 rounded-lg w-full text-center"><p className="text-sm text-muted-foreground">Seleccioná una fecha</p></div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="semanaEspecifica" className="text-sm font-medium mb-2 block">Por Semana</Label>
                            <Input id="semanaEspecifica" type="week" value={semanaEspecifica} onChange={(e) => setSemanaEspecifica(e.target.value)} className="w-full" />
                        </div>
                        <div className="flex items-center">
                            {semanaEspecifica ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
                                            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Semana {semanaEspecifica.split('-W')[1]}</p>
                                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                ${(() => {
                                                    const [año, semana] = semanaEspecifica.split('-W');
                                                    const inicioSemana = new Date(parseInt(año), 0, 1 + (parseInt(semana) - 1) * 7);
                                                    const diaSemana = inicioSemana.getDay();
                                                    inicioSemana.setDate(inicioSemana.getDate() - diaSemana);
                                                    const finSemana = new Date(inicioSemana);
                                                    finSemana.setDate(inicioSemana.getDate() + 6);
                                                    return calcularGanancia(inicioSemana.toISOString().split('T')[0], finSemana.toISOString().split('T')[0]).toLocaleString('es-AR');
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-muted/50 p-4 rounded-lg w-full text-center"><p className="text-sm text-muted-foreground">Seleccioná una semana</p></div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="mesEspecifico" className="text-sm font-medium mb-2 block">Por Mes</Label>
                            <Input id="mesEspecifico" type="month" value={mesEspecifico} onChange={(e) => setMesEspecifico(e.target.value)} className="w-full" />
                        </div>
                        <div className="flex items-center">
                            {mesEspecifico ? (
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-full">
                                            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{new Date(mesEspecifico + '-01').toLocaleDateString('es-AR', {month: 'long',year: 'numeric'})}</p>
                                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                                ${(() => {
                                                    const [año, mes] = mesEspecifico.split('-');
                                                    const inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
                                                    const finMes = new Date(parseInt(año), parseInt(mes), 0);
                                                    return calcularGanancia(inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]).toLocaleString('es-AR');
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-muted/50 p-4 rounded-lg w-full text-center"><p className="text-sm text-muted-foreground">Seleccioná un mes</p></div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
