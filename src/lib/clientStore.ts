import {
  fetchRegionsFromFirestore,
  fetchMembersFromFirestore,
  fetchEvangelismsFromFirestore,
  fetchReportsFromFirestore,
  fetchUsersFromFirestore,
  createRegionInFirestore,
  createMemberInFirestore,
  createEvangelismInFirestore,
  updateEvangelismInFirestore,
  createReportInFirestore,
  updateReportInFirestore,
  calculateFirestoreDashboardMetrics,
} from './firestoreService.js';
import { DatabaseSchema, DashboardMetrics, Region, EvangelismEvent, BimonthlyReport, Member, User } from '../types/index.js';
import { apiClient } from './apiClient.js';

/**
 * Returns empty base schema for safe initial state without fake mock constants.
 */
export function getClientDb(): DatabaseSchema {
  return {
    regions: [],
    users: [],
    members: [],
    evangelismEvents: [],
    bimonthlyReports: [],
    departments: [],
    tasks: [],
    courseModules: [],
    courseClasses: [],
    enrollments: [],
    certificates: [],
    crusades: [],
    consolidationContacts: [],
    mediaAssets: [],
    meetings: [],
    financialRecords: [],
    auditLogs: [],
  };
}

/**
 * Calculate dynamic metrics directly from Firestore without fake fallback constants.
 */
export async function calculateLocalMetrics(regionId?: string): Promise<DashboardMetrics> {
  return calculateFirestoreDashboardMetrics(regionId);
}

/**
 * Unified Client Data Fetcher backed by Cloud Firestore and API Client.
 * Eliminates local storage divergence and ensures live Firestore is the single source of truth.
 */
export async function universalFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const parsedUrl = new URL(url, 'http://localhost');
  const path = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // 1. AI Analysis runs server-side via Gemini API endpoint
  if (path.startsWith('/api/ai/')) {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    return apiClient.post<T>(path, body, { timeoutMs: 45000 });
  }

  // 2. DASHBOARD METRICS: Compute directly from live Firestore
  if (path === '/api/dashboard/metrics') {
    const regionId = searchParams.get('regionId') || undefined;
    const metrics = await calculateFirestoreDashboardMetrics(regionId);
    return metrics as unknown as T;
  }

  // 3. REGIONS: Read/Write from Cloud Firestore
  if (path === '/api/regions') {
    if (method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      const newRegion = await createRegionInFirestore(body);
      return newRegion as unknown as T;
    }
    const regions = await fetchRegionsFromFirestore();
    return regions as unknown as T;
  }

  if (path.startsWith('/api/regions/')) {
    const id = path.replace('/api/regions/', '');
    const regions = await fetchRegionsFromFirestore();
    const found = regions.find((r) => r.id === id);
    return found as unknown as T;
  }

  // 4. MEMBERS: Read/Write from Cloud Firestore
  if (path === '/api/members') {
    const regionId = searchParams.get('regionId') || undefined;
    if (method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      const newMember = await createMemberInFirestore(body);
      return newMember as unknown as T;
    }
    const members = await fetchMembersFromFirestore(regionId);
    return members as unknown as T;
  }

  // 5. EVANGELISMS: Read/Write from Cloud Firestore
  if (path === '/api/evangelisms') {
    const regionId = searchParams.get('regionId') || undefined;
    if (method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      const newEvent = await createEvangelismInFirestore(body);
      return newEvent as unknown as T;
    }
    const events = await fetchEvangelismsFromFirestore(regionId);
    return events as unknown as T;
  }

  if (path.startsWith('/api/evangelisms/')) {
    const id = path.replace('/api/evangelisms/', '');
    if (method === 'PUT' || method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      await updateEvangelismInFirestore(id, body);
      return { id, ...body } as unknown as T;
    }
    const events = await fetchEvangelismsFromFirestore();
    return events.find((e) => e.id === id) as unknown as T;
  }

  // 6. BIMONTHLY REPORTS: Read/Write from Cloud Firestore
  if (path === '/api/reports') {
    const regionId = searchParams.get('regionId') || undefined;
    if (method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      const newReport = await createReportInFirestore(body);
      return newReport as unknown as T;
    }
    const reports = await fetchReportsFromFirestore(regionId);
    return reports as unknown as T;
  }

  if (path.startsWith('/api/reports/')) {
    const id = path.replace('/api/reports/', '');
    if (method === 'PUT' || method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      await updateReportInFirestore(id, body);
      return { id, ...body } as unknown as T;
    }
    const reports = await fetchReportsFromFirestore();
    return reports.find((r) => r.id === id) as unknown as T;
  }

  // 7. USERS & AUTH: Read from Cloud Firestore
  if (path === '/api/auth/users') {
    const users = await fetchUsersFromFirestore();
    return users as unknown as T;
  }

  // 8. ALL OTHER ROUTES: Execute through centralized apiClient with Bearer auth token
  try {
    const response = await apiClient.get<T>(url);
    return response;
  } catch (apiErr) {
    console.warn(`[universalFetch] Falha ao consultar endpoint ${url}:`, apiErr);
    return [] as unknown as T;
  }
}
