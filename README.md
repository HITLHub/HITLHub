# HITLHub Demo

An end-to-end human decision loop for AI agents:

1. An agent calls `create_session` at `/mcp`.
2. An authenticated human sees the request in the web console and chooses an answer.
3. The agent polls `get_session` and receives the recorded human decision.

## Local development

```bash
docker compose up -d
cp .env.example .env.local
npm install
npm run migrate
npm run dev
```

Better Auth is mounted at `/api/auth/[...all]`. The remote MCP endpoint is `/mcp` and requires OAuth 2.1 authorization with PKCE. OAuth protected-resource metadata is published at `/.well-known/oauth-protected-resource/mcp`.
