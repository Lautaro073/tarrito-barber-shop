'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/cliente/Header';
import Footer from '@/components/cliente/Footer';
import { getServicios } from '@/lib/servicios-cache';

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  icono: string;
  activo: boolean;
}

export default function HomePage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarServicios = async () => {
      setCargando(true);
      const data = await getServicios();
      setServicios(data);
      setCargando(false);
    };
    cargarServicios();
  }, []);

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero Simple */}
        <section className="bg-gradient-to-b from-muted/30 to-background py-12 md:py-16 px-4">
          <div className="container mx-auto text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              💈 Tarrito Barber Shop
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Aguilares, Tucumán - Agendá tu turno en segundos
            </p>
            <Link href="/reservar">
              <Button size="lg" className="text-lg px-8 py-4">
                Agendar Turno
              </Button>
            </Link>
          </div>
        </section>

        {/* Servicios Rápidos */}
        <section className="py-8 px-4 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-4">
              {cargando ? (
                // Skeleton loader
                [...Array(2)].map((_, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                servicios.map((servicio) => (
                  <Link key={servicio.id} href={`/reservar?servicio=${servicio.id}`}>
                    <Card className="p-5 cursor-pointer transition-all hover:border-primary hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{servicio.icono}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{servicio.nombre}</h3>
                          {servicio.descripcion && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {servicio.descripcion}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            {servicio.duracionMinutos} min · ${servicio.precio.toLocaleString('es-AR')} ARS
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
