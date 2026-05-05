# RootCX AI Agents

Agents are apps with `backend/` containing a LangGraph agent. Same manifest, deploy, RBAC.

## Structure

```
my-agent/
├── manifest.json
├── .rootcx/launch.json
├── src/App.tsx
└── backend/
    ├── agent.json
    ├── agent/system.md
    ├── index.ts
    └── package.json
```

## agent.json

```json
{
  "name": "<name>",
  "description": "<desc>",
  "systemPrompt": "./agent/system.md",
  "memory": { "enabled": true },
  "limits": { "maxTurns": 50, "maxContextTokens": 100000, "keepRecentMessages": 10 },
  "supervision": { "mode": "autonomous" }
}
```

Supervision modes: `autonomous` (free), `supervised` (policy-based approval), `strict` (every tool call approved).

## Tools

Available to the agent via IPC:

- `query_data` / `mutate_data` — CRUD on any app's collections
- `list_apps` / `describe_app` — discover apps and schemas
- `list_integrations` / `call_integration` — external services (Gmail, Stripe…)
- `list_actions` / `call_action` — custom app actions (see below)
- `invoke_agent` — delegate to another agent

## App actions

Any app exposes RPC methods as agent tools by declaring `actions` in `manifest.json` (see [Manifest — Actions](./manifest.md#actions)). Agent discovers via `list_actions`, calls via `call_action({app, action, input})`. Worker receives standard RPC — no code changes.

To give an agent new capabilities: add action to manifest + implement RPC handler in worker.

## Backend code

- LangGraph `createReactAgent` for ReAct loop + streaming
- Provider SDK: ChatAnthropic / ChatOpenAI / ChatBedrockConverse
- IPC bridge (JSON-lines stdin/stdout) connects to Core
- Deps: `@langchain/langgraph`, provider package, `@langchain/core`, `zod`

## Invocation

```
POST /api/v1/apps/{app_id}/agent/invoke
{ "message": "...", "session_id": "optional-uuid" }
```

SSE events: `chunk`, `tool_call_started`, `tool_call_completed`, `approval_required`, `done`, `error`.

Other: `GET .../agent` (config), `GET .../agent/sessions` (list), `GET .../agent/sessions/{id}` (detail).
