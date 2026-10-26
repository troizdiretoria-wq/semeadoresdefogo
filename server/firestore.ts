import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp as initAdminApp, getApps as getAdminApps, cert, App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth as AdminAuth } from 'firebase-admin/auth';

// Also maintain Web SDK for zero-credential container fallback to the same named database
import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from 'firebase/app';
import {
  getFirestore as getClientFirestore,
  collection as clientCollection,
  doc as clientDoc,
  getDocs as clientGetDocs,
  getDoc as clientGetDoc,
  setDoc as clientSetDoc,
  updateDoc as clientUpdateDoc,
  query as clientQuery,
  where as clientWhere,
  orderBy as clientOrderBy,
  writeBatch as clientWriteBatch,
  getDocFromServer,
  Firestore as ClientFirestore,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read configuration from firebase-applet-config.json
const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export const firebaseConfig = rawConfig;
export const NAMED_DATABASE_ID = rawConfig.firestoreDatabaseId;
export const PROJECT_ID = rawConfig.projectId;

// ==================== FIREBASE ADMIN SDK INITIALIZATION ====================

let adminApp: AdminApp;
let adminDb: AdminFirestore;
let adminAuth: AdminAuth;
let hasAdminCredentials = false;

try {
  if (getAdminApps().length === 0) {
    let credential = undefined;

    // Check for service account in environment variables
    const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (rawSa) {
      try {
        const parsed = rawSa.startsWith('{')
          ? JSON.parse(rawSa)
          : JSON.parse(Buffer.from(rawSa, 'base64').toString('utf8'));
        credential = cert(parsed);
        hasAdminCredentials = true;
      } catch (parseErr) {
        console.warn('[Firebase Admin] Falha ao analisar chave de serviço:', parseErr);
      }
    }

    adminApp = initAdminApp({
      projectId: PROJECT_ID,
      ...(credential ? { credential } : {}),
    });
  } else {
    adminApp = getAdminApps()[0];
  }

  // Connect to the specific named database
  adminDb = getAdminFirestore(adminApp, NAMED_DATABASE_ID);
  adminAuth = getAdminAuth(adminApp);
} catch (adminInitErr) {
  console.warn('[Firebase Admin] Aviso ao inicializar Firebase Admin SDK:', adminInitErr);
}

export { adminApp, adminDb, adminAuth, hasAdminCredentials };

// ==================== FIREBASE WEB CLIENT BACKEND ADAPTER ====================
// Used for the same named database when service account credentials are not injected in serverless container

const clientApp = getClientApps().length === 0 ? initClientApp(rawConfig) : getClientApp();
export const serverDb: ClientFirestore = getClientFirestore(clientApp, NAMED_DATABASE_ID);

export {
  clientCollection as collection,
  clientDoc as doc,
  clientGetDocs as getDocs,
  clientGetDoc as getDoc,
  clientSetDoc as setDoc,
  clientUpdateDoc as updateDoc,
  clientQuery as query,
  clientWhere as where,
  clientOrderBy as orderBy,
  clientWriteBatch as writeBatch,
  getDocFromServer,
};

/**
 * Health check ping to verify Firestore connectivity
 */
export async function pingFirestore(): Promise<boolean> {
  // 1. If admin credentials exist, test via adminDb
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('test').doc('connection').get();
      return true;
    } catch (e: any) {
      // Check if error is network or fatal
      if (e?.code === 14 || e?.message?.includes('UNAVAILABLE')) {
        return false;
      }
    }
  }

  // 2. Fallback to client SDK ping
  try {
    await getDocFromServer(clientDoc(serverDb, 'test', 'connection'));
    return true;
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      return false;
    }
    // If permission-denied or document not found, the service is still reachable
    return true;
  }
}

/**
 * Server audit logging for all critical operations
 */
export async function logServerAudit(
  userId: string,
  userName: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
): Promise<void> {
  const logId = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const auditEntry = {
    id: logId,
    userId,
    userName,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    if (hasAdminCredentials && adminDb) {
      await adminDb.collection('auditLogs').doc(logId).set(auditEntry);
    } else {
      await clientSetDoc(clientDoc(serverDb, 'auditLogs', logId), auditEntry);
    }
  } catch (err) {
    console.warn('[Audit Log] Falha ao registrar auditoria no Firestore:', err);
  }
}
