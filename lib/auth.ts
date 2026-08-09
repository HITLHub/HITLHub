import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";
import { pool } from "@/lib/db";

const infraPlugins = process.env.BETTER_AUTH_API_KEY
  ? [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })]
  : [];

export const auth = betterAuth({
  appName: "HITLHub Demo",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  emailAndPassword: { enabled: true },
  plugins: [...infraPlugins, nextCookies()],
});
