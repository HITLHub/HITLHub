import { auth } from "@/lib/auth";
import { listSessions } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SessionConsole } from "@/app/session-console";
import { ConsoleNav } from "@/app/console-nav";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userSession = await auth.api.getSession({ headers: await headers() });
  if (!userSession) redirect("/sign-in");
  const sessions = await listSessions(userSession.user.id);
  return <main className="min-h-svh bg-muted/25">
    <ConsoleNav active="inbox" user={{ name: userSession.user.name, email: userSession.user.email }} />
    <SessionConsole initial={sessions} />
  </main>;
}
