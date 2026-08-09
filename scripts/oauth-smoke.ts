import { createHash, randomBytes } from "node:crypto";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3100";
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
if (!email || !password) throw new Error("TEST_EMAIL and TEST_PASSWORD are required");

function base64url(value: Buffer) {
  return value.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function json(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body as Record<string, any>;
}

async function main() {
  const redirectUri = "http://localhost:9876/callback";
  const registration = await json(await fetch(`${base}/api/auth/oauth2/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "HITLHub OAuth Smoke Test",
      application_type: "native",
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: "hitl:create hitl:read hitl:cancel offline_access",
    }),
  }));

  const signIn = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, password }),
  });
  await json(signIn);
  const cookie = (signIn.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie) throw new Error("Sign-in did not issue a session cookie");

  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const authorize = new URL(`${base}/api/auth/oauth2/authorize`);
  authorize.searchParams.set("client_id", registration.client_id);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "hitl:create hitl:read hitl:cancel offline_access");
  authorize.searchParams.set("resource", `${base}/mcp`);
  authorize.searchParams.set("state", base64url(randomBytes(18)));
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  const authorization = await fetch(authorize, { headers: { Cookie: cookie }, redirect: "manual" });
  let consentLocation = authorization.headers.get("location");
  if (!consentLocation && authorization.ok) {
    const body = await authorization.json() as { url?: string; redirect_uri?: string };
    consentLocation = body.url || body.redirect_uri || null;
  }
  if (!consentLocation?.includes("/consent?")) throw new Error(`Expected consent redirect, received ${authorization.status} ${consentLocation}`);
  const oauthQuery = new URL(consentLocation, base).search.slice(1);

  const consent = await json(await fetch(`${base}/api/auth/oauth2/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie, Origin: base },
    body: JSON.stringify({ accept: true, oauth_query: oauthQuery }),
  }));
  const callback = new URL(consent.redirect_uri || consent.url);
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("Consent did not return an authorization code");

  const token = await json(await fetch(`${base}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: registration.client_id,
      redirect_uri: redirectUri,
      code,
      code_verifier: verifier,
      resource: `${base}/mcp`,
    }),
  }));

  const tokenParts = String(token.access_token || "").split(".");
  const tokenClaims = tokenParts.length === 3
    ? JSON.parse(Buffer.from(tokenParts[1], "base64url").toString("utf8"))
    : { format: "opaque" };
  console.log("Issued token claims", JSON.stringify({
    iss: tokenClaims.iss,
    aud: tokenClaims.aud,
    sub: tokenClaims.sub,
    client_id: tokenClaims.client_id,
    azp: tokenClaims.azp,
    scope: tokenClaims.scope,
    scopes: tokenClaims.scopes,
  }));

  const mcp = await json(await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.access_token}` },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "create_session",
        arguments: {
          question: "Did the OAuth 2.1 smoke test succeed?",
          options: ["Yes", "No"],
          expires_in_seconds: 300,
        },
      },
    }),
  }));

  const sessionId = mcp.result?.structuredContent?.id;
  if (!sessionId) throw new Error(`MCP call failed: ${JSON.stringify(mcp)}`);
  console.log(JSON.stringify({
    dynamicRegistration: "ok",
    pkceAuthorization: "ok",
    refreshTokenIssued: Boolean(token.refresh_token),
    scopedMcpCall: "ok",
    sessionId,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
