## 2026-10-27T04:27:18Z

You are m4_worker_1 (Dark Intelligence Dashboard UI Worker).
Your working directory is F:\antig\netra\.agents\teamwork\m4_worker_1.
Project root is F:\antig\netra.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY READ FIRST:
1. F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md
2. F:\antig\netra\.agents\teamwork\orchestrator_1\PROJECT.md
3. F:\antig\netra\.agents\teamwork\survey_explorer_1\handoff.md (Sections 5.1 & 5.2 on Tactical OSINT theme, colors, and UI layout)
4. F:\antig\netra\.agents\teamwork\m2_worker_2\handoff.md (Backend endpoints and D1 data structures)

Your Exclusive File Ownership:
- src/client/
- index.html
- dist/client/ (build output)

Step-by-Step Tasks:
1. Implement client styling in `src/client/index.css`:
   - Dark Intelligence tactical OSINT theme (background #070A0F, surface #0D121D, grid #1E293B, accents #00F0FF, #10B981, #F59E0B, #EF4444).
   - Glassmorphic panels, tactical badges, and monospace styling.
2. Implement API Client in `src/client/api/client.ts`:
   - Full typed client calling backend /api/* routes (health, auth, cases, dossiers, evidence, notes, timelines).
   - Uses Bearer JWT from localStorage.
3. Implement `src/client/context/AuthContext.tsx`:
   - Session state, login, logout, register, quick demo user switcher (Investigator / Admin).
4. Implement UI components:
   - `src/client/components/layout/Header.tsx`, `Sidebar.tsx`.
   - `src/client/components/graph/NetworkGraphView.tsx`: Interactive Canvas/SVG relationship graph rendering nodes and directed labeled edges with weights, pan/zoom, and node inspector drawer.
   - `src/client/components/timeline/TimelineView.tsx`: Chronological tactical event stream with category filters and severity badges.
   - `src/client/components/dossier/DossierInspector.tsx`: 12-domain inspector cards (Demographics, Physical, Address, Telecom, National IDs, Career, Financial/Crypto, Digital, Assets).
   - `src/client/components/evidence/EvidenceLedger.tsx`: Evidence ledger with SHA-256 hashes and chain of custody.
   - `src/client/components/notes/NotesEditor.tsx`: Markdown investigation notes editor.
   - `src/client/components/report/ExecutiveReportModal.tsx`: Formatted printable intelligence briefing exporter.
5. Implement Views:
   - `src/client/views/LoginView.tsx`
   - `src/client/views/GeneratorView.tsx`: Identity Generator Studio (Seed, randomize button, locale picker, age slider, live JSON preview, attach to case modal).
   - `src/client/views/CaseListView.tsx`: Case management list & create case modal.
   - `src/client/views/CaseDetailView.tsx`: Full investigation workspace with tabs for Overview, Graph, Timeline, Evidence, Notes, and Briefing export.
   - `src/client/views/AuditLogView.tsx`: Admin audit log viewer.
6. Assemble `src/client/App.tsx` and `src/client/main.tsx`.
7. Verify build: run `npm run build:client` (`vite build`) and verify it compiles cleanly to `dist/client/`.
8. Verify tests: run `npm test` and `npx tsc --noEmit` and ensure all tests continue to pass 100%.
9. Write comprehensive handoff report to `F:\antig\netra\.agents\teamwork\m4_worker_1\handoff.md` and message orchestrator.
