# 🗺️ Roadmap - Sistema de Agendas Tarrito Barber Shop

## 📋 Visión General del Proyecto
Aplicación web para gestión de citas de barbería con sistema de reservas, notificaciones y panel administrativo.

---

## 🎯 Fase 1: Configuración Inicial del Proyecto (Día 1)

### 1.1 Setup del Proyecto
- [ ] Inicializar proyecto con **Next.js 14** (App Router)
- [ ] Configurar **TypeScript**
- [ ] Instalar y configurar **Tailwind CSS**
- [ ] Configurar **shadcn/ui** (componentes base)
- [ ] Estructura de carpetas del proyecto

**Stack Tecnológico Recomendado (100% GRATIS):**
```
- Framework: Next.js 14 (App Router) ✅ GRATIS
- UI: shadcn/ui + Tailwind CSS ✅ GRATIS
- Base de datos: Firebase Firestore ✅ GRATIS (hasta 50k lecturas/día)
- Autenticación: NextAuth.js (solo admin) ✅ GRATIS
- Notificaciones Email: Resend ✅ GRATIS (100 emails/día)
- WhatsApp: API no oficial (wa-automate) ✅ GRATIS o solo email
- Validación: Zod ✅ GRATIS
- Formularios: React Hook Form ✅ GRATIS
- Hosting: Vercel ✅ GRATIS
```

**💡 Opción Ultra-Simple (Recomendada para empezar):**
```
- Solo notificaciones por EMAIL (más simple)
- Firebase para todo (DB + Hosting alternativo)
- Sin backend pesado, solo Next.js API Routes
```

### 1.2 Instalar Componentes shadcn Necesarios
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
```

---

## 🎨 Fase 2: UI/UX - Diseño de Interfaces (Día 2-3)

### 2.1 Layout Principal
- [ ] Crear Header con logo de la barbería
- [ ] Diseño responsive (mobile-first)
- [ ] Footer básico

### 2.2 Página Principal (Vista Cliente)
- [ ] Sección de presentación
- [ ] Botón CTA para agendar cita
- [ ] Información de contacto

### 2.3 Componentes de Reserva
- [ ] **Componente: Selector de Servicio**
  - Muestra servicios disponibles
  - Precio por servicio
  - Duración del servicio
  
- [ ] **Componente: Selector de Fecha**
  - Calendar component de shadcn
  - Mostrar fechas disponibles
  
- [ ] **Componente: Selector de Horario**
  - Grid de horarios disponibles
  - Marcar horarios ocupados
  - Mostrar duración del servicio
  
- [ ] **Componente: Formulario de Datos**
  - Input: Nombre completo
  - Input: Número de celular
  - Validación con Zod

- [ ] **Componente: Confirmación**
  - Resumen de la cita
  - Términos y condiciones:
    - Cancelación 30 min antes
    - Llegar entre 10-5 min antes
    - Espera máxima: 5 min
  - Alert Dialog con las reglas

### 2.4 Panel Administrativo (Vista Dueño)
- [ ] Diseño de dashboard
- [ ] Sidebar de navegación
- [ ] Vista de calendario mensual

---

## 🔧 Fase 3: Backend & Base de Datos (Día 4-5)

### 3.1 Modelado de Base de Datos (Firebase Firestore)

**Colecciones necesarias (NoSQL):**

```javascript
// Colección: servicios
{
  id: 'auto-generated',
  nombre: 'Corte de cabello',
  descripcion: 'Corte tradicional',
  precio: 150,
  duracionMinutos: 30,
  activo: true,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Colección: horarios
{
  id: 'auto-generated',
  diaSemana: 1, // 0=Domingo, 1=Lunes, etc.
  horaInicio: '09:00',
  horaFin: '19:00',
  activo: true
}

// Colección: citas
{
  id: 'auto-generated',
  servicioId: 'ref-servicio',
  fecha: '2026-01-30',
  horaInicio: '14:00',
  horaFin: '14:30',
  clienteNombre: 'Juan Pérez',
  clienteCelular: '+52123456789',
  estado: 'pendiente', // 'pendiente', 'confirmada', 'cancelada', 'completada'
  notificacionEnviada: false,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Colección: diasBloqueados
{
  id: 'auto-generated',
  fecha: '2026-12-25',
  motivo: 'Navidad'
}

// Colección: configuracion (1 documento)
{
  emailBarbero: 'barbero@email.com',
  whatsappBarbero: '+52123456789',
  nombreNegocio: 'Tarrito Barber Shop',
  logoUrl: 'url-del-logo'
}
```

**💰 Límites Gratuitos Firebase:**
- 50,000 lecturas/día
- 20,000 escrituras/día
- 1 GB almacenamiento
- ✅ Más que suficiente para una barbería

### 3.2 API Routes (Next.js)
- [ ] `POST /api/citas` - Crear nueva cita
- [ ] `GET /api/citas` - Obtener citas (filtros por fecha)
- [ ] `DELETE /api/citas/[id]` - Cancelar cita
- [ ] `GET /api/servicios` - Listar servicios
- [ ] `PUT /api/servicios/[id]` - Actualizar servicio (admin)
- [ ] `GET /api/horarios-disponibles` - Obtener horarios por fecha
- [ ] `POST /api/horarios` - Actualizar horarios (admin)
- [ ] `GET /api/configuracion` - Obtener configuración
- [ ] `PUT /api/configuracion` - Actualizar configuración (admin)

### 3.3 Lógica de Disponibilidad
- [ ] Función para calcular slots disponibles
- [ ] Validar solapamiento de citas
- [ ] Considerar duración de servicios
- [ ] Bloquear horarios pasados

---

## 🔐 Fase 4: Autenticación (Día 6)

### 4.1 Sistema de Autenticación
- [ ] Configurar NextAuth.js
- [ ] Login solo para administrador (email/password)
- [ ] Ruta protegida para panel admin
- [ ] Middleware de protección

```typescript
// Solo 1 usuario admin necesario
// Puede ser hardcodeado o en variable de entorno
```

---

## 📱 Fase 5: Sistema de Notificaciones (Día 7-8)

### 5.1 Opción A: Solo Email (GRATIS - RECOMENDADO PARA EMPEZAR)
- [ ] Configurar Resend (100 emails gratis/día)
- [ ] Template de email para nueva cita
- [ ] Template de email para lista diaria
- [ ] Función: Enviar confirmación al agendar
- [ ] Función: Enviar resumen diario (cron job)

### 5.2 Opción B: Email + WhatsApp (Requiere más setup)
- [ ] Opción 1: Usar API no oficial (wa-automate-nodejs) - GRATIS pero inestable
- [ ] Opción 2: Solo cuando escale usar Twilio (~$0.005 por mensaje)
- [ ] **Por ahora: Solo email es suficiente** ✅

**Ejemplo de mensaje:**
```
🔔 Nueva cita agendada
📅 Fecha: 30/01/2026
🕐 Hora: 14:00
⏱️ Duración: 30 min
👤 Cliente: Juan Pérez
📞 Tel: +52 123 456 7890
💇 Servicio: Corte + Barba
💰 Precio: $250
```

---
- [ ] Crear cuenta en resend.com (GRATIS)
- [ ] Obtener API Key
- [ ] Template HTML para confirmación
- [ ] Template para resumen diario
- [ ] Función de envío

**Límite gratuito:** 100 emails/día, 3,000/mes ✅

### 5.4 Cron Jobs / Scheduled Tasks (GRATIS en Vercel)
- [ ] Vercel Cron Jobs (GRATIS en plan Hobby) ✅
- [ ] Job diario: Enviar agenda del día (7:00 AM)
- [ ] Alternativa: GitHub Actions (también gratis)
- [ ] Job de recordatorios (opcional para futuro)

---

## 🎯 Fase 6: Funcionalidades de Cliente (Día 9-10)

### 6.1 Flujo de Reserva
- [ ] **Paso 1**: Seleccionar servicio
- [ ] **Paso 2**: Seleccionar fecha
- [ ] **Paso 3**: Seleccionar horario
- [ ] **Paso 4**: Ingresar datos (nombre, celular)
- [ ] **Paso 5**: Confirmación con términos
- [ ] **Paso 6**: Pantalla de éxito + instrucciones

### 6.2 Validaciones
- [ ] Validar que el horario esté disponible
- [ ] Validar formato de celular
- [ ] Prevenir doble reserva
- [ ] Validar que no sea día/hora pasada

### 6.3 Términos y Condiciones
- [ ] Dialog con las reglas:
  ```
  ⚠️ IMPORTANTE:
  • Para cancelar, hazlo 30 min antes
  • Llega entre 10 y 5 min antes de tu cita
  • Tiempo máximo de espera: 5 minutos
  • Después de 5 min, la cita se cancela automáticamente
  ```

---

## 👨‍💼 Fase 7: Panel Administrativo (Día 11-13)

### 7.1 Dashboard Principal
- [ ] Resumen de citas del día
- [ ] Citas de la semana
- [ ] Estadísticas básicas (total mes, ingresos)

### 7.2 Gestión de Servicios
- [ ] Tabla con lista de servicios
- [ ] Botón: Agregar servicio
- [ ] Editar servicio (nombre, precio, duración)
- [ ] Activar/desactivar servicio
- [ ] Dialog de confirmación para cambios

### 7.3 Gestión de Horarios
- [ ] Configurar horarios por día de semana
- [ ] Ejemplo: Lunes a Viernes 9:00 - 19:00
- [ ] Sábado 9:00 - 15:00
- [ ] Domingo cerrado
- [ ] Bloquear días específicos (vacaciones, etc.)

### 7.4 Gestión de Citas
- [ ] Vista de calendario (mes/semana/día)
- [ ] Lista de citas con filtros
- [ ] Ver detalles de cita
- [ ] Cancelar cita manualmente
- [ ] Marcar como completada
- [ ] Buscar por nombre/celular

### 7.5 Configuración
- [ ] Actualizar logo
- [ ] Email de notificaciones
- [ ] WhatsApp de notificaciones
- [ ] Horarios generales
- [ ] Días festivos/bloqueados

---

## 🧪 Fase 8: Testing y Refinamiento (Día 14-15)

### 8.1 Pruebas Funcionales
- [ ] Flujo completo de reserva
- [ ] Validación de horarios
- [ ] Sistema de notificaciones
- [ ] Panel administrativo
- [ ] Responsive en mobile

### 8.2 Optimizaciones
- [ ] Loading states
- [ ] Error handling
- [ ] Optimistic updates
- [ ] Caché de datos

### 8.3 UX/UI
- [ ] Animaciones sutiles
- [ ] Feedback visual
- [ ] Mensajes de error claros
- [ ] Accesibilidad básica

---

## 🚀 Fase 9: Deploy y Producción (Día 16)

### 9.1 Preparación
- [ ] Variables de entorno
- [ ] Configurar base de datos en producción
- [ ] Configurar servicios de terceros (Twilio, etc.)

### 9.2 Deploy
- [ ] Deploy en **Vercel** (recomendado para Next.js)
- [ ] Configurar dominio (opcional)
- [ ] Configurar Cron Jobs

### 9.3 Datos Iniciales
- [ ] Seed de servicios iniciales
- [ ] Configurar horarios por defecto
- [ ] Crear usuario administrador

---

## 📚 Fase 10: Documentación (Día 17)

- [ ] README.md con instrucciones
- [ ] Documentar variables de entorno
- [ ] Guía de uso para administrador
- [ ] Manual de configuración

---

## 🎁 Funcionalidades Adicionales (Futuro)

### Prioridad Media
- [ ] Sistema de recordatorios automáticos (1 hora antes)
- [ ] Historial de clientes
- [ ] Sistema de puntos/fidelización
- [ ] Reportes mensuales de ingresos
- [ ] Exportar citas a PDF/Excel

### Prioridad Baja
- [ ] App móvil (React Native / PWA)
- [ ] Sistema de pagos online
- [ ] Múltiples barberos
- [ ] Sistema de reseñas
- [ ] Chat en tiempo real

---

## 📦 Estructura de Carpetas Sugerida

```
tarrito-barber-shop/
├── src/
│   ├── app/
│   │   ├── (cliente)/
│   │   │   ├── page.tsx              # Página principal
│   │   │   ├── reservar/
│   │   │   │   └── page.tsx          # Flujo de reserva
│   │   │   └── confirmacion/
│   │   │       └── page.tsx          # Confirmación
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   ├── citas/
│   │   │   │   ├── servicios/
│   │   │   │   ├── horarios/
│   │   │   │   └── configuracion/
│   │   │   └── login/
│   │   └── api/
│   │       ├── citas/
│   │       ├── servicios/
│   │       ├── horarios/
│   │       └── notificaciones/
│   ├── components/
│   │   ├── ui/                       # shadcn components
│   │   ├── cliente/
│   │   │   ├── Header.tsx
│   │   │   ├── ServiceSelector.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimeSlots.tsx
│   │   │   └── BookingForm.tsx
│   │   └── admin/
│   │       ├── Sidebar.tsx
│   │       ├── CalendarView.tsx
│   │       └── CitasList.tsx
│   ├── lib/
│   │   ├── db.ts                     # Database client
│   │   ├── validations.ts            # Zod schemas
│   │   ├── utils.ts
│   │   └── notifications/
│   │       ├── whatsapp.ts
│   │       └── email.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── public/
│   └── logo.png
├── .env.local
└── package.json
```

---

## 🛠️ Comandos de Inicio Rápido (TODO GRATIS)

```bash
# Crear proyecto
npx create-next-app@latest tarrito-barber-shop --typescript --tailwind --app

# Instalar shadcn
npx shadcn-ui@latest init

# Instalar dependencias (TODAS GRATIS)
npm install firebase                    # Base de datos GRATIS
npm install next-auth                  # Auth GRATIS
npm install zod react-hook-form @hookform/resolvers  # Validación GRATIS
npm install date-fns                   # Fechas GRATIS
npm install resend                     # Email GRATIS (100/día)
npm install @react-email/components    # Templates email GRATIS

# Opcional (solo si crece el proyecto)
# npm install @wppconnect-team/wppconnect  # WhatsApp GRATIS (no oficial)
```

---

## ✅ Checklist de Progreso

- [ ] Fase 1: Setup ✨
- [ ] Fase 2: UI/UX 🎨
- [ ] Fase 3: Backend 🔧
- [ ] Fase 4: Autenticación 🔐
- [ ] Fase 5: Notificaciones 📱
- [ ] Fase 6: Cliente 🎯
- [ ] Fase 7: Admin 👨‍💼
- [ ] Fase 8: Testing 🧪
- [ ] Fase 9: Deploy 🚀
- [ ] Fase 10: Docs 📚

---

**Tiempo estimado total:** 17 días de desarrollo
**Dificultad:** Media
**💰 Costo mensual:** $0 (100% GRATIS)

**Servicios Gratuitos Usados:**
- ✅ Vercel Hosting: GRATIS para siempre (proyectos personales)
- ✅ Firebase Firestore: GRATIS hasta 50k lecturas/día
- ✅ Resend Email: GRATIS 100 emails/día
- ✅ Vercel Cron Jobs: GRATIS
- ✅ Next.js + shadcn/ui: GRATIS (open source)

**📊 Capacidad con plan gratuito:**
- ~30-50 citas por día sin problemas
- Perfecto para 1 barbero
- Escalable cuando sea necesario

**🚀 Cuando crezcas (opcional):**
- Firebase Blaze: Pay-as-you-go (muy barato)
- Twilio WhatsApp: ~$0.005 por mensaje
- Vercel Pro: $20/mes (solo si necesitas más)

¡Vamos paso a paso! 🚀
