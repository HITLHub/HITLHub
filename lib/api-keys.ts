import { createHash, randomBytes } from "node:crypto";
import { ensureHitlSchema, pool } from "@/lib/db";
import type { McpScope } from "@/lib/oauth-config";

export const API_KEY_PREFIX = "hitl_live_";

export type ApiKeyRecord = {
  id: string;
  owner_user_id: string;
  name: string;
  key_prefix: string;
  scopes: McpScope[];
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function hashApiKey(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export async function createApiKey(ownerUserId: string, name: string, scopes: McpScope[]) {
  await ensureHitlSchema();
  const secret = `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  const keyPrefix = `${secret.slice(0, 18)}...${secret.slice(-4)}`;
  const result = await pool.query<ApiKeyRecord>(
    `INSERT INTO api_key (owner_user_id, name, key_prefix, secret_hash, scopes)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, owner_user_id, name, key_prefix, scopes, status, created_at, last_used_at, revoked_at`,
    [ownerUserId, name, keyPrefix, hashApiKey(secret), JSON.stringify(scopes)],
  );
  return { apiKey: result.rows[0], secret };
}

export async function listApiKeys(ownerUserId: string) {
  await ensureHitlSchema();
  const result = await pool.query<ApiKeyRecord>(
    `SELECT id, owner_user_id, name, key_prefix, scopes, status, created_at, last_used_at, revoked_at
     FROM api_key WHERE owner_user_id = $1 ORDER BY created_at DESC`,
    [ownerUserId],
  );
  return result.rows;
}

export async function verifyApiKey(secret: string, requiredScope?: McpScope) {
  await ensureHitlSchema();
  const result = await pool.query<ApiKeyRecord>(
    `UPDATE api_key SET last_used_at = now()
     WHERE secret_hash = $1 AND status = 'active'
     RETURNING id, owner_user_id, name, key_prefix, scopes, status, created_at, last_used_at, revoked_at`,
    [hashApiKey(secret)],
  );
  const apiKey = result.rows[0];
  if (!apiKey) throw new Error("Invalid or revoked API key");
  if (requiredScope && !apiKey.scopes.includes(requiredScope)) throw new Error(`API key is missing scope ${requiredScope}`);
  return apiKey;
}
