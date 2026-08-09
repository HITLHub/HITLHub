import { auth } from "@/lib/auth";
import { ensureHitlSchema, pool } from "@/lib/db";
import { headers } from "next/headers";

async function ownerId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await ownerId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) return Response.json({ error: "A valid name is required" }, { status: 400 });
  await ensureHitlSchema();
  const result = await pool.query(
    `UPDATE api_key SET name = $1 WHERE id = $2 AND owner_user_id = $3
     RETURNING id, owner_user_id, name, key_prefix, scopes, status, created_at, last_used_at, revoked_at`,
    [name, id, userId],
  );
  return result.rowCount ? Response.json({ apiKey: result.rows[0] }) : Response.json({ error: "API key not found" }, { status: 404 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await ownerId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  await ensureHitlSchema();
  const result = await pool.query(
    `UPDATE api_key SET status = 'revoked', revoked_at = COALESCE(revoked_at, now())
     WHERE id = $1 AND owner_user_id = $2 AND status = 'active'
     RETURNING id, owner_user_id, name, key_prefix, scopes, status, created_at, last_used_at, revoked_at`,
    [id, userId],
  );
  return result.rowCount ? Response.json({ apiKey: result.rows[0] }) : Response.json({ error: "Active API key not found" }, { status: 404 });
}
