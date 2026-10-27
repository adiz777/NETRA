import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { app } from '@server/index.js';
import { createInMemoryDb, setGlobalTestDb, type IDatabase } from '@server/db/client.js';

describe('R2 Verification: Authentication and Role-Based Access Control (RBAC)', () => {
  let db: IDatabase;

  let investigatorAToken: string;
  let investigatorBToken: string;
  let adminToken: string;

  let userAId: string;
  let userBId: string;
  let adminId: string;

  let caseAId: string;
  let caseBId: string;
  let dossierAId: string;

  beforeAll(async () => {
    // 1. Initialize in-memory SQLite database with initial schema migration
    const migrationPath = resolve(process.cwd(), 'migrations/0001_initial_schema.sql');
    const schemaSql = readFileSync(migrationPath, 'utf-8');
    db = createInMemoryDb(schemaSql);
    setGlobalTestDb(db);
  });

  afterAll(() => {
    setGlobalTestDb(null);
  });

  // ---------------------------------------------------------------------------
  // Health Probe
  // ---------------------------------------------------------------------------
  it('GET /api/health returns 200 OK with d1 connected status', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.d1).toBe('connected');
    expect(body.version).toBe('1.0.0');
  });

  // ---------------------------------------------------------------------------
  // User Registration & Authentication
  // ---------------------------------------------------------------------------
  it('registers investigator_a and generates valid JWT', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'investigator_a@netra.local',
        password: 'Password123!',
        fullName: 'Special Agent Dana Scully',
        role: 'investigator',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('investigator_a@netra.local');
    expect(body.user.role).toBe('investigator');
    expect(body.token).toBeDefined();

    investigatorAToken = body.token;
    userAId = body.user.id;
  });

  it('logs in investigator_a with correct credentials', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'investigator_a@netra.local',
        password: 'Password123!',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.token).toBeDefined();
    expect(body.user.id).toBe(userAId);
    investigatorAToken = body.token;
  });

  it('rejects investigator_a login with incorrect password', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'investigator_a@netra.local',
        password: 'WrongPassword999!',
      }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('registers investigator_b', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'investigator_b@netra.local',
        password: 'Password456!',
        fullName: 'Special Agent Fox Mulder',
        role: 'investigator',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    investigatorBToken = body.token;
    userBId = body.user.id;
    expect(investigatorBToken).toBeDefined();
    expect(userBId).not.toBe(userAId);
  });

  it('registers administrator', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@netra.local',
        password: 'AdminPassword789!',
        fullName: 'Assistant Director Skinner',
        role: 'admin',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    adminToken = body.token;
    adminId = body.user.id;
    expect(body.user.role).toBe('admin');
  });

  it('GET /api/auth/me returns current authenticated user profile', async () => {
    const res = await app.request('/api/auth/me', {
      headers: { Authorization: `Bearer ${investigatorAToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user.id).toBe(userAId);
    expect(body.user.email).toBe('investigator_a@netra.local');
  });

  // ---------------------------------------------------------------------------
  // Case Creation
  // ---------------------------------------------------------------------------
  it('Step 1: Investigator A creates Case A', async () => {
    const res = await app.request('/api/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorAToken}`,
      },
      body: JSON.stringify({
        title: 'Case Alpha - Arctic Echo',
        description: 'Classified Arctic communications intelligence inquiry',
        priority: 'high',
        tags: ['arctic', 'sigint'],
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.case).toBeDefined();
    expect(body.case.title).toBe('Case Alpha - Arctic Echo');
    expect(body.case.ownerId).toBe(userAId);
    caseAId = body.case.id;
  });

  it('Step 2: Investigator B creates Case B', async () => {
    const res = await app.request('/api/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorBToken}`,
      },
      body: JSON.stringify({
        title: 'Case Beta - Obsidian Raven',
        description: 'Financial forensic syndicate probe',
        priority: 'critical',
        tags: ['forensics', 'financial'],
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.case).toBeDefined();
    expect(body.case.title).toBe('Case Beta - Obsidian Raven');
    expect(body.case.ownerId).toBe(userBId);
    caseBId = body.case.id;
  });

  // ---------------------------------------------------------------------------
  // RBAC Cross-User Isolation (Must return HTTP 403 Forbidden)
  // ---------------------------------------------------------------------------
  it('Step 3: Investigator B attempts GET /api/cases/:id on Case A -> MUST FAIL with 403 Forbidden', async () => {
    const res = await app.request(`/api/cases/${caseAId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${investigatorBToken}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error).toBe('Forbidden');
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  it('Step 4: Investigator B attempts PATCH /api/cases/:id on Case A -> MUST FAIL with 403 Forbidden', async () => {
    const res = await app.request(`/api/cases/${caseAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorBToken}`,
      },
      body: JSON.stringify({ priority: 'low' }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error).toBe('Forbidden');
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  it('Step 5: Investigator A attempts GET /api/cases/:id on Case B -> MUST FAIL with 403 Forbidden', async () => {
    const res = await app.request(`/api/cases/${caseBId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${investigatorAToken}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error).toBe('Forbidden');
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  it('Step 6: Investigator A attempts DELETE /api/cases/:id on Case B -> MUST FAIL with 403 Forbidden', async () => {
    const res = await app.request(`/api/cases/${caseBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${investigatorAToken}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error).toBe('Forbidden');
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Case Listing Ownership Filtering
  // ---------------------------------------------------------------------------
  it('Investigator A lists cases and sees ONLY own Case A', async () => {
    const res = await app.request('/api/cases', {
      headers: { Authorization: `Bearer ${investigatorAToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.cases).toBeDefined();
    expect(body.cases.length).toBe(1);
    expect(body.cases[0].id).toBe(caseAId);
  });

  it('Investigator B lists cases and sees ONLY own Case B', async () => {
    const res = await app.request('/api/cases', {
      headers: { Authorization: `Bearer ${investigatorBToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.cases).toBeDefined();
    expect(body.cases.length).toBe(1);
    expect(body.cases[0].id).toBe(caseBId);
  });

  // ---------------------------------------------------------------------------
  // Admin Bypass (Admin accesses ALL cases with HTTP 200 OK)
  // ---------------------------------------------------------------------------
  it('Step 7: Admin reads Case A -> MUST SUCCEED with 200 OK', async () => {
    const res = await app.request(`/api/cases/${caseAId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.case.id).toBe(caseAId);
    expect(body.case.title).toBe('Case Alpha - Arctic Echo');
  });

  it('Step 8: Admin reads Case B -> MUST SUCCEED with 200 OK', async () => {
    const res = await app.request(`/api/cases/${caseBId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.case.id).toBe(caseBId);
    expect(body.case.title).toBe('Case Beta - Obsidian Raven');
  });

  it('Admin lists all cases and sees both Case A and Case B', async () => {
    const res = await app.request('/api/cases', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.cases.length).toBe(2);
    const ids = body.cases.map((c: any) => c.id);
    expect(ids).toContain(caseAId);
    expect(ids).toContain(caseBId);
  });

  // ---------------------------------------------------------------------------
  // Unauthenticated Requests (Must return HTTP 401 Unauthorized)
  // ---------------------------------------------------------------------------
  it('Step 9: Unauthenticated request to GET /api/cases/:id -> MUST FAIL with 401 Unauthorized', async () => {
    const res = await app.request(`/api/cases/${caseAId}`, {
      method: 'GET',
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error).toBe('Unauthorized');
    expect(body.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('Unauthenticated request to GET /api/cases -> MUST FAIL with 401 Unauthorized', async () => {
    const res = await app.request('/api/cases', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
  });

  it('Request with corrupted token -> MUST FAIL with 401 Unauthorized', async () => {
    const res = await app.request(`/api/cases/${caseAId}`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.code).toBe('AUTH_INVALID_TOKEN');
  });

  // ---------------------------------------------------------------------------
  // Dossier Creation & Sub-Resource RBAC
  // ---------------------------------------------------------------------------
  it('Investigator A attaches synthetic dossier to Case A', async () => {
    const res = await app.request(`/api/cases/${caseAId}/dossiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorAToken}`,
      },
      body: JSON.stringify({
        seed: 'target-frost-99',
        fullName: 'Dr. Gregory House',
        nationality: 'US',
        generatorParams: { ageRange: [35, 55] },
        dossierData: { note: 'Synthetic medical consultant profile' },
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.dossier).toBeDefined();
    expect(body.dossier.caseId).toBe(caseAId);
    expect(body.dossier.seed).toBe('target-frost-99');
    dossierAId = body.dossier.id;
  });

  it('Investigator B attempts to attach dossier to Case A -> MUST FAIL with 403 Forbidden', async () => {
    const res = await app.request(`/api/cases/${caseAId}/dossiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorBToken}`,
      },
      body: JSON.stringify({
        seed: 'unauthorized-seed',
        fullName: 'Intruder Profile',
        nationality: 'US',
      }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  it('Investigator B attempts to read dossiers of Case A -> MUST FAIL with 403 Forbidden', async () => {
    const res = await app.request(`/api/cases/${caseAId}/dossiers`, {
      headers: { Authorization: `Bearer ${investigatorBToken}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  it('Admin reads dossiers of Case A -> MUST SUCCEED with 200 OK', async () => {
    const res = await app.request(`/api/cases/${caseAId}/dossiers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.dossiers).toBeDefined();
    expect(body.dossiers.length).toBe(1);
    expect(body.dossiers[0].id).toBe(dossierAId);
  });

  // ---------------------------------------------------------------------------
  // Evidence Ledger RBAC
  // ---------------------------------------------------------------------------
  it('Investigator A attaches evidence to Case A', async () => {
    const res = await app.request(`/api/cases/${caseAId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorAToken}`,
      },
      body: JSON.stringify({
        title: 'Network Packet Capture Artifact',
        type: 'network_artifact',
        content: 'TCP handshake analysis on port 443',
        sourceUrl: 'https://osint.netra.local/pcap/1',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.evidence.caseId).toBe(caseAId);
  });

  it('Investigator B attempts to attach evidence to Case A -> MUST FAIL with 403 Forbidden', async () => {
    const res = await app.request(`/api/cases/${caseAId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorBToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Evidence Artifact',
        type: 'document',
        content: 'Tampered intelligence file',
      }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // End-to-End Case Detail Hierarchy (Case + Dossier + Evidence)
  // ---------------------------------------------------------------------------
  it('Investigator A retrieves full Case Detail with nested dossiers and evidence', async () => {
    const res = await app.request(`/api/cases/${caseAId}`, {
      headers: { Authorization: `Bearer ${investigatorAToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.case.id).toBe(caseAId);
    expect(body.dossiers.length).toBe(1);
    expect(body.evidence.length).toBe(1);
  });
});
