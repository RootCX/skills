# RootCX App Manifest

Apps require: `manifest.json` (data contract) + React code using `@rootcx/sdk` hooks and `@rootcx/ui` components.

## manifest.json

```json
{
  "appId": "<id>",
  "name": "<Name>",
  "version": "0.0.1",
  "description": "<description>",
  "dataContract": [
    {
      "entityName": "<entity>",
      "fields": [
        { "name": "<field>", "type": "<type>", "required": true },
        { "name": "<field>", "type": "entity_link", "references": { "entity": "<target>", "field": "id" } },
        { "name": "<field>", "type": "entity_link", "required": true, "on_delete": "cascade", "references": { "entity": "<parent>", "field": "id" } },
        { "name": "<field>", "type": "text", "enum_values": ["a", "b", "c"] }
      ]
    }
  ],
  "permissions": {
    "permissions": [
      { "key": "<entity>.<action>", "description": "<description>" }
    ]
  }
}
```

### Field types

`text` `number` `boolean` `date` `timestamp` `json` `file` `entity_link` `[text]` `[number]`

### Rules

- `id`, `created_at`, `updated_at` are auto-generated — omit from `fields`
- `entity_link` requires `"references": { "entity": "<target>", "field": "id" }`. `<target>` is `"<entity>"` (same app) or `"core:users"` (FK → `rootcx_system.users`). Cross-app refs not yet supported.
- `"required": true` = mandatory on create; omit key for optional
- `"on_delete"` controls FK behavior when the referenced parent is deleted. Values: `"cascade"` (delete child with parent), `"restrict"` (block parent delete), `"set_null"` (set FK to NULL). If omitted: `required: true` defaults to `restrict`, optional fields default to `set_null`. Use `cascade` on join tables and child records that have no meaning without the parent (e.g. `list_records.list_id`). Never use `cascade` on user references.
- `"enum_values": [...]` restricts text fields to fixed values

---

## Actions

Expose worker RPC methods as AI agent tools. `id` = RPC method name.

```json
"actions": [
  { "id": "<method>", "name": "<Name>", "description": "<when to use>", "inputSchema": { ... }, "outputSchema": { ... } }
],
"instructions": "<freeform guidance for AI on how/when to use these actions>"
```

- `inputSchema`: JSON Schema, required — LLM uses it to build valid input
- `outputSchema`: optional — helps LLM interpret results
- `description`: how the LLM decides when to call it
- `instructions`: top-level, optional — multi-action coordination hints
- RBAC: `app:{appId}:action:{id}` auto-registered at install. Agents with `app:{appId}:*` have access by default.
- Worker receives standard RPC: `{ type: "rpc", method: "<id>", params: <input> }` — no code changes needed

---

## Crons

Declarative scheduled jobs. Core syncs via pg_cron on deploy (create/update/delete orphans).

```json
"crons": [
  { "name": "daily-check", "schedule": "0 9 * * *", "timezone": "Europe/Paris", "payload": { "task": "do_thing" }, "overlapPolicy": "skip" }
]
```

Fields: `name` (required, unique), `schedule` (required, cron 5-field or `"N seconds"`), `timezone` (IANA, default GMT), `method` (optional, injected into `payload.method`), `payload` (object, delivered to `onJob`), `overlapPolicy` (`"skip"` default | `"queue"`).

Worker receives in `onJob` same as one-shot jobs. Core adds `cron_id` to payload.

---

## Schema Sync

On install/deploy, Core runs `CREATE SCHEMA IF NOT EXISTS` + `CREATE TABLE IF NOT EXISTS` for each entity in `dataContract`. Then `sync_schema` diffs DB vs manifest and auto-applies all changes (add/drop columns, alter types, nullability, defaults, check constraints). Studio shows a confirmation dialog before applying.

### Manifest ↔ DB contract

`dataContract` fields map to columns. Auto-columns (`id UUID`, `created_at`, `updated_at`) added by Core — omit from manifest `fields`. Type mapping: `text`→`TEXT`, `number`→`DOUBLE PRECISION`, `boolean`→`BOOLEAN`, `date`→`DATE`, `timestamp`→`TIMESTAMPTZ`, `json`→`JSONB`, `file`→`TEXT`, `entity_link`→`UUID`, `[text]`→`TEXT[]`, `[number]`→`DOUBLE PRECISION[]`.
