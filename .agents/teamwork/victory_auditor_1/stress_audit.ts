import { generateIdentity, verifyDeterminism } from '../../../src/generator/index.js';
import { app } from '../../../src/server/index.js';
import { createInMemoryDb, setGlobalTestDb } from '../../../src/server/db/client.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { signJWT } from '../../../src/server/auth/jwt.js';

async function runAdversarialAudit() {
  console.log('--- 1. Testing Generator Determinism & Snapshot ---');
  const snapshotPath = resolve(process.cwd(), 'tests/fixtures/snapshot-seed-42.json');
  const expectedSnapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
  const actualGenerated = generateIdentity({
    seed: 'seed-42',
    nationality: 'US',
    ageRange: [30, 45],
    occupationCategory: 'cybersecurity',
    riskLevel: 'high',
    complexity: 'standard'
  });

  const snapshotMatch = JSON.stringify(expectedSnapshot) === JSON.stringify(actualGenerated);
  if (!snapshotMatch) {
    throw new Error('Adversarial Check Failed: Snapshot mismatch!');
  }
  console.log('✓ Snapshot match verified bit-for-bit.');

  // Test 100-run reproducibility on arbitrary seed
  const testSeeds = ['AUDIT_RANDOM_SEED_999', '日本語テスト', '🛡️⚡', -987654321];
  for (const s of testSeeds) {
    const isReproducible = verifyDeterminism(s, 100);
    if (!isReproducible) {
      throw new Error(`Adversarial Check Failed: Reproducibility failed for seed ${s}`);
    }
  }
  console.log('✓ 100-run deep equality verified for 4 diverse seeds.');

  console.log('--- 2. Testing RBAC Isolation & Cryptographic Boundary ---');
  const schemaPath = resolve(process.cwd(), 'migrations/0001_initial_schema.sql');
  const db = createInMemoryDb(readFileSync(schemaPath, 'utf-8'));
  setGlobalTestDb(db);

  // Register User 1
  const reg1 = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'auditor1@netra.local',
      password: 'AuditPassword123!',
      fullName: 'Auditor One',
      role: 'investigator'
    })
  });
  const data1 = await reg1.json() as any;
  const token1 = data1.token;
  const user1Id = data1.user.id;

  // Register User 2
  const reg2 = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'auditor2@netra.local',
      password: 'AuditPassword456!',
      fullName: 'Auditor Two',
      role: 'investigator'
    })
  });
  const data2 = await reg2.json() as any;
  const token2 = data2.token;

  // User 1 creates Case 1
  const caseRes = await app.request('/api/cases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      title: 'Auditor Case 1',
      description: 'Test case for isolation check',
      priority: 'high'
    })
  });
  const caseData = await caseRes.json() as any;
  const caseId = caseData.case.id;

  // User 2 attempts to access User 1's Case
  const crossAccess = await app.request(`/api/cases/${caseId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token2}` }
  });
  if (crossAccess.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cross-user case access, got ${crossAccess.status}`);
  }
  console.log('✓ RBAC strictly returned HTTP 403 on cross-user case access.');

  // Tampered token test (forged payload with role admin signed with wrong secret)
  const forgedToken = await signJWT({
    sub: user1Id,
    email: 'auditor1@netra.local',
    role: 'admin',
    fullName: 'Auditor One'
  }, 'WRONG_SECRET_KEY_1234567890');

  const forgedAccess = await app.request(`/api/cases/${caseId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${forgedToken}` }
  });
  if (forgedAccess.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for forged token, got ${forgedAccess.status}`);
  }
  console.log('✓ Tampered JWT token with forged admin role rejected with HTTP 401.');

  setGlobalTestDb(null);
  console.log('=== ALL ADVERSARIAL STRESS CHECKS PASSED ===');
}

runAdversarialAudit().catch((err) => {
  console.error('FATAL ADVERSARIAL AUDIT FAILURE:', err);
  process.exit(1);
});
