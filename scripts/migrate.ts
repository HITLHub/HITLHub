import { getMigrations } from "better-auth/db/migration";
import { auth } from "../lib/auth";
import { ensureHitlSchema, pool } from "../lib/db";

async function main() {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  await ensureHitlSchema();
  console.log("Better Auth and HITLHub database schemas are ready.");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
