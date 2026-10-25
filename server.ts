import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, User, Region, Member, EvangelismEvent, BimonthlyReport, ConsolidationContact } from './server/db.js';
import { analyzeReportsWithGemini } from './server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// ==================== AUTH & USERS ====================
app.get('/api/auth/users', (req: Request, res: Response) => {
  const users = db.get().users;
  res.json(users);
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
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  db.logAudit(user.id, user.name, 'LOGIN', 'USUARIO', user.id, `Usuário conectou-se com perfil ${user.role}`);
  res.json({ user });
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedUser: User | null = null;

  db.update((data) => {
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...updates };
      updatedUser = data.users[idx];
    }
  });

  if (!updatedUser) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(updatedUser);
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

app.put('/api/regions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedRegion: Region | null = null;

  db.update((data) => {
    const idx = data.regions.findIndex((r) => r.id === id);
    if (idx !== -1) {
      data.regions[idx] = { ...data.regions[idx], ...updates };
      updatedRegion = data.regions[idx];
    }
  });

  if (!updatedRegion) return res.status(404).json({ error: 'Regional não encontrada' });
  res.json(updatedRegion);
});

// ==================== MEMBERS (SEMEADORES) ====================
app.get('/api/members', (req: Request, res: Response) => {
  const { regionId } = req.query;
  let members = db.get().members;
  if (regionId) {
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

// ==================== EVANGELISM EVENTS ====================
app.get('/api/evangelisms', (req: Request, res: Response) => {
  const { regionId, status } = req.query;
  let events = db.get().evangelismEvents;

  if (regionId) {
    events = events.filter((e) => e.regionId === regionId);
  }
  if (status) {
    events = events.filter((e) => e.status === status);
  }

  // Sort by date descending
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
    confirmedMembers,
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
    confirmedMembers: confirmedMembers || [],
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

app.put('/api/evangelisms/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedEvent: EvangelismEvent | null = null;

  db.update((data) => {
    const idx = data.evangelismEvents.findIndex((e) => e.id === id);
    if (idx !== -1) {
      data.evangelismEvents[idx] = { ...data.evangelismEvents[idx], ...updates };
      updatedEvent = data.evangelismEvents[idx];
    }
  });

  if (!updatedEvent) return res.status(404).json({ error: 'Evangelismo não encontrado' });
  res.json(updatedEvent);
});

// Post-action completion and field report
app.post('/api/evangelisms/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    actualParticipants,
    estimatedReached,
    contactsCollected,
    generalReport,
    positiveHighlights,
    difficultiesFound,
    testimonies,
    photos,
    suggestions,
    authorName,
    authorId,
  } = req.body;

  let completedEvent: EvangelismEvent | null = null;

  db.update((data) => {
    const idx = data.evangelismEvents.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const current = data.evangelismEvents[idx];
      data.evangelismEvents[idx] = {
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
        completedBy: authorName || 'Líder de Evangelismo',
      };
      completedEvent = data.evangelismEvents[idx];
    }
  });

  if (!completedEvent) return res.status(404).json({ error: 'Evangelismo não encontrado' });

  db.logAudit(
    authorId || 'user',
    authorName || 'Líder',
    'CONCLUIR_EVANGELISMO',
    'EVANGELISMO',
    id,
    `Registrado relatório de execução do evangelismo "${(completedEvent as EvangelismEvent).name}" (${estimatedReached} pessoas alcançadas)`
  );

  res.json(completedEvent);
});

// ==================== BIMONTHLY REPORTS ====================
app.get('/api/reports', (req: Request, res: Response) => {
  const { regionId, status, period } = req.query;
  let reports = db.get().bimonthlyReports;

  if (regionId) {
    reports = reports.filter((r) => r.regionId === regionId);
  }
  if (status) {
    reports = reports.filter((r) => r.status === status);
  }
  if (period) {
    reports = reports.filter((r) => r.bimonthlyPeriod === period);
  }

  res.json(reports);
});

// Auto-populate data for creating a bimonthly report from real events
app.get('/api/reports/prefill', (req: Request, res: Response) => {
  const { regionId, period } = req.query as { regionId: string; period: string };
  if (!regionId) return res.status(400).json({ error: 'regionId é obrigatório' });

  const data = db.get();
  const region = data.regions.find((r) => r.id === regionId);
  if (!region) return res.status(404).json({ error: 'Regional não encontrada' });

  // Filter completed evangelisms of this region
  const regionalEvangelisms = data.evangelismEvents.filter(
    (e) => e.regionId === regionId && e.status === 'Realizado'
  );

  const contacts = data.consolidationContacts.filter((c) => c.regionId === regionId);
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
    frequencyObserved: region.plannedFrequency === 'semanal' ? 'Semanal conforme padrão global' : 'Quinzenal conforme padrão global',
    locationsReached: locations || 'Ações em praças e logradouros centrais',
    totalParticipants: totalParticipants || region.memberCount,
    activitiesDescription: `Foram realizadas ${regionalEvangelisms.length} ações evangelísticas no período, com envolvimento dos semeadores locais e ministração pública da Palavra e oração.`,
    peopleReached: totalPeopleReached,
    contactsCollected: totalContactsCollected,
    contactsInConsolidation,
    forwardedToChurch,
    testimonies: testimonies || 'Vidas alcançadas com reconciliação e orações respondidas.',
    strengths: 'Compromisso da liderança local e assiduidade dos semeadores.',
    difficulties: 'Necessidade de mais literatura e material dos 4 módulos de estudo.',
    regionalNeeds: 'Apoio logístico e capacitação adicional para a equipe de consolidação.',
    proposedImprovements: 'Estruturação de escalas fixas e ampliação das abordagens de rua.',
    nextPeriodPlanning: 'Manter a constância das ações e preparar participação nas próximas cruzadas.',
  });
});

app.post('/api/reports', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload.regionId || !payload.bimonthlyPeriod) {
    return res.status(400).json({ error: 'Regional e período são obrigatórios' });
  }

  const id = `rep-${payload.regionId}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const newReport: BimonthlyReport = {
    id,
    regionId: payload.regionId,
    regionName: payload.regionName || 'Regional',
    coordinatorId: payload.coordinatorId || 'coord',
    coordinatorName: payload.coordinatorName || 'Coordenador',
    bimonthlyPeriod: payload.bimonthlyPeriod,
    year: payload.year || 2026,
    status: payload.status || 'Rascunho',
    submissionDate: payload.status === 'Enviado' ? now : undefined,
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

  db.update((data) => {
    data.bimonthlyReports.unshift(newReport);
  });

  db.logAudit(
    payload.authorId || payload.coordinatorId || 'user',
    payload.authorName || payload.coordinatorName || 'Coordenador',
    'CRIAR_RELATORIO',
    'RELATORIO_BIMESTRAL',
    id,
    `Criado relatório para ${payload.regionName} (${payload.bimonthlyPeriod}) com status ${newReport.status}`
  );

  res.status(201).json(newReport);
});

app.put('/api/reports/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedReport: BimonthlyReport | null = null;

  db.update((data) => {
    const idx = data.bimonthlyReports.findIndex((r) => r.id === id);
    if (idx !== -1) {
      data.bimonthlyReports[idx] = {
        ...data.bimonthlyReports[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updatedReport = data.bimonthlyReports[idx];
    }
  });

  if (!updatedReport) return res.status(404).json({ error: 'Relatório não encontrado' });
  res.json(updatedReport);
});

// Review workflow: Approve or Return for adjustments
app.post('/api/reports/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminComments, reviewedBy, reviewerId } = req.body;

  if (status !== 'Aprovado' && status !== 'Devolvido' && status !== 'Em análise') {
    return res.status(400).json({ error: 'Status de avaliação inválido' });
  }

  let reviewedReport: BimonthlyReport | null = null;

  db.update((data) => {
    const idx = data.bimonthlyReports.findIndex((r) => r.id === id);
    if (idx !== -1) {
      data.bimonthlyReports[idx] = {
        ...data.bimonthlyReports[idx],
        status,
        adminComments: adminComments || '',
        reviewedBy: reviewedBy || 'Arthur (Liderança Global)',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reviewedReport = data.bimonthlyReports[idx];
    }
  });

  if (!reviewedReport) return res.status(404).json({ error: 'Relatório não encontrado' });

  db.logAudit(
    reviewerId || 'admin',
    reviewedBy || 'Administrador',
    'AVALIAR_RELATORIO',
    'RELATORIO_BIMESTRAL',
    id,
    `Relatório ${(reviewedReport as BimonthlyReport).regionName} alterado para status "${status}". Parecer: ${adminComments || 'Sem comentários adicionais'}`
  );

  res.json(reviewedReport);
});

// ==================== GEMINI AI ANALYSIS ====================
app.post('/api/ai/analyze-reports', async (req: Request, res: Response) => {
  try {
    const { period, regionId, customPrompt } = req.body;
    const database = db.get();
    let reports = database.bimonthlyReports;

    if (period) {
      reports = reports.filter((r) => r.bimonthlyPeriod === period);
    }
    if (regionId) {
      reports = reports.filter((r) => r.regionId === regionId);
    }

    if (reports.length === 0) {
      return res.status(400).json({
        error: 'Nenhum relatório bimestral encontrado para o escopo selecionado.',
      });
    }

    const analysis = await analyzeReportsWithGemini(reports, database.regions, database.evangelismEvents, {
      period,
      regionId,
      customPrompt,
    });

    db.logAudit('ai-service', 'Gemini AI Assistant', 'ANALISE_INTELIGENTE_RELATORIOS', 'RELATORIOS', 'global', `Análise gerada para ${reports.length} relatórios`);

    res.json(analysis);
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-reports:', err);
    res.status(500).json({ error: 'Erro ao gerar síntese com IA: ' + (err.message || 'Erro interno') });
  }
});

// ==================== CONSOLIDATION MINISTRY ====================
app.get('/api/contacts', (req: Request, res: Response) => {
  const { regionId, status, workerId } = req.query;
  let contacts = db.get().consolidationContacts;

  if (regionId) {
    contacts = contacts.filter((c) => c.regionId === regionId);
  }
  if (status) {
    contacts = contacts.filter((c) => c.status === status);
  }
  if (workerId) {
    contacts = contacts.filter((c) => c.assignedWorkerId === workerId);
  }

  res.json(contacts);
});

app.post('/api/contacts', (req: Request, res: Response) => {
  const {
    regionId,
    evangelismEventId,
    name,
    phone,
    email,
    neighborhood,
    city,
    age,
    gender,
    consentGiven,
    sensitiveDataConsent,
    assignedWorkerId,
    assignedWorkerName,
    prayerRequests,
    authorName,
    authorId,
  } = req.body;

  if (!regionId || !name || !phone) {
    return res.status(400).json({ error: 'Regional, nome e telefone são obrigatórios' });
  }

  if (!consentGiven) {
    return res.status(400).json({ error: 'Em conformidade com a LGPD, o consentimento da pessoa alcançada é obrigatório.' });
  }

  const id = `ct-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const newContact: ConsolidationContact = {
    id,
    regionId,
    evangelismEventId: evangelismEventId || undefined,
    name,
    phone,
    email: email || '',
    neighborhood: neighborhood || '',
    city: city || '',
    age: age ? Number(age) : undefined,
    gender: gender || '',
    consentGiven: true,
    sensitiveDataConsent: !!sensitiveDataConsent,
    assignedWorkerId: assignedWorkerId || undefined,
    assignedWorkerName: assignedWorkerName || undefined,
    status: 'Novo contato',
    prayerRequests: prayerRequests || '',
    activities: [],
    createdAt: now,
    updatedAt: now,
  };

  db.update((data) => {
    data.consolidationContacts.unshift(newContact);
  });

  db.logAudit(
    authorId || 'user',
    authorName || 'Consolidador',
    'CADASTRAR_CONTATO_LGPD',
    'CONSOLIDACAO',
    id,
    `Cadastrado contato com consentimento para consolidação: ${name}`
  );

  res.status(201).json(newContact);
});

app.put('/api/contacts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedContact: ConsolidationContact | null = null;

  db.update((data) => {
    const idx = data.consolidationContacts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      data.consolidationContacts[idx] = {
        ...data.consolidationContacts[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updatedContact = data.consolidationContacts[idx];
    }
  });

  if (!updatedContact) return res.status(404).json({ error: 'Contato não encontrado' });
  res.json(updatedContact);
});

app.post('/api/contacts/:id/activities', (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, notes, workerName, nextActionDate, nextActionDescription, newStatus } = req.body;

  if (!type || !notes) {
    return res.status(400).json({ error: 'Tipo de interação e relato são obrigatórios' });
  }

  let updatedContact: ConsolidationContact | null = null;

  db.update((data) => {
    const idx = data.consolidationContacts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const contact = data.consolidationContacts[idx];
      const activity = {
        id: `act-${Date.now().toString(36)}`,
        contactId: id,
        date: new Date().toISOString(),
        type,
        notes,
        workerName: workerName || 'Voluntário de Consolidação',
        nextActionDate: nextActionDate || undefined,
        nextActionDescription: nextActionDescription || undefined,
      };
      contact.activities.unshift(activity);
      if (newStatus) {
        contact.status = newStatus;
      }
      contact.updatedAt = new Date().toISOString();
      updatedContact = contact;
    }
  });

  if (!updatedContact) return res.status(404).json({ error: 'Contato não encontrado' });
  res.json(updatedContact);
});

// ==================== TRAINING & COURSES ====================
app.get('/api/courses', (req: Request, res: Response) => {
  const data = db.get();
  res.json({
    modules: data.courseModules,
    classes: data.courseClasses,
    enrollments: data.enrollments,
    certificates: data.certificates,
  });
});

app.post('/api/courses/enroll', (req: Request, res: Response) => {
  const { studentName, studentEmail, studentPhone, regionId, classId, moduleTitle, hasPhysicalBook, authorName, authorId } = req.body;
  if (!studentName || !classId) {
    return res.status(400).json({ error: 'Nome do aluno e turma são obrigatórios' });
  }

  const id = `enr-${Date.now().toString(36)}`;
  const newEnrollment = {
    id,
    studentName,
    studentEmail: studentEmail || '',
    studentPhone: studentPhone || '',
    regionId: regionId || 'reg-sp-01',
    classId,
    moduleTitle: moduleTitle || 'Módulo 1 — Evangelismo Sobrenatural',
    status: 'Em andamento' as const,
    attendanceCount: 0,
    totalClasses: 3,
    hasPhysicalBook: !!hasPhysicalBook,
    createdAt: new Date().toISOString(),
  };

  db.update((data) => {
    data.enrollments.unshift(newEnrollment);
  });

  db.logAudit(authorId || 'ensino', authorName || 'Equipe Ensino', 'MATRICULAR_ALUNO', 'CURSO', id, `Matriculado aluno ${studentName} na turma ${moduleTitle}`);
  res.status(201).json(newEnrollment);
});

app.post('/api/courses/certificates', (req: Request, res: Response) => {
  const { studentName, courseTitle, workloadHours, signedBy, regionName, enrollmentId, authorName, authorId } = req.body;
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

  db.update((data) => {
    data.certificates.unshift(certificate);
    if (enrollmentId) {
      const enr = data.enrollments.find((e) => e.id === enrollmentId);
      if (enr) {
        enr.status = 'Concluído';
        enr.certificateId = id;
        enr.completedDate = certificate.completionDate;
      }
    }
  });

  db.logAudit(authorId || 'ensino', authorName || 'Equipe Ensino', 'EMITIR_CERTIFICADO', 'CERTIFICADO', id, `Emitido certificado digital ${code} para ${studentName}`);
  res.status(201).json(certificate);
});

// ==================== CRUSADES & EVENTS ====================
app.get('/api/crusades', (req: Request, res: Response) => {
  res.json(db.get().crusades);
});

app.post('/api/crusades', (req: Request, res: Response) => {
  const {
    title,
    regionId,
    hostCity,
    hostState,
    startDate,
    endDate,
    participatingRegions,
    coordinatorName,
    estimatedAttendance,
    budgetEstimated,
    intercessionLead,
    worshipLead,
    logisticsLead,
    outreachMaterialsLead,
    authorName,
    authorId,
  } = req.body;

  const id = `cru-${Date.now().toString(36)}`;
  const defaultChecklist = [
    { id: 'chk-1', item: 'Vigília de Intercessão Prévia (21 dias)', category: 'Espiritual' as const, completed: false, responsible: intercessionLead || 'Intercessão' },
    { id: 'chk-2', item: 'Autorização Municipal e Alvará de Solo Público', category: 'Logística' as const, completed: false, responsible: logisticsLead || 'Logística' },
    { id: 'chk-3', item: 'Contratação de Palco, Som e Gerador', category: 'Estrutura' as const, completed: false, responsible: coordinatorName || 'Coordenação' },
    { id: 'chk-4', item: 'Folhetos Oficiais e Fichas de Consolidação Impressas', category: 'Evangelismo' as const, completed: false, responsible: outreachMaterialsLead || 'Materiais' },
    { id: 'chk-5', item: 'Divulgação Oficial em Redes Sociais e Rádios', category: 'Comunicação' as const, completed: false, responsible: 'Mídia e Comunicação' },
    { id: 'chk-6', item: 'Acolhimento e Tenda de Consolidação com Água', category: 'Evangelismo' as const, completed: false, responsible: 'Consolidação' },
  ];

  const newCrusade = {
    id,
    title: title || 'Cruzada Evangelística',
    regionId: regionId || 'reg-sp-01',
    hostCity: hostCity || 'Cidade',
    hostState: hostState || 'UF',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date().toISOString().split('T')[0],
    status: 'Planejamento' as const,
    participatingRegions: participatingRegions || [regionId],
    coordinatorName: coordinatorName || 'Coordenador de Eventos',
    estimatedAttendance: Number(estimatedAttendance) || 1000,
    intercessionLead: intercessionLead || 'Sarah Martins',
    worshipLead: worshipLead || 'Louvor Ministerial',
    logisticsLead: logisticsLead || 'Arthur',
    outreachMaterialsLead: outreachMaterialsLead || 'Eduardo Felyx',
    budgetEstimated: Number(budgetEstimated) || 5000,
    checklist: defaultChecklist,
    createdAt: new Date().toISOString(),
  };

  db.update((data) => {
    data.crusades.unshift(newCrusade);
  });

  db.logAudit(authorId || 'admin', authorName || 'Eventos', 'CRIAR_CRUZADA', 'CRUZADA', id, `Cadastrada cruzada ${title}`);
  res.status(201).json(newCrusade);
});

app.put('/api/crusades/:id/checklist/:chkId', (req: Request, res: Response) => {
  const { id, chkId } = req.params;
  const { completed } = req.body;

  let crusade = null;
  db.update((data) => {
    const c = data.crusades.find((item) => item.id === id);
    if (c) {
      const item = c.checklist.find((chk) => chk.id === chkId);
      if (item) {
        item.completed = !!completed;
      }
      crusade = c;
    }
  });

  if (!crusade) return res.status(404).json({ error: 'Cruzada ou item não encontrado' });
  res.json(crusade);
});

// ==================== DEPARTMENTS & TASKS ====================
app.get('/api/departments', (req: Request, res: Response) => {
  const data = db.get();
  res.json({
    departments: data.departments,
    tasks: data.tasks,
  });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { departmentId, title, description, assignedTo, dueDate, priority, authorName, authorId } = req.body;
  if (!departmentId || !title) return res.status(400).json({ error: 'Departamento e título são obrigatórios' });

  const data = db.get();
  const dept = data.departments.find((d) => d.id === departmentId);

  const newTask = {
    id: `tsk-${Date.now().toString(36)}`,
    departmentId,
    departmentName: dept?.name || 'Departamento',
    title,
    description: description || '',
    assignedTo: assignedTo || 'Não atribuído',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    priority: priority || 'Média',
    status: 'Pendente' as const,
    createdAt: new Date().toISOString(),
  };

  db.update((d) => {
    d.tasks.unshift(newTask);
  });

  db.logAudit(authorId || 'admin', authorName || 'Administrador', 'CRIAR_TAREFA', 'TAREFA', newTask.id, `Criada tarefa ${title} para ${dept?.name}`);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, authorName, authorId } = req.body;

  let updatedTask = null;
  db.update((data) => {
    const t = data.tasks.find((item) => item.id === id);
    if (t) {
      t.status = status;
      updatedTask = t;
    }
  });

  if (!updatedTask) return res.status(404).json({ error: 'Tarefa não encontrada' });
  db.logAudit(authorId || 'user', authorName || 'Usuário', 'ATUALIZAR_TAREFA', 'TAREFA', id, `Status da tarefa alterado para ${status}`);
  res.json(updatedTask);
});

// ==================== MEETINGS ====================
app.get('/api/meetings', (req: Request, res: Response) => {
  res.json(db.get().meetings);
});

app.post('/api/meetings', (req: Request, res: Response) => {
  const { title, meetingType, date, time, zoomLink, location, participants, agendaItems, authorName, authorId } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Título e data são obrigatórios' });

  const newMeeting = {
    id: `mtg-${Date.now().toString(36)}`,
    title,
    meetingType: meetingType || 'Reunião Bimestral de Alinhamento Global',
    date,
    time: time || '19:30',
    zoomLink: zoomLink || '',
    location: location || 'Ambiente Virtual Zoom',
    participants: participants || ['Liderança Global'],
    agendaItems: agendaItems || [],
    decisionsRecorded: '',
    minutesText: '',
    actionItems: [],
    status: 'Agendada' as const,
    createdAt: new Date().toISOString(),
  };

  db.update((data) => {
    data.meetings.unshift(newMeeting);
  });

  db.logAudit(authorId || 'admin', authorName || 'Administrador', 'AGENDAR_REUNIAO', 'REUNIAO', newMeeting.id, `Agendada reunião: ${title}`);
  res.status(201).json(newMeeting);
});

app.put('/api/meetings/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedMeeting = null;

  db.update((data) => {
    const idx = data.meetings.findIndex((m) => m.id === id);
    if (idx !== -1) {
      data.meetings[idx] = { ...data.meetings[idx], ...updates };
      updatedMeeting = data.meetings[idx];
    }
  });

  if (!updatedMeeting) return res.status(404).json({ error: 'Reunião não encontrada' });
  res.json(updatedMeeting);
});

// ==================== MEDIA & OFFICIAL BRAND ASSETS ====================
app.get('/api/media', (req: Request, res: Response) => {
  res.json(db.get().mediaAssets);
});

// ==================== FINANCIAL & LEGAL ====================
app.get('/api/financial', (req: Request, res: Response) => {
  res.json(db.get().financialRecords);
});

app.post('/api/financial', (req: Request, res: Response) => {
  const { category, title, description, amount, status, responsibleName, notes, authorName, authorId } = req.body;
  const newRecord = {
    id: `fin-${Date.now().toString(36)}`,
    category: category || 'Orçamento de Evento',
    title: title || 'Registro Administrativo',
    description: description || '',
    amount: Number(amount) || 0,
    status: status || 'Estimado',
    responsibleName: responsibleName || authorName || 'Administração',
    date: new Date().toISOString().split('T')[0],
    notes: notes || '',
  };

  db.update((data) => {
    data.financialRecords.unshift(newRecord);
  });

  db.logAudit(authorId || 'admin', authorName || 'Administrador', 'CRIAR_REGISTRO_FINANCEIRO', 'FINANCEIRO', newRecord.id, `Criado registro financeiro: ${title}`);
  res.status(201).json(newRecord);
});

// ==================== GLOBAL DASHBOARD METRICS ====================
app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
  const { regionId } = req.query;
  const data = db.get();

  let regions = data.regions;
  let members = data.members;
  let evangelisms = data.evangelismEvents;
  let reports = data.bimonthlyReports;
  let contacts = data.consolidationContacts;

  if (regionId) {
    regions = regions.filter((r) => r.id === regionId);
    members = members.filter((m) => m.regionId === regionId);
    evangelisms = evangelisms.filter((e) => e.regionId === regionId);
    reports = reports.filter((r) => r.regionId === regionId);
    contacts = contacts.filter((c) => c.regionId === regionId);
  }

  const totalRegions = regions.length;
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
  const contactsForwardedToChurch = contacts.filter((c) => c.status === 'Encaminhado à igreja' || c.status === 'Acompanhamento concluído').length;

  const reportsSubmitted = reports.filter((r) => r.status === 'Enviado' || r.status === 'Em análise' || r.status === 'Aprovado').length;
  const reportsApproved = reports.filter((r) => r.status === 'Aprovado').length;
  const reportsPendingReview = reports.filter((r) => r.status === 'Enviado' || r.status === 'Em análise').length;

  const totalStudentsEnrolled = data.enrollments.filter((e) => e.status === 'Em andamento' || e.status === 'Concluído').length;

  // Alerts
  const alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string; link?: string }> = [];

  // Check if any region is missing reports
  data.regions.forEach((r) => {
    const hasReport = data.bimonthlyReports.some((rep) => rep.regionId === r.id && rep.bimonthlyPeriod.includes('5º Bimestre'));
    if (!hasReport && r.status === 'active') {
      alerts.push({
        type: 'warning',
        message: `Regional ${r.name} ainda não enviou o Relatório Bimestral do 5º Bimestre / 2026.`,
        link: '/reports',
      });
    }
  });

  if (reportsPendingReview > 0) {
    alerts.push({
      type: 'info',
      message: `Há ${reportsPendingReview} relatório(s) bimestral(is) aguardando parecer da Direção Global.`,
      link: '/reports',
    });
  }

  // Upcoming evangelisms alert
  const upcomingThisWeek = evangelisms.filter((e) => e.status === 'Confirmado');
  if (upcomingThisWeek.length > 0) {
    alerts.push({
      type: 'success',
      message: `${upcomingThisWeek.length} evangelismo(s) confirmado(s) programado(s) para os próximos dias.`,
      link: '/evangelisms',
    });
  }

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
    alerts,
  });
});

// ==================== AUDIT LOGS ====================
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(db.get().auditLogs);
});

// ==================== FRONTEND & VITE DEV SERVER ====================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SEMEADORES DE FOGO GLOBAL] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
});
