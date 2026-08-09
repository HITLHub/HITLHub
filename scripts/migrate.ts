import { getMigrations } from "better-auth/db/migration";
import { auth } from "../lib/auth";
import { ensureHitlSchema, pool } from "../lib/db";

async function main() {
  // Better Auth 1.7 introduces a required issuer namespace for accounts.
  // Backfill existing credential/social rows before the generated migration
  // applies the NOT NULL constraint.
  const accountTable = await pool.query<{ table_name: string | null }>(
    `SELECT to_regclass('public.account')::text AS table_name`,
  );
  if (accountTable.rows[0]?.table_name) {
    await pool.query(`ALTER TABLE account ADD COLUMN IF NOT EXISTS issuer text`);
    await pool.query(`
      UPDATE account
      SET issuer = CASE
        WHEN "providerId" = 'credential' THEN 'local:credential'
        ELSE 'local:oauth:' || "providerId"
      END
      WHERE issuer IS NULL
    `);
  }
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
