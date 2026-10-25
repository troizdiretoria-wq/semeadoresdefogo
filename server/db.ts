import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin_global' | 'coordenador_regional' | 'lider_evangelismo' | 'equipe_consolidacao' | 'equipe_ensino' | 'equipe_midia';
  regionId: string | null;
  phone: string;
  status: 'active' | 'inactive';
  departmentId?: string;
  avatar?: string;
  createdAt: string;
}

export interface Region {
  id: string;
  name: string;
  state: string;
  city: string;
  sponsoringChurch: string;
  responsiblePastor: string;
  coordinatorName: string;
  contactEmail: string;
  contactPhone: string;
  memberCount: number;
  implantationDate: string;
  plannedFrequency: 'semanal' | 'quinzenal';
  status: 'active' | 'implanting' | 'paused';
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  regionId: string;
  email: string;
  phone: string;
  roleInMinistry: string;
  baptismInHolySpirit: boolean;
  trainingCompleted: boolean;
  active: boolean;
  joinDate: string;
}

export interface EvangelismEvent {
  id: string;
  regionId: string;
  name: string;
  dateTime: string;
  location: string;
  address: string;
  leaderId: string;
  leaderName: string;
  actionType: 'Praça Pública' | 'Hospital' | 'Universitário' | 'Impacto nas Ruas' | 'Comunidade' | 'Semáforo / Ponto de Ônibus' | 'Cruzada Local' | 'Outro';
  expectedParticipants: number;
  confirmedMembers: string[];
  notes: string;
  status: 'Planejado' | 'Confirmado' | 'Realizado' | 'Cancelado';
  // Post-event execution results
  actualParticipants?: number;
  estimatedReached?: number;
  contactsCollected?: number;
  generalReport?: string;
  positiveHighlights?: string;
  difficultiesFound?: string;
  testimonies?: string;
  photos?: string[];
  suggestions?: string;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
}

export interface BimonthlyReport {
  id: string;
  regionId: string;
  regionName: string;
  coordinatorId: string;
  coordinatorName: string;
  bimonthlyPeriod: string; // e.g. "5º Bimestre / 2026 (Set/Out)"
  year: number;
  status: 'Rascunho' | 'Enviado' | 'Em análise' | 'Aprovado' | 'Devolvido';
  // Section 1 - Identification
  submissionDate?: string;
  // Section 2 - Activities
  evangelismsCount: number;
  frequencyObserved: string;
  locationsReached: string;
  totalParticipants: number;
  activitiesDescription: string;
  // Section 3 - Results
  peopleReached: number;
  contactsCollected: number;
  contactsInConsolidation: number;
  forwardedToChurch: number;
  testimonies: string;
  // Section 4 - Evaluation
  strengths: string;
  difficulties: string;
  regionalNeeds: string;
  proposedImprovements: string;
  nextPeriodPlanning: string;
  // Section 5 - Attachments
  photos: string[];
  documentsNotes: string;
  // Administrative feedback
  adminComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpActivity {
  id: string;
  contactId: string;
  date: string;
  type: 'WhatsApp' | 'Ligação' | 'Visita' | 'Oração' | 'Convite Culto';
  notes: string;
  workerName: string;
  nextActionDate?: string;
  nextActionDescription?: string;
}

export interface ConsolidationContact {
  id: string;
  regionId: string;
  evangelismEventId?: string;
  name: string;
  phone: string;
  email?: string;
  neighborhood: string;
  city: string;
  age?: number;
  gender?: string;
  consentGiven: boolean; // LGPD
  sensitiveDataConsent: boolean; // LGPD
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  status: 'Novo contato' | 'Aguardando 1º contato' | 'Em acompanhamento' | 'Encaminhado à igreja' | 'Acompanhamento concluído' | 'Sem interesse';
  prayerRequests: string;
  churchForwardedTo?: string;
  activities: FollowUpActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  physicalBookRequired: boolean;
  totalHours: number;
  topics: string[];
}

export interface CourseClass {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  quarter: string;
  zoomLink: string;
  scheduleDescription: string;
  instructorName: string;
  startDate: string;
  endDate: string;
  status: 'Inscrições Abertas' | 'Em Andamento' | 'Concluído';
}

export interface Enrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  regionId: string;
  classId: string;
  moduleTitle: string;
  status: 'Em andamento' | 'Concluído' | 'Trancado';
  attendanceCount: number;
  totalClasses: number;
  hasPhysicalBook: boolean;
  certificateId?: string;
  completedDate?: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  workloadHours: number;
  issuer: string;
  signedBy: string;
  regionName: string;
}

export interface CrusadeChecklistItem {
  id: string;
  item: string;
  category: 'Espiritual' | 'Logística' | 'Estrutura' | 'Evangelismo' | 'Comunicação';
  completed: boolean;
  responsible: string;
}

export interface Crusade {
  id: string;
  title: string;
  regionId: string;
  hostCity: string;
  hostState: string;
  startDate: string;
  endDate: string;
  status: 'Planejamento' | 'Confirmada' | 'Em andamento' | 'Realizada';
  participatingRegions: string[];
  coordinatorName: string;
  estimatedAttendance: number;
  intercessionLead: string;
  worshipLead: string;
  logisticsLead: string;
  outreachMaterialsLead: string;
  budgetEstimated: number;
  checklist: CrusadeChecklistItem[];
  resultsSummary?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  number: number;
  name: string;
  description: string;
  coordinatorName: string;
  objectives: string[];
  memberCount: number;
  status: 'Ativo' | 'Em estruturação';
}

export interface Task {
  id: string;
  departmentId: string;
  departmentName: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'Pendente' | 'Em andamento' | 'Em revisão' | 'Concluído';
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  meetingType: 'Reunião Bimestral de Alinhamento Global' | 'Alinhamento Regional' | 'Conselho Ministerial';
  date: string;
  time: string;
  zoomLink: string;
  location: string;
  participants: string[];
  agendaItems: string[];
  decisionsRecorded: string;
  minutesText: string;
  actionItems: Array<{ task: string; responsible: string; deadline: string; completed: boolean }>;
  status: 'Agendada' | 'Realizada' | 'Cancelada';
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  category: 'Logotipos e Identidade' | 'Camisetas e Bonés' | 'Folhetos e Panfletos' | 'Redes Sociais' | 'Documentos Oficiais';
  description: string;
  fileFormat: string;
  fileSize: string;
  downloadUrl: string;
  previewUrl?: string;
  isOfficialApproved: boolean;
  uploadedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface FinancialRecord {
  id: string;
  category: 'Orçamento de Evento' | 'Custeio de Implantação' | 'Logística e Viagem' | 'Patrimônio Digital / Marca';
  title: string;
  description: string;
  amount: number;
  status: 'Estimado' | 'Aprovado' | 'Em Análise';
  responsibleName: string;
  date: string;
  notes: string;
}

export interface DatabaseSchema {
  users: User[];
  regions: Region[];
  members: Member[];
  evangelismEvents: EvangelismEvent[];
  bimonthlyReports: BimonthlyReport[];
  consolidationContacts: ConsolidationContact[];
  courseModules: CourseModule[];
  courseClasses: CourseClass[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  crusades: Crusade[];
  departments: Department[];
  tasks: Task[];
  meetings: Meeting[];
  mediaAssets: MediaAsset[];
  auditLogs: AuditLog[];
  financialRecords: FinancialRecord[];
}

// Initial Seed Data respecting the strategic meeting
function getInitialSeed(): DatabaseSchema {
  const now = new Date().toISOString();

  const regions: Region[] = [
    {
      id: 'reg-sp-01',
      name: 'São Paulo — Capital (Sede)',
      state: 'SP',
      city: 'São Paulo',
      sponsoringChurch: 'Comunidade Apostólica Rhema',
      responsiblePastor: 'Pr. Samuel Oliveira',
      coordinatorName: 'Lucas Moreira',
      contactEmail: 'sp.sede@semeadoresdefogo.org',
      contactPhone: '(11) 98765-4321',
      memberCount: 42,
      implantationDate: '2025-03-10',
      plannedFrequency: 'semanal',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'reg-mg-01',
      name: 'Minas Gerais — Belo Horizonte',
      state: 'MG',
      city: 'Belo Horizonte',
      sponsoringChurch: 'Igreja Batista da Paz',
      responsiblePastor: 'Pr. Marcos Silva',
      coordinatorName: 'Diogo Alencar',
      contactEmail: 'bh.mg@semeadoresdefogo.org',
      contactPhone: '(31) 97654-3210',
      memberCount: 28,
      implantationDate: '2025-07-15',
      plannedFrequency: 'semanal',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'reg-rj-01',
      name: 'Rio de Janeiro — Capital',
      state: 'RJ',
      city: 'Rio de Janeiro',
      sponsoringChurch: 'Igreja Bíblica Graça Plena',
      responsiblePastor: 'Pra. Aline Santos',
      coordinatorName: 'Gabriel Vianna',
      contactEmail: 'rj@semeadoresdefogo.org',
      contactPhone: '(21) 96543-2109',
      memberCount: 22,
      implantationDate: '2025-11-20',
      plannedFrequency: 'quinzenal',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'reg-pr-01',
      name: 'Paraná — Curitiba',
      state: 'PR',
      city: 'Curitiba',
      sponsoringChurch: 'Comunidade Cristã Central',
      responsiblePastor: 'Pr. Josué Mendes',
      coordinatorName: 'Renan Ribeiro',
      contactEmail: 'curitiba.pr@semeadoresdefogo.org',
      contactPhone: '(41) 95432-1098',
      memberCount: 16,
      implantationDate: '2026-02-01',
      plannedFrequency: 'quinzenal',
      status: 'implanting',
      createdAt: now,
    },
  ];

  const users: User[] = [
    {
      id: 'user-arthur',
      name: 'Arthur',
      email: 'arthursantosprojetos@gmail.com',
      role: 'admin_global',
      regionId: null,
      phone: '(11) 99999-0001',
      status: 'active',
      departmentId: 'dep-6',
      createdAt: now,
    },
    {
      id: 'user-lucas',
      name: 'Lucas Moreira',
      email: 'lucas.moreira@semeadoresdefogo.org',
      role: 'admin_global',
      regionId: 'reg-sp-01',
      phone: '(11) 99999-0002',
      status: 'active',
      departmentId: 'dep-1',
      createdAt: now,
    },
    {
      id: 'user-eduardo',
      name: 'Eduardo Felyx',
      email: 'eduardo.felyx@semeadoresdefogo.org',
      role: 'equipe_midia',
      regionId: null,
      phone: '(11) 99999-0003',
      status: 'active',
      departmentId: 'dep-5',
      createdAt: now,
    },
    {
      id: 'user-coord-mg',
      name: 'Diogo Alencar',
      email: 'coord.mg@semeadoresdefogo.org',
      role: 'coordenador_regional',
      regionId: 'reg-mg-01',
      phone: '(31) 98888-1111',
      status: 'active',
      departmentId: 'dep-1',
      createdAt: now,
    },
    {
      id: 'user-coord-rj',
      name: 'Gabriel Vianna',
      email: 'coord.rj@semeadoresdefogo.org',
      role: 'coordenador_regional',
      regionId: 'reg-rj-01',
      phone: '(21) 97777-2222',
      status: 'active',
      departmentId: 'dep-1',
      createdAt: now,
    },
    {
      id: 'user-lider-evang',
      name: 'Pb. Thiago Rocha',
      email: 'thiago.evang@semeadoresdefogo.org',
      role: 'lider_evangelismo',
      regionId: 'reg-sp-01',
      phone: '(11) 96666-3333',
      status: 'active',
      departmentId: 'dep-2',
      createdAt: now,
    },
    {
      id: 'user-consol-sp',
      name: 'Sarah Martins',
      email: 'sarah.consolida@semeadoresdefogo.org',
      role: 'equipe_consolidacao',
      regionId: 'reg-sp-01',
      phone: '(11) 95555-4444',
      status: 'active',
      departmentId: 'dep-4',
      createdAt: now,
    },
    {
      id: 'user-ensino-prof',
      name: 'Prof. Daniel Batista',
      email: 'ensino@semeadoresdefogo.org',
      role: 'equipe_ensino',
      regionId: null,
      phone: '(11) 94444-5555',
      status: 'active',
      departmentId: 'dep-3',
      createdAt: now,
    },
  ];

  const members: Member[] = [
    {
      id: 'mem-1',
      name: 'Lucas Moreira',
      regionId: 'reg-sp-01',
      email: 'lucas.moreira@semeadoresdefogo.org',
      phone: '(11) 99999-0002',
      roleInMinistry: 'Diretor Ministerial & Coordenador SP',
      baptismInHolySpirit: true,
      trainingCompleted: true,
      active: true,
      joinDate: '2025-01-10',
    },
    {
      id: 'mem-2',
      name: 'Pb. Thiago Rocha',
      regionId: 'reg-sp-01',
      email: 'thiago.evang@semeadoresdefogo.org',
      phone: '(11) 96666-3333',
      roleInMinistry: 'Líder de Ação de Rua',
      baptismInHolySpirit: true,
      trainingCompleted: true,
      active: true,
      joinDate: '2025-03-12',
    },
    {
      id: 'mem-3',
      name: 'Sarah Martins',
      regionId: 'reg-sp-01',
      email: 'sarah.consolida@semeadoresdefogo.org',
      phone: '(11) 95555-4444',
      roleInMinistry: 'Coordenadora de Consolidação SP',
      baptismInHolySpirit: true,
      trainingCompleted: true,
      active: true,
      joinDate: '2025-04-01',
    },
    {
      id: 'mem-4',
      name: 'Felipe Santana',
      regionId: 'reg-sp-01',
      email: 'felipe.s@gmail.com',
      phone: '(11) 94321-8765',
      roleInMinistry: 'Semeador de Rua e Intercessão',
      baptismInHolySpirit: true,
      trainingCompleted: true,
      active: true,
      joinDate: '2025-06-15',
    },
    {
      id: 'mem-5',
      name: 'Diogo Alencar',
      regionId: 'reg-mg-01',
      email: 'coord.mg@semeadoresdefogo.org',
      phone: '(31) 98888-1111',
      roleInMinistry: 'Coordenador Regional MG',
      baptismInHolySpirit: true,
      trainingCompleted: true,
      active: true,
      joinDate: '2025-07-15',
    },
    {
      id: 'mem-6',
      name: 'Priscila Duarte',
      regionId: 'reg-mg-01',
      email: 'priscila.d@gmail.com',
      phone: '(31) 97711-2233',
      roleInMinistry: 'Equipe de Consolidação MG',
      baptismInHolySpirit: true,
      trainingCompleted: true,
      active: true,
      joinDate: '2025-08-01',
    },
    {
      id: 'mem-7',
      name: 'Gabriel Vianna',
      regionId: 'reg-rj-01',
      email: 'coord.rj@semeadoresdefogo.org',
      phone: '(21) 97777-2222',
      roleInMinistry: 'Coordenador Regional RJ',
      baptismInHolySpirit: true,
      trainingCompleted: true,
      active: true,
      joinDate: '2025-11-20',
    },
    {
      id: 'mem-8',
      name: 'Renan Ribeiro',
      regionId: 'reg-pr-01',
      email: 'curitiba.pr@semeadoresdefogo.org',
      phone: '(41) 95432-1098',
      roleInMinistry: 'Coordenador Implantação PR',
      baptismInHolySpirit: true,
      trainingCompleted: false,
      active: true,
      joinDate: '2026-02-01',
    },
  ];

  const evangelismEvents: EvangelismEvent[] = [
    {
      id: 'ev-sp-01',
      regionId: 'reg-sp-01',
      name: 'Impacto Evangelístico Praça da Sé & Centro Histórico',
      dateTime: '2026-10-04T15:00:00',
      location: 'Praça da Sé — Centro',
      address: 'Praça da Sé, s/n - Centro Histórico, São Paulo - SP',
      leaderId: 'user-lider-evang',
      leaderName: 'Pb. Thiago Rocha',
      actionType: 'Praça Pública',
      expectedParticipants: 25,
      confirmedMembers: ['mem-1', 'mem-2', 'mem-3', 'mem-4'],
      notes: 'Equipes divididas em evangelismo corpo a corpo e intercessão na tenda central.',
      status: 'Realizado',
      actualParticipants: 28,
      estimatedReached: 180,
      contactsCollected: 24,
      generalReport: 'Ação com forte manifestação do Espírito Santo. Muitos transeuntes pararam para receber oração e ouvir o Evangelho. Nenhum incidente com autoridades locais.',
      positiveHighlights: 'Ótima adesão dos semeadores jovens e excelente recepção das pessoas.',
      difficultiesFound: 'Barulho elevado de tráfego em determinados pontos; recomendável reforçar som portátil.',
      testimonies: 'Um jovem desempregado há 8 meses aceitou a Cristo em lágrimas após oração por restituição espiritual.',
      photos: [],
      suggestions: 'Levar mais folhetos específicos para dependentes químicos que circulam no entorno.',
      completedAt: '2026-10-04T18:30:00',
      completedBy: 'Pb. Thiago Rocha',
      createdAt: '2026-09-28T10:00:00',
    },
    {
      id: 'ev-sp-02',
      regionId: 'reg-sp-01',
      name: 'Ação Evangelística Hospital das Clínicas & Entorno',
      dateTime: '2026-10-11T09:30:00',
      location: 'Portaria de Visitantes HC',
      address: 'Av. Dr. Enéas Carvalho de Aguiar, 255 - Cerqueira César, São Paulo - SP',
      leaderId: 'user-lider-evang',
      leaderName: 'Pb. Thiago Rocha',
      actionType: 'Hospital',
      expectedParticipants: 15,
      confirmedMembers: ['mem-2', 'mem-3', 'mem-4'],
      notes: 'Acolhimento de familiares de pacientes internados com café, água e oração de conforto.',
      status: 'Realizado',
      actualParticipants: 16,
      estimatedReached: 95,
      contactsCollected: 18,
      generalReport: 'Evangelismo de grande impacto emocional. Familiares receptivos e abertos à oração e leitura bíblica.',
      positiveHighlights: 'Respeito estrito às normas hospitalares; equipe de apoio foi exemplar.',
      difficultiesFound: 'Espaço restrito para conversar sem obstruir a circulação de macas.',
      testimonies: 'Mãe de paciente na UTI recebeu oração e entregou a vida a Cristo na sala de espera externa.',
      photos: [],
      suggestions: 'Providenciar cartões com versículos de conforto e QR Code da consolidação.',
      completedAt: '2026-10-11T12:00:00',
      completedBy: 'Pb. Thiago Rocha',
      createdAt: '2026-10-01T14:00:00',
    },
    {
      id: 'ev-sp-03',
      regionId: 'reg-sp-01',
      name: 'Invasão de Fogo — Estação Brás e Trem Metropolitano',
      dateTime: '2026-10-18T16:00:00',
      location: 'Estação Brás - Acesso Praça Agente Cícero',
      address: 'Praça Agente Cícero, s/n - Brás, São Paulo - SP',
      leaderId: 'user-lider-evang',
      leaderName: 'Pb. Thiago Rocha',
      actionType: 'Impacto nas Ruas',
      expectedParticipants: 30,
      confirmedMembers: ['mem-1', 'mem-2', 'mem-3', 'mem-4'],
      notes: 'Distribuição de água mineral e folhetos aos trabalhadores no retorno do expediente.',
      status: 'Confirmado',
      createdAt: '2026-10-08T11:00:00',
    },
    {
      id: 'ev-mg-01',
      regionId: 'reg-mg-01',
      name: 'Evangelismo Praça da Estação BH',
      dateTime: '2026-10-05T14:30:00',
      location: 'Praça da Estação',
      address: 'Praça Rui Barbosa - Centro, Belo Horizonte - MG',
      leaderId: 'user-coord-mg',
      leaderName: 'Diogo Alencar',
      actionType: 'Praça Pública',
      expectedParticipants: 20,
      confirmedMembers: ['mem-5', 'mem-6'],
      notes: 'Pintura facial com mensagens bíblicas para crianças e evangelismo pessoal aos pais.',
      status: 'Realizado',
      actualParticipants: 22,
      estimatedReached: 140,
      contactsCollected: 19,
      generalReport: 'Grande movimento na praça. As famílias receberam muito bem as orações e o atendimento.',
      positiveHighlights: 'A equipe de louvor acústico atraiu a atenção de dezenas de jovens skatistas.',
      difficultiesFound: 'Calor excessivo no período da tarde; faltou água mineral para a equipe.',
      testimonies: 'Dois estudantes universitários que passavam a caminho do metrô aceitaram oração e pediram visita.',
      photos: [],
      suggestions: 'Adquirir gazebo ou guarda-sol ministerial para proteção do sol.',
      completedAt: '2026-10-05T17:30:00',
      completedBy: 'Diogo Alencar',
      createdAt: '2026-09-29T16:00:00',
    },
    {
      id: 'ev-rj-01',
      regionId: 'reg-rj-01',
      name: 'Evangelismo Calçadão de Madureira',
      dateTime: '2026-10-10T10:00:00',
      location: 'Parque e Calçadão de Madureira',
      address: 'R. Min. Edgard Romero, s/n - Madureira, Rio de Janeiro - RJ',
      leaderId: 'user-coord-rj',
      leaderName: 'Gabriel Vianna',
      actionType: 'Comunidade',
      expectedParticipants: 18,
      confirmedMembers: ['mem-7'],
      notes: 'Ação conjunta com membros da igreja local patrocinadora.',
      status: 'Realizado',
      actualParticipants: 18,
      estimatedReached: 110,
      contactsCollected: 14,
      generalReport: 'Ação evangelística no polo comercial de Madureira. Equipe motivada.',
      positiveHighlights: 'Integração perfeita com a liderança da igreja local.',
      difficultiesFound: 'Fiscalização comercial pediu remanejamento da tenda para área interna do parque.',
      testimonies: 'Comerciante local recebeu oração e relatou alívio imediato de crise de pânico.',
      photos: [],
      suggestions: 'Emitir autorização formal antecipada junto à administração do parque.',
      completedAt: '2026-10-10T13:30:00',
      completedBy: 'Gabriel Vianna',
      createdAt: '2026-10-02T09:00:00',
    },
  ];

  const bimonthlyReports: BimonthlyReport[] = [
    {
      id: 'rep-sp-b5-2026',
      regionId: 'reg-sp-01',
      regionName: 'São Paulo — Capital (Sede)',
      coordinatorId: 'user-lucas',
      coordinatorName: 'Lucas Moreira',
      bimonthlyPeriod: '5º Bimestre / 2026 (Set/Out)',
      year: 2026,
      status: 'Enviado',
      submissionDate: '2026-10-15T18:00:00',
      evangelismsCount: 8,
      frequencyObserved: 'Semanal rigorosa (todas as semanas de Setembro e Outubro)',
      locationsReached: 'Praça da Sé, Estação Brás, Hospital das Clínicas, Largo da Concórdia e Avenida Paulista.',
      totalParticipants: 42,
      activitiesDescription: 'Realizamos 8 evangelismos no bimestre, intercalando praças de grande circulação, portas de hospitais e paradas de transporte público. Houve ênfase na ministração de cura e oração pelos enfermos.',
      peopleReached: 1250,
      contactsCollected: 148,
      contactsInConsolidation: 96,
      forwardedToChurch: 32,
      testimonies: 'Múltiplos testemunhos de cura e reconciliações com Deus. Um jovem dependente químico foi acolhido e encaminhado para centro de apoio cristão conveniado.',
      strengths: 'Constância semanal dos semeadores; forte intercessão prévia às ações; crescimento da equipe jovem; padronização dos coletes e crachás.',
      difficulties: 'Equipe de consolidação sobrecarregada com o volume alto de contatos; necessidade de treinar novos consolidadores; desgaste de transporte em locais distantes.',
      regionalNeeds: 'Reforço de material didático dos 4 módulos físicos; treinamento específico de consolidação via WhatsApp; verba para lanche comunitário pós-ação.',
      proposedImprovements: 'Implementar escalas rotativas na consolidação para que nenhum voluntário fique com mais de 5 contatos simultâneos.',
      nextPeriodPlanning: 'Organizar a primeira Cruzada Jovem na Zona Leste e intensificar os evangelismos natalinos no mês de Dezembro.',
      photos: [],
      documentsNotes: 'Planilha detalhada de contatos e atas de intercessão arquivadas na regional.',
      createdAt: '2026-10-12T10:00:00',
      updatedAt: '2026-10-15T18:00:00',
    },
    {
      id: 'rep-mg-b5-2026',
      regionId: 'reg-mg-01',
      regionName: 'Minas Gerais — Belo Horizonte',
      coordinatorId: 'user-coord-mg',
      coordinatorName: 'Diogo Alencar',
      bimonthlyPeriod: '5º Bimestre / 2026 (Set/Out)',
      year: 2026,
      status: 'Aprovado',
      submissionDate: '2026-10-14T11:00:00',
      evangelismsCount: 7,
      frequencyObserved: 'Semanal (com 1 cancelamento devido a tempestade em Setembro)',
      locationsReached: 'Praça da Estação, Parque Municipal, Praça Sete e Hospital João XXIII.',
      totalParticipants: 28,
      activitiesDescription: 'Evangelismo dinâmico com louvor acústico e abordagem individual. Foco nos jovens e famílias que frequentam as praças centrais de Belo Horizonte.',
      peopleReached: 820,
      contactsCollected: 92,
      contactsInConsolidation: 64,
      forwardedToChurch: 21,
      testimonies: 'Três famílias inteiras integradas aos cultos de domingo da igreja patrocinadora local.',
      strengths: 'Forte presença de jovens; excelente suporte da liderança pastoral da Igreja Batista da Paz.',
      difficulties: 'Equipamento de som portátil avariado durante a chuva; falta de mais exemplares do Módulo 1 físico.',
      regionalNeeds: 'Substituição de caixa amplificada e envio de 30 kits de apostilas dos Semeadores.',
      proposedImprovements: 'Estruturar o Ministério de Consolidação em duplas fixas de oração.',
      nextPeriodPlanning: 'Expansão de evangelismos para a região metropolitana (Contagem e Betim).',
      photos: [],
      documentsNotes: 'Comprovantes de frequência e registros anexados.',
      adminComments: 'Relatório consistente e dados bem documentados. Parabéns à regional MG pelo avanço! Verba de apoio para a caixa de som será avaliada no comitê de logística.',
      reviewedBy: 'Arthur',
      reviewedAt: '2026-10-15T14:20:00',
      createdAt: '2026-10-10T15:00:00',
      updatedAt: '2026-10-15T14:20:00',
    },
    {
      id: 'rep-rj-b5-2026',
      regionId: 'reg-rj-01',
      regionName: 'Rio de Janeiro — Capital',
      coordinatorId: 'user-coord-rj',
      coordinatorName: 'Gabriel Vianna',
      bimonthlyPeriod: '5º Bimestre / 2026 (Set/Out)',
      year: 2026,
      status: 'Em análise',
      submissionDate: '2026-10-16T10:30:00',
      evangelismsCount: 4,
      frequencyObserved: 'Quinzenal conforme determinado para o porte da regional',
      locationsReached: 'Calçadão de Madureira, Praça Saens Peña (Tijuca) e entorno do Maracanã.',
      totalParticipants: 22,
      activitiesDescription: 'Ações quinzenais aos sábados de manhã com distribuição de água e literaturas evangelísticas.',
      peopleReached: 510,
      contactsCollected: 58,
      contactsInConsolidation: 38,
      forwardedToChurch: 12,
      testimonies: 'Jovem universitário que havia abandonado a fé pediu reconciliação e agora frequenta os encontros de estudo bíblico.',
      strengths: 'Pontualidade e zelo com a imagem institucional dos Semeadores.',
      difficulties: 'Necessidade de maior número de semeadores do sexo feminino para atendimento a mulheres na consolidação.',
      regionalNeeds: 'Treinamento de novas semeadoras e folhetos voltados para estudantes universitários.',
      proposedImprovements: 'Parceria com grupo de oração feminino da igreja patrocinadora.',
      nextPeriodPlanning: 'Aumentar a frequência para semanal a partir de 2027.',
      photos: [],
      documentsNotes: 'Registros fotográficos anexados no drive regional.',
      createdAt: '2026-10-15T19:00:00',
      updatedAt: '2026-10-16T10:30:00',
    },
  ];

  const consolidationContacts: ConsolidationContact[] = [
    {
      id: 'ct-01',
      regionId: 'reg-sp-01',
      evangelismEventId: 'ev-sp-01',
      name: 'Matheus Henrique Silveira',
      phone: '(11) 98123-4567',
      email: 'matheus.silveira@email.com',
      neighborhood: 'Sé',
      city: 'São Paulo',
      age: 24,
      gender: 'Masculino',
      consentGiven: true,
      sensitiveDataConsent: true,
      assignedWorkerId: 'mem-3',
      assignedWorkerName: 'Sarah Martins',
      status: 'Em acompanhamento',
      prayerRequests: 'Oração por direcionamento profissional e libertação de vícios.',
      churchForwardedTo: 'Comunidade Apostólica Rhema (Zona Sul)',
      activities: [
        {
          id: 'act-01',
          contactId: 'ct-01',
          date: '2026-10-06T14:00:00',
          type: 'WhatsApp',
          notes: 'Primeiro contato realizado via mensagem oficial de acolhimento. Matheus agradeceu a oração na praça.',
          workerName: 'Sarah Martins',
          nextActionDate: '2026-10-09T19:00:00',
          nextActionDescription: 'Ligar para orar juntos no início da noite.',
        },
        {
          id: 'act-02',
          contactId: 'ct-01',
          date: '2026-10-09T19:15:00',
          type: 'Ligação',
          notes: 'Conversa de 15 minutos. Matheus expressou desejo de visitar o culto de jovens no sábado.',
          workerName: 'Sarah Martins',
          nextActionDate: '2026-10-17T18:00:00',
          nextActionDescription: 'Recepcioná-lo no culto de jovens.',
        },
      ],
      createdAt: '2026-10-04T18:00:00',
      updatedAt: '2026-10-09T19:30:00',
    },
    {
      id: 'ct-02',
      regionId: 'reg-sp-01',
      evangelismEventId: 'ev-sp-02',
      name: 'Luciana Aparecida Carvalho',
      phone: '(11) 97234-5678',
      email: 'luciana.carvalho@email.com',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      age: 42,
      gender: 'Feminino',
      consentGiven: true,
      sensitiveDataConsent: true,
      assignedWorkerId: 'mem-3',
      assignedWorkerName: 'Sarah Martins',
      status: 'Encaminhado à igreja',
      prayerRequests: 'Oração pela cirurgia da mãe internada no HC e paz para o coração da família.',
      churchForwardedTo: 'Comunidade Apostólica Rhema (Pinheiros)',
      activities: [
        {
          id: 'act-03',
          contactId: 'ct-02',
          date: '2026-10-12T10:00:00',
          type: 'WhatsApp',
          notes: 'Envio de mensagem com versículo do Salmo 91 e acompanhamento da internação.',
          workerName: 'Sarah Martins',
        },
        {
          id: 'act-04',
          contactId: 'ct-02',
          date: '2026-10-14T16:00:00',
          type: 'Visita',
          notes: 'Visita breve na sala de espera para entrega de devocional e oração presencial. Luciana esteve no culto de quarta-feira.',
          workerName: 'Sarah Martins',
        },
      ],
      createdAt: '2026-10-11T12:00:00',
      updatedAt: '2026-10-14T17:00:00',
    },
    {
      id: 'ct-03',
      regionId: 'reg-mg-01',
      evangelismEventId: 'ev-mg-01',
      name: 'Rodrigo Barbosa Guimarães',
      phone: '(31) 98345-6789',
      email: 'rodrigo.bg@email.com',
      neighborhood: 'Floresta',
      city: 'Belo Horizonte',
      age: 21,
      gender: 'Masculino',
      consentGiven: true,
      sensitiveDataConsent: true,
      assignedWorkerId: 'mem-6',
      assignedWorkerName: 'Priscila Duarte',
      status: 'Aguardando 1º contato',
      prayerRequests: 'Oração por restauração nos estudos e relacionamento familiar.',
      activities: [],
      createdAt: '2026-10-05T17:00:00',
      updatedAt: '2026-10-05T17:00:00',
    },
  ];

  const courseModules: CourseModule[] = [
    {
      id: 'mod-1',
      moduleNumber: 1,
      title: 'Módulo 1 — Evangelismo Sobrenatural',
      description: 'Fundamentos bíblicos da Grande Comissão, proclamação apostólica, manifestação do poder de Deus no dia a dia e abordagem nas ruas sem timidez.',
      physicalBookRequired: true,
      totalHours: 16,
      topics: [
        'A Urgência dos Campos Brancos',
        'Cura e Palavra de Conhecimento na Abordagem Urbana',
        'Rompendo o Medo dos Homens',
        'Ética e Respeito no Evangelismo Público',
      ],
    },
    {
      id: 'mod-2',
      moduleNumber: 2,
      title: 'Módulo 2 — Unção do Espírito',
      description: 'O que é a unção bíblica, como preservá-la, consagração ministerial, pureza e poder para o testemunho eficaz.',
      physicalBookRequired: true,
      totalHours: 16,
      topics: [
        'O Preço do Óleo: Vida de Oração Secreta',
        'O Fruto do Espírito como Proteção da Unção',
        'Intercessão Profética pelos Perdidos',
        'Resistência Espiritual nas Grandes Cidades',
      ],
    },
    {
      id: 'mod-3',
      moduleNumber: 3,
      title: 'Módulo 3 — Dons do Espírito',
      description: 'Estudo aprofundado dos 9 dons do Espírito Santo (1 Coríntios 12) em operação direta no campo missionário e na ministração de vidas.',
      physicalBookRequired: true,
      totalHours: 16,
      topics: [
        'Dons de Revelação: Palavra de Sabedoria e Conhecimento',
        'Dons de Poder: Fé Operosa e Dons de Curar',
        'Dons de Inspiração: Profecia e Discernimento de Espíritos',
        'Operação dos Dons com Amor e Ordem',
      ],
    },
    {
      id: 'mod-4',
      moduleNumber: 4,
      title: 'Módulo 4 — Paternidade Espiritual',
      description: 'Discipulado verdadeiro, conselho pastoral, autoridade bíblica, honra, envio ministerial e multiplicação de líderes evangelísticos.',
      physicalBookRequired: true,
      totalHours: 16,
      topics: [
        'O Coração de Pai e o Resgate dos Órfãos de Alma',
        'Submissão, Aliança e Cobertura Ministerial',
        'Multiplicação de Novos Semeadores de Fogo',
        'Implantação de Novas Regionais com Legitimidade',
      ],
    },
  ];

  const courseClasses: CourseClass[] = [
    {
      id: 'cls-2026-t4',
      moduleId: 'mod-1',
      moduleTitle: 'Módulo 1 — Evangelismo Sobrenatural',
      title: 'Turma Nacional Alpha — 4º Trimestre / 2026',
      quarter: 'Out-Dez / 2026',
      zoomLink: 'https://zoom.us/j/98723456789',
      scheduleDescription: 'Aulas mensais aos sábados, das 09h às 12h via Zoom',
      instructorName: 'Lucas Moreira & Prof. Daniel Batista',
      startDate: '2026-10-24',
      endDate: '2026-12-19',
      status: 'Em Andamento',
    },
    {
      id: 'cls-2027-t1',
      moduleId: 'mod-2',
      moduleTitle: 'Módulo 2 — Unção do Espírito',
      title: 'Turma Nacional Beta — 1º Trimestre / 2027',
      quarter: 'Jan-Mar / 2027',
      zoomLink: 'https://zoom.us/j/98799887766',
      scheduleDescription: 'Aulas mensais aos sábados, das 09h às 12h via Zoom',
      instructorName: 'Prof. Daniel Batista',
      startDate: '2027-01-16',
      endDate: '2027-03-20',
      status: 'Inscrições Abertas',
    },
  ];

  const enrollments: Enrollment[] = [
    {
      id: 'enr-01',
      studentName: 'Felipe Santana',
      studentEmail: 'felipe.s@gmail.com',
      studentPhone: '(11) 94321-8765',
      regionId: 'reg-sp-01',
      classId: 'cls-2026-t4',
      moduleTitle: 'Módulo 1 — Evangelismo Sobrenatural',
      status: 'Em andamento',
      attendanceCount: 1,
      totalClasses: 3,
      hasPhysicalBook: true,
      createdAt: '2026-09-20T10:00:00',
    },
    {
      id: 'enr-02',
      studentName: 'Priscila Duarte',
      studentEmail: 'priscila.d@gmail.com',
      studentPhone: '(31) 97711-2233',
      regionId: 'reg-mg-01',
      classId: 'cls-2026-t4',
      moduleTitle: 'Módulo 1 — Evangelismo Sobrenatural',
      status: 'Em andamento',
      attendanceCount: 1,
      totalClasses: 3,
      hasPhysicalBook: true,
      createdAt: '2026-09-22T14:30:00',
    },
    {
      id: 'enr-03',
      studentName: 'Thiago Rocha',
      studentEmail: 'thiago.evang@semeadoresdefogo.org',
      studentPhone: '(11) 96666-3333',
      regionId: 'reg-sp-01',
      classId: 'cls-2026-t4',
      moduleTitle: 'Módulo 1 — Evangelismo Sobrenatural',
      status: 'Concluído',
      attendanceCount: 3,
      totalClasses: 3,
      hasPhysicalBook: true,
      certificateId: 'cert-sf-2026-001',
      completedDate: '2026-10-01',
      createdAt: '2026-07-10T09:00:00',
    },
  ];

  const certificates: Certificate[] = [
    {
      id: 'cert-sf-2026-001',
      certificateCode: 'SF-CERT-2026-0089',
      studentName: 'Pb. Thiago Rocha',
      courseTitle: 'Formação Ministerial em Evangelismo Sobrenatural (Módulo 1)',
      completionDate: '2026-10-01',
      workloadHours: 16,
      issuer: 'Semeadores de Fogo Global',
      signedBy: 'Lucas Moreira & Arthur',
      regionName: 'São Paulo — Capital (Sede)',
    },
  ];

  const crusades: Crusade[] = [
    {
      id: 'cru-01',
      title: 'Cruzada de Fogo & Avivamento — Vale do Paraíba',
      regionId: 'reg-sp-01',
      hostCity: 'São José dos Campos',
      hostState: 'SP',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      status: 'Confirmada',
      participatingRegions: ['reg-sp-01', 'reg-rj-01'],
      coordinatorName: 'Lucas Moreira',
      estimatedAttendance: 1500,
      intercessionLead: 'Sarah Martins',
      worshipLead: 'Gabriel Vianna',
      logisticsLead: 'Arthur',
      outreachMaterialsLead: 'Eduardo Felyx',
      budgetEstimated: 8500,
      checklist: [
        { id: 'chk-1', item: 'Vigília de Intercessão Prévia de 21 dias', category: 'Espiritual', completed: true, responsible: 'Sarah Martins' },
        { id: 'chk-2', item: 'Autorização Municipal para Praça e Tenda de Eventos', category: 'Logística', completed: true, responsible: 'Arthur' },
        { id: 'chk-3', item: 'Contratação de Gerador, Som e Palco', category: 'Estrutura', completed: true, responsible: 'Lucas Moreira' },
        { id: 'chk-4', item: 'Impressão de 5.000 Folhetos e Fichas de Consolidação', category: 'Evangelismo', completed: false, responsible: 'Eduardo Felyx' },
        { id: 'chk-5', item: 'Divulgação nas Rádios Comunitárias e Redes Sociais', category: 'Comunicação', completed: false, responsible: 'Eduardo Felyx' },
        { id: 'chk-6', item: 'Escala de Hospedagem e Transporte das Regionais Parceiras', category: 'Logística', completed: false, responsible: 'Arthur' },
      ],
      createdAt: '2026-09-15T10:00:00',
    },
  ];

  const departments: Department[] = [
    {
      id: 'dep-1',
      number: 1,
      name: 'Direção Global e Coordenação Regional',
      description: 'Direcionamento ministerial, supervisão pastoral das regionais, homologação de implantações e alinhamento da visão.',
      coordinatorName: 'Lucas Moreira',
      objectives: [
        'Manter a unidade doutrinária e o fervor evangelístico em todas as regionais',
        'Avaliar bimestralmente o desempenho e as necessidades das lideranças locais',
        'Garantir a implantação de ao menos 10 novas regionais até 2027',
      ],
      memberCount: 6,
      status: 'Ativo',
    },
    {
      id: 'dep-2',
      number: 2,
      name: 'Evangelismo e Expansão',
      description: 'Planejamento de impacto de rua, estratégias de abordagem em massa, mobilização de semeadores e abertura de frentes missionárias.',
      coordinatorName: 'Pb. Thiago Rocha',
      objectives: [
        'Padronizar as metodologias de evangelismo sobrenatural com base bíblica',
        'Apoiar regionais menores na organização de evangelismos quinzenais',
        'Mapear cidades estratégicas para envio de caravanas evangelísticas',
      ],
      memberCount: 14,
      status: 'Ativo',
    },
    {
      id: 'dep-3',
      number: 3,
      name: 'Ensino e Formação',
      description: 'Coordenação pedagógica dos 4 módulos de estudo, aulas mensais via Zoom, gestão de certificados e treinamento de novos semeadores.',
      coordinatorName: 'Prof. Daniel Batista',
      objectives: [
        'Capacitar biblicamente 100% dos semeadores cadastrados',
        'Coordenar as turmas trimestrais e o acompanhamento de leitura dos 4 livros físicos',
        'Emitir certificados digitais oficiais aos concluintes',
      ],
      memberCount: 5,
      status: 'Ativo',
    },
    {
      id: 'dep-4',
      number: 4,
      name: 'Consolidação',
      description: 'Ministério de acolhimento e discipulado inicial dos evangelizados, acompanhamento individual e encaminhamento para igrejas locais.',
      coordinatorName: 'Sarah Martins',
      objectives: [
        'Garantir primeiro contato em até 48 horas após a coleta autorizada',
        'Manter conformidade rigorosa com a LGPD e respeito à privacidade',
        'Encaminhar pelo menos 60% dos contatos alcançados para igrejas locais sólidas',
      ],
      memberCount: 8,
      status: 'Ativo',
    },
    {
      id: 'dep-5',
      number: 5,
      name: 'Mídia e Comunicação',
      description: 'Curadoria visual, padronização da marca ministerial, identidade visual de camisetas/bonés/panfletos e gestão de mídias sociais oficiais.',
      coordinatorName: 'Eduardo Felyx',
      objectives: [
        'Disponibilizar biblioteca com todos os materiais vetorizados e templates oficiais',
        'Filtrar e aprovar fotografias e testemunhos das ações regionais',
        'Preservar a integridade da marca e a dignidade do ministério na internet',
      ],
      memberCount: 4,
      status: 'Ativo',
    },
    {
      id: 'dep-6',
      number: 6,
      name: 'Tecnologia e Dados',
      description: 'Arquitetura e sustentação da Plataforma Semeadores de Fogo Global, inteligência de dados com IA, segurança e infraestrutura.',
      coordinatorName: 'Arthur',
      objectives: [
        'Manter a plataforma web full-stack ágil, segura e escalável para dezenas de regionais',
        'Desenvolver modelos de síntese analítica dos relatórios bimestrais com Gemini',
        'Proteger dados pessoais e garantir alta disponibilidade do sistema',
      ],
      memberCount: 3,
      status: 'Ativo',
    },
    {
      id: 'dep-7',
      number: 7,
      name: 'Eventos e Cruzadas',
      description: 'Organização de grandes concentrações públicas, cronogramas operacionais, intercâmbios evangelísticos e suporte de palco/som.',
      coordinatorName: 'Lucas Moreira & Equipe',
      objectives: [
        'Planejar e executar cruzadas de grande impacto em praças públicas',
        'Facilitar a logística de intercâmbio de semeadores entre estados',
        'Operar checklist padronizado de segurança e permissões governamentais',
      ],
      memberCount: 7,
      status: 'Ativo',
    },
    {
      id: 'dep-8',
      number: 8,
      name: 'Financeiro e Logística',
      description: 'Controle de orçamentos de eventos, planejamento de custeio de viagens missionárias, transporte e envio de materiais físicos.',
      coordinatorName: 'Arthur',
      objectives: [
        'Planejar com rigor os custos de viagens e implantação de regionais',
        'Controlar estoque e envio das apostilas e livros físicos',
        'Apresentar prestação de contas transparente à direção ministerial',
      ],
      memberCount: 3,
      status: 'Ativo',
    },
    {
      id: 'dep-9',
      number: 9,
      name: 'Jurídico e Patrimônio Digital',
      description: 'Registro de marca junto ao INPI, proteção de direitos autorais de apostilas, controle de domínios web e conformidade com a LGPD.',
      coordinatorName: 'Arthur & Eduardo Felyx',
      objectives: [
        'Acompanhar processo de registro do nome e símbolo oficial no INPI',
        'Gerenciar termos de uso, políticas de privacidade e termo de voluntariado',
        'Blindar juridicamente o ministério contra uso indevido da marca',
      ],
      memberCount: 3,
      status: 'Ativo',
    },
    {
      id: 'dep-10',
      number: 10,
      name: 'Intercessão e Apoio Espiritual',
      description: 'Cobertura de oração 24 horas, relógio de oração antes dos evangelismos, apoio pastoral aos semeadores e guerra espiritual.',
      coordinatorName: 'Sarah Martins',
      objectives: [
        'Manter intercessão contínua por cada regional e por seus coordenadores',
        'Discernir espiritualmente as cidades e bairros antes das cruzadas',
        'Apoiar voluntários em momentos de desgaste físico e emocional',
      ],
      memberCount: 12,
      status: 'Ativo',
    },
  ];

  const tasks: Task[] = [
    {
      id: 'tsk-01',
      departmentId: 'dep-6',
      departmentName: 'Tecnologia e Dados',
      title: 'Implantar módulo de relatórios bimestrais automatizados',
      description: 'Garantir preenchimento ágil e fluxo de aprovação com IA no painel administrativo.',
      assignedTo: 'Arthur',
      dueDate: '2026-10-25',
      priority: 'Alta',
      status: 'Em andamento',
      createdAt: now,
    },
    {
      id: 'tsk-02',
      departmentId: 'dep-9',
      departmentName: 'Jurídico e Patrimônio Digital',
      title: 'Protocolar acompanhamento de registro da marca no INPI',
      description: 'Levantar classe de registro ministerial/educacional e status do logotipo oficial.',
      assignedTo: 'Arthur & Eduardo Felyx',
      dueDate: '2026-11-05',
      priority: 'Alta',
      status: 'Em andamento',
      createdAt: now,
    },
    {
      id: 'tsk-03',
      departmentId: 'dep-5',
      departmentName: 'Mídia e Comunicação',
      title: 'Atualizar biblioteca com artes vetorizadas oficiais de bonés e camisetas',
      description: 'Disponibilizar arquivos em PDF/SVG de alta resolução para download das regionais.',
      assignedTo: 'Eduardo Felyx',
      dueDate: '2026-10-30',
      priority: 'Média',
      status: 'Concluído',
      createdAt: now,
    },
    {
      id: 'tsk-04',
      departmentId: 'dep-3',
      departmentName: 'Ensino e Formação',
      title: 'Homologar link do Zoom e escala de docentes para Turma Alpha Módulo 1',
      description: 'Configurar sala de transmissão com capacidade para 200 alunos e gravação de aula.',
      assignedTo: 'Prof. Daniel Batista',
      dueDate: '2026-10-22',
      priority: 'Alta',
      status: 'Pendente',
      createdAt: now,
    },
    {
      id: 'tsk-05',
      departmentId: 'dep-4',
      departmentName: 'Consolidação',
      title: 'Workshop online de capacitação em acolhimento pós-evangelismo',
      description: 'Treinar os voluntários de consolidação de SP, MG e RJ sobre abordagem bíblica e LGPD.',
      assignedTo: 'Sarah Martins',
      dueDate: '2026-11-10',
      priority: 'Média',
      status: 'Pendente',
      createdAt: now,
    },
  ];

  const meetings: Meeting[] = [
    {
      id: 'mtg-01',
      title: 'Reunião Estratégica Inaugural de Alinhamento Global',
      meetingType: 'Reunião Bimestral de Alinhamento Global',
      date: '2026-10-16',
      time: '19:30',
      zoomLink: 'https://zoom.us/j/90112233445',
      location: 'Ambiente Virtual Zoom',
      participants: ['Lucas Moreira', 'Eduardo Felyx', 'Arthur', 'Diogo Alencar', 'Gabriel Vianna'],
      agendaItems: [
        'Definição da frequência obrigatória de evangelismos (Semanal para grandes, Quinzenal para menores)',
        'Estruturação dos 10 departamentos ministeriais e responsáveis',
        'Exigência dos Relatórios Bimestrais para todas as regionais',
        'Formação dos 4 módulos físicos e curso via Zoom gratuito aos jovens',
        'Planejamento das Cruzadas e acompanhamento rigoroso pelo Ministério de Consolidação',
      ],
      decisionsRecorded: 'Aprovada a obrigatoriedade dos relatórios bimestrais como instrumento oficial de avaliação. Aprovada a implantação da plataforma web centralizada para eliminar controles manuais.',
      minutesText: 'Em 16 de outubro de 2026, reuniu-se a liderança estratégica dos Semeadores de Fogo Global. Ficou estipulado que o ministério não abrirá mão da excelência administrativa, mantendo a individualidade e a responsabilidade de cada regional sob supervisão global contínua.',
      actionItems: [
        { task: 'Desenvolvimento e publicação da plataforma ministerial completa', responsible: 'Arthur', deadline: '2026-10-25', completed: true },
        { task: 'Envio das diretrizes para os líderes regionais de SP, MG e RJ', responsible: 'Lucas Moreira', deadline: '2026-10-22', completed: false },
        { task: 'Validação dos arquivos oficiais da marca e materiais de mídia', responsible: 'Eduardo Felyx', deadline: '2026-10-28', completed: false },
      ],
      status: 'Realizada',
      createdAt: now,
    },
    {
      id: 'mtg-02',
      title: 'Próxima Reunião Bimestral de Alinhamento com Coordenadores Regionais',
      meetingType: 'Reunião Bimestral de Alinhamento Global',
      date: '2026-12-18',
      time: '20:00',
      zoomLink: 'https://zoom.us/j/90112233999',
      location: 'Ambiente Virtual Zoom',
      participants: ['Lucas Moreira', 'Arthur', 'Eduardo Felyx', 'Todos os Coordenadores Regionais'],
      agendaItems: [
        'Apresentação da síntese analítica dos relatórios do 5º Bimestre via IA',
        'Avaliação da Cruzada no Vale do Paraíba',
        'Apresentação do calendário evangelístico nacional de 2027',
      ],
      decisionsRecorded: '',
      minutesText: '',
      actionItems: [],
      status: 'Agendada',
      createdAt: now,
    },
  ];

  const mediaAssets: MediaAsset[] = [
    {
      id: 'ast-01',
      title: 'Logotipo Oficial Semeadores de Fogo (Pacote Vetorial)',
      category: 'Logotipos e Identidade',
      description: 'Símbolo oficial com a pomba e a chama, nas versões monocromática, preta, branca e vermelha. Arquivos em alta definição.',
      fileFormat: 'SVG / PNG / PDF',
      fileSize: '4.2 MB',
      downloadUrl: '#download-logo-pack',
      isOfficialApproved: true,
      uploadedBy: 'Eduardo Felyx',
      createdAt: now,
    },
    {
      id: 'ast-02',
      title: 'Manual de Aplicação da Identidade Visual',
      category: 'Logotipos e Identidade',
      description: 'Diretrizes oficiais para uso da tipografia Montserrat, proporções do símbolo, paleta de cores primárias e regras de não-distorção.',
      fileFormat: 'PDF',
      fileSize: '8.7 MB',
      downloadUrl: '#download-brand-manual',
      isOfficialApproved: true,
      uploadedBy: 'Arthur & Eduardo Felyx',
      createdAt: now,
    },
    {
      id: 'ast-03',
      title: 'Arte Oficial de Camisetas dos Semeadores (Frente e Costas)',
      category: 'Camisetas e Bonés',
      description: 'Gabarito para serigrafia e sublimação com versículo bíblico nas costas e símbolo no peito esquerdo.',
      fileFormat: 'AI / PDF',
      fileSize: '12.4 MB',
      downloadUrl: '#download-tshirt-pack',
      isOfficialApproved: true,
      uploadedBy: 'Eduardo Felyx',
      createdAt: now,
    },
    {
      id: 'ast-04',
      title: 'Folheto Evangelístico Padrão (Frente e Verso com Espaço para Igreja Local)',
      category: 'Folhetos e Panfletos',
      description: 'Folheto com mensagem evangelística clara, oração de entrega e campo editável para endereço da igreja patrocinadora.',
      fileFormat: 'PDF de Impressão',
      fileSize: '5.1 MB',
      downloadUrl: '#download-flyer-template',
      isOfficialApproved: true,
      uploadedBy: 'Arthur',
      createdAt: now,
    },
  ];

  const financialRecords: FinancialRecord[] = [
    {
      id: 'fin-01',
      category: 'Orçamento de Evento',
      title: 'Orçamento Cruzada São José dos Campos (Novembro 2026)',
      description: 'Locação de som, palco móvel, gerador e banheiros químicos para 3 dias de cruzada pública.',
      amount: 8500.0,
      status: 'Aprovado',
      responsibleName: 'Lucas Moreira & Arthur',
      date: '2026-10-12',
      notes: 'Rateio aprovado com apoio das igrejas patrocinadoras de São Paulo e Vale do Paraíba.',
    },
    {
      id: 'fin-02',
      category: 'Patrimônio Digital / Marca',
      title: 'Taxas Oficiais INPI — Registro de Marca Mista Semeadores de Fogo',
      description: 'Taxa federal de depósito e pesquisa de anterioridade da marca nominativa e figurativa.',
      amount: 475.0,
      status: 'Em Análise',
      responsibleName: 'Arthur & Eduardo Felyx',
      date: '2026-10-14',
      notes: 'Pesquisa prévia concluída; protocolo agendado com advogado cooperador.',
    },
    {
      id: 'fin-03',
      category: 'Custeio de Implantação',
      title: 'Estimativa de Custeio — Caravana de Implantação Curitiba / PR',
      description: 'Combustível, pedágios e alimentação para equipe de 4 semeadores de apoio durante final de semana.',
      amount: 1450.0,
      status: 'Estimado',
      responsibleName: 'Arthur',
      date: '2026-10-15',
      notes: 'Hospedagem solidária concedida pela Comunidade Cristã Central de Curitiba.',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-01',
      userId: 'user-arthur',
      userName: 'Arthur',
      action: 'CRIAÇÃO_SISTEMA',
      entityType: 'PLATAFORMA',
      entityId: 'global',
      details: 'Inicialização da arquitetura oficial Semeadores de Fogo Global após reunião de alinhamento estratégico.',
      timestamp: now,
    },
    {
      id: 'log-02',
      userId: 'user-arthur',
      userName: 'Arthur',
      action: 'APROVACAO_RELATORIO',
      entityType: 'RELATORIO_BIMESTRAL',
      entityId: 'rep-mg-b5-2026',
      details: 'Relatório do 5º Bimestre da regional MG analisado e homologado com parecer administrativo.',
      timestamp: now,
    },
  ];

  return {
    users,
    regions,
    members,
    evangelismEvents,
    bimonthlyReports,
    consolidationContacts,
    courseModules,
    courseClasses,
    enrollments,
    certificates,
    crusades,
    departments,
    tasks,
    meetings,
    mediaAssets,
    auditLogs,
    financialRecords,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading database file, using seed data:', err);
    }
    const seed = getInitialSeed();
    this.save(seed);
    return seed;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public update(modifier: (db: DatabaseSchema) => void): DatabaseSchema {
    modifier(this.data);
    this.save();
    return this.data;
  }

  public logAudit(userId: string, userName: string, action: string, entityType: string, entityId: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
  }
}

export const db = new Database();
