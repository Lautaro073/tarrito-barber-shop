'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Turno {
    id: string;
    fecha: string;
    hora: string;
    estado: string;
}

interface Servicio {
    id: string;
    activo: boolean;
}

export default function DashboardPage() {
    const [turnosHoy, setTurnosHoy] = useState(0);
    const [turnosSemana, setTurnosSemana] = useState(0);
    const [serviciosActivos, setServiciosActivos] = useState(0);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Cargar turnos
            const turnosRes = await fetch('/api/citas/all');
            const turnosData = await turnosRes.json();
            const turnos: Turno[] = turnosData.turnos || [];

            // Calcular turnos de hoy
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const turnosDeHoy = turnos.filter(t => {
                const fechaTurno = new Date(t.fecha);
                fechaTurno.setHours(0, 0, 0, 0);
                return fechaTurno.getTime() === hoy.getTime();
            });
            setTurnosHoy(turnosDeHoy.length);

            // Calcular turnos de esta semana
            const inicioSemana = new Date(hoy);
            const diaSemana = hoy.getDay();
            const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;
            inicioSemana.setDate(hoy.getDate() - diasDesdeInicio);

            const finSemana = new Date(inicioSemana);
            finSemana.setDate(inicioSemana.getDate() + 6);
            finSemana.setHours(23, 59, 59, 999);

            const turnosDeSemana = turnos.filter(t => {
                const fechaTurno = new Date(t.fecha);
                return fechaTurno >= inicioSemana && fechaTurno <= finSemana;
            });
            setTurnosSemana(turnosDeSemana.length);

            // Cargar servicios activos
            const serviciosRes = await fetch('/api/servicios');
            const serviciosData = await serviciosRes.json();
            const servicios: Servicio[] = serviciosData.servicios || [];
            const activos = servicios.filter(s => s.activo);
            setServiciosActivos(activos.length);

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setCargando(false);
        }
    };
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                <p className="text-muted-foreground">Bienvenido al panel de administración</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/tarritobarbershop2023/horarios">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary">
                        <div className="text-4xl mb-3">🕐</div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Horarios</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Configurá tus días y horarios de trabajo
                        </p>
                        <Button variant="outline" className="w-full">Gestionar Horarios</Button>
                    </Card>
                </Link>

                <Link href="/tarritobarbershop2023/servicios">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary">
                        <div className="text-4xl mb-3">✂️</div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Servicios</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Administrá servicios, precios y duraciones
                        </p>
                        <Button variant="outline" className="w-full">Gestionar Servicios</Button>
                    </Card>
                </Link>

                <Link href="/tarritobarbershop2023/turnos">
                    <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
                        <div className="text-3xl mb-3">📅</div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Turnos</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Gestioná y revisá los turnos agendados
                        </p>
                        <Button variant="outline" className="w-full">Ver Turnos</Button>
                    </Card>
                </Link>

                <Link href="/tarritobarbershop2023/estadisticas">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary">
                        <div className="text-4xl mb-3">📊</div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Estadísticas</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Visualizá ganancias y métricas del negocio
                        </p>
                        <Button variant="outline" className="w-full">Ver Estadísticas</Button>
                    </Card>
                </Link>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Resumen rápido</h3>
                {cargando ? (
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="h-9 bg-muted rounded animate-pulse mb-2"></div>
                            <p className="text-sm text-muted-foreground">Turnos hoy</p>
                        </div>
                        <div>
                            <div className="h-9 bg-muted rounded animate-pulse mb-2"></div>
                            <p className="text-sm text-muted-foreground">Esta semana</p>
                        </div>
                        <div>
                            <div className="h-9 bg-muted rounded animate-pulse mb-2"></div>
                            <p className="text-sm text-muted-foreground">Servicios activos</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-3xl font-bold text-primary">{turnosHoy}</p>
                            <p className="text-sm text-muted-foreground">Turnos hoy</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-primary">{turnosSemana}</p>
                            <p className="text-sm text-muted-foreground">Esta semana</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-primary">{serviciosActivos}</p>
                            <p className="text-sm text-muted-foreground">Servicios activos</p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
