# 🚀 Guía de Deploy - Tarrito Barber Shop

## 📦 Pre-requisitos

- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [GitHub](https://github.com) (gratis)
- Cuenta de Gmail para emails (gratis)
- Proyecto Firebase configurado

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Crear repositorio en GitHub

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit - Tarrito Barber Shop"
git branch -M main
git remote add origin https://github.com/Lautaro073/tarrito-barber-shop.git
git push -u origin main
```

### 1.2 Crear `.gitignore` (si no existe)

Asegurate de que `.env.local` esté en `.gitignore` para no subir credenciales.

## ☁️ Paso 2: Deploy en Vercel

### 2.1 Conectar con GitHub

1. Ir a [vercel.com](https://vercel.com)
2. Click en "New Project"
3. Importar tu repositorio de GitHub
4. Seleccionar el proyecto

### 2.2 Configurar Variables de Entorno

En el dashboard de Vercel, ir a **Settings** → **Environment Variables** y agregar:

#### Firebase (obligatorio)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDJ_sAYBqMAfUElP1ue2gfzhqoE9sbFcqU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tarrito-barber-shop.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tarrito-barber-shop
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tarrito-barber-shop.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=938108519108
NEXT_PUBLIC_FIREBASE_APP_ID=1:938108519108:web:0451fce81b4a6ab417f91
```

#### NextAuth (obligatorio)
```
NEXTAUTH_URL=https://TU_DOMINIO.vercel.app
NEXTAUTH_SECRET=genera_un_secreto_aleatorio_aqui
```

Para generar `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

#### Admin (obligatorio)
```
ADMIN_EMAIL=admin@tarritobarber.com
ADMIN_PASSWORD=CAMBIA_ESTO_POR_ALGO_SEGURO
```

#### Gmail/Nodemailer (obligatorio)
```
GMAIL_USER=therialguak666@gmail.com
GMAIL_APP_PASSWORD=kqoixuapgtvjuyqb
BARBER_EMAIL=therialguak666@gmail.com
```

#### Cron Job (opcional)
```
CRON_SECRET=vivaperon
```

### 2.3 Deploy

1. Click en **Deploy**
2. Esperar 2-3 minutos
3. ✅ Tu app estará en `https://tu-proyecto.vercel.app`

## ⚙️ Paso 3: Configurar Cron Job

El archivo `vercel.json` ya está configurado para ejecutar el resumen diario a las 7 AM.

**Importante:** Los cron jobs **solo funcionan en producción**, no en local.

### Verificar que funciona:

1. Ir al dashboard de Vercel
2. Settings → Cron Jobs
3. Debería aparecer: `/api/notificaciones/resumen-diario` - `0 7 * * *`

## 🔐 Paso 4: Seguridad en Producción

### 4.1 Cambiar credenciales de admin

Usar contraseñas fuertes para:
- `ADMIN_PASSWORD`
- `NEXTAUTH_SECRET`

### 4.2 Configurar Firebase Security Rules

En la consola de Firebase, ir a **Firestore Database** → **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo lectura para servicios y horarios (público)
    match /servicios/{document} {
      allow read: if true;
      allow write: if false; // Solo desde admin
    }
    
    match /horarios/{document} {
      allow read: if true;
      allow write: if false; // Solo desde admin
    }
    
    // Citas: lectura/escritura pública (validado en backend)
    match /citas/{document} {
      allow read, write: if true;
    }
  }
}
```

## 📧 Paso 5: Verificar Emails

1. Crear un turno desde tu sitio en producción
2. Verificar que el email llega a `BARBER_EMAIL`
3. Probar cancelación de turno
4. Verificar email de cancelación

## 🧪 Testing en Producción

### URLs a probar:

- ✅ Home: `https://tu-proyecto.vercel.app`
- ✅ Reservar: `https://tu-proyecto.vercel.app/reservar`
- ✅ Cancelar: `https://tu-proyecto.vercel.app/cancelar-turno`
- ✅ Admin: `https://tu-proyecto.vercel.app/admin/dashboard`

### Checklist:

- [ ] Home carga correctamente
- [ ] Servicios se muestran desde Firebase
- [ ] Horarios se cargan
- [ ] Formulario de reserva funciona
- [ ] Email de nuevo turno llega
- [ ] Cancelación de turno funciona
- [ ] Email de cancelación llega
- [ ] Login de admin funciona
- [ ] Dashboard admin accesible
- [ ] CRUD de servicios funciona
- [ ] CRUD de horarios funciona
- [ ] Gestión de turnos funciona
- [ ] Estadísticas se muestran

## 🔄 Actualizar el Sitio

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel desplegará automáticamente los cambios en ~2 minutos.

## 🆘 Troubleshooting

### Error: "Function timed out"
- Aumentar timeout en Vercel Settings → Functions → Timeout (máx 60s en plan gratuito)

### Error: "Invalid Firebase credentials"
- Verificar que todas las variables `NEXT_PUBLIC_FIREBASE_*` estén correctas
- Copiar desde Firebase Console exactamente

### No llegan emails
- Verificar `GMAIL_APP_PASSWORD` sin espacios
- Verificar que la App Password no haya sido revocada
- Revisar logs en Vercel

### Cron job no ejecuta
- Solo funciona en producción
- Verificar que `vercel.json` esté en la raíz
- Esperar hasta las 7 AM (timezone UTC-3)

## 📊 Monitoreo

### Ver logs en Vercel:

1. Dashboard → Tu Proyecto
2. Click en "Deployments"
3. Click en el deployment activo
4. Click en "Functions" para ver logs

## 💰 Costos

Todo es **100% GRATIS**:

- ✅ Vercel: Plan gratuito (100GB bandwidth, 100 deployments/mes)
- ✅ Firebase: Plan Spark gratuito (50k reads/día, 20k writes/día)
- ✅ Gmail: Gratuito (~500 emails/día)
- ✅ GitHub: Repositorios públicos gratuitos

## 🎯 Siguientes Pasos

1. **Dominio personalizado** (opcional): Conectar tu propio dominio en Vercel Settings
2. **Analytics**: Agregar Google Analytics
3. **Backups**: Exportar datos de Firebase periódicamente
4. **SEO**: Mejorar metadata y Open Graph tags

## 📞 Soporte

Si tenés problemas:
1. Revisar esta guía
2. Revisar logs en Vercel
3. Revisar Firebase Console
4. Buscar en [Vercel Docs](https://vercel.com/docs)
