export type UserRole =
  | 'admin_global'
  | 'coordenador_regional'
  | 'lider_evangelismo'
  | 'equipe_consolidacao'
  | 'equipe_ensino'
  | 'equipe_midia';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  regionId: string | null;
  phone: string;
  status: 'active' | 'inactive';
  departmentId?: string;
  avatar?: string;
  authUid?: string;
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
  bimonthlyPeriod: string;
  year: number;
  status: 'Rascunho' | 'Enviado' | 'Em análise' | 'Aprovado' | 'Devolvido';
  submissionDate?: string;
  evangelismsCount: number;
  frequencyObserved: string;
  locationsReached: string;
  totalParticipants: number;
  activitiesDescription: string;
  peopleReached: number;
  contactsCollected: number;
  contactsInConsolidation: number;
  forwardedToChurch: number;
  testimonies: string;
  strengths: string;
  difficulties: string;
  regionalNeeds: string;
  proposedImprovements: string;
  nextPeriodPlanning: string;
  photos: string[];
  documentsNotes: string;
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
  consentGiven: boolean;
  sensitiveDataConsent: boolean;
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

export interface DashboardMetrics {
  totalRegions: number;
  activeRegions: number;
  totalMembers: number;
  completedEvangelisms: number;
  plannedEvangelisms: number;
  totalParticipantsInvolved: number;
  totalPeopleReached: number;
  totalContactsCollected: number;
  contactsInConsolidation: number;
  contactsForwardedToChurch: number;
  reportsSubmitted: number;
  reportsApproved: number;
  reportsPendingReview: number;
  totalStudentsEnrolled: number;
  alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string; link?: string }>;
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
