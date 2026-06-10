---
name: rootcx
description: Build internal apps and AI agents on RootCX, the open-source platform with shared PostgreSQL, auto-generated CRUD APIs, OIDC SSO, role-based access control, audit logging, scheduled jobs, inbound webhooks, message queuing, encrypted secrets, file storage, managed deployment, and pre-built integrations. Use when building, modifying, or reviewing any RootCX application — including frontends, manifests, backends, agents, integrations, or deployment.
license: Apache-2.0
compatibility: Requires the RootCX CLI (curl -fsSL https://rootcx.com/install.sh | sh)
metadata:
  version: 0.3.0
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
