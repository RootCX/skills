# Core REST API -- Webhooks

Inbound webhook endpoints declared in `manifest.json`. Core generates tokens, routes incoming requests to worker RPC.

## Management

Base: `/api/v1/apps/{app_id}/webhooks`

| Method | Path | Response |
|--------|------|----------|
| GET | `/` | `Webhook[]` |

**Webhook shape:** `{ id, name, method, token, url, createdAt }`

Requires `app:{app_id}:webhook.read` permission.

## Ingress

| Method | Path | Auth | Response |
|--------|------|------|----------|
| POST | `/api/v1/hooks/{token}` | None (token is auth) | Worker RPC response |

No authentication header required. The token itself authenticates the request.

**Flow:**
1. External service POSTs to `/api/v1/hooks/{token}`
2. Core resolves token to app + method
3. Core invokes worker RPC with: `{ name, headers, body, rawBody }`
4. Worker response is returned to the caller

**Params passed to worker:**
- `name` -- webhook name from manifest (e.g. "hubspot")
- `headers` -- HTTP headers as `{ key: value }` object
- `body` -- parsed JSON body (or string if not valid JSON)
- `rawBody` -- base64-encoded raw request body (for signature verification)

## SDK

```typescript
const webhooks = await client.listWebhooks(appId);
// [{ id, name, method, token, url, createdAt }]
```

Use `url` to configure the callback URL in the external service.
