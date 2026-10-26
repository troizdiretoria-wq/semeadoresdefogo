import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read configuration from firebase-applet-config.json
const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export const firebaseConfig = rawConfig;

const app = getApps().length === 0 ? initializeApp(rawConfig) : getApp();

export const serverDb: Firestore = getFirestore(app, rawConfig.firestoreDatabaseId);

export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
  getDocFromServer,
};

export async function pingFirestore(): Promise<boolean> {
  try {
    await getDocFromServer(doc(serverDb, 'test', 'connection'));
    return true;
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      return false;
    }
    // If permission-denied or document not found, the service is still reachable
    return true;
  }
}

export async function logServerAudit(
  userId: string,
  userName: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
): Promise<void> {
  try {
    const logId = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await setDoc(doc(serverDb, 'auditLogs', logId), {
      id: logId,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Audit Log] Falha ao gravar log no Firestore:', err);
  }
}
