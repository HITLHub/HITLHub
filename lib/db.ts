import { Pool } from "pg";

const globalForDb = globalThis as unknown as { hitlhubPool?: Pool };

function connectionString() {
  const value = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  // Keep build-time module evaluation side-effect free. Runtime database calls
  // still fail clearly if production was deployed without DATABASE_URL.
  return value || "postgresql://postgres:postgres@127.0.0.1:5432/hitlhub";
}

export const pool = globalForDb.hitlhubPool ?? new Pool({
  connectionString: connectionString(),
  max: 5,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV !== "production") globalForDb.hitlhubPool = pool;

export type HitlSession = {
  id: string;
  integration: string;
  question: string;
  options: string[];
  status: "waiting" | "answered" | "expired" | "cancelled";
  answer: string | null;
  created_at: string;
  expires_at: string;
  answered_at: string | null;
  answered_by: string | null;
  oauth_client_id: string | null;
  requested_by_user_id: string | null;
};

export async function ensureHitlSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hitl_session (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      integration text NOT NULL DEFAULT 'Demo Agent',
      question text NOT NULL,
      options jsonb NOT NULL,
      status text NOT NULL DEFAULT 'waiting',
      answer text,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      answered_at timestamptz,
      answered_by text
    );
    CREATE TABLE IF NOT EXISTS integration (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      oauth_client_id text UNIQUE NOT NULL,
      name text NOT NULL,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      last_used_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE hitl_session ADD COLUMN IF NOT EXISTS oauth_client_id text;
    ALTER TABLE hitl_session ADD COLUMN IF NOT EXISTS requested_by_user_id text;
    CREATE INDEX IF NOT EXISTS hitl_session_created_idx ON hitl_session (created_at DESC);
    CREATE INDEX IF NOT EXISTS hitl_session_oauth_client_idx ON hitl_session (oauth_client_id, created_at DESC);
  `);
}

export async function resolveIntegration(clientId: string) {
  await ensureHitlSchema();
  const result = await pool.query<{ oauth_client_id: string; name: string; status: string }>(
    `INSERT INTO integration (oauth_client_id, name)
     VALUES ($1, $2)
     ON CONFLICT (oauth_client_id) DO UPDATE SET last_used_at = now()
     RETURNING oauth_client_id, name, status`,
    [clientId, `OAuth ${clientId.slice(0, 8)}`],
  );
  const integration = result.rows[0];
  if (!integration || integration.status !== "active") throw new Error("Integration is disabled");
  return integration;
}

export async function expireSessions() {
  await pool.query(`UPDATE hitl_session SET status = 'expired' WHERE status = 'waiting' AND expires_at <= now()`);
}

export async function listSessions(): Promise<HitlSession[]> {
  await ensureHitlSchema();
  await expireSessions();
  const result = await pool.query<HitlSession>(`SELECT * FROM hitl_session ORDER BY created_at DESC LIMIT 100`);
  return result.rows;
}
