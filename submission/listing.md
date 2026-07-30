# RootCX public plugin listing

## Listing

- **Name:** RootCX
- **Category:** Productivity
- **Short description:** Build local apps and work with RootCX.
- **Website:** https://rootcx.com
- **Support:** https://rootcx.com/contact
- **Privacy:** https://rootcx.com/privacy-policy
- **Terms:** https://rootcx.com/terms-of-service

## Long description

Connect to your RootCX workspace, inspect applications, validate manifests, and create approved records. The RootCX skill installs and uses the local CLI for scaffolding, builds, tests, and deployment, so application source stays on your machine. MCP actions use your existing RootCX permissions; data mutations remain attributed in the RootCX audit trail.

## MCP

- **Submission type:** With MCP and bundled skills
- **URL type:** Universal
- **Production MCP URL:** https://rootcx.com/mcp
- **Authentication:** OAuth 2.1 authorization code with PKCE and dynamic client registration
- **Authorization server:** https://rootcx.com
- **Protected resource metadata:** https://rootcx.com/.well-known/oauth-protected-resource
- **Resource documentation:** https://rootcx.com/docs/developers/mcp
- **Domain challenge:** https://rootcx.com/.well-known/openai-apps-challenge
- **Custom UI:** None
- **CSP:** Not applicable because the plugin returns no custom UI

## Starter prompts

1. Build an internal CRM for my team and deploy it to RootCX.
2. Open my RootCX CRM, show me overdue follow-ups, and update the ones I choose.
3. Create an AI support agent in RootCX that triages requests and drafts replies.

## Availability

Select only countries where RootCX cloud service, support, privacy terms, and the required OpenAI plugin capabilities are available at submission time.

## Release notes

Initial public RootCX plugin. Includes the official RootCX local build skill and an authenticated universal MCP server for project context, manifest validation, and approved starter data.
