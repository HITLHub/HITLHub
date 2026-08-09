import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { pool } from "@/lib/db";
import { AUTH_ISSUER, MCP_RESOURCE, MCP_SCOPES } from "@/lib/oauth-config";

export const auth = betterAuth({
  appName: "HITLHub Demo",
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  emailAndPassword: { enabled: true, disableSignUp: true },
  plugins: [
    jwt({ jwt: { issuer: AUTH_ISSUER }, disableSettingJwtHeader: true }),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      scopes: [...MCP_SCOPES],
      resources: [{
        identifier: MCP_RESOURCE,
        name: "HITLHub MCP",
        allowedScopes: [...MCP_SCOPES],
        accessTokenTtl: 3600,
        refreshTokenTtl: 60 * 60 * 24 * 30,
      }],
      clientRegistrationDefaultResources: [MCP_RESOURCE],
      clientRegistrationAllowedResources: [MCP_RESOURCE],
      grantTypes: ["authorization_code", "refresh_token"],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultScopes: [...MCP_SCOPES],
      clientRegistrationAllowedScopes: [...MCP_SCOPES],
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 60 * 60 * 24 * 30,
    }),
    nextCookies(),
  ],
});
