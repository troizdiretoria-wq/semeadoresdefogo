import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { db, User, Region, Member, EvangelismEvent, BimonthlyReport, ConsolidationContact } from './db.js';
import { analyzeReportsWithGemini } from './gemini.js';

dotenv.config();

export const app = express();

app.use(express.json());

// CORS & Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Semeadores de Fogo Global API',
  });
});

// ==================== AUTH & USERS ====================
app.get('/api/auth/users', (req: Request, res: Response) => {
  try {
    const users = db.get().users;
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao listar usuários' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, userId } = req.body;
  const users = db.get().users;
  let user: User | undefined;

  if (userId) {
    user = users.find((u) => u.id === userId);
  } else if (email) {
    user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({ error: 'Usuário não cadastrado na base ministerial' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Cadastro inativo. Contate o Administrador Global.' });
  }

  db.logAudit(user.id, user.name, 'LOGIN', 'USUARIO', user.id, `Usuário conectou-se com perfil ${user.role}`);
  res.json({ user });
});

// ==================== REGIONS ====================
app.get('/api/regions', (req: Request, res: Response) => {
  const { status, state } = req.query;
  let regions = db.get().regions;

  if (status) {
    regions = regions.filter((r) => r.status === status);
  }
  if (state) {
    regions = regions.filter((r) => r.state === state);
  }

  res.json(regions);
});

app.get('/api/regions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const region = db.get().regions.find((r) => r.id === id);
  if (!region) return res.status(404).json({ error: 'Regional não encontrada' });
  res.json(region);
});

app.post('/api/regions', (req: Request, res: Response) => {
  const {
    name,
    state,
    city,
    sponsoringChurch,
    responsiblePastor,
    coordinatorName,
    contactEmail,
    contactPhone,
    plannedFrequency,
    status,
    authorName,
    authorId,
  } = req.body;

  if (!name || !state || !city || !sponsoringChurch || !responsiblePastor || !coordinatorName) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  const id = `reg-${state.toLowerCase()}-${Date.now().toString(36)}`;
  const newRegion: Region = {
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

  db.update((data) => {
    data.regions.push(newRegion);
  });

  db.logAudit(authorId || 'admin', authorName || 'Administrador', 'CRIAR_REGIONAL', 'REGIONAL', id, `Criada a regional ${name} (${state})`);
  res.status(201).json(newRegion);
});

// ==================== MEMBERS ====================
app.get('/api/members', (req: Request, res: Response) => {
  const { regionId } = req.query;
  let members = db.get().members;
  if (regionId && regionId !== 'ALL') {
    members = members.filter((m) => m.regionId === regionId);
  }
  res.json(members);
});

app.post('/api/members', (req: Request, res: Response) => {
  const { name, regionId, email, phone, roleInMinistry, baptismInHolySpirit, trainingCompleted, authorName, authorId } = req.body;
  if (!name || !regionId) return res.status(400).json({ error: 'Nome e regional são obrigatórios' });

  const id = `mem-${Date.now().toString(36)}`;
  const newMember: Member = {
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

  db.update((data) => {
    data.members.push(newMember);
    const reg = data.regions.find((r) => r.id === regionId);
    if (reg) {
      reg.memberCount = data.members.filter((m) => m.regionId === regionId && m.active).length;
    }
  });

  db.logAudit(authorId || 'admin', authorName || 'Administrador', 'CADASTRAR_SEMEADOR', 'MEMBRO', id, `Cadastrado semeador ${name}`);
  res.status(201).json(newMember);
});

// ==================== EVANGELISMS ====================
app.get('/api/evangelisms', (req: Request, res: Response) => {
  const { regionId, status } = req.query;
  let events = db.get().evangelismEvents;

  if (regionId && regionId !== 'ALL') {
    events = events.filter((e) => e.regionId === regionId);
  }
  if (status) {
    events = events.filter((e) => e.status === status);
  }

  events = events.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  res.json(events);
});

app.post('/api/evangelisms', (req: Request, res: Response) => {
  const {
    regionId,
    name,
    dateTime,
    location,
    address,
    leaderId,
    leaderName,
    actionType,
    expectedParticipants,
    notes,
    authorName,
    authorId,
  } = req.body;

  if (!regionId || !name || !dateTime || !location) {
    return res.status(400).json({ error: 'Campos essenciais do evangelismo não preenchidos' });
  }

  const id = `ev-${Date.now().toString(36)}`;
  const newEvangelism: EvangelismEvent = {
    id,
    regionId,
    name,
    dateTime,
    location,
    address: address || location,
    leaderId: leaderId || authorId || 'admin',
    leaderName: leaderName || authorName || 'Líder',
    actionType: actionType || 'Praça Pública',
    expectedParticipants: Number(expectedParticipants) || 10,
    confirmedMembers: [],
    notes: notes || '',
    status: 'Planejado',
    createdAt: new Date().toISOString(),
  };

  db.update((data) => {
    data.evangelismEvents.unshift(newEvangelism);
  });

  db.logAudit(authorId || 'user', authorName || 'Líder', 'PLANEJAR_EVANGELISMO', 'EVANGELISMO', id, `Planejado evangelismo "${name}"`);
  res.status(201).json(newEvangelism);
});

// ==================== BIMONTHLY REPORTS ====================
app.get('/api/reports', (req: Request, res: Response) => {
  const { regionId, status, period } = req.query;
  let reports = db.get().bimonthlyReports;

  if (regionId && regionId !== 'ALL') {
    reports = reports.filter((r) => r.regionId === regionId);
  }
  if (status) {
    reports = reports.filter((r) => r.status === status);
  }
  if (period && period !== 'ALL') {
    reports = reports.filter((r) => r.bimonthlyPeriod === period);
  }

  res.json(reports);
});

// ==================== GEMINI AI ANALYSIS ====================
app.post('/api/ai/analyze-reports', async (req: Request, res: Response) => {
  try {
    const { period, regionId, customPrompt } = req.body;
    const database = db.get();
    let reports = database.bimonthlyReports;

    if (period && period !== 'ALL') {
      reports = reports.filter((r) => r.bimonthlyPeriod === period);
    }
    if (regionId && regionId !== 'ALL') {
      reports = reports.filter((r) => r.regionId === regionId);
    }

    if (reports.length === 0) {
      return res.status(400).json({
        error: 'Nenhum relatório bimestral encontrado para o escopo e período selecionados.',
      });
    }

    const analysis = await analyzeReportsWithGemini(reports, database.regions, database.evangelismEvents, {
      period,
      regionId,
      customPrompt,
    });

    res.json(analysis);
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-reports:', err);
    res.status(500).json({
      error: 'Falha ao processar síntese com Inteligência Artificial: ' + (err.message || 'Erro desconhecido'),
    });
  }
});

// ==================== DASHBOARD METRICS ====================
app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
  const { regionId } = req.query;
  const data = db.get();

  let regions = data.regions;
  let members = data.members;
  let evangelisms = data.evangelismEvents;
  let reports = data.bimonthlyReports;
  let contacts = data.consolidationContacts;

  if (regionId && regionId !== 'ALL') {
    regions = regions.filter((r) => r.id === regionId);
    members = members.filter((m) => m.regionId === regionId);
    evangelisms = evangelisms.filter((e) => e.regionId === regionId);
    reports = reports.filter((r) => r.regionId === regionId);
    contacts = contacts.filter((c) => c.regionId === regionId);
  }

  const totalRegions = data.regions.length;
  const activeRegions = regions.filter((r) => r.status === 'active').length;
  const totalMembers = members.filter((m) => m.active).length;

  const completedEvangelisms = evangelisms.filter((e) => e.status === 'Realizado').length;
  const plannedEvangelisms = evangelisms.filter((e) => e.status === 'Planejado' || e.status === 'Confirmado').length;

  const totalParticipantsInvolved = evangelisms
    .filter((e) => e.status === 'Realizado')
    .reduce((acc, e) => acc + (e.actualParticipants || e.expectedParticipants || 0), 0);

  const totalPeopleReached = evangelisms
    .filter((e) => e.status === 'Realizado')
    .reduce((acc, e) => acc + (e.estimatedReached || 0), 0);

  const totalContactsCollected = contacts.length;
  const contactsInConsolidation = contacts.filter((c) => c.status === 'Em acompanhamento').length;
  const contactsForwardedToChurch = contacts.filter(
    (c) => c.status === 'Encaminhado à igreja' || c.status === 'Acompanhamento concluído'
  ).length;

  const reportsSubmitted = reports.filter((r) => r.status === 'Enviado' || r.status === 'Em análise' || r.status === 'Aprovado').length;
  const reportsApproved = reports.filter((r) => r.status === 'Aprovado').length;
  const reportsPendingReview = reports.filter((r) => r.status === 'Enviado' || r.status === 'Em análise').length;

  const totalStudentsEnrolled = data.enrollments.filter((e) => e.status === 'Em andamento' || e.status === 'Concluído').length;

  res.json({
    totalRegions,
    activeRegions,
    totalMembers,
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
    totalStudentsEnrolled,
    alerts: [
      {
        type: 'info',
        message: 'Sistema de Inteligência Ministerial Semeadores de Fogo ativo e sincronizado.',
      },
    ],
  });
});

// Fallback 404 for unmatched API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `Rota de API '${req.method} ${req.originalUrl}' não encontrada.`,
  });
});

export default app;
