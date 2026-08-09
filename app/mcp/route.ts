import { ensureHitlSchema, expireSessions, pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const tools = [
  {
    name: "create_session",
    description: "Ask a human a multiple-choice question. Returns a session id immediately; poll get_session for the decision.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question shown to the human" },
        options: { type: "array", items: { type: "string" }, minItems: 2, description: "Allowed answers" },
        expires_in_seconds: { type: "integer", minimum: 30, maximum: 86400, description: "How long the human has to answer" },
      },
      required: ["question", "options", "expires_in_seconds"],
    },
  },
  {
    name: "get_session",
    description: "Get the current status and human answer for a HITL session.",
    inputSchema: {
      type: "object",
      properties: { session_id: { type: "string" } },
      required: ["session_id"],
    },
  },
  {
    name: "cancel_session",
    description: "Cancel a HITL session that is still waiting.",
    inputSchema: {
      type: "object",
      properties: { session_id: { type: "string" } },
      required: ["session_id"],
    },
  },
];

function rpc(id: RpcRequest["id"], result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result }, { headers: { "Access-Control-Allow-Origin": "*" } });
}

function toolResult(value: unknown, isError = false) {
  return { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value, ...(isError ? { isError: true } : {}) };
}

async function callTool(name: unknown, args: Record<string, unknown>) {
  await ensureHitlSchema();
  await expireSessions();
  if (name === "create_session") {
    const question = typeof args.question === "string" ? args.question.trim() : "";
    const options = Array.isArray(args.options) ? args.options.filter((v): v is string => typeof v === "string" && !!v.trim()) : [];
    const seconds = Number(args.expires_in_seconds);
    if (!question || options.length < 2 || !Number.isInteger(seconds) || seconds < 30 || seconds > 86400) {
      return toolResult({ error: "question, at least two options, and expires_in_seconds (30-86400) are required" }, true);
    }
    const result = await pool.query(
      `INSERT INTO hitl_session (question, options, expires_at) VALUES ($1, $2::jsonb, now() + ($3 * interval '1 second')) RETURNING *`,
      [question, JSON.stringify(options), seconds],
    );
    return toolResult(result.rows[0]);
  }
  if (name === "get_session") {
    const result = await pool.query(`SELECT * FROM hitl_session WHERE id = $1`, [args.session_id]);
    return result.rowCount ? toolResult(result.rows[0]) : toolResult({ error: "Session not found" }, true);
  }
  if (name === "cancel_session") {
    const result = await pool.query(`UPDATE hitl_session SET status = 'cancelled' WHERE id = $1 AND status = 'waiting' RETURNING *`, [args.session_id]);
    return result.rowCount ? toolResult(result.rows[0]) : toolResult({ error: "Session not found or no longer waiting" }, true);
  }
  return toolResult({ error: `Unknown tool: ${String(name)}` }, true);
}

async function handle(message: RpcRequest) {
  if (message.method === "initialize") {
    return rpc(message.id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "HITLHub Demo", version: "0.1.0" },
    });
  }
  if (message.method === "tools/list") return rpc(message.id, { tools });
  if (message.method === "tools/call") {
    const params = message.params ?? {};
    return rpc(message.id, await callTool(params.name, (params.arguments ?? {}) as Record<string, unknown>));
  }
  if (message.method?.startsWith("notifications/")) return new Response(null, { status: 202 });
  return Response.json({ jsonrpc: "2.0", id: message.id ?? null, error: { code: -32601, message: "Method not found" } });
}

export async function POST(request: Request) {
  try {
    return await handle(await request.json());
  } catch (error) {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: error instanceof Error ? error.message : "Internal error" } }, { status: 500 });
  }
}

export function GET() {
  return Response.json({ name: "HITLHub Demo MCP", status: "live", endpoint: "/mcp" });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id" } });
}
