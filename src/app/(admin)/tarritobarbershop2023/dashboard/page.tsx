import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
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
                <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-3xl font-bold text-primary">0</p>
                        <p className="text-sm text-muted-foreground">Turnos hoy</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-primary">0</p>
                        <p className="text-sm text-muted-foreground">Esta semana</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-primary">2</p>
                        <p className="text-sm text-muted-foreground">Servicios activos</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
