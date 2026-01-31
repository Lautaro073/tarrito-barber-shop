import { redirect } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TODO: Verificar autenticación
    // Por ahora dejamos abierto para desarrollo
    // const isAuthenticated = false;
    // if (!isAuthenticated) {
    //   redirect('/login');
    // }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-background sticky top-0 z-50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col gap-3">
                        <h1 className="text-xl font-bold">💈 Panel Admin - Tarrito</h1>
                        <nav className="flex flex-wrap gap-3">
                            <a href="/tarritobarbershop2023/dashboard" className="text-sm hover:text-primary whitespace-nowrap">Dashboard</a>
                            <a href="/tarritobarbershop2023/horarios" className="text-sm hover:text-primary whitespace-nowrap">Horarios</a>
                            <a href="/tarritobarbershop2023/servicios" className="text-sm hover:text-primary whitespace-nowrap">Servicios</a>
                            <a href="/tarritobarbershop2023/turnos" className="text-sm hover:text-primary whitespace-nowrap">Turnos</a>
                            <a href="/tarritobarbershop2023/estadisticas" className="text-sm hover:text-primary whitespace-nowrap">Estadísticas</a>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
