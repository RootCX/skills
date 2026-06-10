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
| `ctx.databaseUrl` | PostgreSQL connection string (direct access) |
| `ctx.credentials` | Decrypted secrets (platform + app) |
| `ctx.log.info/warn/error(msg)` | Structured logging (broadcasts via SSE) |
| `ctx.emit(name, data)` | Emit named event |
| `ctx.uploadFile(content, filename, contentType?)` | Upload to storage, returns file ID |
| `ctx.collection(entity)` | IPC collection access (see below) |

## ctx.collection(entity)

```typescript
await ctx.collection("contacts").insert({ first_name: "Alice", email: "a@b.com" });
await ctx.collection("contacts").update({ id: "...", first_name: "Alice B." });
await ctx.collection("contacts").find({ stage: "lead" }); // equality map
await ctx.collection("contacts").findOne({ email: "a@b.com" });
```

- `find({})` with empty object = full scan (returns all records)
- Where clause is equality-only. For complex queries, use Core REST API via fetch.

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
- All apps share one PG instance — cross-app queries possible via `ctx.databaseUrl`.

## Public RPCs

When manifest declares `public.rpcs` with `scope`, Core enforces scope-match BEFORE the handler runs. The handler does NOT need to verify `caller` or check share context:

```typescript
// Core already verified params.board_id matches the share token's context
get_public_board: async (params, _caller, ctx) => {
  return await ctx.collection("board").findOne({ id: params.board_id });
},
```

## Actions (agent tools)

Declare in manifest `"actions"` array. `id` = RPC method name. Worker receives standard RPC — no code changes needed. Agents with `app:{appId}:*` have access by default.
