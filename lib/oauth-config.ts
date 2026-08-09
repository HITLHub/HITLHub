export const AUTH_ORIGIN = process.env.BETTER_AUTH_URL || "http://localhost:3000";
export const AUTH_ISSUER = `${AUTH_ORIGIN}/api/auth`;
export const MCP_RESOURCE = `${AUTH_ORIGIN}/mcp`;

export const MCP_SCOPES = [
  "hitl:create",
  "hitl:read",
  "hitl:cancel",
  "offline_access",
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

export const MCP_RESOURCE_METADATA = `${AUTH_ORIGIN}/.well-known/oauth-protected-resource/mcp`;
