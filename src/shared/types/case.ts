import type { IdentityDossier } from './dossier.js';

export type CaseStatus = 'active' | 'archived' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Case {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  status: CaseStatus;
  priority: CasePriority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dossierCount?: number;
  evidenceCount?: number;
}

export interface CaseDetail {
  case: Case;
  dossiers: DossierRecord[];
  evidence: EvidenceRecord[];
  notes: NoteRecord[];
  timelines: TimelineRecord[];
}

export interface DossierRecord {
  id: string;
  caseId: string;
  seed: string;
  generatorParams: Record<string, unknown>;
  fullName: string;
  primaryAlias: string;
  nationality: string;
  dossierData: IdentityDossier | Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceType =
  | 'document'
  | 'network_artifact'
  | 'credential'
  | 'communication'
  | 'financial_record'
  | 'raw_json'
  | 'other';

export interface EvidenceRecord {
  id: string;
  caseId: string;
  dossierId?: string | null;
  title: string;
  type: EvidenceType;
  content: string;
  sourceUrl: string;
  hashSha256: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteCategory = 'observation' | 'lead' | 'hypothesis' | 'interview' | 'summary';

export interface NoteRecord {
  id: string;
  caseId: string;
  authorId: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
  updatedAt: string;
}

export type TimelineCategory =
  | 'employment'
  | 'education'
  | 'financial'
  | 'incident'
  | 'travel'
  | 'legal'
  | 'social'
  | 'cyber';

export type TimelineSignificance = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineRecord {
  id: string;
  caseId: string;
  dossierId?: string | null;
  eventTimestamp: string;
  title: string;
  description: string;
  category: TimelineCategory;
  significance: TimelineSignificance;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
