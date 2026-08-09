import { auth } from "@/lib/auth";
import { listSessions } from "@/lib/db";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const userSession = await auth.api.getSession({ headers: await headers() });
  if (!userSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ sessions: await listSessions() });
}
