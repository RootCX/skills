# Core REST API — Integrations

Bind — base `/api/v1/apps/{app_id}/integrations`:

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/` | — | bindings list `[{integrationId, enabled, connectionId, createdAt}]` |
| POST | `/` | `{integrationId, connectionId?}` | bind app to integration (optionally with a specific connection) |
| DELETE | `/{integration_id}` | — | unbind |

Connections — base `/api/v1/integrations/{integration_id}/connections`:

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/` | — | user's connections `[{id, integrationId, userId, label, createdAt}]` |
| PATCH | `/{connection_id}` | `{label?}` | update connection label |
| DELETE | `/{connection_id}` | — | remove connection + credentials |

Actions + auth — base `/api/v1/integrations`:

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/{integration_id}/actions/{action_id}` | action input | action result |
| GET | `/{integration_id}/auth` | — | `{connected, connectionCount?}` |
| POST | `/{integration_id}/auth/start` | — | OAuth url or credential schema |
| POST | `/{integration_id}/auth/credentials` | `{credentials, label?}` | `{connectionId}` |
| POST | `/{integration_id}/auth/delegate` | `{agent_app_id}` | delegate credentials to agent |
| GET | `/{integration_id}/connected-users` | — | list of user IDs (admin only) |

**Multi-account connections:** A user can connect multiple accounts to the same integration (e.g., two Gmail inboxes). Each connection has an `id` and a `label` (typically the email address). When binding an app to an integration, pass `connectionId` to select which account that app uses. If omitted, the user's first connection is used.

**Credential resolution order:** When an action is executed with header `x-app-id`:
1. Check app binding → use its `connectionId`
2. Check for delegation connection → follow pointer to source
3. Fallback to user's first direct connection

**Deduplication:** Connecting the same account twice (same label) reuses the existing connection and refreshes the token.

**From a worker:** `POST {runtime_url}/api/v1/integrations/{integration_id}/actions/{action_id}` with `Authorization: Bearer {authToken}`, body = action input.
