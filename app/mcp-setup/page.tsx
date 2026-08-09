import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConsoleNav } from "@/app/console-nav";

const endpoint = "https://demo.hitlhub.dev/mcp";

export default async function McpSetupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return <main className="app-shell">
    <ConsoleNav active="setup" user={{ name: session.user.name, email: session.user.email }} />
    <div className="settings-page setup-page">
      <header className="page-heading"><div><p className="eyebrow">DEVELOPER SETUP</p><h1>Connect an agent</h1><p>Use OAuth for ChatGPT or an API key for headless agents and scripts.</p></div><span className="endpoint-live">● Live</span></header>
      <section className="settings-card"><div className="method-heading"><span>01</span><div><h2>ChatGPT with OAuth</h2><p className="muted">Recommended for interactive connectors. No secret needs to be copied.</p></div></div><ol className="setup-steps"><li>Open ChatGPT Settings → Apps → Create.</li><li>Enter the MCP URL below and select OAuth.</li><li>Connect, sign in to HITLHub, and approve access.</li></ol><pre><code>{endpoint}</code></pre><p className="setup-note">Sessions created by ChatGPT appear only in the inbox of the user who authorized the connection.</p></section>
      <section className="settings-card"><div className="method-heading"><span>02</span><div><h2>Agent with API key</h2><p className="muted">Create a key, save it as an environment variable, then add this server configuration.</p></div></div><pre><code>{`{
  "mcpServers": {
    "hitlhub": {
      "url": "${endpoint}",
      "headers": {
        "Authorization": "Bearer \${HITLHUB_API_KEY}"
      }
    }
  }
}`}</code></pre><pre><code>HITLHUB_API_KEY=hitl_live_your_key</code></pre><p className="setup-note">Never commit an API key or expose it in browser-side code. Each key routes sessions to the inbox of its owner.</p></section>
      <section className="settings-card"><h2>Available tools</h2><div className="tool-table"><div><code>create_session</code><span>Ask a human and set an expiration.</span></div><div><code>get_session</code><span>Poll for the human decision.</span></div><div><code>cancel_session</code><span>Cancel a request that is still waiting.</span></div></div></section>
    </div>
  </main>;
}
