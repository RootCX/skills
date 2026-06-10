# RootCX Code Generation Rules

Constraints and patterns that are NOT in the documentation. These override defaults.

## Data

- All data comes from hooks. Types exported from `@rootcx/sdk`. Never use `useState` with mock data.
- Records are flat objects. Auto-fields: `id`, `created_at`, `updated_at`. Pass only user-defined fields on create/update.
- `useCoreCollection("users")` for org members. Do NOT use `useAppCollection` with `core:users` — it will 404.
- Cross-app reads: `appId` in `useAppCollection` can be any installed app. User needs read permissions on the target.
- `useAppCollection` without `query` → `GET /collections/{entity}` (full list, no limit). With `query` → `POST /collections/{entity}/query` (default limit 100). Auto re-fetches on `query` change.
- GET list query params are flat, no bracket syntax: `?contact_id=uuid&status=active`

## Manifest

- `id`, `created_at`, `updated_at` are auto-generated — omit from `fields`
- `entity_link` requires `"references": { "entity": "<target>", "field": "id" }`. Target is `"<entity>"` (same app) or `"core:users"`. Cross-app refs not yet supported.
- `"on_delete": "cascade"` on join tables and child records that have no meaning without the parent. Never use `cascade` on user references.
- Routes NOT in `public` require a JWT (fail-closed, 401 without Bearer)
- Add `"public.share"` to your manifest's `permissions` to let users create share links
- Actions: `id` = RPC method name. Worker receives `{ type: "rpc", method: "<id>", params: <input> }`. No code changes needed.
- Agents with `app:{appId}:*` have access to actions by default

## Backend workers

- Entry point: `index.ts` → `index.js` → `main.ts` → `main.js` → `src/index.ts`
- Backend deps go in `backend/package.json`. Do NOT put backend deps in the root `package.json` (that's for frontend/Vite).
- NEVER use SQLite or file-based storage — PostgreSQL is the only database
- All apps share one PG instance — cross-app queries are possible via `database_url`
- RPC timeout: 30s. Always respond with matching `id`
- Crash recovery: max 5 crashes in 60s → crashed state
- Always check `caller` for authorization in RPC handlers
- `ctx.collection().find({})` — empty object = full scan
- Public RPCs: Core enforces scope-match BEFORE the handler runs. The handler does NOT need to verify `caller` or check share context.
- Caller shape: `{ userId: string, email: string, authToken?: string }`
- Use `caller.authToken` for authenticated Core API calls from the worker

## IPC protocol (raw workers without serve())

Most apps use `serve()`. For manual IPC (e.g., custom agent backends):

**Core → Worker:**
- `{ type: "discover", app_id, runtime_url, database_url, credentials }` — init
- `{ type: "rpc", id, method, params, caller }` — RPC call
- `{ type: "job", id, payload, caller }` — job dispatch (caller.authToken = short-lived JWT minted by Core)
- `{ type: "shutdown" }` — graceful exit

**Worker → Core:**
- `{ type: "discover", methods: [...] }` — handshake response
- `{ type: "rpc_response", id, result }` or `{ type: "rpc_response", id, error }`
- `{ type: "job_result", id, result }` or `{ type: "job_result", id, error }`
- `{ type: "log", level: "info"|"warn"|"error", message }`

## Integrations

- Call `list_integrations` first. Never guess action IDs.
- `useIntegration`: after OAuth popup closes, hook auto-detects the new connection
- Multi-account: connecting the same account twice (same label) reuses the existing connection

## Agents

- Backend deps: `@langchain/langgraph`, `@langchain/core`, provider package (`@langchain/anthropic` | `@langchain/openai`), `zod`
- IPC bridge: JSON-lines stdin/stdout connects agent worker to Core
- Provider SDKs: `ChatAnthropic` / `ChatOpenAI` / `ChatBedrockConverse`
- `sub_agent_chunk` SSE event type exists (not always listed in docs)
- Agent config endpoint: `GET /api/v1/apps/{appId}/agent`

## Templates

Agent system prompt skeleton: [templates/system.md](./templates/system.md)
