# NETRA Cloud Intelligence

This feature adds a hosted LLM analysis endpoint, case evidence workspace, and public-source lookup integrations to NETRA's existing web application. It does not run a local model and does not alter deterministic identity generation.

## Hosted LLM configuration

Configure these as **server-side deployment secrets/environment variables** in the web host (for Cloudflare Workers, use the Worker's secrets/variables configuration):

- `NETRA_LLM_API_KEY` — secret API key for an OpenAI-compatible chat-completions provider.
- `NETRA_LLM_MODEL` — exact model identifier enabled for your account.
- `NETRA_LLM_BASE_URL` — optional API base URL. Defaults to `https://api.groq.com/openai/v1`.
- `NETRA_LLM_PROVIDER` — optional display label, e.g. `groq` or `openrouter`.

Example local development values belong in an ignored `.env.local`, never in committed source:

```env
NETRA_LLM_API_KEY=replace_with_your_key
NETRA_LLM_MODEL=replace_with_a_model_available_to_your_account
NETRA_LLM_BASE_URL=https://api.groq.com/openai/v1
NETRA_LLM_PROVIDER=groq
```

The application calls `POST {NETRA_LLM_BASE_URL}/chat/completions` from the server-side route. The UI only calls NETRA's own API, so the provider key is never sent to the browser. The default URL is a provider endpoint, not a guarantee of a permanent free quota; models, quotas and terms can change. Select a model currently available on your chosen provider. OpenRouter or another OpenAI-compatible provider can be used by setting the base URL, key and model.

No local LLM fallback is included. If hosted AI is not configured, the existing app remains usable and the AI panel explains that deployment secrets are required.

## Public-source integrations

- **URLhaus**: checks one submitted HTTP(S) URL against the abuse.ch URLhaus feed. A miss is not a safety verdict.
- **Open-Meteo Geocoding**: returns candidate coordinates for a place name.
- **Open-Meteo Weather**: retrieves current conditions for coordinates supplied by the user or selected from geocoding.
- **Hacker News Search API**: searches public technology stories; this is not a general news-verification service.

These connectors use server-side requests and return source names, timestamps and caveats. Check provider terms, rate limits and suitability before production use. Do not treat external responses as proof of identity, location, activity or wrongdoing.

## Routes

- `GET /api/analysis` — reports whether hosted AI is configured (never returns the API key).
- `POST /api/analysis` — accepts `{ "task": "summary|timeline|relationships|report", "context": "..." }`.
- `GET /api/intelligence` — lists connectors.
- `POST /api/intelligence` — accepts `action: urlhaus|geocode|weather|news` with the corresponding input fields.

Both routes are protected by the existing authentication proxy.

## Deployment and storage caveat

The current case store uses Node filesystem APIs. That is not persistent storage for a Cloudflare Workers deployment. The evidence workspace uses the existing case API and therefore inherits its storage behavior; use a durable Cloudflare D1/KV/R2-backed case store before relying on evidence persistence in production. This feature does not silently claim to solve that pre-existing storage issue.

## Privacy and reliability

- Never place provider keys in client-side variables or committed files.
- Avoid submitting passwords, government identifiers, financial account data or unnecessary personal data to external LLMs.
- AI output is marked as generated and requires human review.
- Analysis is grounded only in the case context supplied to the model; external facts are not automatically verified.
