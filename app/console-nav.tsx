import Link from "next/link";
import { signOut } from "@/app/actions";

export function ConsoleNav({ active, user }: { active: "inbox" | "keys" | "setup"; user: { name: string; email: string } }) {
  return <nav>
    <div className="nav-brand"><span>∞</span><strong>HITLHub</strong></div>
    <div className="nav-center">
      <Link className={active === "inbox" ? "selected" : ""} href="/">Inbox</Link>
      <Link className={active === "keys" ? "selected" : ""} href="/api-keys">API Keys</Link>
      <Link className={active === "setup" ? "selected" : ""} href="/mcp-setup">MCP Setup</Link>
    </div>
    <div className="profile"><span>{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div><form action={signOut}><button>Sign out</button></form></div>
  </nav>;
}
