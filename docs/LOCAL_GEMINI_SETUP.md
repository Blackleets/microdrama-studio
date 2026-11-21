# Optional Gemini setup for local-first Studio

Gemini script generation can run without Supabase. The Google API key is read only by the server route at `/api/local/story`.

## Required server environment

Set these variables in the server's private environment (for local development, use an uncommitted `.env.local` file):

- `GEMINI_API_KEY`: Google AI API key. Never prefix it with `NEXT_PUBLIC_` and never paste it into the browser.
- `GEMINI_MODEL`: exact model identifier enabled for the key/account. The app deliberately does not guess a model.
- `LOCAL_STUDIO_AI_TOKEN`: a separate random access token with at least 32 characters.

Example PowerShell command to create a random token:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Copy the generated value into `LOCAL_STUDIO_AI_TOKEN` in the server environment. Do not commit `.env.local`.

## In the Studio

1. Open Script Room for an episode.
2. Paste the value of `LOCAL_STUDIO_AI_TOKEN` into the local AI token field.
3. Add optional creative instructions.
4. Select **Generar con Gemini**.
5. The generated script is saved as an editable draft. It is not auto-approved or published.

The access token is held in the current tab's sessionStorage. The Google API key never leaves the server.

## Limits and deployment safety

- The endpoint rejects requests without a valid access token and checks same-origin requests when an Origin header is present.
- Tokens shorter than 32 characters are rejected.
- The daily request cap is an in-memory, per-process best-effort limit. It is not a durable account quota and may reset when a serverless instance restarts.
- Do not expose this endpoint on an untrusted public deployment without adding proper owner authentication, persistent rate limiting, monitoring and billing controls.
- Provider model availability, quotas and billing are controlled by the Google AI account. The project does not verify the model or account quota ahead of time.
