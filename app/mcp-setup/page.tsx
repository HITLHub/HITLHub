import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleUserRound, KeyRound, PlugZap } from "lucide-react";
import { ConsoleNav } from "@/app/console-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const endpoint = "https://demo.hitlhub.dev/mcp";
const config = `{
  "mcpServers": {
    "hitlhub": {
      "url": "${endpoint}",
      "headers": {
        "Authorization": "Bearer \${HITLHUB_API_KEY}"
      }
    }
  }
}`;

function CodeBlock({ children }: { children: string }) {
  return <pre className="max-w-full overflow-x-auto rounded-xl bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100"><code>{children}</code></pre>;
}

export default async function McpSetupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return <main className="min-h-svh bg-muted/25">
    <ConsoleNav active="setup" user={{ name: session.user.name, email: session.user.email }} />
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-7 flex items-start justify-between gap-4"><div><p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Developer setup</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Connect an agent</h1><p className="mt-2 text-sm text-muted-foreground">OAuth for interactive connectors. API keys for servers and scripts.</p></div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" />Live</Badge></div>

      <Tabs defaultValue="oauth" className="gap-5"><TabsList className="grid w-full grid-cols-2 sm:w-fit"><TabsTrigger value="oauth"><CircleUserRound />OAuth</TabsTrigger><TabsTrigger value="api-key"><KeyRound />API key</TabsTrigger></TabsList>
        <TabsContent value="oauth"><Card className="shadow-none"><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><CircleUserRound className="size-5" /></div><CardTitle>Connect ChatGPT with OAuth</CardTitle><CardDescription>Recommended for interactive connectors. No secret needs to be copied or managed.</CardDescription></CardHeader><CardContent className="space-y-5"><ol className="grid gap-3 text-sm"><li className="flex gap-3"><Badge variant="secondary">1</Badge><span>Open ChatGPT Settings → Apps → Create.</span></li><li className="flex gap-3"><Badge variant="secondary">2</Badge><span>Enter the MCP URL and select OAuth authentication.</span></li><li className="flex gap-3"><Badge variant="secondary">3</Badge><span>Connect, sign in to HITLHub, and approve access.</span></li></ol><CodeBlock>{endpoint}</CodeBlock><div className="flex gap-2 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground"><CheckCircle2 className="size-4 shrink-0 text-emerald-600" /><span>Sessions appear only in the inbox of the user who authorizes the connection.</span></div></CardContent></Card></TabsContent>
        <TabsContent value="api-key"><Card className="shadow-none"><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><KeyRound className="size-5" /></div><CardTitle>Connect with an API key</CardTitle><CardDescription>Best for headless agents, backend services, development tools, and scripts.</CardDescription></CardHeader><CardContent className="space-y-5"><ol className="grid gap-3 text-sm"><li className="flex gap-3"><Badge variant="secondary">1</Badge><span>Create a key in the API Keys view.</span></li><li className="flex gap-3"><Badge variant="secondary">2</Badge><span>Save it as a server-side environment variable.</span></li><li className="flex gap-3"><Badge variant="secondary">3</Badge><span>Add the MCP server configuration to your agent.</span></li></ol><CodeBlock>{config}</CodeBlock><CodeBlock>HITLHUB_API_KEY=hitl_live_your_key</CodeBlock><div className="flex gap-2 rounded-xl border bg-amber-50 p-3 text-xs text-amber-800"><KeyRound className="size-4 shrink-0" /><span>Never commit API keys or expose them in browser-side code.</span></div></CardContent></Card></TabsContent>
      </Tabs>

      <Card className="mt-5 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><PlugZap className="size-5" />Available tools</CardTitle><CardDescription>The minimal session lifecycle exposed by the MCP server.</CardDescription></CardHeader><CardContent><div className="divide-y rounded-xl border">{[["create_session", "Ask a human a structured question and set an expiration."], ["get_session", "Poll the session for status and the human decision."], ["cancel_session", "Cancel a request that is still waiting."]].map(([tool, description]) => <div key={tool} className="grid gap-1 p-4 sm:grid-cols-[170px_1fr] sm:gap-5"><code className="text-sm font-medium">{tool}</code><span className="text-sm text-muted-foreground">{description}</span></div>)}</div></CardContent></Card>
    </div>
  </main>;
}
