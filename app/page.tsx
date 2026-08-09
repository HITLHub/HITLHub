import { auth } from "@/lib/auth";
import { listSessions } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { SessionConsole } from "@/app/session-console";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userSession = await auth.api.getSession({ headers: await headers() });
  if (!userSession) redirect("/sign-in");
  const sessions = await listSessions();
  return <main className="app-shell">
    <nav>
      <div className="nav-brand"><span>∞</span><strong>HITLHub</strong></div>
      <div className="nav-center"><a className="selected">Inbox</a><a href="/mcp" target="_blank">MCP status</a></div>
      <div className="profile"><span>{userSession.user.name?.slice(0, 1).toUpperCase()}</span><div><strong>{userSession.user.name}</strong><small>{userSession.user.email}</small></div><form action={signOut}><button>Sign out</button></form></div>
    </nav>
    <SessionConsole initial={sessions} />
  </main>;
}
