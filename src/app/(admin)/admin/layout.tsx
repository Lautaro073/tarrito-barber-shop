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
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">💈 Panel Admin - Tarrito</h1>
                        <nav className="flex gap-4">
                            <a href="/admin/dashboard" className="text-sm hover:text-primary">Dashboard</a>
                            <a href="/admin/horarios" className="text-sm hover:text-primary">Horarios</a>
                            <a href="/admin/servicios" className="text-sm hover:text-primary">Servicios</a>
                            <a href="/admin/turnos" className="text-sm hover:text-primary">Turnos</a>
                            <a href="/admin/estadisticas" className="text-sm hover:text-primary">Estadísticas</a>
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
