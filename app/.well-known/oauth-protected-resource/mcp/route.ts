import { auth } from "@/lib/auth";
import { createAuthClient } from "better-auth/client";
import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";
import { AUTH_ISSUER, MCP_RESOURCE, MCP_SCOPES } from "@/lib/oauth-config";

const client = createAuthClient({ plugins: [oauthProviderResourceClient(auth)] });

export async function GET() {
  const metadata = await client.getProtectedResourceMetadata({
    resource: MCP_RESOURCE,
    authorization_servers: [AUTH_ISSUER],
    scopes_supported: [...MCP_SCOPES],
    resource_name: "HITLHub MCP",
    bearer_methods_supported: ["header"],
  });
  return Response.json(metadata, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=60" },
  });
}
