# Public review checklist

## Automated and code-backed requirements

- Universal production MCP URL is `https://rootcx.com/mcp`.
- OAuth protected resource metadata is public on both standard well-known paths.
- OAuth authorization-server and OpenID discovery metadata are public.
- Authorization code flow requires PKCE S256.
- Dynamic client registration creates public clients without stored client secrets.
- Access tokens are short-lived, audience-bound, tenant-bound, and scope-checked.
- Refresh tokens rotate on use; replay or revocation invalidates the whole token family.
- Tenant membership and active status are checked again at token issue and on every MCP request.
- Every MCP tool declares `readOnlyHint`, `openWorldHint`, and `destructiveHint`.
- Every MCP tool declares OAuth security schemes and least-privilege scopes.
- Tool results do not return credentials or access tokens.
- MCP exposes no source upload, build, or deployment tool.
- The skill keeps application work local and never transfers MCP tokens to the CLI.
- The CLI installer and release artifacts are verified before execution.
- The plugin has no custom UI and therefore no component CSP domains.
- At least five positive and three negative review cases are documented.

## Account-gated submission steps

- Verify the RootCX business identity in the OpenAI Platform organization used for submission.
- Confirm the submitter has Apps Management write permission.
- Confirm in the current OpenAI submission portal whether the selected project and its data-residency setting are eligible for public plugin submission.
- Register `https://rootcx.com/mcp` in that OpenAI project and replace the development `.mcp.json` mapping with the generated `.app.json` connection file before uploading the public plugin.
- Provision a dedicated review workspace and reviewer account without MFA, email confirmation, SMS, or private-network requirements.
- Put reviewer credentials in the submission portal only; never commit them.
- Set the exact domain verification token as `OPENAI_PLUGIN_VERIFICATION_TOKEN`, deploy, and verify that the challenge endpoint returns only that token.
- Verify edge rate limits for dynamic registration, token exchange, revocation, and the public MCP gateway in the production environment.
- Scan tools in the submission portal and confirm the imported annotations, schemas, security schemes, and server instructions.
- Select only verified countries and regions in the availability section.
- Submit for review, then publish only after approval.
