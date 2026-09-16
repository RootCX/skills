# Public data publications

Requires **Core 0.26.0 or newer on the target tenant**. The source contract is
`docs/publications.md` in the Core `core-v0.26.0` release. Updating skills, the
SDK or the CLI does not upgrade Core.

Use publications when anonymous visitors need an approved subset of application
data. Core creates a credentialless execution identity for the installation;
developers do not create a service account or expose a bearer token to visitors.

## Declare the disclosure

For an app `catalog` with a `products` entity containing `name` (text),
`published` (boolean) and `internal_notes` (text), add this top-level manifest
property:

```json
{
  "public": {
    "publications": [{
      "name": "catalog",
      "entity": "products",
      "actions": ["list", "read"],
      "fields": ["name"],
      "where": {"published": true}
    }],
    "rpcs": [{"name": "list", "publications": ["catalog"]}],
    "collections": [{
      "entity": "products",
      "actions": ["list", "read"],
      "publication": "catalog"
    }]
  }
}
```

- `fields` must be explicit and nonempty. Output and fixed-filter fields cannot
  be sensitive or JSON fields.
- `where` is a fixed disclosure predicate. Visitor filters only narrow it.
- RPC bindings use `publications` (an array of names); collection bindings use
  `publication` (one name). Declare only the surfaces the app needs.
- Ownership remains enforced by default (`releaseOwnership: false`). Set
  `releaseOwnership: true` only when the provider explicitly intends to publish
  matching rows regardless of owner. Other restrictive provider RLS still applies.

## Install, deploy, then approve

Install the manifest and deploy any worker through the normal local workflow.
Manifest deployment does not approve disclosure. Show the intended provider,
fields, row predicate and ownership setting to the responsible approver; carry
out approval only within the user's authorization and actual Core permissions.

Using the provider approver's authenticated HTTP client, read
`GET /api/v1/apps/catalog/publications`. Select the declaration by `name`, then
copy its current installation IDs into:

```http
POST /api/v1/apps/catalog/publications/catalog/approve
Content-Type: application/json
Authorization: Bearer <provider-approver-token>
```

```json
{
  "consumerInstallationId": "<current consumer UUID>",
  "providerInstallationId": "<current provider UUID>",
  "reason": "Publish the reviewed product catalog"
}
```

Approval requires `app:<provider>:publications.approve` or
`admin:publications.manage`, including for a same-app publication. An optional
`expiresAt` must be a future RFC 3339 timestamp. Success is `201`; stale
installation IDs produce `409`. Contract changes that rotate an installation
require fresh IDs and approval.

These are Core HTTP endpoints, not assumed CLI subcommands or MCP tools. Keep
the approver's token out of visitor code; never copy an MCP token into the CLI.

## Read without a token

An RPC implementation uses the same collection methods as ordinary workers:

```ts
serve({
  rpc: {
    list: async (_params, _caller, ctx) =>
      ctx.collection("products").findPage({
        limit: 20, orderBy: "name", order: "asc"
      })
  }
});
```

Visitors can call either declared surface without an authorization header:

```sh
curl -sS "$CORE_URL/api/v1/apps/catalog/rpc" \
  -H 'Content-Type: application/json' \
  -d '{"method":"list","params":{}}'

curl -sS --get "$CORE_URL/api/v1/public/apps/catalog/collections/products" \
  --data-urlencode 'where={"name":"Example"}' \
  --data-urlencode 'limit=20' --data-urlencode 'offset=0' \
  --data-urlencode 'orderBy=name' --data-urlencode 'order=asc'
```

The list result is `{"data":[{"name":"Example"}],"total":1}`. Use a direct HTTP
request to these public routes; do not assume authenticated SDK hooks target
them. Ordinary collection endpoints remain authenticated.

`GET /api/v1/public/apps/catalog/collections/products/{uuid}` returns one projected
record, or `404` outside the publication. `findOne({id: productId})` likewise
accepts a UUID even if `id` is absent from output fields. Other filters and sorts
may only use approved output fields. Totals count only visible rows.

Prefer `findPage` with an explicit `orderBy`. `find` rejects more than 10,000 rows,
and read responses are capped at 4 MiB. Reduce page size when needed.

Publication-bound RPCs retain this ceiling even with an administrator JWT.
Their caller is null, credentials are absent and `onStart` does not run.
They can perform declared collection reads, not SQL, writes, jobs, storage,
integration calls or agent invocation. Do not proxy a privileged worker or embed
a credential to bypass a denial.

## Another app's data

Add `"app": "provider"` to the publication, then use
`ctx.remote("provider").collection("products").findPage(...)`. The provider must
approve the publication; the consumer also needs a live
[cross-app grant](data.md#governed-cross-app-access) for that provider and entity.
Neither approval replaces the other.

Effective fields and actions are the intersection of the grant and publication.
The grant must authorize fields used by the fixed predicate too: this example
needs `name` and `published` in the grant's `fields`, while the publication only
outputs `name`. A denied read is not permission to broaden either approval.

Direct HTTP routes still use the **consumer** app ID (`catalog` here); Core
resolves the provider from the bound publication.

## Withdraw and verify

Under `/api/v1/apps/{consumer}/publications/{name}`:

| Method | Suffix | Effect |
| --- | --- | --- |
| POST | `/disable` | Pause access |
| POST | `/enable` | Resume after checking contract, installation and expiry |
| POST | `/revoke` | Permanently withdraw this approval |
| GET | `/audit` | Inspect approval and lifecycle events |

Each lifecycle POST needs `{"reason":"..."}` and approver permissions.
Revocation and expiry are terminal; publishing again requires a new approval.
Current status and grants are rechecked on use, including cached workers.
Re-enabling a publication does not restore a revoked cross-app grant.

Verify with synthetic data on a disposable tenant: anonymous reads fail before
approval; after approval, only matching rows and approved fields appear; an
administrator JWT does not widen that result; hidden-field filters are rejected;
revocation denies both direct reads and an already-used public RPC. Include
owned rows and the separate remote grant when the application uses them.
