# Backend Worker Patterns

Full reference: `https://rootcx.com/docs/developers/backend.md`

## serve() — the standard pattern

```typescript
serve({
  rpc: {
    my_method: async (params, caller, ctx) => {
      const items = await ctx.collection("items").find({ status: "active" });
      return { items };
    },
  },
  onJob: async (payload, caller, ctx) => {
    // process background job
  },
});
```

## ctx object

| Property | Usage |
|----------|-------|
| `ctx.appId` | App identifier |
| `ctx.runtimeUrl` | Core API base URL |
| `ctx.credentials` | Decrypted secrets (platform + app) |
| `ctx.log.info/warn/error(msg)` | Structured logging (broadcasts via SSE) |
| `ctx.emit(name, data)` | Emit named event |
| `ctx.uploadFile(content, filename, contentType?)` | Upload to storage, returns file ID |
| `ctx.downloadFile/openFile(...)` | Read a Storage file as a buffer/stream |
| `ctx.enqueueJob(payload)` | Enqueue durable background work from ordinary workers; raw agent enqueue is denied |
| `ctx.sql(text, params)` | Governed SQL confined to the worker's Core-bound app, under the caller's RLS identity |
| `ctx.collection(entity)` | IPC collection access (see below) |
| `ctx.remote(providerApp).collection(entity)` | Governed cross-app CRUD through an approved collection grant |

## ctx.collection(entity)

```typescript
await ctx.collection("contacts").insert({ first_name: "Alice", email: "a@b.com" });
await ctx.collection("contacts").update({ id: "...", first_name: "Alice B." });
await ctx.collection("contacts").find({ stage: "lead" }); // equality map
await ctx.collection("contacts").findOne({ email: "a@b.com" });
```

- `find(where?)` returns all visible matching records as an array, without an implicit limit. `findOne(where?)` returns one record or `null`. Both take equality maps.
- Use `findPage({ where, orderBy, order, limit, offset })` for query operators and explicit pagination. It returns `{ data, total }`; default limit is 100, allowed limits are integers 1–1000. Keep filters under `where`: `find({ limit: 7 })` filters a column named `limit`.
- `create(data)` and `insert(data)` are aliases. Both `update({ id, ...data })` and `update(id, data)` work. `delete(id)` returns `{ id, deleted: true }`. Update/delete require an explicit UUID.
- Large normalized datasets use `ctx.collection(entity).importRows(rows, options)`. Run it inside `onJob`; see `data.md` for modes, permissions, and idempotency.

## Cross-app collections

Requires the Core implementation identified in `../SKILL.md`. Local and remote collections share the CRUD methods and result shapes above; `remote` only selects the provider:

```typescript
const contacts = ctx.remote("crm").collection("contacts");
const page = await contacts.findPage({
  where: { name: { $ilike: "Ada%" } },
  limit: 25,
  offset: 0,
});
await contacts.update(contactId, { email: "ada@example.test" });
```

- Obtain the exact operation and field grants described in [data.md](data.md#governed-cross-app-access). `find`/`findPage` require `list`; `findOne` requires `read`. Mutations require their corresponding action.
- Responses contain only the approved readable projection. A writable field need not be readable. Type parameters describe that projection; they do not authorize access.
- Methods throw on failure; invisible/missing updates and deletes reject. Do not blindly retry creates after a timeout: the public API has no idempotency key.
- Remote operations cannot run inside `ctx.transaction`; each owns a provider transaction. No cross-app transaction, `remote(...).action(...)`, remote import, or `bulk_create` method is exposed.
- Replace cross-schema SQL and joins with granted remote queries and combine projected results in app code. Do not substitute a caller-token `fetch` to evade a rejected app grant. Direct human HTTP access has its own RBAC/RLS path.
- Agent workers must use supervised `query_data`/`mutate_data`; see [agents.md](agents.md#cross-app-tools-and-workflows).

## Queued work and upgrades

Ordinary worker jobs retain Core-bound app identity and delegated authority. Provider access still needs that worker app's grant. Raw agent `ctx.enqueueJob` is denied; an agent can use supervised `call_action` to invoke an ordinary app action that enqueues work within its own authority.

When upgrading to this Core implementation, upgrade all dispatchers sharing a queue together. Legacy envelopes without Core-owned `kind` are quarantined in `jobs_dlq`; reconcile associated queued workflow executions against trusted records and resubmit required work through authorized APIs. Never add authority fields to replay old payloads. Plan rollback before processing new envelopes with an older Core.

## Caller

```typescript
{ userId: string; email: string; authToken?: string }
```

- `authToken` is the caller's JWT — use for `Authorization: Bearer` when calling Core REST API from the worker
- `caller` is null for anonymous/public RPC calls
- Always check `caller` for authorization in handlers

## Rules

- Entry point resolution: `index.ts` → `index.js` → `main.ts` → `main.js` → `src/index.ts`
- Backend deps go in `backend/package.json`. NOT the root `package.json` (that's for frontend/Vite).
- RPC timeout: 30 seconds. For longer work, enqueue a background job.
- Crash recovery: 5 crashes in 60s → `crashed` state.
- NEVER use SQLite or file-based storage.
- Workers never receive database credentials. Use `ctx.collection`, `ctx.sql`, or Core REST endpoints; Core applies the worker's fixed identity, RLS, audit attribution, and timeouts.

## Public RPCs

When manifest declares `public.rpcs` with `scope`, Core enforces scope-match BEFORE the handler runs. The handler does NOT need to verify `caller` or check share context:

```typescript
// Core already verified params.board_id matches the share token's context
get_public_board: async (params, _caller, ctx) => {
  return await ctx.collection("board").findOne({ id: params.board_id });
},
```

## Actions (agent tools)

Declare in manifest `"actions"` array. `id` = RPC method name. Worker receives standard RPC. Agent `call_action` requires its tool permission and the target's invoke or specific action permission, subject to delegation and supervision. A collection grant does not authorize an action. Worker `ctx.action(name, input)` calls only the current app.
