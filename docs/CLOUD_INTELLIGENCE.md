# NETRA Cloud Intelligence and Deployment

This feature adds a hosted LLM analysis endpoint, case evidence workspace, and public-source lookup integrations. It does not run a local model and does not alter deterministic identity generation.

## Fix: AUTHENTICATION SERVICE NOT CONFIGURED

This message means the deployed login API cannot find one or more required server-side settings. It is not fixed by entering credentials into the login form. NETRA deliberately does not ship with a default username or password.

Required settings:
- `NETRA_USERNAME` — your chosen operator ID.
- `NETRA_PASSWORD` — a long, unique password.
- `NETRA_SESSION_SECRET` — a random secret used to sign session cookies.

### Cloudflare Workers setup

From the `web` directory, with Wrangler authenticated to the Cloudflare account that hosts NETRA, run these commands one at a time. Wrangler prompts for each value; enter it at the prompt and do not paste secrets into GitHub, chat, or source files.

```bash
npx wrangler secret put NETRA_USERNAME
npx wrangler secret put NETRA_PASSWORD
npx wrangler secret put NETRA_SESSION_SECRET
```

Generate a strong session secret locally if OpenSSL is installed:

```bash
openssl rand -base64 48
```

Use that output as the value for `NETRA_SESSION_SECRET`. After setting all three secrets, redeploy the Worker from the `web` directory:

```bash
npx wrangler deploy
```

If the site is deployed through another platform, add the same three values as server-side environment variables/secrets in that platform and redeploy. Never use `NEXT_PUBLIC_` names for these values. Do not commit a populated `.env.local`.

The login API now returns the names of missing settings (never their values), which should make this configuration problem easier to diagnose.

## Hosted LLM configuration

Configure these as server-side deployment secrets/environment variables:
- `NETRA_LLM_API_KEY` — API key for an OpenAI-compatible chat-completions provider.
- `NETRA_LLM_MODEL` — exact model identifier enabled for your account.
- `NETRA_LLM_BASE_URL` — optional API base URL; defaults to `https://api.groq.com/openai/v1`.
- `NETRA_LLM_PROVIDER` — optional display label, e.g. `groq` or `openrouter`.

Set hosted AI secrets using the provider dashboard or Wrangler secret commands. Provider free quotas, model access, and terms can change. No local LLM is used.

## Public-source integrations

- **URLhaus** checks a submitted HTTP(S) URL against the URLhaus feed. A miss is not a safety verdict.
- **Open-Meteo Geocoding** returns candidate coordinates for a place name.
- **Open-Meteo Weather** retrieves current conditions for supplied or selected coordinates.
- **Hacker News Search API** searches public technology stories; it is not a general news-verification service.

These sources are contextual aids, not proof of identity, location, activity, or wrongdoing.

## Routes

- `GET /api/analysis` reports whether hosted AI is configured (never returns the API key).
- `POST /api/analysis` accepts `{ "task": "summary|timeline|relationships|report", "context": "..." }`.
- `GET /api/intelligence` lists public-source connectors.
- `POST /api/intelligence` accepts `action: urlhaus|geocode|weather|news`.

## Deployment and storage caveat

The current case store uses Node filesystem APIs. That is not persistent storage for Cloudflare Workers. The evidence workspace uses the existing case API and inherits its storage behavior; migrate case/evidence storage to Cloudflare D1 or another durable store before relying on persistence in production.

## Privacy and reliability

- Never commit provider keys, passwords, or session secrets.
- Avoid submitting passwords, government identifiers, financial account data, or unnecessary personal data to external LLMs.
- AI output requires human review and does not independently verify external facts.
