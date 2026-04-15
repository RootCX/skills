# @rootcx/skills

Agent Skill for building apps on the RootCX platform. Compatible with the [Agent Skills](https://agentskills.io/specification) open standard.

## Structure

Single `rootcx` skill with rules loaded on demand:

| Rule | Description |
|------|-------------|
| `manifest` | Data contract, entities, field types, schema sync |
| `sdk-hooks` | React hooks — useAppCollection, useAppRecord, queries |
| `ui` | Components, layout, routing, dark mode, AuthGate |
| `ui-components` | Full component catalogue with prop signatures |
| `backend-worker` | Bun worker IPC protocol, RPC, jobs |
| `rest-api` | Core HTTP API overview, where operators |
| `rest-api-collections` | CRUD endpoints, query params |
| `rest-api-integrations` | Bind, actions, auth |
| `rest-api-jobs` | Async job queue |
| `agent` | AI agent with LangGraph backend |

## Install

**Claude Code:**

```bash
npx skills add rootcx/rootcx-skills
```

**npm (for Forge monolith build):**

```bash
npm install @rootcx/skills
```

## License

Apache-2.0
