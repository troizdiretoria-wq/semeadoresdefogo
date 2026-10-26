import { Request, Response, NextFunction } from 'express';
import {
  firebaseConfig,
  serverDb,
  adminAuth,
  hasAdminCredentials,
  doc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
} from './firestore.js';

export interface MinisterialUser {
  id: string;
  name: string;
  email: string;
  role: 'admin_global' | 'coordenador_regional' | 'lider_evangelismo' | 'equipe_consolidacao' | 'equipe_ensino' | 'equipe_midia';
  regionId: string | null;
  phone: string;
  status: 'active' | 'inactive';
  authUid?: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: {
    uid: string;
    email: string;
    user: MinisterialUser;
  };
}

/**
 * Validates Firebase ID Token using Firebase Admin SDK first.
 * If running without service account credentials, falls back to Google Identity Toolkit REST API.
 * This guarantees cryptographic verification in every environment (Vercel, Local, Cloud).
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email: string; emailVerified: boolean } | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  // 1. Try Firebase Admin SDK verification
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded && decoded.uid) {
        return {
          uid: decoded.uid,
          email: decoded.email || '',
          emailVerified: !!decoded.email_verified,
        };
      }
    } catch (adminErr: any) {
      // If the token is invalid/expired according to Firebase, return null
      if (
        adminErr?.code === 'auth/id-token-expired' ||
        adminErr?.code === 'auth/id-token-revoked' ||
        adminErr?.code === 'auth/argument-error'
      ) {
        return null;
      }
      // If error is due to missing service account credentials in container, fall back to REST
    }
  }

  // 2. Fallback to Google Identity Toolkit REST API
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.users || data.users.length === 0) {
      return null;
    }

    const fbUser = data.users[0];
    return {
      uid: fbUser.localId,
      email: fbUser.email,
      emailVerified: !!fbUser.emailVerified,
    };
  } catch (err) {
    console.error('[Auth Middleware] Erro na validação do token Firebase:', err);
    return null;
  }
}

/**
 * Express Middleware: Enforces that the request has a valid Firebase ID Token
 * and maps the token to an active ministerial user in Firestore.
 */
export async function authenticateMinisterialToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Não autorizado: Token de autenticação ausente ou em formato inválido (Bearer esperado).',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  const verifiedToken = await verifyFirebaseIdToken(token);

  if (!verifiedToken) {
    return res.status(401).json({
      error: 'Não autorizado: Token Firebase inválido ou expirado.',
    });
  }

  try {
    const emailLower = verifiedToken.email.toLowerCase().trim();

    // 1. Check if Arthur (Primary Global Administrator)
    const isArthurAdmin = emailLower === 'arthursantosprojetos@gmail.com';

    // 2. Query Firestore users by authUid or email
    let ministerialUser: MinisterialUser | null = null;

    const snapUid = await getDocs(query(collection(serverDb, 'users'), where('authUid', '==', verifiedToken.uid)));
    if (!snapUid.empty) {
      ministerialUser = snapUid.docs[0].data() as MinisterialUser;
    } else {
      const snapAll = await getDocs(collection(serverDb, 'users'));
      for (const d of snapAll.docs) {
        const u = d.data() as MinisterialUser;
        if (u.email && u.email.toLowerCase().trim() === emailLower) {
          ministerialUser = u;
          // Associate UID
          setDoc(doc(serverDb, 'users', d.id), { authUid: verifiedToken.uid }, { merge: true }).catch(() => {});
          break;
        }
      }
    }

    // If Arthur is logging in for the first time before seeding, bootstrap admin user profile
    if (!ministerialUser && isArthurAdmin) {
      const newAdmin: MinisterialUser = {
        id: 'user-arthur',
        name: 'Arthur Santos',
        email: emailLower,
        role: 'admin_global',
        regionId: null,
        phone: '(11) 99999-0001',
        status: 'active',
        authUid: verifiedToken.uid,
      };
      await setDoc(doc(serverDb, 'users', 'user-arthur'), newAdmin);
      ministerialUser = newAdmin;
    }

    if (!ministerialUser) {
      return res.status(403).json({
        error: `Acesso negado: O e-mail (${verifiedToken.email}) não possui cadastro ministerial ativo. Solicite autorização à Liderança Global.`,
      });
    }

    if (ministerialUser.status !== 'active') {
      return res.status(403).json({
        error: 'Acesso bloqueado: Seu cadastro ministerial encontra-se inativo ou suspenso.',
      });
    }

    req.auth = {
      uid: verifiedToken.uid,
      email: verifiedToken.email,
      user: ministerialUser,
    };

    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Erro ao consultar usuário ministerial no Firestore:', err);
    res.status(500).json({ error: 'Erro interno ao validar permissões no banco de dados.' });
  }
}

/**
 * Middleware: Requires global admin role
 */
export function requireGlobalAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.user.role !== 'admin_global') {
    return res.status(403).json({
      error: 'Acesso negado: Esta operação requer privilégio de Administrador Global.',
    });
  }
  next();
}

/**
 * Middleware: Requires coordinator or global admin role
 */
export function requireCoordinator(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'Não autenticado' });
  const role = req.auth.user.role;
  if (role !== 'admin_global' && role !== 'coordenador_regional') {
    return res.status(403).json({
      error: 'Acesso negado: Esta operação requer função de Coordenação Regional ou Administração Global.',
    });
  }
  next();
}

/**
 * Middleware: Requires consolidation team or admin role
 */
export function requireConsolidationRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'Não autenticado' });
  const role = req.auth.user.role;
  if (role !== 'admin_global' && role !== 'coordenador_regional' && role !== 'equipe_consolidacao') {
    return res.status(403).json({
      error: 'Acesso negado: Operação restrita ao Ministério de Consolidação e Supervisão Pastoral (LGPD).',
    });
  }
  next();
}

/**
 * Helper to check regional isolation
 */
export function enforceRegionalScope(req: AuthenticatedRequest, targetRegionId?: string): boolean {
  if (!req.auth) return false;
  if (req.auth.user.role === 'admin_global') return true;
  if (!targetRegionId) return true;
  return req.auth.user.regionId === targetRegionId;
}
