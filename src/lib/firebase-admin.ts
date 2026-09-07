import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export function pushAdmin() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!clientEmail || !privateKey || !projectId) throw new Error('Faltan credenciales Firebase Admin para push');
  const app = getApps().find(app => app.name === 'push-admin') || initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  }, 'push-admin');
  return { db: getFirestore(app), messaging: getMessaging(app) };
}
