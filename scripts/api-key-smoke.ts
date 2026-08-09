import { createApiKey, hashApiKey, verifyApiKey } from "../lib/api-keys";
import { pool } from "../lib/db";

async function main() {
  const ownerUserId = "api-key-smoke-user";
  const { apiKey, secret } = await createApiKey(ownerUserId, "API key smoke test", ["hitl:create", "hitl:read"]);
  try {
    if (!secret.startsWith("hitl_live_")) throw new Error("Unexpected API key format");
    if (hashApiKey(secret) === secret) throw new Error("API key was not hashed");

    const verified = await verifyApiKey(secret, "hitl:create");
    if (verified.owner_user_id !== ownerUserId) throw new Error("Owner was not preserved");

    let denied = false;
    try { await verifyApiKey(secret, "hitl:cancel"); } catch { denied = true; }
    if (!denied) throw new Error("Missing scope was accepted");

    await pool.query(`UPDATE api_key SET status = 'revoked', revoked_at = now() WHERE id = $1`, [apiKey.id]);
    let revoked = false;
    try { await verifyApiKey(secret); } catch { revoked = true; }
    if (!revoked) throw new Error("Revoked key was accepted");

    console.log("API key smoke test passed", { keyPrefix: apiKey.key_prefix, ownerUserId });
  } finally {
    await pool.query(`DELETE FROM api_key WHERE id = $1 AND owner_user_id = $2`, [apiKey.id, ownerUserId]);
    await pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
