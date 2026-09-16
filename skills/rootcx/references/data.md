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
- Direct user cross-app reads: pass the provider's app ID as `appId`; that user's provider permissions and RLS still apply. This does not establish worker or agent grant authority.

## Governed cross-app access

Requires the Core implementation identified in `../SKILL.md`. For worker, agent, or workflow access, Core binds the consumer identity and requires an approved grant for that consumer installation, provider installation, and entity. Existing user RBAC permissions do not automatically create a grant.

An authorized administrator creates a pending grant with `POST /api/v1/cross-app/grants`:

```json
{
  "consumerApp": "sales",
  "providerApp": "crm",
  "entity": "contacts",
  "actions": ["list", "read", "update"],
  "fields": ["name", "email"],
  "writeFields": ["email"],
  "reason": "Allow sales to maintain contact email addresses"
}
```

Creation requires `admin:cross_app.grants.manage`. Approval uses `POST /api/v1/cross-app/grants/<id>/approve` with `{"reason":"Approved by provider"}` and `admin:cross_app.grants.approve` or `app:crm:cross_app.approve`. These are HTTP endpoints, not manifest fields or assumed MCP tools.

- Request only needed actions: `list`, `read`, `create`, `update`, and `delete` are independent.
- `fields` freezes readable, filterable, and sortable fields; prefer an explicit nonempty list. `writeFields` is independently required and nonempty for create/update; omit it or use `[]` for read/delete-only grants. Sensitive fields are excluded; system fields cannot be written.
- Grants do not widen provider RLS, ownership, delegated permissions, or task scope. A request-supplied app ID cannot impersonate the consumer. Cross-app writes are supported when all these checks pass.
- Inspect grants via `GET /api/v1/cross-app/grants/<id>` and operations via `GET /api/v1/cross-app/audit` with the required administrative permissions. A denial is not a reason to broaden roles automatically.
- Existing installations receive no automatic grants. Contract changes revoke old grants; only changes confined to top-level `name`, `version`, `description`, and `icon` retain them. Failed contract updates and uninstall/reinstall require fresh approvals.

Use [backend.md](backend.md#cross-app-collections) for worker calls and [agents.md](agents.md#cross-app-tools-and-workflows) for tools and workflow migration. Collection grants do not authorize action calls or agent invocation.

## Traps to avoid

- `useAppCollection(appId, "core:users")` → 404. Use `useCoreCollection("users")`.
- GET list params are flat, no bracket syntax: `?status=active&company_id=uuid`
- Records are flat objects. On create/update, pass only user-defined fields (never `id`, `created_at`, `updated_at`).

## Large collection imports

`POST /bulk` is an interactive JSON endpoint for at most 1,000 rows. For a large source file, upload it to RootCX Storage, enqueue a background job, normalize rows in the worker, and stream them through the governed collection-import path:

```ts
await ctx.collection("catalog_offer").importRows(rows, {
  mode: "append",
  columns: ["import_run_id", "source_item_id", "description", "price"],
  sourceFileId: fileId,
  idempotencyKey: `${checksum}:mapping-v1`,
});
```

- `rows` may be an `Iterable` or `AsyncIterable`; the worker streams CSV with backpressure and does not buffer the dataset.
- Core supports `append`, `upsert`, and atomic `replace`. `upsert` also needs `conflictColumns` matching a non-partial unique index.
- Existing permissions govern publication: `create` for append, `create+update` for upsert, and `create+update+delete` for replace. A linked source file also requires `storage.read`.
- XLSX/CSV parsing, schema-drift checks, mapping, and business validation belong to the app. Core owns the temporary staging table, PostgreSQL `COPY`, RLS publication, progress, retry state, and summary audit event.
- Use an idempotency key derived from the immutable source checksum and mapping version. An already-completed matching run is returned without uploading rows again.
- Empty streams are rejected by default so an accidental empty `replace` cannot erase data. Set `allowEmpty: true` only for an intentionally empty publication.

REST lifecycle: `GET|POST /api/v1/apps/{app_id}/collections/{entity}/imports`, `GET|DELETE .../imports/{id}`, and `POST .../imports/{id}/retry`.

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
