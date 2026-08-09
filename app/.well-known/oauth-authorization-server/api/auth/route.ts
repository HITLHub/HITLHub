import { auth } from "@/lib/auth";
import { AUTH_ORIGIN } from "@/lib/oauth-config";

export async function GET(request: Request) {
  const upstream = new URL("/api/auth/.well-known/oauth-authorization-server", AUTH_ORIGIN);
  return auth.handler(new Request(upstream, { headers: request.headers }));
}
