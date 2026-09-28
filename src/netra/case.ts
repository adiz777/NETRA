  import type { NetraIdentity } from './identity.js';

  export type NetraCaseStatus =
    | 'OPEN'
    | 'ACTIVE'
    | 'CLOSED'
    | 'ARCHIVED';

  export interface NetraEvidence {
    id: string;
    type: 'NOTE' | 'DOCUMENT' | 'IMAGE' | 'LINK' | 'RECORD';
    title: string;
    description: string;
    createdAt: string;
  }

  export interface NetraCase {
    caseId: string;
    title: string;
    status: NetraCaseStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    subjects: string[];
    objectives: string[];
    evidence: NetraEvidence[];
    notes: string[];
    createdAt: string;
    updatedAt: string;
  }

  export function createCase(
    title: string,
    identity?: NetraIdentity,
  ): NetraCase {
    const now = new Date().toISOString();

    const alphabet =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let caseId = "";

for (let i = 0; i < 6; i++) {
  caseId += alphabet[
    Math.floor(Math.random() * alphabet.length)
  ];
}

caseId = `CASE-${caseId}`;

    return {
      caseId,
      title,
      status: 'OPEN',
      priority: 'MEDIUM',
      subjects: identity
        ? [identity.netraId]
        : [],
      objectives: [],
      evidence: [],
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  export function addEvidence(
    netraCase: NetraCase,
    evidence: Omit<NetraEvidence, 'id' | 'createdAt'>,
  ): NetraCase {
    const now = new Date().toISOString();

    const item: NetraEvidence = {
      ...evidence,
      id: `EVD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: now,
    };

    return {
      ...netraCase,
      evidence: [
        ...netraCase.evidence,
        item,
      ],
      updatedAt: now,
    };
  }

  export function addNote(
    netraCase: NetraCase,
    note: string,
  ): NetraCase {
    return {
      ...netraCase,
      notes: [
        ...netraCase.notes,
        note,
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  export function assignSubject(
    netraCase: NetraCase,
    identity: NetraIdentity,
  ): NetraCase {
    if (netraCase.subjects.includes(identity.netraId)) {
      return netraCase;
    }

    return {
      ...netraCase,
      subjects: [
        ...netraCase.subjects,
        identity.netraId,
      ],
      updatedAt: new Date().toISOString(),
    };
  }
