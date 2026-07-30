---
name: rootcx
description: Build internal apps and AI agents on RootCX, the open-source platform with shared PostgreSQL, auto-generated CRUD APIs, OIDC SSO, role-based access control, audit logging, scheduled jobs, inbound webhooks, message queuing, encrypted secrets, file storage, managed deployment, and pre-built integrations. Use when building, modifying, or reviewing any RootCX application — including frontends, manifests, backends, agents, integrations, or deployment.
license: Apache-2.0
metadata:
  version: 0.5.2
---

RootCX changes frequently. Your training data may be outdated. Verify against the live documentation before implementing. Any doc page is available as raw markdown by appending `.md` to the URL (e.g., `https://rootcx.com/docs/developers/manifests.md`).

## Integration routing

| Building... | Start here | Reference |
|---|---|---|
| App with entities and CRUD UI | Manifest + SDK hooks | [references/data.md](references/data.md) |
| Backend logic, RPC handlers, jobs | `serve()` API + worker lifecycle | [references/backend.md](references/backend.md) |
| AI agent with tools and supervision | agent.json + LangGraph backend | [references/agents.md](references/agents.md) |
| Integration with external API | OAuth, actions, credentials | [references/integrations.md](references/integrations.md) |
| Frontend layout, components, routing | `@rootcx/ui` + Tailwind v4 | [references/ui.md](references/ui.md) |
| Component props and catalogue | Full prop signatures | [references/ui-components.md](references/ui-components.md) |

Read the relevant reference file before writing code.

## Local CLI workflow

Application source, builds, tests, and deployment always stay in the user's local workspace. MCP provides authenticated RootCX context and governed actions; it never receives application source code and never builds or deploys an app.

When the official RootCX MCP server is available:

1. Call `get_project_context` before designing or modifying an app. Use `workspace.url` as the CLI login target.
2. Run `rootcx --version` when the CLI is available. This workflow requires RootCX CLI 0.17.2 or newer. If the CLI is missing or older and local command execution is available, ask once for approval to download or upgrade the verified RootCX executable and update `PATH`. After approval, run the installer bundled with this plugin instead of downloading and executing a remote script:
   - macOS or Linux: run `scripts/install.sh` with `sh` (the path is relative to the plugin root, two directories above this file).
   - Windows PowerShell: run `scripts/install.ps1` with `pwsh -File` (the path is relative to the plugin root, two directories above this file).
   The bundled installers verify the release archive checksum before extracting or executing it. Do not use `curl | sh`, `wget | sh`, `irm | iex`, or another remote-script pipeline.
3. After installation, run `rootcx --version` again and stop with a clear explanation if version 0.17.2 or newer is still unavailable. Use `rootcx` from `PATH`; if the current process has not reloaded its environment, invoke `~/.rootcx/bin/rootcx` on macOS/Linux or `$HOME\.rootcx\bin\rootcx.exe` on Windows.
4. Run `rootcx auth whoami --json` and compare its `workspaceUrl` with the exact `workspace.url` returned by MCP. If they differ, run `rootcx auth login <workspace-url>` and let the user complete browser authentication. Never copy MCP access or refresh tokens into the CLI.
5. For a new app, ask only for the desired outcome, the people who will use it, and the information they must manage. Restate one concise user story and obtain agreement.
6. Choose a stable app ID and run `rootcx new <app-id>` in the local workspace. Do not run bare `rootcx init`: it is the standalone account/workspace onboarding command and deploys its initial scaffold immediately.
7. Read the relevant references and live documentation, then implement the app locally. Never invent manifest fields, SDK hooks, or UI components.
8. Run the project's relevant local checks. Call `validate_manifest` with the completed `manifest.json` and fix every reported issue.
9. Explain what will change and obtain explicit approval before deployment.
10. Run `rootcx deploy` from the app directory. Return `<workspace.url>/apps/<app-id>/` and ask the user to try the primary workflow.

If local command execution is unavailable, explain that building requires ChatGPT Desktop Work in local mode or another local coding agent. Do not fall back to sending source code through MCP.

`get_project_context.onboarding.firstAppDeployed` is the authoritative activation state. Do not infer onboarding from the number of installed apps because a tenant may contain system or prebuilt applications.

For an existing app, call `get_app` before proposing changes and work from its local source directory. Use `create_records` only for user-approved initial data; never fabricate real customer or company data.

## Key documentation

When the task does not fit a single domain above, fetch the specific doc page:

| Topic | URL |
|-------|-----|
| Manifest reference | `https://rootcx.com/docs/developers/manifests.md` |
| React SDK (all hooks + RuntimeClient) | `https://rootcx.com/docs/developers/sdk.md` |
| Backend workers (serve, ctx, deploy) | `https://rootcx.com/docs/developers/backend.md` |
| Data API (CRUD, query operators) | `https://rootcx.com/docs/platform/data.md` |
| AI agents (tools, supervision, invoke) | `https://rootcx.com/docs/build/agent.md` |
| Integrations (OAuth, actions, connections) | `https://rootcx.com/docs/build/integration.md` |
| Storage (buckets + app files + nonces) | `https://rootcx.com/docs/platform/storage.md` |
| Authentication (JWT, OIDC, magic links) | `https://rootcx.com/docs/platform/authentication.md` |
| Webhooks | `https://rootcx.com/docs/platform/webhooks.md` |
| Jobs | `https://rootcx.com/docs/platform/jobs.md` |
| RBAC | `https://rootcx.com/docs/governance/rbac.md` |

## Core principles

1. **All data from hooks.** Never `useState` with mock data. Types come from `@rootcx/sdk`.
2. **Manifest is the source of truth.** Entities, permissions, actions, crons, webhooks — declare everything in `manifest.json`. Core derives the rest.
3. **PostgreSQL only.** Never SQLite, never file-based storage. All apps share one PG instance.
4. **`serve()` for backends.** Never write raw stdin/stdout IPC unless building a custom LangGraph agent backend.
5. **RBAC is structural.** Permissions are enforced by the Core in PostgreSQL (RLS), not in app code.
