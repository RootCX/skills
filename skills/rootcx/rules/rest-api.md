# RootCX Core REST API

Base: `{runtime_url}/api/v1`. Authenticated requests use `Authorization: Bearer {authToken}`.

Load the detailed endpoint references:
- [Collections](./rest-api-collections.md)
- [Storage](./rest-api-storage.md)
- [Integrations](./rest-api-integrations.md)
- [Jobs](./rest-api-jobs.md)

## Collections (summary)

Base: `/api/v1/apps/{app_id}/collections/{entity}`

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/` | — | `T[]` |
| POST | `/` | `{field:value,...}` | `T` (201) |
| POST | `/bulk` | `[{...},...]` | `T[]` (201) |
| POST | `/query` | `QueryOptions` | `{data:T[],total:number}` |
| GET | `/{id}` | — | `T` |
| PATCH | `/{id}` | `{field:value,...}` | `T` |
| DELETE | `/{id}` | — | `{message:string}` |

## Where operators

**Operators:** `$eq` `$ne` `$gt` `$gte` `$lt` `$lte` `$like` `$ilike` `$in` `$nin` `$contains` `$isNull`
**Logical:** `$and` `$or` (arrays) `$not` (object)
**Shorthand:** `{"field":"value"}` = `{"field":{"$eq":"value"}}`, `{"field":null}` = IS NULL

## Integrations (summary)

- Bind: `/api/v1/apps/{app_id}/integrations` (list/bind/update/unbind)
- Actions + auth: `/api/v1/integrations/{integration_id}` (actions, auth start/credentials/disconnect)

**From a worker:** `POST {runtime_url}/api/v1/integrations/{integration_id}/actions/{action_id}` with `Authorization: Bearer {authToken}`, body = action input.

## Storage (summary)

File storage managed by Core. Files stored in PostgreSQL BYTEA (max 64 MiB).

Base: `/api/v1/apps/{app_id}/storage` — POST `/upload` (multipart), GET `/{file_id}`, DELETE `/{file_id}`.

Use manifest field type `file` (→ TEXT) to store returned `file_id`. Frontend must pass JWT via `Authorization` header (not cookies). Use `fetch` + `FormData` for uploads, `fetch` + `blob()` for downloads.

## Jobs (summary)

Async job queue managed by Core. Workers enqueue jobs via REST, Core dispatches them back to the worker via IPC.

Base: `/api/v1/apps/{app_id}/jobs` — POST `/`, GET `/`, GET `/{job_id}`.

**Job statuses:** `pending` → `running` → `completed` | `failed`

Use jobs for long-running work (bulk fetches, batch imports, async syncs) that would exceed the 30s RPC timeout.

## Magic-Link Invitations

Invite users to the app without passwords. The admin generates a secure one-time link, delivers it (email, Slack, etc.), and the recipient clicks to get a JWT.

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/v1/auth/magic-link/generate` | Bearer (requires `auth.invite` permission) | `GenerateRequest` | `{magicLinkUrl, expiresAt}` (201) |
| POST | `/api/v1/auth/magic-link/consume` | None (anonymous) | `{token}` | `{accessToken, refreshToken, expiresIn, user, redirectUri}` |
| GET | `/api/v1/auth/magic-link/consume?token=...` | None | — | Redirect to `redirectUri#access_token=...&refresh_token=...&expires_in=...` (fragment, never in server logs or Referer) |

**GenerateRequest:**

```json
{
  "email": "marie@company.com",
  "roles": ["sales"],
  "redirectUri": "https://myapp.rootcx.com/dashboard",
  "expiresInSeconds": 900
}
```

- `email` (required) normalized to lowercase
- `roles` RBAC roles to assign on consume. Caller must hold these roles (privilege containment) or be admin
- `redirectUri` (optional) returned to consumer or used as redirect in GET flow. Must be http(s), no credentials
- `expiresInSeconds` (optional) 60 to 86400, default 900 (15 min)

**Security:** Tokens are 256-bit CSPRNG, stored as SHA-256 hash, single-use (atomic UPDATE), constant-time verification.

**Permission:** The caller needs either admin (`*`) or the `auth.invite` permission. Non-admins can only confer roles they already hold.

## Public Shares

Base: `/api/v1/apps/{app_id}/public-shares` (requires JWT + `app:{app_id}:public.share` permission)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/` | `{context:{...}}` | `{id,url,token,tokenPrefix,context,createdAt}` (201) |
| GET | `/` | — | `ShareListing[]` (owner-scoped) |
| DELETE | `/{id}` | — | `{message}` (creator-only) |

**Public endpoint (no JWT, share token as Bearer):**

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/v1/public/share/info` | Bearer: share token | `{appId, context}` |

**RPC with share token:** `POST /api/v1/apps/{app_id}/rpc` with Bearer = share token. Only works if the method is declared in `manifest.public.rpcs`. Core enforces `scope` match before dispatch.
