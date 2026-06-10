# Integration Patterns

Full reference: `https://rootcx.com/docs/build/integration.md`

## SDK usage

```tsx
const { connected, connections, connect, submitCredentials, remove, call } = useIntegration(integrationId);

await connect(); // starts OAuth or returns credential schema
await call("send_message", { channel: "#general", text: "Hello!" });
```

- After OAuth popup closes, hook auto-detects the new connection.
- `connections` is an array — a user can have multiple accounts connected.
- Connecting same account twice (same label) reuses the existing connection and refreshes credentials.

## Multi-account connections

One user can connect multiple accounts (e.g., two Gmail inboxes). Each connection has an `id` and `label`.

When binding an app to an integration, pass `connectionId` to select which account. If omitted, first connection is used.

## Credential resolution order

When an action executes:

1. **App binding** — if `x-app-id` header present and binding has a `connectionId`, use it.
2. **Delegation** — if a delegation connection exists, follow it.
3. **First direct connection** — fallback to user's oldest connection.

## Calling from a worker

```typescript
const res = await fetch(`${ctx.runtimeUrl}/api/v1/integrations/${integrationId}/actions/${actionId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${caller.authToken}` },
  body: JSON.stringify({ channel: "#general", text: "Hello from worker" }),
});
```

## Traps to avoid

- Never guess action IDs. Call `list_integrations` first to discover available actions.
- Agent credential delegation: agents don't have their own OAuth tokens. An admin must delegate via `POST /api/v1/integrations/{id}/auth/delegate`.
- Integration permissions follow the pattern `integration:{integrationId}:{actionId}`.
