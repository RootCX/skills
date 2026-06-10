# Data & Manifest Patterns

Full reference: `https://rootcx.com/docs/developers/manifests.md`

## Manifest structure

```json
{
  "appId": "my_app",
  "name": "My App",
  "version": "0.0.1",
  "dataContract": [...],
  "permissions": { "permissions": [...] },
  "actions": [...],
  "crons": [...],
  "webhooks": [...],
  "public": { "rpcs": [...], "collections": [...] }
}
```

## Entity rules

- `id`, `created_at`, `updated_at` are auto-generated — never declare them in `fields`
- Field names: lowercase snake_case
- `entity_link` requires `"references": { "entity": "<target>", "field": "id" }`
- Target is `"<entity>"` (same app) or `"core:users"` (FK to system users). Cross-app refs not supported.

## on_delete guidance

| Scenario | Use |
|----------|-----|
| Join tables, child records meaningless without parent | `"cascade"` |
| Important linked records that should block deletion | `"restrict"` |
| Optional references (e.g., assigned_to user) | `"set_null"` |
| **User references (core:users)** | **Never cascade** |

If omitted: `required: true` defaults to `restrict`, optional defaults to `set_null`.

## Data hooks

```tsx
// Collection (list + mutations)
const { data, total, loading, create, update, remove } = useAppCollection<T>(appId, entity, query?);

// Single record
const { data, update, remove } = useAppRecord<T>(appId, entity, recordId);

// Core users (NOT useAppCollection)
const { data } = useCoreCollection<T>("users");
```

- Without `query`: `GET` (no limit, returns all). With `query`: `POST /query` (default limit 100).
- Auto re-fetches when `query` object changes.
- Cross-app reads: pass any installed app's ID as `appId`. User needs read permissions.

## Traps to avoid

- `useAppCollection(appId, "core:users")` → 404. Use `useCoreCollection("users")`.
- GET list params are flat, no bracket syntax: `?status=active&company_id=uuid`
- Records are flat objects. On create/update, pass only user-defined fields (never `id`, `created_at`, `updated_at`).

## Public access

- Routes NOT in `public` require a JWT (fail-closed, 401).
- Add `"public.share"` to `permissions` to let users create share links.
- Public RPCs with `scope`: Core enforces scope-match before the handler runs. Handler does NOT check share context.

## Public shares REST

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/apps/{app_id}/public-shares` | Create (requires `app:{app_id}:public.share`) |
| GET | `/api/v1/apps/{app_id}/public-shares` | List caller's active shares |
| DELETE | `/api/v1/apps/{app_id}/public-shares/{id}` | Revoke (creator only) |
| GET | `/api/v1/public/share/info` | Resolve share token → `{appId, context}` |

RPC with share token: `POST /api/v1/apps/{app_id}/rpc` with Bearer = share token. Only works if method is in `manifest.public.rpcs`.
