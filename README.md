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

## ChatGPT and Codex

The public RootCX plugin bundles this skill with the official authenticated MCP server. Install RootCX from the Plugin Directory, select **Connect**, sign in to RootCX, and choose the workspace the assistant may use. When the CLI is missing, the skill asks once for installation approval and runs its bundled checksum-verifying installer. Application source, builds, tests, and deployment stay in the local workspace.

Until RootCX is available in the public Plugin Directory, add the official marketplace in ChatGPT Work:

1. Open **Plugins**, then select **Create → Add marketplace**.
2. Use `RootCX/skills` as the source.
3. Use `master` as the Git ref and leave sparse paths empty.
4. Open the **RootCX** marketplace and install **RootCX**.

The installed plugin includes both the RootCX skill and the authenticated MCP connection. Users do not enter an MCP URL manually.

## Skills-compatible coding agents

**Claude Code:**

```bash
npx skills add rootcx/rootcx-skills
```

The same command installs the skill for clients that follow the cross-client `.agents/skills` convention. MCP provides authenticated actions, while the skill provides the RootCX build workflow.

For Claude Code, connect the tenant first:

```bash
claude mcp add --transport http rootcx https://<tenant>.rootcx.com/mcp
```

Then run `/mcp` in Claude Code and complete the browser sign-in.

**npm (for Forge monolith build):**

```bash
npm install @rootcx/skills
```

## License

Apache-2.0
