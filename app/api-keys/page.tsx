import { auth } from "@/lib/auth";
import { listApiKeys } from "@/lib/api-keys";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConsoleNav } from "@/app/console-nav";
import { ApiKeysManager } from "@/app/api-keys/api-keys-manager";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const keys = await listApiKeys(session.user.id);
  return <main className="min-h-svh bg-muted/25">
    <ConsoleNav active="keys" user={{ name: session.user.name, email: session.user.email }} />
    <ApiKeysManager initial={keys} />
  </main>;
}
