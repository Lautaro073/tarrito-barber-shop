import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Header() {
    return (
        <header className="border-b bg-background sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
            <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center bg-transparent gap-3 hover:opacity-80 transition-opacity">
                    <Image
                        src="/assets/tarritoOscuro.png"
                        alt="Tarrito Barber Shop"
                        width={120}
                        height={40}
                        className="dark:hidden w-[120px] h-auto md:w-[150px]"
                        priority
                    />
                    <Image
                        src="/assets/tarritoClaro.png"
                        alt="Tarrito Barber Shop"
                        width={120}
                        height={40}
                        className="hidden dark:block w-[120px] h-auto md:w-[150px]"
                        priority
                    />
                </Link>

                {/* Navegación Desktop */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
                        Inicio
                    </Link>
                    <Link href="/reservar" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
                        Reservar Turno
                    </Link>
                    <ThemeToggle />
                </nav>

                {/* Botones móvil */}
                <div className="flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <Link
                        href="/reservar"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Reservar
                    </Link>
                </div>

                {/* Botón desktop */}
                <Link
                    href="/reservar"
                    className="hidden md:block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    Agendar Turno
                </Link>
            </div>
        </header>
    );
}
