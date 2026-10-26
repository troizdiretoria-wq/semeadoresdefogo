import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import {
  serverDb,
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
  pingFirestore,
  logServerAudit,
} from './firestore.js';
import {
  authenticateMinisterialToken,
  requireGlobalAdmin,
  requireCoordinator,
  requireConsolidationRole,
  enforceRegionalScope,
  verifyFirebaseIdToken,
  AuthenticatedRequest,
  MinisterialUser,
} from './authMiddleware.js';
import { analyzeReportsFromFirestore } from './gemini.js';
import { INITIAL_DATABASE } from '../src/data/initialData.js';

dotenv.config();

export const app = express();

app.use(express.json());

// CORS & Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// ==================== HEALTH & OPERATIONAL DIAGNOSTICS ====================
app.get('/api/health', async (req: Request, res: Response) => {
  const isFirestoreAlive = await pingFirestore();
  const uptimeSeconds = Math.floor(process.uptime());

  const isGeminiConfigured = !!process.env.GEMINI_API_KEY;

  const status = isFirestoreAlive ? 'healthy' : 'degraded';

  res.status(isFirestoreAlive ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    dependencies: {
      firestore: isFirestoreAlive ? 'connected' : 'disconnected',
      geminiApi: isGeminiConfigured ? 'configured' : 'missing_api_key',
      auth: 'firebase_auth_active',
    },
    version: '2.0.0-firestore-production',
  });
});

// ==================== AUTH & USER VERIFICATION ====================

// Verify token and return authorized ministerial profile
app.post('/api/auth/verify', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Token de autenticação (idToken) não fornecido.' });
  }

  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified) {
    return res.status(401).json({ error: 'Token Firebase inválido ou expirado.' });
  }

  const emailLower = verified.email.toLowerCase().trim();

  try {
    // 1. Search by authUid or email in Firestore
    let foundUser: MinisterialUser | null = null;
    let docId: string | null = null;

    const snapUid = await getDocs(query(collection(serverDb, 'users'), where('authUid', '==', verified.uid)));
    if (!snapUid.empty) {
      foundUser = snapUid.docs[0].data() as MinisterialUser;
      docId = snapUid.docs[0].id;
    } else {
      const snapAll = await getDocs(collection(serverDb, 'users'));
      for (const d of snapAll.docs) {
        const u = d.data() as MinisterialUser;
        if (u.email && u.email.toLowerCase().trim() === emailLower) {
          foundUser = u;
          docId = d.id;
          // Associate UID
          await setDoc(doc(serverDb, 'users', d.id), { authUid: verified.uid }, { merge: true });
          break;
        }
      }
    }

    // Arthur first-login automatic authorization
    if (!foundUser && emailLower === 'arthursantosprojetos@gmail.com') {
      const adminUser: MinisterialUser = {
        id: 'user-arthur',
        name: 'Arthur Santos',
        email: emailLower,
        role: 'admin_global',
        regionId: null,
        phone: '(11) 99999-0001',
        status: 'active',
        authUid: verified.uid,
      };
      await setDoc(doc(serverDb, 'users', 'user-arthur'), adminUser);
      foundUser = adminUser;
    }

    if (!foundUser) {
      return res.status(403).json({
        error: `O e-mail (${verified.email}) não possui cadastro ministerial ativo. Solicite autorização à Liderança Global.`,
      });
    }

    if (foundUser.status !== 'active') {
      return res.status(403).json({
        error: 'Cadastro ministerial inativo ou suspenso. Contate a Liderança Global.',
      });
    }

    await logServerAudit(
      foundUser.id,
      foundUser.name,
      'LOGIN_AUTORIZADO',
      'USUARIO',
      foundUser.id,
      `Usuário autenticado via Firebase com perfil ${foundUser.role}`
    );

    res.json({ user: foundUser });
  } catch (err: any) {
    console.error('[Auth Verify] Erro:', err);
    res.status(500).json({ error: 'Erro ao verificar perfil ministerial no banco de dados.' });
  }
});

// List all ministerial users (Protected)
app.get('/api/auth/users', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await getDocs(collection(serverDb, 'users'));
    const users = snap.docs.map((d) => d.data());
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao consultar usuários no Firestore' });
  }
});

// Update ministerial user (Admin only, or user updating own phone/profile without privilege escalation)
app.put('/api/users/:id', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const caller = req.auth!.user;

  // Prevent regular users from modifying role, regionId, or status
  if (caller.role !== 'admin_global') {
    if (caller.id !== id) {
      return res.status(403).json({ error: 'Você só pode editar seu próprio perfil.' });
    }
    // Block privileged attributes
    delete updates.role;
    delete updates.status;
    delete updates.regionId;
    delete updates.authUid;
    delete updates.id;
  }

  try {
    const userRef = doc(serverDb, 'users', id);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(userRef);
    await logServerAudit(caller.id, caller.name, 'ATUALIZAR_USUARIO', 'USUARIO', id, `Atualização de cadastro`);
    res.json(updatedSnap.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar usuário' });
  }
});

// ==================== ADMIN BOOTSTRAP (SAFE FIRST INITIALIZATION) ====================
app.post('/api/admin/bootstrap', authenticateMinisterialToken, requireGlobalAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const caller = req.auth!.user;
  if (caller.email.toLowerCase() !== 'arthursantosprojetos@gmail.com') {
    return res.status(403).json({ error: 'Apenas o Administrador Global titular pode executar o bootstrap.' });
  }

  try {
    const snapRegions = await getDocs(collection(serverDb, 'regions'));
    if (!snapRegions.empty) {
      return res.json({ message: 'O banco de dados Firestore já está inicializado.', count: snapRegions.size });
    }

    console.log('[Bootstrap] Inicializando banco ministerial no Cloud Firestore...');
    const batch = writeBatch(serverDb);

    if (INITIAL_DATABASE.users) {
      for (const u of INITIAL_DATABASE.users) {
        batch.set(doc(serverDb, 'users', u.id), u);
      }
    }
    if (INITIAL_DATABASE.regions) {
      for (const r of INITIAL_DATABASE.regions) {
        batch.set(doc(serverDb, 'regions', r.id), r);
      }
    }
    if (INITIAL_DATABASE.members) {
      for (const m of INITIAL_DATABASE.members) {
        batch.set(doc(serverDb, 'members', m.id), m);
      }
    }
    if (INITIAL_DATABASE.evangelismEvents) {
      for (const e of INITIAL_DATABASE.evangelismEvents) {
        batch.set(doc(serverDb, 'evangelismEvents', e.id), e);
      }
    }
    if (INITIAL_DATABASE.bimonthlyReports) {
      for (const rep of INITIAL_DATABASE.bimonthlyReports) {
        batch.set(doc(serverDb, 'bimonthlyReports', rep.id), rep);
      }
    }
    if (INITIAL_DATABASE.courseModules) {
      for (const mod of INITIAL_DATABASE.courseModules) {
        batch.set(doc(serverDb, 'courseModules', mod.id), mod);
      }
    }
    if (INITIAL_DATABASE.courseClasses) {
      for (const cl of INITIAL_DATABASE.courseClasses) {
        batch.set(doc(serverDb, 'courseClasses', cl.id), cl);
      }
    }
    if (INITIAL_DATABASE.enrollments) {
      for (const enr of INITIAL_DATABASE.enrollments) {
        batch.set(doc(serverDb, 'enrollments', enr.id), enr);
      }
    }
    if (INITIAL_DATABASE.certificates) {
      for (const cert of INITIAL_DATABASE.certificates) {
        batch.set(doc(serverDb, 'certificates', cert.id), cert);
      }
    }
    if (INITIAL_DATABASE.departments) {
      for (const d of INITIAL_DATABASE.departments) {
        batch.set(doc(serverDb, 'departments', d.id), d);
      }
    }
    if (INITIAL_DATABASE.tasks) {
      for (const t of INITIAL_DATABASE.tasks) {
        batch.set(doc(serverDb, 'tasks', t.id), t);
      }
    }

    // Connection document
    batch.set(doc(serverDb, 'test', 'connection'), {
      status: 'active',
      testedAt: new Date().toISOString(),
    });

    await batch.commit();

    await logServerAudit(caller.id, caller.name, 'BOOTSTRAP_BANCO', 'SISTEMA', 'global', 'Inicialização oficial do Cloud Firestore');
    res.json({ message: 'Banco de dados Cloud Firestore inicializado com sucesso.' });
  } catch (err: any) {
    console.error('[Bootstrap Error]:', err);
    res.status(500).json({ error: 'Erro ao executar bootstrap: ' + err.message });
  }
});

// ==================== REGIONS ====================
app.get('/api/regions', async (req: Request, res: Response) => {
  try {
    const snap = await getDocs(collection(serverDb, 'regions'));
    const regions = snap.docs.map((d) => d.data());
    res.json(regions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar regionais' });
  }
});

app.get('/api/regions/:id', async (req: Request, res: Response) => {
  try {
    const snap = await getDoc(doc(serverDb, 'regions', req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: 'Regional não encontrada' });
    res.json(snap.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/regions', authenticateMinisterialToken, requireGlobalAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, state, city, sponsoringChurch, responsiblePastor, coordinatorName, contactEmail, contactPhone, plannedFrequency, status } = req.body;
  if (!name || !state || !city || !sponsoringChurch || !responsiblePastor || !coordinatorName) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  const id = `reg-${state.toLowerCase()}-${Date.now().toString(36)}`;
  const newRegion = {
    id,
    name,
    state: state.toUpperCase(),
    city,
    sponsoringChurch,
    responsiblePastor,
    coordinatorName,
    contactEmail: contactEmail || '',
    contactPhone: contactPhone || '',
    memberCount: 0,
    implantationDate: new Date().toISOString().split('T')[0],
    plannedFrequency: plannedFrequency || 'quinzenal',
    status: status || 'implanting',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(serverDb, 'regions', id), newRegion);
    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'CRIAR_REGIONAL', 'REGIONAL', id, `Criada regional ${name}`);
    res.status(201).json(newRegion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/regions/:id', authenticateMinisterialToken, requireGlobalAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const ref = doc(serverDb, 'regions', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: 'Regional não encontrada' });

    await updateDoc(ref, req.body);
    const updated = await getDoc(ref);
    res.json(updated.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MEMBERS (SEMEADORES) ====================
app.get('/api/members', async (req: Request, res: Response) => {
  const { regionId } = req.query;
  try {
    let snap = await getDocs(collection(serverDb, 'members'));
    let members = snap.docs.map((d) => d.data());
    if (regionId && regionId !== 'ALL') {
      members = members.filter((m: any) => m.regionId === regionId);
    }
    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { name, regionId, email, phone, roleInMinistry, baptismInHolySpirit, trainingCompleted } = req.body;
  if (!name || !regionId) return res.status(400).json({ error: 'Nome e regional são obrigatórios' });

  if (!enforceRegionalScope(req, regionId)) {
    return res.status(403).json({ error: 'Você não tem permissão para cadastrar membros fora da sua regional vinculada.' });
  }

  const id = `mem-${Date.now().toString(36)}`;
  const newMember = {
    id,
    name,
    regionId,
    email: email || '',
    phone: phone || '',
    roleInMinistry: roleInMinistry || 'Semeador',
    baptismInHolySpirit: !!baptismInHolySpirit,
    trainingCompleted: !!trainingCompleted,
    active: true,
    joinDate: new Date().toISOString().split('T')[0],
  };

  try {
    await setDoc(doc(serverDb, 'members', id), newMember);
    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'CADASTRAR_SEMEADOR', 'MEMBRO', id, `Cadastrado semeador ${name}`);
    res.status(201).json(newMember);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EVANGELISMS ====================
app.get('/api/evangelisms', async (req: Request, res: Response) => {
  const { regionId, status } = req.query;
  try {
    let snap = await getDocs(collection(serverDb, 'evangelismEvents'));
    let events = snap.docs.map((d) => d.data() as any);
    if (regionId && regionId !== 'ALL') {
      events = events.filter((e) => e.regionId === regionId);
    }
    if (status) {
      events = events.filter((e) => e.status === status);
    }
    events = events.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/evangelisms', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { regionId, name, dateTime, location, address, actionType, expectedParticipants, notes } = req.body;
  if (!regionId || !name || !dateTime || !location) {
    return res.status(400).json({ error: 'Campos essenciais do evangelismo não preenchidos' });
  }

  if (!enforceRegionalScope(req, regionId)) {
    return res.status(403).json({ error: 'Não é permitido planejar evangelismos em outra regional.' });
  }

  const id = `ev-${Date.now().toString(36)}`;
  const newEvangelism = {
    id,
    regionId,
    name,
    dateTime,
    location,
    address: address || location,
    leaderId: req.auth!.user.id,
    leaderName: req.auth!.user.name,
    actionType: actionType || 'Praça Pública',
    expectedParticipants: Number(expectedParticipants) || 10,
    confirmedMembers: [],
    notes: notes || '',
    status: 'Planejado',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(serverDb, 'evangelismEvents', id), newEvangelism);
    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'PLANEJAR_EVANGELISMO', 'EVANGELISMO', id, `Planejado evangelismo: ${name}`);
    res.status(201).json(newEvangelism);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/evangelisms/:id', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const ref = doc(serverDb, 'evangelismEvents', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: 'Evangelismo não encontrado' });

    const ev = snap.data();
    if (!enforceRegionalScope(req, ev.regionId)) {
      return res.status(403).json({ error: 'Permissão negada para alterar evangelismo de outra regional.' });
    }

    await updateDoc(ref, req.body);
    const updated = await getDoc(ref);
    res.json(updated.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete evangelism with field outcomes
app.post('/api/evangelisms/:id/complete', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { actualParticipants, estimatedReached, contactsCollected, generalReport, positiveHighlights, difficultiesFound, testimonies, photos, suggestions } = req.body;

  try {
    const ref = doc(serverDb, 'evangelismEvents', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: 'Evangelismo não encontrado' });

    const current = snap.data();
    if (!enforceRegionalScope(req, current.regionId)) {
      return res.status(403).json({ error: 'Permissão negada para concluir evangelismo de outra regional.' });
    }

    const completedData = {
      ...current,
      status: 'Realizado',
      actualParticipants: Number(actualParticipants) || current.expectedParticipants,
      estimatedReached: Number(estimatedReached) || 0,
      contactsCollected: Number(contactsCollected) || 0,
      generalReport: generalReport || '',
      positiveHighlights: positiveHighlights || '',
      difficultiesFound: difficultiesFound || '',
      testimonies: testimonies || '',
      photos: photos || [],
      suggestions: suggestions || '',
      completedAt: new Date().toISOString(),
      completedBy: req.auth!.user.name,
    };

    await updateDoc(ref, completedData);
    await logServerAudit(
      req.auth!.user.id,
      req.auth!.user.name,
      'CONCLUIR_EVANGELISMO',
      'EVANGELISMO',
      id,
      `Concluído evangelismo "${current.name}" com ${estimatedReached} pessoas alcançadas`
    );

    res.json(completedData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BIMONTHLY REPORTS ====================
app.get('/api/reports', async (req: Request, res: Response) => {
  const { regionId, status, period } = req.query;
  try {
    const snap = await getDocs(collection(serverDb, 'bimonthlyReports'));
    let reports = snap.docs.map((d) => d.data() as any);
    if (regionId && regionId !== 'ALL') {
      reports = reports.filter((r) => r.regionId === regionId);
    }
    if (status && status !== 'ALL') {
      reports = reports.filter((r) => r.status === status);
    }
    if (period && period !== 'ALL') {
      reports = reports.filter((r) => r.bimonthlyPeriod === period);
    }
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/prefill', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { regionId, period } = req.query as { regionId: string; period: string };
  if (!regionId) return res.status(400).json({ error: 'regionId é obrigatório' });

  try {
    const regSnap = await getDoc(doc(serverDb, 'regions', regionId));
    if (!regSnap.exists()) return res.status(404).json({ error: 'Regional não encontrada' });
    const region = regSnap.data();

    // Query evangelisms
    const evSnap = await getDocs(collection(serverDb, 'evangelismEvents'));
    const regionalEvangelisms = evSnap.docs
      .map((d) => d.data() as any)
      .filter((e) => e.regionId === regionId && e.status === 'Realizado');

    // Query contacts
    const ctSnap = await getDocs(collection(serverDb, 'consolidationContacts'));
    const contacts = ctSnap.docs
      .map((d) => d.data() as any)
      .filter((c) => c.regionId === regionId);

    const contactsInConsolidation = contacts.filter((c) => c.status === 'Em acompanhamento').length;
    const forwardedToChurch = contacts.filter((c) => c.status === 'Encaminhado à igreja' || c.status === 'Acompanhamento concluído').length;

    const totalPeopleReached = regionalEvangelisms.reduce((acc, e) => acc + (e.estimatedReached || 0), 0);
    const totalContactsCollected = regionalEvangelisms.reduce((acc, e) => acc + (e.contactsCollected || 0), 0);
    const totalParticipants = regionalEvangelisms.reduce((acc, e) => acc + (e.actualParticipants || 0), 0);
    const locations = Array.from(new Set(regionalEvangelisms.map((e) => e.location))).join(', ');
    const testimonies = regionalEvangelisms
      .filter((e) => e.testimonies)
      .map((e) => `[${e.name}]: ${e.testimonies}`)
      .join('\n\n');

    res.json({
      regionId: region.id,
      regionName: region.name,
      coordinatorName: region.coordinatorName,
      bimonthlyPeriod: period || '5º Bimestre / 2026 (Set/Out)',
      year: 2026,
      evangelismsCount: regionalEvangelisms.length,
      frequencyObserved: region.plannedFrequency === 'semanal' ? 'Semanal' : 'Quinzenal',
      locationsReached: locations || 'Ações em praças e logradouros centrais',
      totalParticipants: totalParticipants || region.memberCount,
      activitiesDescription: `Foram realizadas ${regionalEvangelisms.length} ações evangelísticas no período auditado.`,
      peopleReached: totalPeopleReached,
      contactsCollected: totalContactsCollected,
      contactsInConsolidation,
      forwardedToChurch,
      testimonies: testimonies || 'Vidas reconciliadas e atendidas em oração.',
      strengths: 'Comprometimento da equipe de semeadores.',
      difficulties: 'Necessidade de mais literatura e bíblias.',
      regionalNeeds: 'Apoio logístico para expansão de frentes de rua.',
      proposedImprovements: 'Estruturação de escalas fixas.',
      nextPeriodPlanning: 'Manter a constância das ações quinzenais.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body;
  if (!payload.regionId || !payload.bimonthlyPeriod) {
    return res.status(400).json({ error: 'Regional e período são obrigatórios' });
  }

  if (!enforceRegionalScope(req, payload.regionId)) {
    return res.status(403).json({ error: 'Não é permitido enviar relatório de outra regional.' });
  }

  const id = `rep-${payload.regionId}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const newReport = {
    id,
    regionId: payload.regionId,
    regionName: payload.regionName || 'Regional',
    coordinatorId: req.auth!.user.id,
    coordinatorName: req.auth!.user.name,
    bimonthlyPeriod: payload.bimonthlyPeriod,
    year: payload.year || 2026,
    status: payload.status || 'Enviado',
    submissionDate: now,
    evangelismsCount: Number(payload.evangelismsCount) || 0,
    frequencyObserved: payload.frequencyObserved || '',
    locationsReached: payload.locationsReached || '',
    totalParticipants: Number(payload.totalParticipants) || 0,
    activitiesDescription: payload.activitiesDescription || '',
    peopleReached: Number(payload.peopleReached) || 0,
    contactsCollected: Number(payload.contactsCollected) || 0,
    contactsInConsolidation: Number(payload.contactsInConsolidation) || 0,
    forwardedToChurch: Number(payload.forwardedToChurch) || 0,
    testimonies: payload.testimonies || '',
    strengths: payload.strengths || '',
    difficulties: payload.difficulties || '',
    regionalNeeds: payload.regionalNeeds || '',
    proposedImprovements: payload.proposedImprovements || '',
    nextPeriodPlanning: payload.nextPeriodPlanning || '',
    photos: payload.photos || [],
    documentsNotes: payload.documentsNotes || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(serverDb, 'bimonthlyReports', id), newReport);
    await logServerAudit(
      req.auth!.user.id,
      req.auth!.user.name,
      'CRIAR_RELATORIO',
      'RELATORIO_BIMESTRAL',
      id,
      `Criado relatório para ${payload.regionName} (${payload.bimonthlyPeriod})`
    );
    res.status(201).json(newReport);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reports/:id', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const ref = doc(serverDb, 'bimonthlyReports', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: 'Relatório não encontrado' });

    const rep = snap.data();
    if (!enforceRegionalScope(req, rep.regionId)) {
      return res.status(403).json({ error: 'Acesso negado para modificar relatório de outra regional.' });
    }

    await updateDoc(ref, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    });

    const updated = await getDoc(ref);
    res.json(updated.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports/:id/review', authenticateMinisterialToken, requireGlobalAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, adminComments } = req.body;

  if (status !== 'Aprovado' && status !== 'Devolvido' && status !== 'Em análise') {
    return res.status(400).json({ error: 'Status de avaliação inválido' });
  }

  try {
    const ref = doc(serverDb, 'bimonthlyReports', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: 'Relatório não encontrado' });

    const updates = {
      status,
      adminComments: adminComments || '',
      reviewedBy: req.auth!.user.name,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(ref, updates);
    const updated = await getDoc(ref);

    await logServerAudit(
      req.auth!.user.id,
      req.auth!.user.name,
      'AVALIAR_RELATORIO',
      'RELATORIO_BIMESTRAL',
      id,
      `Relatório atualizado para status "${status}"`
    );

    res.json(updated.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CONSOLIDATION (LGPD PROTECTED) ====================
app.get('/api/contacts', authenticateMinisterialToken, requireConsolidationRole, async (req: AuthenticatedRequest, res: Response) => {
  const { regionId, status } = req.query;
  try {
    const snap = await getDocs(collection(serverDb, 'consolidationContacts'));
    let contacts = snap.docs.map((d) => d.data() as any);

    // Enforce regional scope for non-admins
    if (req.auth!.user.role !== 'admin_global' && req.auth!.user.regionId) {
      contacts = contacts.filter((c) => c.regionId === req.auth!.user.regionId);
    } else if (regionId && regionId !== 'ALL') {
      contacts = contacts.filter((c) => c.regionId === regionId);
    }

    if (status) {
      contacts = contacts.filter((c) => c.status === status);
    }

    res.json(contacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts', authenticateMinisterialToken, requireConsolidationRole, async (req: AuthenticatedRequest, res: Response) => {
  const { regionId, name, phone, email, neighborhood, city, prayerRequests, consentGiven } = req.body;
  if (!regionId || !name || !phone) {
    return res.status(400).json({ error: 'Regional, nome e telefone são obrigatórios' });
  }

  if (!consentGiven) {
    return res.status(400).json({ error: 'Sob a LGPD, o consentimento do titular é obrigatório.' });
  }

  if (!enforceRegionalScope(req, regionId)) {
    return res.status(403).json({ error: 'Não é permitido cadastrar contato para outra regional.' });
  }

  const id = `ct-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const newContact = {
    id,
    regionId,
    name,
    phone,
    email: email || '',
    neighborhood: neighborhood || '',
    city: city || '',
    consentGiven: true,
    status: 'Novo contato',
    prayerRequests: prayerRequests || '',
    activities: [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(serverDb, 'consolidationContacts', id), newContact);
    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'CADASTRAR_CONTATO_LGPD', 'CONSOLIDACAO', id, `Cadastrado contato ${name}`);
    res.status(201).json(newContact);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts/:id/activities', authenticateMinisterialToken, requireConsolidationRole, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { type, notes, nextActionDate, nextActionDescription, newStatus } = req.body;

  if (!type || !notes) {
    return res.status(400).json({ error: 'Tipo e anotação são obrigatórios' });
  }

  try {
    const ref = doc(serverDb, 'consolidationContacts', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: 'Contato não encontrado' });

    const contact = snap.data();
    if (!enforceRegionalScope(req, contact.regionId)) {
      return res.status(403).json({ error: 'Permissão negada para atender contato de outra regional.' });
    }

    const activity = {
      id: `act-${Date.now().toString(36)}`,
      contactId: id,
      date: new Date().toISOString(),
      type,
      notes,
      workerName: req.auth!.user.name,
      nextActionDate: nextActionDate || undefined,
      nextActionDescription: nextActionDescription || undefined,
    };

    const activities = contact.activities || [];
    activities.unshift(activity);

    const updates: any = {
      activities,
      updatedAt: new Date().toISOString(),
    };
    if (newStatus) updates.status = newStatus;

    await updateDoc(ref, updates);
    const updated = await getDoc(ref);
    res.json(updated.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TRAINING & COURSES ====================
app.get('/api/courses', async (req: Request, res: Response) => {
  try {
    const [modsSnap, clsSnap, enrSnap, certsSnap] = await Promise.all([
      getDocs(collection(serverDb, 'courseModules')),
      getDocs(collection(serverDb, 'courseClasses')),
      getDocs(collection(serverDb, 'enrollments')),
      getDocs(collection(serverDb, 'certificates')),
    ]);

    res.json({
      modules: modsSnap.docs.map((d) => d.data()),
      classes: clsSnap.docs.map((d) => d.data()),
      enrollments: enrSnap.docs.map((d) => d.data()),
      certificates: certsSnap.docs.map((d) => d.data()),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/enroll', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { studentName, studentEmail, studentPhone, regionId, classId, moduleTitle, hasPhysicalBook } = req.body;
  if (!studentName || !classId) {
    return res.status(400).json({ error: 'Nome do aluno e turma são obrigatórios' });
  }

  const id = `enr-${Date.now().toString(36)}`;
  const newEnrollment = {
    id,
    studentName,
    studentEmail: studentEmail || '',
    studentPhone: studentPhone || '',
    regionId: regionId || req.auth!.user.regionId || 'reg-sp-01',
    classId,
    moduleTitle: moduleTitle || 'Módulo 1 — Evangelismo Sobrenatural',
    status: 'Em andamento',
    attendanceCount: 0,
    totalClasses: 3,
    hasPhysicalBook: !!hasPhysicalBook,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(serverDb, 'enrollments', id), newEnrollment);
    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'MATRICULAR_ALUNO', 'CURSO', id, `Matriculado aluno ${studentName}`);
    res.status(201).json(newEnrollment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/certificates', authenticateMinisterialToken, requireCoordinator, async (req: AuthenticatedRequest, res: Response) => {
  const { studentName, courseTitle, workloadHours, signedBy, regionName, enrollmentId } = req.body;
  if (!studentName || !courseTitle) {
    return res.status(400).json({ error: 'Nome do aluno e título do curso são obrigatórios' });
  }

  const certNumber = Math.floor(1000 + Math.random() * 9000);
  const code = `SF-CERT-2026-${certNumber}`;
  const id = `cert-${Date.now().toString(36)}`;

  const certificate = {
    id,
    certificateCode: code,
    studentName,
    courseTitle,
    completionDate: new Date().toISOString().split('T')[0],
    workloadHours: Number(workloadHours) || 16,
    issuer: 'Semeadores de Fogo Global',
    signedBy: signedBy || 'Lucas Moreira & Arthur',
    regionName: regionName || 'Direção Global',
  };

  try {
    await setDoc(doc(serverDb, 'certificates', id), certificate);
    if (enrollmentId) {
      await updateDoc(doc(serverDb, 'enrollments', enrollmentId), {
        status: 'Concluído',
        certificateId: id,
        completedDate: certificate.completionDate,
      }).catch(() => {});
    }

    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'EMITIR_CERTIFICADO', 'CERTIFICADO', id, `Certificado ${code} para ${studentName}`);
    res.status(201).json(certificate);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DEPARTMENTS & TASKS ====================
app.get('/api/departments', async (req: Request, res: Response) => {
  try {
    const [deptSnap, tasksSnap] = await Promise.all([
      getDocs(collection(serverDb, 'departments')),
      getDocs(collection(serverDb, 'tasks')),
    ]);

    res.json({
      departments: deptSnap.docs.map((d) => d.data()),
      tasks: tasksSnap.docs.map((d) => d.data()),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { departmentId, title, description, assignedTo, dueDate, priority } = req.body;
  if (!departmentId || !title) return res.status(400).json({ error: 'Departamento e título são obrigatórios' });

  const id = `tsk-${Date.now().toString(36)}`;
  const newTask = {
    id,
    departmentId,
    title,
    description: description || '',
    assignedTo: assignedTo || 'Não atribuído',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    priority: priority || 'Média',
    status: 'Pendente',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(serverDb, 'tasks', id), newTask);
    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'CRIAR_TAREFA', 'TAREFA', id, `Criada tarefa ${title}`);
    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id/status', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const ref = doc(serverDb, 'tasks', id);
    await updateDoc(ref, { status, updatedAt: new Date().toISOString() });
    const snap = await getDoc(ref);
    res.json(snap.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MEETINGS ====================
app.get('/api/meetings', async (req: Request, res: Response) => {
  try {
    const snap = await getDocs(collection(serverDb, 'meetings'));
    res.json(snap.docs.map((d) => d.data()));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetings', authenticateMinisterialToken, requireCoordinator, async (req: AuthenticatedRequest, res: Response) => {
  const { title, meetingType, date, time, zoomLink, location, participants, agendaItems } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Título e data são obrigatórios' });

  const id = `mtg-${Date.now().toString(36)}`;
  const newMeeting = {
    id,
    title,
    meetingType: meetingType || 'Reunião Bimestral de Alinhamento Global',
    date,
    time: time || '19:30',
    zoomLink: zoomLink || '',
    location: location || 'Ambiente Virtual Zoom',
    participants: participants || ['Liderança Global'],
    agendaItems: agendaItems || [],
    status: 'Agendada',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(serverDb, 'meetings', id), newMeeting);
    await logServerAudit(req.auth!.user.id, req.auth!.user.name, 'AGENDAR_REUNIAO', 'REUNIAO', id, `Reunião: ${title}`);
    res.status(201).json(newMeeting);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CRUSADES ====================
app.get('/api/crusades', async (req: Request, res: Response) => {
  try {
    const snap = await getDocs(collection(serverDb, 'crusades'));
    res.json(snap.docs.map((d) => d.data()));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FINANCIAL & LEGAL ====================
app.get('/api/financial', authenticateMinisterialToken, requireGlobalAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await getDocs(collection(serverDb, 'financialRecords'));
    res.json(snap.docs.map((d) => d.data()));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== AUDIT LOGS ====================
app.get('/api/audit-logs', authenticateMinisterialToken, requireGlobalAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await getDocs(collection(serverDb, 'auditLogs'));
    res.json(snap.docs.map((d) => d.data()));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GEMINI AI REPORT SYNTHESIS ====================
// Protected: Only authenticated ministerial leadership can invoke Gemini
app.post('/api/ai/analyze-reports', authenticateMinisterialToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, regionId, customPrompt } = req.body;

    // Restrict coordinator from analyzing other regionals unless global admin
    const effectiveRegion = req.auth!.user.role === 'admin_global' ? regionId : req.auth!.user.regionId || regionId;

    const analysis = await analyzeReportsFromFirestore({
      period,
      regionId: effectiveRegion,
      customPrompt,
    });

    await logServerAudit(
      req.auth!.user.id,
      req.auth!.user.name,
      'SINTESE_GEMINI',
      'RELATORIOS',
      effectiveRegion || 'global',
      `Síntese gerada para ${analysis.totalReportsAnalyzed} relatórios`
    );

    res.json(analysis);
  } catch (err: any) {
    console.error('[Gemini API Error]:', err);
    res.status(500).json({
      error: 'Falha ao processar síntese ministerial com Gemini API: ' + (err.message || 'Erro desconhecido'),
    });
  }
});

// ==================== DASHBOARD DYNAMIC METRICS ====================
app.get('/api/dashboard/metrics', async (req: Request, res: Response) => {
  const { regionId } = req.query;

  try {
    const [regSnap, evSnap, repSnap, memSnap, enrSnap] = await Promise.all([
      getDocs(collection(serverDb, 'regions')),
      getDocs(collection(serverDb, 'evangelismEvents')),
      getDocs(collection(serverDb, 'bimonthlyReports')),
      getDocs(collection(serverDb, 'members')),
      getDocs(collection(serverDb, 'enrollments')),
    ]);

    let regions = regSnap.docs.map((d) => d.data() as any);
    let events = evSnap.docs.map((d) => d.data() as any);
    let reports = repSnap.docs.map((d) => d.data() as any);
    let members = memSnap.docs.map((d) => d.data() as any);
    let enrollments = enrSnap.docs.map((d) => d.data() as any);

    if (regionId && regionId !== 'ALL') {
      events = events.filter((e) => e.regionId === regionId);
      reports = reports.filter((r) => r.regionId === regionId);
      members = members.filter((m) => m.regionId === regionId);
    }

    const activeRegions = regions.filter((r) => r.status === 'active').length;
    const completedEvangelisms = events.filter((e) => e.status === 'Realizado').length;
    const plannedEvangelisms = events.filter((e) => e.status === 'Planejado' || e.status === 'Confirmado').length;

    const totalPeopleReached = events
      .filter((e) => e.status === 'Realizado')
      .reduce((acc, e) => acc + (Number(e.estimatedReached) || 0), 0);

    const totalContactsCollected = events
      .filter((e) => e.status === 'Realizado')
      .reduce((acc, e) => acc + (Number(e.contactsCollected) || 0), 0);

    const totalParticipantsInvolved = events
      .filter((e) => e.status === 'Realizado')
      .reduce((acc, e) => acc + (Number(e.actualParticipants) || Number(e.expectedParticipants) || 0), 0);

    const contactsInConsolidation = reports.reduce((acc, r) => acc + (Number(r.contactsInConsolidation) || 0), 0);
    const contactsForwardedToChurch = reports.reduce((acc, r) => acc + (Number(r.forwardedToChurch) || 0), 0);

    const reportsSubmitted = reports.filter((r) => r.status === 'Enviado' || r.status === 'Em análise' || r.status === 'Aprovado').length;
    const reportsApproved = reports.filter((r) => r.status === 'Aprovado').length;
    const reportsPendingReview = reports.filter((r) => r.status === 'Enviado' || r.status === 'Em análise').length;

    res.json({
      totalRegions: regions.length,
      activeRegions,
      totalMembers: members.length,
      completedEvangelisms,
      plannedEvangelisms,
      totalParticipantsInvolved,
      totalPeopleReached,
      totalContactsCollected,
      contactsInConsolidation,
      contactsForwardedToChurch,
      reportsSubmitted,
      reportsApproved,
      reportsPendingReview,
      totalStudentsEnrolled: enrollments.length,
      alerts: [
        {
          type: 'info',
          message: 'Sistema de Inteligência Ministerial sincronizado com Cloud Firestore em tempo real.',
        },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao calcular métricas' });
  }
});

// Fallback for unmatched API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `Rota de API '${req.method} ${req.originalUrl}' não encontrada.`,
  });
});

export default app;
