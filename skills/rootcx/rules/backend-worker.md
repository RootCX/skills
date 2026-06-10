# RootCX Backend Workers

Apps can have a `backend/` directory with a Bun worker for server-side logic. Core manages lifecycle (spawn, crash recovery, shutdown). IPC via JSON-lines on stdin/stdout.

Deps: add `backend/package.json` for backend-only npm deps. Core runs `bun install` there at deploy. Do NOT put backend deps in the root `package.json` (that one is for the frontend/Vite).

## IPC protocol

Core sends `discover` immediately after spawn. Worker listens on stdin, responds on stdout. JSON-lines (one JSON object per line).

**Messages Core → Worker:**
- `{ type: "discover", app_id, runtime_url, database_url, credentials }` — init handshake
- `{ type: "rpc", id, method, params, caller }` — caller includes `authToken` for Core API calls
- `{ type: "job", id, payload, caller }` — async job dispatch (caller has authToken if enqueued by a user)
- `{ type: "shutdown" }` — graceful exit

**Messages Worker → Core:**
- `{ type: "discover", methods: [...] }` — handshake response (list exposed RPC methods)
- `{ type: "rpc_response", id, result }` or `{ type: "rpc_response", id, error }`
- `{ type: "job_result", id, result }` or `{ type: "job_result", id, error }`
- `{ type: "log", level: "info"|"warn"|"error", message }` — structured logging

**Caller shape:** `{ userId: string, email: string, authToken?: string }`
- `authToken` is the caller's JWT — use it for `Authorization: Bearer` when calling Core REST API
- Always check `caller` for authorization in RPC handlers

## Data access

- **Simple CRUD**: use Core REST API via `runtime_url` with `caller.authToken` (see [REST API](./rest-api.md))
- **Custom SQL** (transactions, sequences, JOINs): connect to PostgreSQL via `database_url` from discover
- All apps share one PG instance — cross-app queries are possible
- **NEVER use SQLite or file-based storage** — PostgreSQL is the only database

## Frontend → Worker

```tsx
const client = useRuntimeClient();
const result = await client.rpc(appId, "method_name", { ...params });
```

## serve() API (recommended)

Use `serve()` instead of raw stdin/stdout parsing. It's injected by the runtime prelude.

```typescript
serve({
  rpc: {
    ping: () => ({ pong: true }),
    get_data: async (params, caller, ctx) => {
      const items = await ctx.collection("items").find({ status: "active" });
      return items;
    },
  },
  onJob: async (payload, caller, ctx) => { /* handle async job */ },
});
```

### ctx.collection(entity)

- `insert(data)` → created record
- `update(data)` → updated record (must include `id`)
- `find(where?)` → array of matching records (empty `{}` = full scan)
- `findOne(where?)` → single record or `null`

`where` is an equality map: `{ field: value }` → `WHERE field = value AND ...`

### Public RPCs

When a manifest declares `"public": { "rpcs": [{ "name": "get_public_board", "scope": ["board_id"] }] }`, the core enforces scope-match BEFORE the RPC handler runs. The handler does NOT need to verify `caller` or check the share context — just query the data using the params.

```typescript
get_public_board: async (params: { board_id: string }, _caller, ctx) => {
  // Core already verified params.board_id matches the share token's context
  const board = await ctx.collection("board").findOne({ id: params.board_id });
  const lists = await ctx.collection("list").find({ board_id: params.board_id });
  return { board, lists };
},
```

---

## Minimal worker template

```typescript
import { createInterface } from "readline";
import postgres from "postgres";

interface Caller { userId: string; email: string; authToken?: string }

const write = (m: any) => process.stdout.write(JSON.stringify(m) + "\n");
const rl = createInterface({ input: process.stdin });
let sql: ReturnType<typeof postgres>;
let runtimeUrl: string;
let appId: string;

rl.on("line", (l) => {
  let m: any;
  try { m = JSON.parse(l); } catch { return; }

  switch (m.type) {
    case "discover":
      appId = m.app_id;
      runtimeUrl = m.runtime_url;
      sql = postgres(m.database_url);
      write({ type: "discover", methods: ["ping"] });
      break;
    case "rpc":
      handleRpc(m);
      break;
    case "shutdown":
      process.exit(0);
  }
});

async function handleRpc(m: any) {
  try {
    const result = await dispatch(m.method, m.params ?? {}, m.caller);
    write({ type: "rpc_response", id: m.id, result });
  } catch (e: any) {
    write({ type: "rpc_response", id: m.id, error: e.message });
  }
}

async function dispatch(method: string, params: any, caller: Caller | null): Promise<any> {
  switch (method) {
    case "ping": return { pong: true };
    default: throw new Error(`unknown method: ${method}`);
  }
}
```

## Rules

- Entry point: `index.ts` → `index.js` → `main.ts` → `main.js` → `src/index.ts`
- RPC timeout: 30s. Always respond with matching `id`
- Use `caller.authToken` for authenticated Core API calls from the worker
- Crash recovery: max 5 crashes in 60s → crashed state
