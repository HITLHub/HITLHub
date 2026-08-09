import { auth } from "@/lib/auth";
import { ensureHitlSchema, pool } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userSession = await auth.api.getSession({ headers: await headers() });
  if (!userSession) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  if (typeof body.answer !== "string" || !body.answer.trim()) {
    return Response.json({ error: "Answer is required" }, { status: 400 });
  }

  await ensureHitlSchema();
  const result = await pool.query(
    `UPDATE hitl_session
     SET status = 'answered', answer = $1, answered_at = now(), answered_by = $2
     WHERE id = $3 AND status = 'waiting' AND expires_at > now()
     RETURNING *`,
    [body.answer.trim(), userSession.user.email, id],
  );
  if (!result.rowCount) return Response.json({ error: "Session is no longer waiting" }, { status: 409 });
  return Response.json({ session: result.rows[0] });
}
