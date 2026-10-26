import { auth } from './firebase.js';

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Centralized, typed API Client for Semeadores de Fogo Global.
 * - Auto-attaches Firebase ID Token via Bearer header
 * - Enforces JSON responses and handles empty/timeout scenarios
 * - Handles 401 Unauthorized with clean session logout
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { timeoutMs = 20000, skipAuth = false, headers: customHeaders, ...restOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(customHeaders || {});

  // 1. Auto-attach Bearer Firebase ID Token
  if (!skipAuth && !headers.has('Authorization')) {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        if (idToken) {
          headers.set('Authorization', `Bearer ${idToken}`);
        }
      }
    } catch (tokenErr) {
      console.warn('[ApiClient] Falha ao obter token Firebase do usuário:', tokenErr);
    }
  }

  // 2. Set default Content-Type for JSON payloads
  if (restOptions.body && typeof restOptions.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(endpoint, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 3. Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn(`[ApiClient] 401 Não autorizado em ${endpoint}`);
      // If we are currently logged in with a rejected token, trigger clean sign-out
      if (auth.currentUser && !skipAuth) {
        auth.signOut().catch(() => {});
      }
    }

    // 4. Validate Content-Type
    const contentType = response.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      if (!response.ok) {
        throw new ApiError(
          text || `Erro HTTP ${response.status}: resposta não-JSON recebida.`,
          response.status
        );
      }
      responseData = text;
    }

    // 5. Handle HTTP errors
    if (!response.ok) {
      const message =
        responseData?.error ||
        responseData?.message ||
        `Erro ${response.status} ao comunicar com ${endpoint}`;
      throw new ApiError(message, response.status, responseData);
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError(
        `Tempo limite excedido (${timeoutMs / 1000}s) ao comunicar com ${endpoint}`,
        408
      );
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      err?.message || `Falha de rede ao acessar ${endpoint}`,
      0,
      err
    );
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: ApiClientOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: ApiClientOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  // Domain-specific endpoints
  getHealth: () => apiRequest('/api/health', { skipAuth: true }),

  verifyAuthToken: (idToken: string) =>
    apiRequest('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    }),

  triggerBootstrap: () =>
    apiRequest('/api/admin/bootstrap', {
      method: 'POST',
    }),

  analyzeReportsWithGemini: (prompt?: string, regionId?: string) =>
    apiRequest('/api/ai/analyze-reports', {
      method: 'POST',
      body: JSON.stringify({ prompt, regionId }),
      timeoutMs: 45000,
    }),
};
