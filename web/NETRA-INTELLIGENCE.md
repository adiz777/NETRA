# NETRA intelligence workspace — implementation notes

## Implemented in this branch

- Dashboard session validation uses the existing signed `netra_session` token.
- D1 schema at `migrations/0001_netra_intelligence.sql` for cases, evidence, timeline events, relationship edges, audit events and cached intelligence.
- `POST /api/intelligence`: passive domain DNS/certificate transparency lookup, public IP metadata, GitHub/GitLab public username checks, and optional Have I Been Pwned email breach checks.
- `POST /api/ai`: hosted analysis through OpenRouter; model is configurable.
- `POST /api/export`: JSON export.
- Dashboard page at `/dashboard/intelligence` combines lookups, AI analysis and export.
- `/dashboard/attack-surface` builds a passive relationship graph from the existing domain lookup: root domain, certificate-transparency names, and IPv4 DNS A answers. It supports node inspection and JSON export; it does not scan ports or prove that certificate-listed hosts are live.
- `/dashboard/data-quality` sends structured record fields to the existing AI endpoint for a context-aware consistency review. It treats unusual values as review candidates rather than impossible facts and asks for education-system context when labels such as `middle` are ambiguous.

## Worker secrets

Set these only if you want the corresponding integrations enabled:

```powershell
npx wrangler secret put OPENROUTER_API_KEY --name netra
npx wrangler secret put HIBP_API_KEY --name netra
npx wrangler secret put NETRA_LLM_MODEL --name netra
```

Use a currently available free-tier OpenRouter model for `NETRA_LLM_MODEL`. Free model availability and limits change; the default in the route is a fallback, not a guarantee of availability. Never commit API keys.

Email checks are disabled unless `HIBP_API_KEY` is configured. Only query addresses you own or are authorised to investigate. A negative provider result is not proof of no exposure.

## D1 migration and remaining integration

Create a D1 database in the same Cloudflare account as the Worker, then run:

```powershell
npx wrangler d1 create netra-db
npx wrangler d1 execute netra-db --remote --file=migrations/0001_netra_intelligence.sql
```

The create command returns the database ID. Add that exact ID to `wrangler.jsonc` under `d1_databases`, with binding `DB` and database_name `netra-db`, before using it from application code. Do not use a placeholder database ID.

**Important:** the schema is staged, but the existing case and audit stores still need to be migrated from filesystem-based storage to D1. Do not claim persistent case storage until that adapter and binding are wired and tested. This branch is not deployed automatically.
