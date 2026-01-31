# 🔥 Configuración de Firebase

## Paso 1: Crear proyecto en Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Clic en "Agregar proyecto"
3. Nombre del proyecto: **Tarrito Barber Shop**
4. Desactivar Google Analytics (no es necesario por ahora)
5. Crear proyecto

## Paso 2: Configurar Firestore Database

1. En el menú lateral: **Firestore Database**
2. Clic en "Crear base de datos"
3. Modo: **Producción** (cambiaremos las reglas después)
4. Ubicación: **southamerica-east1** (São Paulo - más cercano a Argentina)
5. Habilitar

## Paso 3: Obtener credenciales

1. Ir a **Configuración del proyecto** (ícono de engranaje)
2. En "Tus apps" → seleccionar "Web" (ícono `</>`)
3. Nombre de la app: **Tarrito Web App**
4. No marcar Firebase Hosting
5. Registrar app

6. Copiar las credenciales que aparecen y pegarlas en `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tarrito-barber-shop.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tarrito-barber-shop
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tarrito-barber-shop.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Paso 4: Configurar reglas de Firestore

En Firestore → **Reglas**, reemplazar con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Citas: lectura/escritura pública (temporal)
    match /citas/{citaId} {
      allow read, write: if true;
    }
    
    // Servicios: lectura/escritura pública (temporal)
    match /servicios/{servicioId} {
      allow read, write: if true;
    }
    
    // Horarios: lectura/escritura pública (temporal)
    match /horarios/{horarioId} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Nota**: Estas reglas son temporales para desarrollo. Más adelante se implementará autenticación para el admin.

## Paso 5: Reiniciar servidor

```bash
npm run dev
```

## 🎯 Próximos pasos

Una vez configurado Firebase:
- ✅ Las citas se guardarán en Firestore
- 📧 Configurar Resend para emails de confirmación
- 🔐 Implementar autenticación para el panel admin
- 📊 Crear dashboard para ver/gestionar citas
