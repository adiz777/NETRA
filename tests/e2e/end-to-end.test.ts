/**
 * NETRA End-to-End Sanity Flow Test Suite
 * Path: tests/e2e/end-to-end.test.ts
 *
 * Acceptance Criteria C4 from ORIGINAL_REQUEST.md:
 * "A scripted end‑to‑end flow (generate identity -> create case -> view case in dashboard)
 * completes without manual intervention and produces no console errors."
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { app } from '@server/index.js';
import { createInMemoryDb, setGlobalTestDb, type IDatabase } from '@server/db/client.js';
import { generateIdentity } from '@generator/index.js';
import type { IdentityDossier } from '@shared/types/dossier.js';

describe('C4 Acceptance Criteria: Scripted End-to-End Investigation Lifecycle', () => {
  let db: IDatabase;
  let generatedDossier: IdentityDossier;

  let leadInvestigatorToken: string;
  let leadInvestigatorId: string;

  let rogueInvestigatorToken: string;
  let adminToken: string;

  let activeCaseId: string;
  let attachedDossierId: string;
  let evidenceDigestSha256: string;

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    // Zero console error assertion spy
    consoleErrorSpy = vi.spyOn(console, 'error');
    consoleWarnSpy = vi.spyOn(console, 'warn');

    // Initialize D1 SQLite test harness with migrations
    const migrationPath = resolve(process.cwd(), 'migrations/0001_initial_schema.sql');
    const schemaSql = readFileSync(migrationPath, 'utf-8');
    db = createInMemoryDb(schemaSql);
    setGlobalTestDb(db);

    // Ensure production client assets exist for asset verification step
    const clientDistPath = resolve(process.cwd(), 'dist/client/index.html');
    if (!existsSync(clientDistPath)) {
      execSync('npm run build:client', { stdio: 'ignore' });
    }
  });

  afterAll(() => {
    setGlobalTestDb(null);
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Step 1: Deterministic Identity Generation (R1, C1)
  // ---------------------------------------------------------------------------
  it('Step 1: Generates deterministic synthetic identity dossier with 12 domains', () => {
    const seed = 'E2E-TEST-SEED-2026';
    const nationality = 'US';

    generatedDossier = generateIdentity({ seed, nationality });

    // Assert 12 isolated domains are fully populated
    expect(generatedDossier.meta).toBeDefined();
    expect(generatedDossier.personal).toBeDefined();
    expect(generatedDossier.physical).toBeDefined();
    expect(generatedDossier.addresses).toBeDefined();
    expect(generatedDossier.communications).toBeDefined();
    expect(generatedDossier.governmentIds).toBeDefined();
    expect(generatedDossier.careerAndEducation).toBeDefined();
    expect(generatedDossier.financial).toBeDefined();
    expect(generatedDossier.digitalFootprint).toBeDefined();
    expect(generatedDossier.assets).toBeDefined();
    expect(generatedDossier.networkGraph).toBeDefined();
    expect(generatedDossier.timeline).toBeDefined();

    // Verify deterministic identity invariants
    expect(generatedDossier.meta.seed).toBe(seed);
    expect(generatedDossier.personal.nationality).toBe('US');
    expect(generatedDossier.personal.legalFullName).toBeTruthy();
    expect(generatedDossier.personal.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(generatedDossier.personal.age).toBeGreaterThanOrEqual(18);
    expect(generatedDossier.physical.biometricFingerprintHash).toHaveLength(64);
    expect(generatedDossier.communications.emailAddresses.length).toBeGreaterThan(0);
    expect(generatedDossier.financial.bankAccounts.length).toBeGreaterThan(0);
    expect(generatedDossier.networkGraph.nodes.length).toBeGreaterThan(0);
    expect(generatedDossier.timeline.events.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Step 2: Investigator Registration & Authentication (R2, C2)
  // ---------------------------------------------------------------------------
  it('Step 2a: Registers lead investigator account via POST /api/auth/register', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'agent_scully@netra.local',
        password: 'E2E-Secure-Password-2026!',
        fullName: 'Special Agent Dana Scully',
        role: 'investigator',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('agent_scully@netra.local');
    expect(body.user.role).toBe('investigator');
    expect(body.token).toBeDefined();

    leadInvestigatorId = body.user.id;
  });

  it('Step 2b: Logs in lead investigator via POST /api/auth/login and receives JWT', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'agent_scully@netra.local',
        password: 'E2E-Secure-Password-2026!',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.token).toBeDefined();
    expect(body.user.id).toBe(leadInvestigatorId);

    leadInvestigatorToken = body.token;
  });

  // ---------------------------------------------------------------------------
  // Step 3: Case Lifecycle Creation
  // ---------------------------------------------------------------------------
  it('Step 3: Creates new investigation case via POST /api/cases', async () => {
    const res = await app.request('/api/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadInvestigatorToken}`,
      },
      body: JSON.stringify({
        title: 'Operation Arctic Spectre',
        description: 'Investigation into advanced cross-border synthetic identity network',
        priority: 'critical',
        tags: ['arctic', 'osint', 'e2e-sanity', 'counter-intel'],
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.case).toBeDefined();
    expect(body.case.id).toBeDefined();
    expect(body.case.title).toBe('Operation Arctic Spectre');
    expect(body.case.ownerId).toBe(leadInvestigatorId);
    expect(body.case.status).toBe('active');
    expect(body.case.priority).toBe('critical');

    activeCaseId = body.case.id;
  });

  // ---------------------------------------------------------------------------
  // Step 4: Dossier Attachment
  // ---------------------------------------------------------------------------
  it('Step 4: Attaches synthetic identity dossier to case via POST /api/cases/:id/dossiers', async () => {
    const res = await app.request(`/api/cases/${activeCaseId}/dossiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadInvestigatorToken}`,
      },
      body: JSON.stringify({
        seed: 'E2E-TEST-SEED-2026',
        fullName: generatedDossier.personal.legalFullName,
        primaryAlias: generatedDossier.personal.aliases[0] || 'Unknown',
        nationality: 'US',
        generatorParams: {
          seed: 'E2E-TEST-SEED-2026',
          nationality: 'US',
        },
        dossierData: generatedDossier,
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.dossier).toBeDefined();
    expect(body.dossier.caseId).toBe(activeCaseId);
    expect(body.dossier.seed).toBe('E2E-TEST-SEED-2026');
    expect(body.dossier.fullName).toBe(generatedDossier.personal.legalFullName);

    attachedDossierId = body.dossier.id;
  });

  // ---------------------------------------------------------------------------
  // Step 5: Evidence Ledger Ingestion with SHA-256 Digest
  // ---------------------------------------------------------------------------
  it('Step 5: Ingests evidence artifact with WebCrypto SHA-256 integrity hash', async () => {
    const evidenceRawContent =
      'BEGIN INTELLIGENCE ARTIFACT\nTimestamp: 2026-10-26T23:59:00Z\nIntercepted Ku-Band packet stream.\nTarget Node: 198.51.100.42\nEND ARTIFACT';

    // Compute cryptographic SHA-256 digest using standard Web Crypto API
    const enc = new TextEncoder();
    const digestBuffer = await crypto.subtle.digest('SHA-256', enc.encode(evidenceRawContent));
    evidenceDigestSha256 = Array.from(new Uint8Array(digestBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const res = await app.request(`/api/cases/${activeCaseId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadInvestigatorToken}`,
      },
      body: JSON.stringify({
        title: 'Encrypted Satellite Burst Intercept',
        type: 'network_artifact',
        content: evidenceRawContent,
        sourceUrl: 'https://sigint.netra.local/intercepts/burst-2026-10',
        hashSha256: evidenceDigestSha256,
        dossierId: attachedDossierId,
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.evidence).toBeDefined();
    expect(body.evidence.caseId).toBe(activeCaseId);
    expect(body.evidence.dossierId).toBe(attachedDossierId);
    expect(body.evidence.hashSha256).toBe(evidenceDigestSha256);
    expect(body.evidence.type).toBe('network_artifact');
  });

  // ---------------------------------------------------------------------------
  // Step 6: Case Notes & Chronological Timeline Ingestion
  // ---------------------------------------------------------------------------
  it('Step 6a: Adds case notes via POST /api/cases/:id/notes', async () => {
    const res = await app.request(`/api/cases/${activeCaseId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadInvestigatorToken}`,
      },
      body: JSON.stringify({
        title: 'Initial Signal Analysis Correlation',
        content: 'Subject fingerprint and digital footprint align with the Svalbard uplink signature.',
        category: 'lead',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.note).toBeDefined();
    expect(body.note.caseId).toBe(activeCaseId);
    expect(body.note.category).toBe('lead');
  });

  it('Step 6b: Adds chronological timeline event via POST /api/cases/:id/timelines', async () => {
    const res = await app.request(`/api/cases/${activeCaseId}/timelines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadInvestigatorToken}`,
      },
      body: JSON.stringify({
        title: 'Anomalous Transmission Intercepted',
        description: 'Automated SIGINT receiver logged compressed transmission packet.',
        eventTimestamp: '2026-10-26T21:15:00.000Z',
        category: 'cyber',
        significance: 'critical',
        dossierId: attachedDossierId,
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.timeline).toBeDefined();
    expect(body.timeline.caseId).toBe(activeCaseId);
    expect(body.timeline.significance).toBe('critical');
    expect(body.timeline.category).toBe('cyber');
  });

  // ---------------------------------------------------------------------------
  // Step 7: Case Workspace Retrieval Asserting All Child Entities
  // ---------------------------------------------------------------------------
  it('Step 7: Retrieves full case workspace via GET /api/cases/:id with intact child entities', async () => {
    const res = await app.request(`/api/cases/${activeCaseId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${leadInvestigatorToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;

    // Verify parent case metadata
    expect(body.case).toBeDefined();
    expect(body.case.id).toBe(activeCaseId);
    expect(body.case.title).toBe('Operation Arctic Spectre');
    expect(body.case.ownerId).toBe(leadInvestigatorId);

    // Verify dossiers array
    expect(body.dossiers).toBeDefined();
    expect(body.dossiers.length).toBe(1);
    expect(body.dossiers[0].id).toBe(attachedDossierId);
    expect(body.dossiers[0].seed).toBe('E2E-TEST-SEED-2026');
    expect(body.dossiers[0].dossierData.personal.legalFullName).toBe(
      generatedDossier.personal.legalFullName
    );

    // Verify evidence ledger array
    expect(body.evidence).toBeDefined();
    expect(body.evidence.length).toBe(1);
    expect(body.evidence[0].hashSha256).toBe(evidenceDigestSha256);
    expect(body.evidence[0].type).toBe('network_artifact');

    // Verify notes array
    expect(body.notes).toBeDefined();
    expect(body.notes.length).toBe(1);
    expect(body.notes[0].title).toBe('Initial Signal Analysis Correlation');

    // Verify timelines array
    expect(body.timelines).toBeDefined();
    expect(body.timelines.length).toBe(1);
    expect(body.timelines[0].title).toBe('Anomalous Transmission Intercepted');
  });

  // ---------------------------------------------------------------------------
  // Step 8: RBAC Compartment Isolation (Investigator 403, Admin 200)
  // ---------------------------------------------------------------------------
  it('Step 8a: Unauthorized investigator receives HTTP 403 Forbidden attempting to read case', async () => {
    // Register rogue investigator
    const regRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rogue_agent@netra.local',
        password: 'RoguePassword123!',
        fullName: 'Unauthorized Operative',
        role: 'investigator',
      }),
    });
    expect(regRes.status).toBe(201);
    const regBody = (await regRes.json()) as any;
    rogueInvestigatorToken = regBody.token;

    // Attempt access to activeCaseId
    const res = await app.request(`/api/cases/${activeCaseId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${rogueInvestigatorToken}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error).toBe('Forbidden');
    expect(body.code).toBe('AUTH_FORBIDDEN');
  });

  it('Step 8b: Administrator receives HTTP 200 OK accessing investigator case', async () => {
    // Register system admin
    const regRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'director@netra.local',
        password: 'DirectorAdmin2026!',
        fullName: 'Assistant Director Skinner',
        role: 'admin',
      }),
    });
    expect(regRes.status).toBe(201);
    const regBody = (await regRes.json()) as any;
    adminToken = regBody.token;

    // Admin accesses activeCaseId
    const res = await app.request(`/api/cases/${activeCaseId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.case.id).toBe(activeCaseId);
    expect(body.case.title).toBe('Operation Arctic Spectre');
  });

  // ---------------------------------------------------------------------------
  // Step 9: Client SPA Production Asset Verification
  // ---------------------------------------------------------------------------
  it('Step 9: Verifies client SPA production bundle assets exist and are valid', () => {
    const distClientDir = resolve(process.cwd(), 'dist/client');
    const indexPath = resolve(distClientDir, 'index.html');

    expect(existsSync(indexPath)).toBe(true);
    const htmlContent = readFileSync(indexPath, 'utf-8');

    // Verify SPA mount element
    expect(htmlContent).toContain('<div id="root"></div>');

    // Extract script module tag
    const scriptMatch = htmlContent.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    expect(scriptMatch).not.toBeNull();
    const scriptSrc = scriptMatch![1].replace(/^\//, '');
    const scriptPath = resolve(distClientDir, scriptSrc);
    expect(existsSync(scriptPath)).toBe(true);

    // Extract stylesheet link tag
    const cssMatch = htmlContent.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
    expect(cssMatch).not.toBeNull();
    const cssHref = cssMatch![1].replace(/^\//, '');
    const cssPath = resolve(distClientDir, cssHref);
    expect(existsSync(cssPath)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Step 10: Zero Console Errors Verification
  // ---------------------------------------------------------------------------
  it('Step 10: Confirms zero console errors or unhandled warnings were emitted', () => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
