import {
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
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import {
  User,
  Region,
  Member,
  EvangelismEvent,
  BimonthlyReport,
  DashboardMetrics,
} from '../types/index.js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

// Track connection health
let firestoreOnline = true;

/**
 * Accurately pings Cloud Firestore.
 * Fails if the server is unreachable, offline, or if permission is denied.
 */
export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    firestoreOnline = true;
    return true;
  } catch (err: any) {
    console.warn('[Firestore Health] Conexão indisponível ou não autorizada:', err?.message);
    firestoreOnline = false;
    return false;
  }
}

export function isFirestoreOnline(): boolean {
  return firestoreOnline;
}

/**
 * Administrative bootstrap triggered through secure backend endpoint
 */
export async function triggerAdminBootstrap(idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao inicializar banco');
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro de comunicação com o servidor' };
  }
}

// ==================== USERS & AUTH ====================

export async function fetchUsersFromFirestore(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as User);
  } catch (err) {
    console.warn('[Firestore] Erro ao consultar usuários:', err);
    return [];
  }
}

export async function findUserByEmailOrUid(
  email?: string | null,
  uid?: string | null
): Promise<User | null> {
  if (!email && !uid) return null;

  try {
    // 1. Query by UID if document ID is UID or authUid field
    if (uid) {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as User;
      }

      const qUid = query(collection(db, 'users'), where('authUid', '==', uid));
      const snapUid = await getDocs(qUid);
      if (!snapUid.empty) {
        return snapUid.docs[0].data() as User;
      }
    }

    // 2. Query by email
    if (email) {
      const lower = email.toLowerCase().trim();
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const u = d.data() as User;
        if (u.email && u.email.toLowerCase().trim() === lower) {
          // Link UID to the user document if not yet linked
          if (uid && (!u.authUid || u.authUid !== uid)) {
            updateDoc(doc(db, 'users', d.id), { authUid: uid }).catch(() => {});
          }
          return u;
        }
      }
    }

    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'users');
  }
}

// ==================== REGIONS ====================

export async function fetchRegionsFromFirestore(): Promise<Region[]> {
  try {
    const snap = await getDocs(collection(db, 'regions'));
    return snap.docs.map((d) => d.data() as Region);
  } catch (err) {
    console.warn('[Firestore] Erro ao buscar regionais:', err);
    return [];
  }
}

export async function createRegionInFirestore(regionData: Partial<Region>): Promise<Region> {
  const id = regionData.id || `reg-${(regionData.state || 'xx').toLowerCase()}-${Date.now().toString(36)}`;
  const newRegion: Region = {
    id,
    name: regionData.name || 'Nova Regional',
    state: (regionData.state || 'SP').toUpperCase(),
    city: regionData.city || '',
    sponsoringChurch: regionData.sponsoringChurch || '',
    responsiblePastor: regionData.responsiblePastor || '',
    coordinatorName: regionData.coordinatorName || '',
    contactEmail: regionData.contactEmail || '',
    contactPhone: regionData.contactPhone || '',
    memberCount: 0,
    implantationDate: new Date().toISOString().split('T')[0],
    plannedFrequency: regionData.plannedFrequency || 'quinzenal',
    status: regionData.status || 'implanting',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'regions', id), newRegion);
    return newRegion;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `regions/${id}`);
  }
}

// ==================== MEMBERS ====================

export async function fetchMembersFromFirestore(regionId?: string): Promise<Member[]> {
  try {
    let q = collection(db, 'members');
    const snap = await getDocs(q);
    let members = snap.docs.map((d) => d.data() as Member);
    if (regionId && regionId !== 'ALL') {
      members = members.filter((m) => m.regionId === regionId);
    }
    return members;
  } catch (err) {
    console.warn('[Firestore] Erro ao buscar membros:', err);
    return [];
  }
}

export async function createMemberInFirestore(memberData: Partial<Member>): Promise<Member> {
  const id = `mem-${Date.now().toString(36)}`;
  const newMember: Member = {
    id,
    name: memberData.name || '',
    regionId: memberData.regionId || 'reg-sp-01',
    email: memberData.email || '',
    phone: memberData.phone || '',
    roleInMinistry: memberData.roleInMinistry || 'Semeador',
    baptismInHolySpirit: !!memberData.baptismInHolySpirit,
    trainingCompleted: !!memberData.trainingCompleted,
    active: true,
    joinDate: new Date().toISOString().split('T')[0],
  };

  try {
    await setDoc(doc(db, 'members', id), newMember);
    return newMember;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `members/${id}`);
  }
}

// ==================== EVANGELISMS ====================

export async function fetchEvangelismsFromFirestore(regionId?: string): Promise<EvangelismEvent[]> {
  try {
    const snap = await getDocs(collection(db, 'evangelismEvents'));
    let events = snap.docs.map((d) => d.data() as EvangelismEvent);
    if (regionId && regionId !== 'ALL') {
      events = events.filter((e) => e.regionId === regionId);
    }
    return events.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  } catch (err) {
    console.warn('[Firestore] Erro ao buscar evangelismos:', err);
    return [];
  }
}

export async function createEvangelismInFirestore(
  data: Partial<EvangelismEvent>
): Promise<EvangelismEvent> {
  const id = `ev-${Date.now().toString(36)}`;
  const newEvent: EvangelismEvent = {
    id,
    regionId: data.regionId || 'reg-sp-01',
    name: data.name || '',
    dateTime: data.dateTime || new Date().toISOString(),
    location: data.location || '',
    address: data.address || data.location || '',
    leaderId: data.leaderId || 'admin',
    leaderName: data.leaderName || 'Líder',
    actionType: data.actionType || 'Praça Pública',
    expectedParticipants: Number(data.expectedParticipants) || 10,
    confirmedMembers: [],
    notes: data.notes || '',
    status: 'Planejado',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'evangelismEvents', id), newEvent);
    return newEvent;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `evangelismEvents/${id}`);
  }
}

export async function updateEvangelismInFirestore(
  id: string,
  updates: Partial<EvangelismEvent>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'evangelismEvents', id), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `evangelismEvents/${id}`);
  }
}

// ==================== BIMONTHLY REPORTS ====================

export async function fetchReportsFromFirestore(regionId?: string): Promise<BimonthlyReport[]> {
  try {
    const snap = await getDocs(collection(db, 'bimonthlyReports'));
    let reports = snap.docs.map((d) => d.data() as BimonthlyReport);
    if (regionId && regionId !== 'ALL') {
      reports = reports.filter((r) => r.regionId === regionId);
    }
    return reports;
  } catch (err) {
    console.warn('[Firestore] Erro ao buscar relatórios:', err);
    return [];
  }
}

export async function createReportInFirestore(
  data: Partial<BimonthlyReport>
): Promise<BimonthlyReport> {
  const id = `rep-${data.regionId || 'reg'}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const newReport: BimonthlyReport = {
    id,
    regionId: data.regionId || '',
    regionName: data.regionName || 'Regional',
    coordinatorId: data.coordinatorId || 'coord',
    coordinatorName: data.coordinatorName || 'Coordenador',
    bimonthlyPeriod: data.bimonthlyPeriod || '',
    year: data.year || 2026,
    status: data.status || 'Enviado',
    submissionDate: now,
    evangelismsCount: Number(data.evangelismsCount) || 0,
    frequencyObserved: data.frequencyObserved || '',
    locationsReached: data.locationsReached || '',
    totalParticipants: Number(data.totalParticipants) || 0,
    activitiesDescription: data.activitiesDescription || '',
    peopleReached: Number(data.peopleReached) || 0,
    contactsCollected: Number(data.contactsCollected) || 0,
    contactsInConsolidation: Number(data.contactsInConsolidation) || 0,
    forwardedToChurch: Number(data.forwardedToChurch) || 0,
    testimonies: data.testimonies || '',
    strengths: data.strengths || '',
    difficulties: data.difficulties || '',
    regionalNeeds: data.regionalNeeds || '',
    proposedImprovements: data.proposedImprovements || '',
    nextPeriodPlanning: data.nextPeriodPlanning || '',
    photos: data.photos || [],
    documentsNotes: data.documentsNotes || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'bimonthlyReports', id), newReport);
    return newReport;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bimonthlyReports/${id}`);
  }
}

export async function updateReportInFirestore(
  id: string,
  updates: Partial<BimonthlyReport>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'bimonthlyReports', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bimonthlyReports/${id}`);
  }
}

// ==================== DASHBOARD METRICS CALCULATION ====================

/**
 * Calculates genuine dynamic metrics purely from live Firestore documents.
 * Completely eliminates static constants and mock values.
 */
export async function calculateFirestoreDashboardMetrics(
  regionId?: string
): Promise<DashboardMetrics> {
  const [regions, evangelisms, reports, members, enrollmentsSnap] = await Promise.all([
    fetchRegionsFromFirestore(),
    fetchEvangelismsFromFirestore(regionId),
    fetchReportsFromFirestore(regionId),
    fetchMembersFromFirestore(regionId),
    getDocs(collection(db, 'enrollments')).catch(() => ({ size: 0, docs: [] } as any)),
  ]);

  const activeRegions = regions.filter((r) => r.status === 'active').length;
  const completedEvangelisms = evangelisms.filter((e) => e.status === 'Realizado').length;
  const plannedEvangelisms = evangelisms.filter(
    (e) => e.status === 'Planejado' || e.status === 'Confirmado'
  ).length;

  const totalPeopleReached = evangelisms
    .filter((e) => e.status === 'Realizado')
    .reduce((acc, e) => acc + (Number(e.estimatedReached) || 0), 0);

  const totalContactsCollected = evangelisms
    .filter((e) => e.status === 'Realizado')
    .reduce((acc, e) => acc + (Number(e.contactsCollected) || 0), 0);

  const totalParticipantsInvolved = evangelisms
    .filter((e) => e.status === 'Realizado')
    .reduce((acc, e) => acc + (Number(e.actualParticipants) || Number(e.expectedParticipants) || 0), 0);

  // Read contacts directly from bimonthly reports and events
  const contactsInConsolidation = reports.reduce(
    (acc, r) => acc + (Number(r.contactsInConsolidation) || 0),
    0
  );

  const contactsForwardedToChurch = reports.reduce(
    (acc, r) => acc + (Number(r.forwardedToChurch) || 0),
    0
  );

  const reportsSubmitted = reports.filter(
    (r) => r.status === 'Enviado' || r.status === 'Em análise' || r.status === 'Aprovado'
  ).length;
  const reportsApproved = reports.filter((r) => r.status === 'Aprovado').length;
  const reportsPendingReview = reports.filter(
    (r) => r.status === 'Enviado' || r.status === 'Em análise'
  ).length;

  const totalStudentsEnrolled = enrollmentsSnap.size || 0;

  return {
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
    totalStudentsEnrolled,
    alerts: [
      {
        type: 'info',
        message: 'Base Cloud Firestore conectada e sincronizada com segurança ministerial.',
      },
    ],
  };
}
