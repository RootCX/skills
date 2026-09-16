# AI Agent Patterns

Full reference: `https://rootcx.com/docs/build/agent.md`

## Project structure

```
my-agent/
├── manifest.json          # Data model + permissions (same as any app)
├── agent.json             # Agent configuration
├── .rootcx/launch.json    # Dev server config
├── agent/
│   └── system.md          # System prompt (Markdown)
├── src/
│   └── App.tsx            # React chat UI
└── backend/
    ├── index.ts           # LangGraph agent logic
    └── package.json       # Backend deps
```

## agent.json

```json
{
  "name": "Support Agent",
  "description": "Handles customer queries",
  "systemPrompt": "./agent/system.md",
  "memory": { "enabled": true },
  "limits": { "maxTurns": 20, "maxContextTokens": 100000, "keepRecentMessages": 10 },
  "supervision": { "mode": "autonomous" }
}
```

Supervision modes: `autonomous` (free), `supervised` (policy-based), `strict` (every tool call approved).

## Backend dependencies

```json
{
  "dependencies": {
    "@langchain/langgraph": "latest",
    "@langchain/core": "latest",
    "@langchain/anthropic": "latest",
    "zod": "latest"
  }
}
```

Provider SDKs: `@langchain/anthropic` (ChatAnthropic), `@langchain/openai` (ChatOpenAI), or `@langchain/aws` (ChatBedrockConverse).

## SDK invocation

```tsx
const client = useRuntimeClient();
const result = await client.invokeAgent("agent-app-id", {
  message: "...",
  sessionId: "optional-uuid",
  fileIds: ["optional-file-uuid"],
}, (event) => {
  if (event.type === "chunk") appendToUI(event.delta);
});
// result: { type: "done", response: string, sessionId: string, tokens: number }
```

SSE event types: `chunk`, `tool_call_started`, `tool_call_completed`, `approval_required`, `session_compacted`, `sub_agent_chunk`, `done`, `error`.

## Agent endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/apps/{appId}/agent/invoke` | Invoke (SSE stream) |
| GET | `/api/v1/apps/{appId}/agent` | Agent config |
| GET | `/api/v1/apps/{appId}/agent/sessions` | List sessions |
| GET | `/api/v1/apps/{appId}/agent/sessions/{id}` | Session detail |

## Traps to avoid

- Agent backend communicates via JSON-lines stdin/stdout IPC to the Core — this is handled by the LangGraph boilerplate, not manually.
- Agents get `admin` role by default on deploy. Restrict via the roles API if needed.
- Sub-agents cannot spawn further sub-agents (single-level delegation).
- An agent cannot invoke itself.

## Cross-app tools and workflows

Requires the Core implementation identified in `../SKILL.md`. Use Core-dispatched tools so supervision and task scope apply; raw `ctx.remote` and `ctx.enqueueJob` calls from agent workers are denied.

| Tool | Arguments | Result / authority |
|------|-----------|--------------------|
| `query_data` | `{ app, entity, where?, orderBy?, order?, limit?, offset? }` | No query options: full array. Any query option: `{ data, total }`; `where: {}` explicitly requests a page. Remote access requires `list`, even when filtering by ID. |
| `mutate_data` | `{ app, entity, action, id?, data? }` | Requires the exact mutation grant and writable fields; update/delete use an explicit ID. |
| `call_action` | `{ app, action, input }` | Returns raw action result. Requires target `app:<app>:invoke` or `app:<app>:action:<action>`. |
| `invoke_agent` | `{ app_id, message }` | Returns `{ agent, response }`. Requires target `app:<app>:invoke`; child authority is narrowed. |

Every tool also requires `tool:<name>` within the delegated permission ceiling and task scope. Collection operations need provider operation permissions and preserve provider RLS; a grant never replaces these checks. Use explicit pagination for large reads; `query_data` without options has no implicit 100-row cap.

Obtain grants using [data.md](data.md#governed-cross-app-access). For native workflows, the consumer is the Core-created `wf-<workflow UUID>` backing app. Existing cross-app workflows need explicit grants even if their users already have RBAC permissions.

Workflow tool nodes use `kind: { "type": "tool", "toolName": "mutate_data" }` (or `query_data`) and put arguments in `params`. Durable workflow creates keep deterministic IDs on retry; `bulk_create` is unavailable there, so use per-item create nodes.

`call_action`, `invoke_agent`, and `call_integration` require agent execution context and are unavailable in native workflow tool nodes or generic HTTP tool execution. New/updated graphs and enabling legacy graphs validate this restriction; review existing enabled workflows before upgrading. Collection grants cannot enable these tools. Ordinary worker `ctx.callIntegration` remains supported.

To schedule work from an agent, use supervised `call_action` to an ordinary app action that enqueues a job; that app needs its own collection grants. See [backend.md](backend.md#queued-work-and-upgrades) for the queue migration.
