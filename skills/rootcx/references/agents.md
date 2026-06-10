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
