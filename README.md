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

Better Auth is mounted at `/api/auth/[...all]`. The remote MCP endpoint is `/mcp` and supports OAuth 2.1 with PKCE or a user-owned API key. OAuth protected-resource metadata is published at `/.well-known/oauth-protected-resource/mcp`.

## Connect an agent

Use OAuth when adding `https://demo.hitlhub.dev/mcp` to ChatGPT. For a headless agent, create a key in the API Keys view and send it as a bearer token:

```json
{
  "mcpServers": {
    "hitlhub": {
      "url": "https://demo.hitlhub.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${HITLHUB_API_KEY}"
      }
    }
  }
}
```

Every API key belongs to the user who created it. Sessions created with that key appear only in that user's inbox. The full key is displayed once and only its SHA-256 hash is stored.
