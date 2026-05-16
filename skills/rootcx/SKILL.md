---
name: rootcx
description: Build internal apps and AI agents on RootCX, the open-source platform with shared PostgreSQL, auto-generated CRUD APIs, OIDC SSO, role-based access control, audit logging, scheduled jobs, inbound webhooks, message queuing, encrypted secrets, file storage, managed deployment, and pre-built integrations. Get everything you need to ship internal tools to production out of the box.
license: Apache-2.0
compatibility: Requires the RootCX CLI (curl -fsSL https://rootcx.com/install.sh | sh)
metadata:
  version: 0.1.0
---

# RootCX App Development

[RootCX](https://rootcx.com) is governed infrastructure for internal tools and AI agents. Every app you build deploys to a runtime with the same PostgreSQL database, role-based access, audit logs, and SSO your IT team already trusts. Internal tools that ship to production, not just AI prototypes. One platform instead of twenty subscriptions, open source and self-hostable.

A RootCX app is a TypeScript/React frontend plus a `manifest.json` data contract. Core syncs the schema to PostgreSQL and auto-generates CRUD APIs, so most apps need zero backend code, just `@rootcx/sdk` hooks and `@rootcx/ui` components. Add a Bun worker for custom logic, or an agent that reads from the same database your team uses, follows the same access rules, and logs every action.

Learn more at [rootcx.com](https://rootcx.com).

## Rules

- [Manifest](./rules/manifest.md) — data contract, entities, field types, schema sync
- [SDK Hooks](./rules/sdk-hooks.md) — useAppCollection, useAppRecord, useIntegration, queries
- [UI & Styling](./rules/ui.md) — components, layout, routing, dark mode, AuthGate
- [UI Components](./rules/ui-components.md) — full component catalogue with prop signatures
- [Backend Worker](./rules/backend-worker.md) — Bun worker IPC protocol, RPC, jobs
- [REST API](./rules/rest-api.md) — Core HTTP API overview, where operators
- [REST API — Collections](./rules/rest-api-collections.md) — CRUD endpoints, query params
- [REST API — Integrations](./rules/rest-api-integrations.md) — bind, actions, auth
- [REST API — Storage](./rules/rest-api-storage.md) — file upload/download/delete
- [REST API — Jobs](./rules/rest-api-jobs.md) — async job queue
- [REST API — Webhooks](./rules/rest-api-webhooks.md) — inbound webhook endpoints
- [AI Agent](./rules/agent.md) — LangGraph backend, agent.json config, SSE invoke
