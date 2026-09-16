# RootCX for AI assistants

Ship internal apps and AI agents from the assistant you already use. Build with ChatGPT Work, Codex, Claude Code, or any assistant that supports the [Agent Skills](https://agentskills.io/specification) open standard. RootCX provides PostgreSQL, SSO, role-based permissions, audit logs, integrations, secrets, jobs, and deployment from day one.

## What the RootCX plugin unlocks

- **Build and deploy apps.** Describe the outcome. Your assistant creates and tests the app locally, shows you the deployment plan, and deploys after you approve.
- **Work inside live apps.** Ask for the records you need, approve a change, and let your assistant update RootCX through the same permissions and audit trail as your team.
- **Create AI agents that act.** Build agents that work with real business data, use approved tools, and log every action.

## Structure

Single `rootcx` skill with references loaded on demand from `skills/rootcx/references/`:

| Reference | Description |
|------|-------------|
| `data.md` | Manifest, React data hooks, imports, cross-app grants |
| `backend.md` | Worker CRUD, cross-app access, RPC, jobs and upgrade constraints |
| `agents.md` | AI agents, supervised tools and workflow governance |
| `integrations.md` | External API integrations, credentials and actions |
| `ui.md` | Components, layout, routing, dark mode, AuthGate |
| `ui-components.md` | Full component catalogue with prop signatures |

## ChatGPT Work and Codex

Install RootCX once from the Plugin Directory, select **Connect**, and choose the workspace your assistant may use. That single installation combines the RootCX skill with the authenticated RootCX connection. No MCP URL, access token, or separate skill setup is required.

When local work is needed, the plugin asks once before installing the verified RootCX CLI. Source code, builds, and tests stay on your machine. Reads and approved changes go through RootCX authentication, permissions, row-level security, and audit logs.

Until RootCX is available in the public Plugin Directory, add the official marketplace in ChatGPT Work:

1. Open **Plugins**, then select **Create → Add marketplace**.
2. Use `RootCX/skills` as the source.
3. Use `master` as the Git ref and leave sparse paths empty.
4. Open the **RootCX** marketplace and install **RootCX**.

The installed plugin includes both the RootCX skill and the authenticated MCP connection. Users do not enter an MCP URL manually.

## Claude Desktop, Cowork, and Claude Code

Install the official RootCX marketplace from GitHub, then install the RootCX plugin:

```text
/plugin marketplace add RootCX/skills
/plugin install rootcx@rootcx
```

In Claude Desktop or Cowork, open **Customize → Plugins**, add `RootCX/skills` as a marketplace, then install **RootCX**. Complete the RootCX browser sign-in shown during installation. The skill and universal RootCX connector are then ready together—no connector URL, tenant-specific endpoint, or access token required.

Build workflows require Cowork or Claude Code with access to a local project folder. Regular Chat can use connected RootCX data but does not provide a local coding workspace.

Claude Code uses its native MCP authentication screen. If it reports that RootCX needs authentication, run `/mcp`, select **RootCX**, and complete the browser sign-in once.

For other skills-compatible coding agents:

```bash
npx skills add rootcx/rootcx-skills
```

The same command installs the skill for clients that follow the cross-client `.agents/skills` convention. Connect their MCP client to `https://rootcx.com/mcp` and complete OAuth separately.

**npm (for Forge monolith build):**

```bash
npm install @rootcx/skills
```

## License

Apache-2.0
