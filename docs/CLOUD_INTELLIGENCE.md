# NETRA Cloud Intelligence and Deployment

This feature adds a hosted LLM analysis endpoint, case evidence workspace, and public-source lookup integrations. It does not run a local model and does not alter deterministic identity generation.

## Authentication: one operator account

NETRA supports one configured operator login through server-side environment variables. It deliberately has no hard-coded default credentials.

### Local development

Create `web/.env.local` on your own computer (do not commit it). Add the following keys with your chosen credentials and a unique session secret:

```env
NETRA_USERNAME=your_operator_id
NETRA_PASSWORD=your_long_unique_password
NETRA_SESSION_SECRET=your_random_secret
```

Generate a strong session secret locally if OpenSSL is installed:

```bash
openssl rand -base64 48
```

Restart the development server after changing environment variables. The repository's `.gitignore` excludes local environment files. The committed `web/.env.example` is a template only and must never contain real secrets.

### Cloudflare Workers deployment

A local `.env.local` file on your computer is not automatically available to a deployed Worker. Configure the same three values as Worker secrets from the `web` directory, while authenticated to the Cloudflare account that hosts NETRA:

```bash
npx wrangler secret put NETRA_USERNAME
npx wrangler secret put NETRA_PASSWORD
npx wrangler secret put NETRA_SESSION_SECRET
```

Wrangler prompts for each value. Enter your chosen operator ID, password, and generated session secret at the prompts. Do not paste them into source code, GitHub, chat, or a committed file. After all three secrets are configured, redeploy the Worker:

```bash
npx wrangler deploy
```

If NETRA is hosted somewhere other than Cloudflare, configure these as server-side environment variables/secrets in that host and redeploy. Never use `NEXT_PUBLIC_` names for authentication settings.

If the login API returns `AUTHENTICATION SERVICE NOT CONFIGURED`, it includes the names of missing settings only, never their values.

**Security note:** use a long, unique password before exposing the site publicly. Treat a password shared in chat as exposed and change it before production.

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
