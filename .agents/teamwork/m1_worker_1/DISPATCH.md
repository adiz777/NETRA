## 2026-10-27T02:50:32Z
You are m1_worker_1 (Scaffolding & Synthetic Identity Generator Worker).
Your working directory is F:\antig\netra\.agents\teamwork\m1_worker_1.
Project root is F:\antig\netra.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY READ FIRST:
1. F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md
2. F:\antig\netra\.agents\teamwork\orchestrator_1\PROJECT.md
3. F:\antig\netra\.agents\teamwork\m1_explorer_1\handoff.md
4. F:\antig\netra\.agents\teamwork\m1_explorer_2\handoff.md
5. F:\antig\netra\.agents\teamwork\m1_explorer_3\handoff.md

Reference Assets Ready for Direct Deployment:
- F:\antig\netra\.agents\teamwork\m1_explorer_3\proposed_dossier_schema.ts -> use for src/shared/schemas/dossier.ts
- F:\antig\netra\.agents\teamwork\m1_explorer_3\proposed_dossier_types.ts -> use for src/shared/types/dossier.ts
- F:\antig\netra\.agents\teamwork\m1_explorer_3\proposed_unit_tests.md -> use for tests/unit/
- F:\antig\netra\.agents\teamwork\m1_explorer_2\proposed_snapshot_seed_42.json -> reference snapshot

Your Exclusive File Ownership:
- Root config files: .gitignore, package.json, tsconfig.json, vite.config.ts, vitest.config.ts, wrangler.jsonc, tailwind.config.js, postcss.config.js, index.html
- src/shared/
- src/generator/
- tests/fixtures/
- tests/unit/

Step-by-Step Task:
1. Initialize git repo if needed (git init).
2. Create all root configuration files (package.json with better-sqlite3@^13.0.3 and vitest@^3.0.5 per m1_explorer_1, tsconfig.json with path aliases, vite.config.ts, vitest.config.ts, wrangler.jsonc, tailwind.config.js, postcss.config.js, index.html, .gitignore).
3. Run `npm install` in F:\antig\netra and verify clean completion.
4. Implement `src/shared/schemas/dossier.ts` and `src/shared/types/dossier.ts`.
5. Implement `src/generator/`:
   - prng/murmur3.ts (32-bit MurmurHash3 with Math.imul and TextEncoder)
   - prng/mulberry32.ts (Mulberry32 stateful generator with next, nextInt, pick, sample, fork)
   - prng/domain_isolation.ts (derives isolated sub-seeds)
   - catalogs/ (names, addresses, companies, cyber, assets for US, GB, DE, IN, JP, CA, EE)
   - domains/ (12 domain generators: demographics, physical, addresses, communications, governmentIds, careerEducation, financial, digitalFootprint, assets, networkGraph, timeline, meta)
   - engine.ts (reference epoch 2026-10-27T00:00:00.000Z, option canonicalization, dossier assembly)
   - index.ts (public API: generateIdentity, verifyDeterminism)
6. Create `tests/fixtures/snapshot-seed-42.json` and all unit test files in `tests/unit/`:
   - tests/unit/prng.test.ts
   - tests/unit/generator-snapshot.test.ts (R1 Verification #1)
   - tests/unit/generator-reproducibility.test.ts (R1 Verification #2, C1 100-run deep equality)
   - tests/unit/generator-entropy.test.ts
   - tests/unit/generator-conditioning.test.ts
   - tests/unit/dossier-schema.test.ts
   - tests/unit/domain-coherence.test.ts
7. Run `npx tsc --noEmit` and `npm test` (`npx vitest run tests/unit`).
8. Assert 100% of unit tests pass with exit code 0.
9. Write a comprehensive handoff report to F:\antig\netra\.agents\teamwork\m1_worker_1\handoff.md documenting all created files, commands executed, and verification output.
10. Send a message to orchestrator upon completion.
