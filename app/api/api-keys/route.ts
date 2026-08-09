import { auth } from "@/lib/auth";
import { createApiKey, listApiKeys } from "@/lib/api-keys";
import { MCP_SCOPES, type McpScope } from "@/lib/oauth-config";
import { headers } from "next/headers";

async function currentUser() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET() {
  const session = await currentUser();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ apiKeys: await listApiKeys(session.user.id) });
}

export async function POST(request: Request) {
  const session = await currentUser();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const requestedScopes: unknown[] = Array.isArray(body.scopes) ? body.scopes : [];
  const scopes = requestedScopes.filter((scope: unknown): scope is McpScope =>
    typeof scope === "string" && (MCP_SCOPES as readonly string[]).includes(scope) && scope !== "offline_access",
  );
  if (!name || name.length > 80 || scopes.length === 0) {
    return Response.json({ error: "A name and at least one valid scope are required" }, { status: 400 });
  }
  const created = await createApiKey(session.user.id, name, [...new Set(scopes)]);
  return Response.json(created, { status: 201 });
}
