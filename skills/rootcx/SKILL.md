---
name: rootcx
description: Build internal apps and AI agents on RootCX, the open-source platform with shared PostgreSQL, auto-generated CRUD APIs, OIDC SSO, role-based access control, audit logging, scheduled jobs, inbound webhooks, message queuing, encrypted secrets, file storage, managed deployment, and pre-built integrations. Get everything you need to ship internal tools to production out of the box.
license: Apache-2.0
compatibility: Requires the RootCX CLI (curl -fsSL https://rootcx.com/install.sh | sh)
metadata:
  version: 0.2.0
---

# RootCX App Development

[RootCX](https://rootcx.com) is governed infrastructure for internal tools and AI agents. Every app you build deploys to a runtime with the same PostgreSQL database, role-based access, audit logs, and SSO your IT team already trusts.

A RootCX app is a TypeScript/React frontend plus a `manifest.json` data contract. Core syncs the schema to PostgreSQL and auto-generates CRUD APIs, so most apps need zero backend code, just `@rootcx/sdk` hooks and `@rootcx/ui` components. Add a Bun worker for custom logic, or an agent that reads from the same database your team uses.

## Reference (fetch from docs)

Before generating code, fetch the relevant documentation pages. Append `.md` to any doc URL to get the raw markdown source.

| Topic | URL |
|-------|-----|
| Manifest (entities, fields, types, schema sync, actions, crons, webhooks, public access, indexes, checks) | `https://rootcx.com/docs/developers/manifests.md` |
| React SDK (hooks, components, RuntimeClient, QueryOptions, types) | `https://rootcx.com/docs/developers/sdk.md` |
| Backend workers (serve API, ctx, lifecycle hooks, RPC, jobs, deploy) | `https://rootcx.com/docs/developers/backend.md` |
| AI agents (agent.json, tools, supervision, invoke, sessions, triggers) | `https://rootcx.com/docs/build/agent.md` |
| Data API (CRUD endpoints, query operators, filtering, pagination) | `https://rootcx.com/docs/platform/data.md` |
| Integrations (actions, OAuth, credentials, connections, delegation) | `https://rootcx.com/docs/build/integration.md` |
| Storage (platform buckets + app files + nonce uploads) | `https://rootcx.com/docs/platform/storage.md` |
| Authentication (JWT, OIDC, magic links, sessions) | `https://rootcx.com/docs/platform/authentication.md` |
| Job queue (enqueue, dispatch, statuses) | `https://rootcx.com/docs/platform/jobs.md` |
| Webhooks (tokens, ingress, worker handler) | `https://rootcx.com/docs/platform/webhooks.md` |
| RBAC (roles, permissions, wildcards, API) | `https://rootcx.com/docs/governance/rbac.md` |

Fetch only the pages relevant to the task. Do not fetch all pages for every request.

## Rules (always loaded)

- [UI & Styling](./rules/ui.md) — components, layout, routing, dark mode, patterns
- [UI Components](./rules/ui-components.md) — full component catalogue with prop signatures
- [Craft Rules](./rules/craft.md) — behavioral rules, constraints, and code generation guidance
