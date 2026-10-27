/**
 * NETRA API Client
 * Typed HTTP client communicating with backend /api/* routes.
 * Supports token storage in localStorage and automatic Bearer JWT injection.
 */

import type {
  UserPublic,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@shared/types/auth.js';

import type {
  Case,
  CaseDetail,
  CasePriority,
  CaseStatus,
  DossierRecord,
  EvidenceRecord,
  EvidenceType,
  NoteRecord,
  NoteCategory,
  TimelineRecord,
  TimelineCategory,
  TimelineSignificance,
  AuditLogRecord,
} from '@shared/types/case.js';

import type { GeneratorOptions, IdentityDossier } from '@shared/types/dossier.js';
import { generateIdentity as generateIdentityLocal } from '@generator/engine.js';

const TOKEN_KEY = 'netra_auth_token';

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Compute SHA-256 digest in hex format for text/content using standard WebCrypto.
 */
export async function computeSha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

class NetraApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }

    if (!response.ok) {
      const message =
        data?.message || data?.error || (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
      const code = data?.code || data?.error || `HTTP_${response.status}`;
      throw new ApiError(message, response.status, code, data?.details);
    }

    return data as T;
  }

  // ---------------------------------------------------------------------------
  // System Health
  // ---------------------------------------------------------------------------
  async getHealth(): Promise<{ status: string; d1: string; version: string }> {
    return this.request<{ status: string; d1: string; version: string }>('/api/health');
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------
  async register(req: RegisterRequest): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async login(req: LoginRequest): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getCurrentUser(): Promise<UserPublic> {
    const res = await this.request<{ user: UserPublic }>('/api/auth/me');
    return res.user;
  }

  logout(): void {
    this.setToken(null);
  }

  // ---------------------------------------------------------------------------
  // Identity Generation
  // ---------------------------------------------------------------------------
  async generateIdentity(params: Partial<GeneratorOptions> = {}): Promise<{
    seed: string;
    parameters: any;
    dossier: IdentityDossier;
  }> {
    try {
      const res = await this.request<{
        seed: string;
        parameters: any;
        dossier: IdentityDossier;
      }>('/api/dossiers/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return res;
    } catch {
      // Fallback to local deterministic generator engine
      const seed = String(params.seed || `NETRA-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
      const dossier = generateIdentityLocal({ ...params, seed });
      return {
        seed,
        parameters: params,
        dossier,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Cases CRUD
  // ---------------------------------------------------------------------------
  async listCases(params?: {
    status?: CaseStatus;
    priority?: CasePriority;
    limit?: number;
    offset?: number;
  }): Promise<{ cases: Case[]; total: number; limit: number; offset: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const qs = query.toString();
    const endpoint = `/api/cases${qs ? `?${qs}` : ''}`;
    return this.request<{ cases: Case[]; total: number; limit: number; offset: number }>(endpoint);
  }

  async getCase(id: string): Promise<CaseDetail> {
    const res = await this.request<{
      case: Case;
      dossiers: DossierRecord[];
      evidence: EvidenceRecord[];
      notes: NoteRecord[];
      timelines: TimelineRecord[];
    }>(`/api/cases/${id}`);

    return {
      case: res.case,
      dossiers: res.dossiers || [],
      evidence: res.evidence || [],
      notes: res.notes || [],
      timelines: res.timelines || [],
    };
  }

  async createCase(data: {
    title: string;
    description?: string;
    priority?: CasePriority;
    tags?: string[];
  }): Promise<Case> {
    const res = await this.request<{ case: Case }>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.case;
  }

  async updateCase(id: string, updates: {
    title?: string;
    description?: string;
    status?: CaseStatus;
    priority?: CasePriority;
    tags?: string[];
  }): Promise<Case> {
    const res = await this.request<{ case: Case }>(`/api/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.case;
  }

  async deleteCase(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/cases/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // ---------------------------------------------------------------------------
  // Dossiers
  // ---------------------------------------------------------------------------
  async attachDossier(
    caseId: string,
    payload: {
      seed: string;
      generatorParams?: Record<string, unknown>;
      fullName?: string;
      primaryAlias?: string;
      nationality?: string;
      dossierData: IdentityDossier | Record<string, unknown>;
    }
  ): Promise<DossierRecord> {
    const res = await this.request<{ dossier: DossierRecord }>(`/api/cases/${caseId}/dossiers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.dossier;
  }

  async listDossiers(caseId: string): Promise<DossierRecord[]> {
    const res = await this.request<{ dossiers: DossierRecord[] }>(`/api/cases/${caseId}/dossiers`);
    return res.dossiers;
  }

  // ---------------------------------------------------------------------------
  // Evidence Ledger
  // ---------------------------------------------------------------------------
  async createEvidence(
    caseId: string,
    payload: {
      title: string;
      type: EvidenceType;
      content: string;
      dossierId?: string | null;
      sourceUrl?: string;
      hashSha256?: string;
    }
  ): Promise<EvidenceRecord> {
    // Automatically calculate SHA-256 digest if not explicitly provided
    if (!payload.hashSha256) {
      payload.hashSha256 = await computeSha256(payload.content || payload.title);
    }

    const res = await this.request<{ evidence: EvidenceRecord }>(`/api/cases/${caseId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.evidence;
  }

  async listEvidence(caseId: string): Promise<EvidenceRecord[]> {
    const res = await this.request<{ evidence: EvidenceRecord[] }>(`/api/cases/${caseId}/evidence`);
    return res.evidence;
  }

  async deleteEvidence(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/evidence/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // ---------------------------------------------------------------------------
  // Investigation Notes
  // ---------------------------------------------------------------------------
  async createNote(
    caseId: string,
    payload: {
      title?: string;
      content: string;
      category?: NoteCategory;
    }
  ): Promise<NoteRecord> {
    const res = await this.request<{ note: NoteRecord }>(`/api/cases/${caseId}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.note;
  }

  async listNotes(caseId: string): Promise<NoteRecord[]> {
    const res = await this.request<{ notes: NoteRecord[] }>(`/api/cases/${caseId}/notes`);
    return res.notes;
  }

  async updateNote(
    id: string,
    updates: {
      title?: string;
      content?: string;
      category?: NoteCategory;
    }
  ): Promise<NoteRecord> {
    const res = await this.request<{ note: NoteRecord }>(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.note;
  }

  async deleteNote(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // ---------------------------------------------------------------------------
  // Case Timelines
  // ---------------------------------------------------------------------------
  async createTimelineEvent(
    caseId: string,
    payload: {
      title: string;
      description?: string;
      eventTimestamp?: string;
      category?: TimelineCategory;
      significance?: TimelineSignificance;
      dossierId?: string | null;
    }
  ): Promise<TimelineRecord> {
    const res = await this.request<{ timeline: TimelineRecord }>(`/api/cases/${caseId}/timelines`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.timeline;
  }

  async listTimelines(caseId: string): Promise<TimelineRecord[]> {
    const res = await this.request<{ timelines: TimelineRecord[] }>(`/api/cases/${caseId}/timelines`);
    return res.timelines;
  }

  async deleteTimelineEvent(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/timelines/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // ---------------------------------------------------------------------------
  // Admin Audit Logs
  // ---------------------------------------------------------------------------
  async listAuditLogs(): Promise<AuditLogRecord[]> {
    try {
      const res = await this.request<{ auditLogs: AuditLogRecord[] }>('/api/admin/audit-logs');
      return res.auditLogs;
    } catch {
      // In case server doesn't expose route yet or user is non-admin
      return [];
    }
  }
}

export const apiClient = new NetraApiClient();
export default apiClient;
