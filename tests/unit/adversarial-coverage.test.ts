/**
 * NETRA Tier 5 Adversarial Coverage Hardening Test Suite
 * Path: tests/unit/adversarial-coverage.test.ts
 *
 * Requirements: Tier 5 from TEST_INFRA.md and DISPATCH.md
 * White-box fuzzing, boundary value analysis, temporal clamping,
 * JWT cryptographic edge cases, and cryptographic tamper detection.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateIdentity } from '@generator/engine.js';
import { REFERENCE_EPOCH, REFERENCE_TIMESTAMP_MS } from '@generator/constants.js';
import { GeneratorOptionsSchema } from '@shared/schemas/dossier.js';
import { signJWT, verifyJWT } from '@server/auth/jwt.js';
import { authMiddleware, JWT_SECRET_DEFAULT } from '@server/middleware/auth.js';
import { createInMemoryDb, setGlobalTestDb, type IDatabase } from '@server/db/client.js';
import { EvidenceRepository } from '@server/db/evidence.repo.js';
import { CasesRepository } from '@server/db/cases.repo.js';
import { UsersRepository } from '@server/db/users.repo.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Hono } from 'hono';

describe('Tier 5 Adversarial Coverage Hardening', () => {
  let db: IDatabase;

  beforeAll(async () => {
    const migrationPath = resolve(process.cwd(), 'migrations/0001_initial_schema.sql');
    const schemaSql = readFileSync(migrationPath, 'utf-8');
    db = createInMemoryDb(schemaSql);
    setGlobalTestDb(db);
  });

  afterAll(() => {
    setGlobalTestDb(null);
  });

  // ===========================================================================
  // 1. Seed Boundary & White-box Fuzzing
  // ===========================================================================
  describe('1. Seed Boundary & Exotic Seed Fuzzing', () => {
    it('rejects empty string seed with Zod validation error', () => {
      expect(() => {
        GeneratorOptionsSchema.parse({ seed: '' });
      }).toThrow();
    });

    it('handles 10,000-character extreme string seed deterministically', () => {
      const longSeed = 'NETRA_EXTREME_SEED_'.repeat(550); // > 10,000 characters
      const dossierA = generateIdentity({ seed: longSeed });
      const dossierB = generateIdentity({ seed: longSeed });

      expect(dossierA.meta.seed).toBe(longSeed);
      expect(dossierA).toEqual(dossierB);
      expect(dossierA.personal.legalFullName).toBeTruthy();
    });

    it('handles multilingual, Kanji, Cyrillic, and Emoji seeds safely and deterministically', () => {
      const exoticSeeds = [
        'サイバー脅威分析_2026_種',
        'Синтетический_Профиль_ГРУ_007',
        'التحقيق_الجنائي_الرقمي_٢٠٢٦',
        '🕵️‍♂️🔐🛡️⚡💥🛸',
        'Special!@#$%^&*()_+-=[]{}|;:",.<>?/~`\\',
      ];

      for (const seed of exoticSeeds) {
        const d1 = generateIdentity({ seed });
        const d2 = generateIdentity({ seed });
        expect(d1.meta.seed).toBe(seed);
        expect(d1).toEqual(d2);
      }
    });

    it('handles whitespace-only seeds deterministically', () => {
      const spaceSeed = '   \t\r\n   ';
      const d1 = generateIdentity({ seed: spaceSeed });
      const d2 = generateIdentity({ seed: spaceSeed });
      expect(d1.meta.seed).toBe(spaceSeed);
      expect(d1).toEqual(d2);
    });

    it('handles SQL injection and directory traversal strings as inert literal seeds', () => {
      const attackSeeds = [
        "' OR '1'='1' --",
        "'; DROP TABLE dossiers; --",
        "../../../../../../etc/passwd",
        "<script>alert('xss')</script>",
        "{{7*7}}",
        "seed\0nullbyte",
      ];

      for (const seed of attackSeeds) {
        const dossier = generateIdentity({ seed });
        expect(dossier.meta.seed).toBe(seed);
        expect(dossier.personal.legalFullName).toBeTruthy();
      }
    });

    it('handles numeric seeds by converting to string representation', () => {
      const d1 = generateIdentity({ seed: 0 as any });
      const d2 = generateIdentity({ seed: -4242 as any });
      const d3 = generateIdentity({ seed: 999999999 as any });

      expect(d1.meta.seed).toBe('0');
      expect(d2.meta.seed).toBe('-4242');
      expect(d3.meta.seed).toBe('999999999');
    });
  });

  // ===========================================================================
  // 2. Age Range & Parameter Boundaries
  // ===========================================================================
  describe('2. Parameter Boundaries (Age, Nationality, Enums)', () => {
    it('produces exactly age 18 when constrained to [18, 18]', () => {
      const dossier = generateIdentity({ seed: 'min-age-test', ageRange: [18, 18] });
      expect(dossier.personal.age).toBe(18);
      const birthYear = parseInt(dossier.personal.dateOfBirth.split('-')[0], 10);
      expect(birthYear).toBe(2008);
    });

    it('produces exactly age 100 when constrained to [100, 100]', () => {
      const dossier = generateIdentity({ seed: 'max-age-test', ageRange: [100, 100] });
      expect(dossier.personal.age).toBe(100);
      const birthYear = parseInt(dossier.personal.dateOfBirth.split('-')[0], 10);
      expect(birthYear).toBe(1926);
    });

    it('rejects age below 18 (e.g. 17)', () => {
      expect(() => {
        GeneratorOptionsSchema.parse({ ageRange: [17, 30] });
      }).toThrow();
    });

    it('rejects age above 100 (e.g. 101)', () => {
      expect(() => {
        GeneratorOptionsSchema.parse({ ageRange: [30, 101] });
      }).toThrow();
    });

    it('rejects inverted ageRange where min > max', () => {
      expect(() => {
        GeneratorOptionsSchema.parse({ ageRange: [65, 25] });
      }).toThrow();
    });

    it('rejects non-integer ages (e.g. 25.5)', () => {
      expect(() => {
        GeneratorOptionsSchema.parse({ ageRange: [25.5, 40] });
      }).toThrow();
    });

    it('rejects invalid nationality not in the supported catalogue', () => {
      expect(() => {
        GeneratorOptionsSchema.parse({ nationality: 'FR' as any });
      }).toThrow();

      expect(() => {
        GeneratorOptionsSchema.parse({ nationality: 'INVALID' as any });
      }).toThrow();
    });

    it('rejects invalid enums for riskLevel, gender, and complexity', () => {
      expect(() => {
        GeneratorOptionsSchema.parse({ riskLevel: 'extreme' as any });
      }).toThrow();

      expect(() => {
        GeneratorOptionsSchema.parse({ gender: 'alien' as any });
      }).toThrow();

      expect(() => {
        GeneratorOptionsSchema.parse({ complexity: 'ultra' as any });
      }).toThrow();
    });
  });

  // ===========================================================================
  // 3. Temporal Coherence & Reference Epoch Clamping
  // ===========================================================================
  describe('3. Temporal Coherence & Reference Epoch Clamping (<= 2026-10-27)', () => {
    it('strictly clamps meta.generatedAt to REFERENCE_EPOCH', () => {
      const seeds = ['epoch-1', 'epoch-2', 'epoch-3'];
      for (const seed of seeds) {
        const dossier = generateIdentity({ seed });
        expect(dossier.meta.generatedAt).toBe(REFERENCE_EPOCH);
        expect(new Date(dossier.meta.generatedAt).getTime()).toBe(REFERENCE_TIMESTAMP_MS);
      }
    });

    it('guarantees all timeline events are strictly <= REFERENCE_EPOCH across multiple locales and seeds', () => {
      const nationalities = ['US', 'GB', 'DE', 'IN', 'JP', 'CA', 'EE'] as const;
      const seeds = ['alpha-9', 'bravo-8', 'charlie-7', 'delta-6'];

      for (const nat of nationalities) {
        for (const seed of seeds) {
          const dossier = generateIdentity({ seed: `${nat}-${seed}`, nationality: nat });
          const events = dossier.timeline.events;

          expect(events.length).toBeGreaterThan(0);

          for (const ev of events) {
            const eventMs = new Date(ev.timestamp).getTime();
            expect(eventMs).toBeLessThanOrEqual(REFERENCE_TIMESTAMP_MS);
          }

          // Check that timeline is chronologically sorted
          for (let i = 0; i < events.length - 1; i++) {
            const currentMs = new Date(events[i].timestamp).getTime();
            const nextMs = new Date(events[i + 1].timestamp).getTime();
            expect(currentMs).toBeLessThanOrEqual(nextMs);
          }
        }
      }
    });

    it('guarantees subject dateOfBirth, career start, and residence dates are historically prior to epoch', () => {
      const dossier = generateIdentity({ seed: 'chronology-audit' });

      const dobMs = new Date(dossier.personal.dateOfBirth).getTime();
      expect(dobMs).toBeLessThan(REFERENCE_TIMESTAMP_MS);

      const jobStartMs = new Date(dossier.careerAndEducation.current.startDate).getTime();
      expect(jobStartMs).toBeLessThanOrEqual(REFERENCE_TIMESTAMP_MS);

      const residenceMs = new Date(dossier.addresses.current.residenceSince).getTime();
      expect(residenceMs).toBeLessThanOrEqual(REFERENCE_TIMESTAMP_MS);

      // Education graduation years must be <= 2026
      for (const edu of dossier.careerAndEducation.education) {
        expect(edu.graduationYear).toBeLessThanOrEqual(2026);
      }
    });
  });

  // ===========================================================================
  // 4. Authentication & JWT Cryptographic Edge Cases
  // ===========================================================================
  describe('4. Authentication & JWT Adversarial Edge Cases', () => {
    const validSecret = JWT_SECRET_DEFAULT;

    it('rejects completely malformed tokens', async () => {
      expect(await verifyJWT('', validSecret)).toBeNull();
      expect(await verifyJWT('not-a-token', validSecret)).toBeNull();
      expect(await verifyJWT('single-part-token', validSecret)).toBeNull();
      expect(await verifyJWT('part1.part2', validSecret)).toBeNull();
      expect(await verifyJWT('part1.part2.part3.part4', validSecret)).toBeNull();
      expect(await verifyJWT('..', validSecret)).toBeNull();
    });

    it('detects tampered signature bytes and rejects token', async () => {
      const validToken = await signJWT(
        {
          sub: 'usr_test_1',
          email: 'agent@netra.local',
          role: 'investigator',
          fullName: 'Test Agent',
        },
        validSecret
      );

      const [header, payload, signature] = validToken.split('.');

      // Corrupt the signature by modifying characters
      const corruptedSig = signature.slice(0, -2) + (signature.endsWith('a') ? 'b' : 'a');
      const tamperedToken = `${header}.${payload}.${corruptedSig}`;

      const verified = await verifyJWT(tamperedToken, validSecret);
      expect(verified).toBeNull();
    });

    it('detects tampered payload claims with original signature', async () => {
      const validToken = await signJWT(
        {
          sub: 'usr_test_1',
          email: 'agent@netra.local',
          role: 'investigator',
          fullName: 'Test Agent',
        },
        validSecret
      );

      const [header, payload, signature] = validToken.split('.');

      // Elevate role from investigator to admin in payload
      const payloadDecoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
      payloadDecoded.role = 'admin';
      const tamperedPayload = Buffer.from(JSON.stringify(payloadDecoded)).toString('base64url');
      const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

      const verified = await verifyJWT(tamperedToken, validSecret);
      expect(verified).toBeNull();
    });

    it('detects and rejects expired tokens', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredToken = await signJWT(
        {
          sub: 'usr_test_expired',
          email: 'expired@netra.local',
          role: 'investigator',
          fullName: 'Expired Agent',
          iat: now - 7200,
          exp: now - 3600, // Expired 1 hour ago
        },
        validSecret
      );

      const verified = await verifyJWT(expiredToken, validSecret);
      expect(verified).toBeNull();
    });

    it('rejects tokens forged using an adversary secret key', async () => {
      const adversarySecret = 'attacker-private-forged-key-2026';
      const forgedToken = await signJWT(
        {
          sub: 'usr_attacker',
          email: 'attacker@evil.corp',
          role: 'admin',
          fullName: 'Malicious Admin',
        },
        adversarySecret
      );

      const verified = await verifyJWT(forgedToken, validSecret);
      expect(verified).toBeNull();
    });

    it('enforces HTTP 401 on missing, empty, or non-Bearer authorization headers', async () => {
      const testApp = new Hono();
      testApp.use('/protected', authMiddleware);
      testApp.get('/protected', (c) => c.json({ ok: true }));

      // Missing header
      const r1 = await testApp.request('/protected');
      expect(r1.status).toBe(401);
      const b1 = (await r1.json()) as any;
      expect(b1.code).toBe('AUTH_UNAUTHORIZED');

      // Basic auth instead of Bearer
      const r2 = await testApp.request('/protected', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      expect(r2.status).toBe(401);
      const b2 = (await r2.json()) as any;
      expect(b2.code).toBe('AUTH_UNAUTHORIZED');

      // Empty Bearer token
      const r3 = await testApp.request('/protected', {
        headers: { Authorization: 'Bearer ' },
      });
      expect(r3.status).toBe(401);
      const b3 = (await r3.json()) as any;
      expect(['AUTH_UNAUTHORIZED', 'AUTH_INVALID_TOKEN']).toContain(b3.code);

      // Corrupted Bearer token
      const r4 = await testApp.request('/protected', {
        headers: { Authorization: 'Bearer corrupt.token.signature' },
      });
      expect(r4.status).toBe(401);
      const b4 = (await r4.json()) as any;
      expect(b4.code).toBe('AUTH_INVALID_TOKEN');
    });
  });

  // ===========================================================================
  // 5. Cryptographic Evidence SHA-256 Tamper Detection
  // ===========================================================================
  describe('5. Evidence Ledger SHA-256 Cryptographic Tamper Detection', () => {
    async function computeDigest(text: string): Promise<string> {
      const enc = new TextEncoder();
      const digestBuf = await crypto.subtle.digest('SHA-256', enc.encode(text));
      return Array.from(new Uint8Array(digestBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    it('demonstrates cryptographic avalanche effect on single-character alteration', async () => {
      const originalPayload = 'TRANSACTION_ID=90842;AMOUNT=500000;DEST=OFFSHORE_ACC_9921';
      const tamperedPayload = 'TRANSACTION_ID=90842;AMOUNT=500001;DEST=OFFSHORE_ACC_9921'; // single digit change

      const originalHash = await computeDigest(originalPayload);
      const tamperedHash = await computeDigest(tamperedPayload);

      expect(originalHash).toHaveLength(64);
      expect(tamperedHash).toHaveLength(64);
      expect(originalHash).not.toBe(tamperedHash);

      // Verify widespread avalanche divergence in hex representation
      let differingChars = 0;
      for (let i = 0; i < 64; i++) {
        if (originalHash[i] !== tamperedHash[i]) differingChars++;
      }
      expect(differingChars).toBeGreaterThan(25); // > 40% char difference
    });

    it('verifies EvidenceRepository computes and validates SHA-256 integrity digest correctly', async () => {
      const usersRepo = new UsersRepository(db);
      const casesRepo = new CasesRepository(db);
      const evidenceRepo = new EvidenceRepository(db);

      const auditUser = await usersRepo.createUser({
        email: 'usr_audit_lead@netra.local',
        passwordHash: 'pbkdf2$mockhash',
        fullName: 'Audit Lead Agent',
      });

      const parentCase = await casesRepo.createCase({
        title: 'Tamper Evidence Test Case',
        ownerId: auditUser.id,
        priority: 'high',
        status: 'active',
      });

      const rawContent = 'CLASSIFIED_SATELLITE_DOWNLINK_RAW_PACKET_2026';
      const expectedDigest = await computeDigest(rawContent);

      const created = await evidenceRepo.createEvidence({
        caseId: parentCase.id,
        title: 'Cryptographic Test Artifact',
        type: 'network_artifact',
        content: rawContent,
      });

      expect(created.hashSha256).toBe(expectedDigest);

      // Query database directly to confirm persisted hash
      const retrieved = await evidenceRepo.findById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.hashSha256).toBe(expectedDigest);

      // Attempting to match with tampered payload content must fail verification
      const tamperedDigest = await computeDigest(rawContent + '_TAMPERED');
      expect(retrieved?.hashSha256).not.toBe(tamperedDigest);
    });
  });
});
