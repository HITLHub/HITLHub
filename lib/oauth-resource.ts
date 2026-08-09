import { createAuthClient } from "better-auth/client";
import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";
import { auth } from "@/lib/auth";
import { MCP_RESOURCE, MCP_RESOURCE_METADATA, type McpScope } from "@/lib/oauth-config";
import { API_KEY_PREFIX, verifyApiKey } from "@/lib/api-keys";

const resourceClient = createAuthClient({
  plugins: [oauthProviderResourceClient(auth)],
});

export type McpPrincipal = {
  userId: string;
  clientId: string;
  scopes: string[];
  authMethod: "oauth" | "api_key";
  apiKeyId?: string;
  credentialName?: string;
};

export function bearerChallenge(scope?: McpScope) {
  const parts = [`Bearer resource_metadata="${MCP_RESOURCE_METADATA}"`];
  if (scope) parts.push(`scope="${scope}"`);
  return parts.join(", ");
}

export async function verifyMcpRequest(request: Request, requiredScope?: McpScope): Promise<McpPrincipal> {
  const authorization = request.headers.get("authorization") ?? "";
  const secret = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (secret.startsWith(API_KEY_PREFIX)) {
    const apiKey = await verifyApiKey(secret, requiredScope);
    return {
      userId: apiKey.owner_user_id,
      clientId: `api-key:${apiKey.id}`,
      scopes: apiKey.scopes,
      authMethod: "api_key",
      apiKeyId: apiKey.id,
      credentialName: apiKey.name,
    };
  }

  const payload = await resourceClient.verifyAccessTokenRequest(request, {
    verifyOptions: { audience: MCP_RESOURCE },
    requiredScopes: requiredScope ? [requiredScope] : undefined,
  });

  const userId = typeof payload.sub === "string" ? payload.sub : "";
  const clientId = typeof payload.client_id === "string"
    ? payload.client_id
    : typeof payload.azp === "string" ? payload.azp : "";
  const scopes = typeof payload.scope === "string"
    ? payload.scope.split(" ").filter(Boolean)
    : Array.isArray(payload.scopes) ? payload.scopes.filter((value): value is string => typeof value === "string") : [];

  if (!userId || !clientId) throw new Error("Access token is missing subject or client identity");
  return { userId, clientId, scopes, authMethod: "oauth" };
}
