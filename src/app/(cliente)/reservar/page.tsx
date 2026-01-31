import Header from '@/components/cliente/Header';
import Footer from '@/components/cliente/Footer';
import ServiceSelector from '@/components/cliente/ServiceSelector';
import { Suspense } from 'react';

export default function ReservarPage() {
    return (
        <>
            <Header />

            <main className="flex-1 py-12 px-4 bg-muted/30">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-foreground mb-3">
                            Agendá tu Turno 📅
                        </h1>
                        <p className="text-muted-foreground">
                            Seguí los pasos para reservar tu servicio
                        </p>
                    </div>

                    {/* Formulario de reserva */}
                    <Suspense fallback={<div className="text-center py-12">Cargando...</div>}>
                        <ServiceSelector />
                    </Suspense>
                </div>
            </main>

            <Footer />
        </>
    );
}
