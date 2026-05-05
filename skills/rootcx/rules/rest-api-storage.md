# Core REST API — File Storage

Base: `/api/v1/apps/{app_id}/storage`

Max file size: 64 MiB. Files stored in PostgreSQL (`rootcx_system.files`). All endpoints require JWT.

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/upload` | `multipart/form-data` (field: `file`) | `{file_id, name, content_type, size}` (201) |
| GET | `/{file_id}` | — | Binary file (Content-Disposition: attachment) |
| DELETE | `/{file_id}` | — | `{deleted: file_id}` |

## Usage in manifest

Use field type `file` (maps to `TEXT` in DB) to store the `file_id` returned by upload. Or store `file_id` in a dedicated collection with metadata (filename, size, content_type) for queryability.

## Frontend upload pattern

```tsx
const client = useRuntimeClient();
const form = new FormData();
form.append("file", file);

const res = await fetch(`${client.getBaseUrl()}/api/v1/apps/${APP_ID}/storage/upload`, {
  method: "POST",
  headers: { Authorization: `Bearer ${client.getAccessToken()}` },
  body: form,
});
const { file_id, name, content_type, size } = await res.json();
```

## Frontend download pattern

```tsx
const res = await fetch(`${client.getBaseUrl()}/api/v1/apps/${APP_ID}/storage/${fileId}`, {
  headers: { Authorization: `Bearer ${client.getAccessToken()}` },
});
const blob = await res.blob();
```

## Worker upload (nonce-based, no JWT)

Workers receive a single-use nonce from Core via IPC to upload/download without a user JWT.

- Upload: `POST /api/v1/storage/upload/{nonce}` — raw body (not multipart)
- Download: `GET /api/v1/storage/download/{nonce}`
