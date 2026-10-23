import { Client } from "pg";

export interface Env {
  // Hyperdrive binding injected by Cloudflare Workers runtime
  HYPERDRIVE: Hyperdrive;
  // Optional secret to secure proxy query endpoint (configured via Cloudflare Dashboard / wrangler secret)
  WORKER_API_SECRET?: string;
  ENVIRONMENT?: string;
}

interface RequestTraceContext {
  traceId: string;
  rayId: string;
  clientIp: string;
  colo: string;
  country: string;
  userAgent: string;
  startTime: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Trace-Id, X-Request-Id",
  "Access-Control-Expose-Headers": "X-Trace-Id, CF-Ray, Server-Timing",
};

/**
 * Structured Logging compatible with Cloudflare Workers Observability
 */
function logEvent(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  context: RequestTraceContext,
  extra: Record<string, unknown> = {}
) {
  const durationMs = Math.round((performance.now() - context.startTime) * 100) / 100;
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    traceId: context.traceId,
    rayId: context.rayId,
    clientIp: context.clientIp,
    colo: context.colo,
    country: context.country,
    durationMs,
    ...extra,
  };

  const jsonStr = JSON.stringify(payload);
  if (level === "ERROR") {
    console.error(jsonStr);
  } else if (level === "WARN") {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}

/**
 * Classifies Database & Runtime errors for issue tracking
 */
function classifyIssue(e: unknown): { code: string; message: string; status: number } {
  const msg = e instanceof Error ? e.message : String(e);

  if (msg.includes("password authentication failed")) {
    return { code: "DB_AUTH_FAILED", message: "Database authentication failed", status: 502 };
  }
  if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
    return { code: "DB_DNS_ERROR", message: "Database host unreachable (DNS lookup failed)", status: 502 };
  }
  if (msg.includes("ECONNREFUSED") || msg.includes("Connection terminated")) {
    return { code: "DB_CONNECTION_REFUSED", message: "Database connection refused by pooler", status: 503 };
  }
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
    return { code: "DB_TIMEOUT", message: "Database query timed out", status: 504 };
  }
  if (msg.includes("syntax error") || msg.includes("does not exist")) {
    return { code: "SQL_SYNTAX_ERROR", message: msg, status: 400 };
  }

  return { code: "INTERNAL_ERROR", message: msg, status: 500 };
}

/**
 * Builds a standardized JSON response with trace & timing headers
 */
function jsonResponse(
  data: Record<string, unknown>,
  status: number,
  context: RequestTraceContext,
  dbDurationMs?: number
): Response {
  const totalDurationMs = Math.round((performance.now() - context.startTime) * 100) / 100;
  
  const serverTiming = dbDurationMs !== undefined
    ? `db;dur=${dbDurationMs.toFixed(1)}, total;dur=${totalDurationMs.toFixed(1)}`
    : `total;dur=${totalDurationMs.toFixed(1)}`;

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      "X-Trace-Id": context.traceId,
      "CF-Ray": context.rayId,
      "Server-Timing": serverTiming,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = performance.now();
    const url = new URL(request.url);

    // 1. Traces & Context Initialization
    const cf = (request as unknown as { cf?: Record<string, string> }).cf || {};
    const traceContext: RequestTraceContext = {
      traceId: request.headers.get("x-trace-id") || request.headers.get("x-request-id") || crypto.randomUUID(),
      rayId: request.headers.get("cf-ray") || "local-ray",
      clientIp: request.headers.get("cf-connecting-ip") || "127.0.0.1",
      colo: cf.colo || "LOCAL",
      country: cf.country || "VN",
      userAgent: request.headers.get("user-agent") || "unknown",
      startTime,
    };

    // 2. Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 3. Verify Hyperdrive Binding
    if (!env.HYPERDRIVE) {
      logEvent("ERROR", "Hyperdrive binding is missing from environment", traceContext, {
        issue: "MISSING_BINDING",
      });
      return jsonResponse(
        {
          success: false,
          error: {
            code: "CONFIG_ERROR",
            message: "HYPERDRIVE binding missing. Verify wrangler.toml configuration.",
            traceId: traceContext.traceId,
          },
        },
        500,
        traceContext
      );
    }

    // Helper to connect via Hyperdrive
    const connectClient = async () => {
      const dbConnectStart = performance.now();
      const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
      await client.connect();
      const connectLatencyMs = Math.round((performance.now() - dbConnectStart) * 100) / 100;
      return { client, connectLatencyMs };
    };

    try {
      // Route A: Healthcheck & Connectivity Ping
      if (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/api/health") {
        const { client, connectLatencyMs } = await connectClient();
        let dbQueryMs = 0;

        try {
          const queryStart = performance.now();
          const pingResult = await client.query(
            "SELECT 1 as ping, current_database() as db, current_user as usr, version() as version;"
          );
          dbQueryMs = Math.round((performance.now() - queryStart) * 100) / 100;

          const totalDbMs = Math.round((connectLatencyMs + dbQueryMs) * 100) / 100;

          logEvent("INFO", "Healthcheck completed successfully", traceContext, {
            route: url.pathname,
            status: 200,
            dbLatencyMs: totalDbMs,
            connectLatencyMs,
            queryLatencyMs: dbQueryMs,
          });

          return jsonResponse(
            {
              success: true,
              status: "healthy",
              service: "agrilog-worker",
              edge: {
                colo: traceContext.colo,
                country: traceContext.country,
                rayId: traceContext.rayId,
              },
              timing: {
                connectLatencyMs,
                queryLatencyMs: dbQueryMs,
                totalDbMs,
              },
              database: {
                connected: true,
                database: pingResult.rows[0]?.db,
                user: pingResult.rows[0]?.usr,
              },
              timestamp: new Date().toISOString(),
            },
            200,
            traceContext,
            totalDbMs
          );
        } finally {
          ctx.waitUntil(client.end());
        }
      }

      // Route B: Database Tables Stats
      if (url.pathname === "/api/db/stats" || url.pathname === "/stats") {
        const { client, connectLatencyMs } = await connectClient();
        try {
          const queryStart = performance.now();
          const result = await client.query(`
            SELECT table_name, table_schema
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
          `);
          const dbQueryMs = Math.round((performance.now() - queryStart) * 100) / 100;
          const totalDbMs = Math.round((connectLatencyMs + dbQueryMs) * 100) / 100;

          logEvent("INFO", "Retrieved database table statistics", traceContext, {
            tableCount: result.rows.length,
            dbLatencyMs: totalDbMs,
          });

          return jsonResponse(
            {
              success: true,
              tableCount: result.rows.length,
              tables: result.rows.map((r) => r.table_name),
              timing: { totalDbMs },
            },
            200,
            traceContext,
            totalDbMs
          );
        } finally {
          ctx.waitUntil(client.end());
        }
      }

      // Route C: Authenticated Query Proxy (Protected by WORKER_API_SECRET if set)
      if (url.pathname === "/api/query" && request.method === "POST") {
        // Optional security check if secret is configured
        if (env.WORKER_API_SECRET) {
          const authHeader = request.headers.get("authorization") || "";
          const token = authHeader.replace(/^Bearer\s+/i, "");
          if (token !== env.WORKER_API_SECRET) {
            logEvent("WARN", "Unauthorized access attempt to /api/query", traceContext);
            return jsonResponse(
              {
                success: false,
                error: {
                  code: "UNAUTHORIZED",
                  message: "Invalid or missing Bearer token in Authorization header",
                },
              },
              401,
              traceContext
            );
          }
        }

        const body = (await request.json().catch(() => ({}))) as { sql?: string; params?: unknown[] };
        if (!body.sql || typeof body.sql !== "string") {
          return jsonResponse(
            {
              success: false,
              error: { code: "BAD_REQUEST", message: "Field 'sql' is required." },
            },
            400,
            traceContext
          );
        }

        const { client, connectLatencyMs } = await connectClient();
        try {
          const queryStart = performance.now();
          const queryResult = await client.query(body.sql, body.params || []);
          const dbQueryMs = Math.round((performance.now() - queryStart) * 100) / 100;
          const totalDbMs = Math.round((connectLatencyMs + dbQueryMs) * 100) / 100;

          logEvent("INFO", "Executed proxied SQL query", traceContext, {
            sqlPreview: body.sql.substring(0, 100),
            rowCount: queryResult.rowCount,
            dbLatencyMs: totalDbMs,
          });

          return jsonResponse(
            {
              success: true,
              rowCount: queryResult.rowCount,
              rows: queryResult.rows,
              timing: { totalDbMs },
            },
            200,
            traceContext,
            totalDbMs
          );
        } finally {
          ctx.waitUntil(client.end());
        }
      }

      // 404 Route Not Found
      logEvent("WARN", "Route not found", traceContext, { path: url.pathname });
      return jsonResponse(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Route '${url.pathname}' not found on agrilog-worker.`,
            availableEndpoints: ["/", "/health", "/api/db/stats", "/api/query"],
          },
        },
        404,
        traceContext
      );
    } catch (err: unknown) {
      // 4. Issue Tracking & Structured Exception Logging
      const issue = classifyIssue(err);
      logEvent("ERROR", `Unhandled exception: ${issue.message}`, traceContext, {
        issueCode: issue.code,
        stack: err instanceof Error ? err.stack : undefined,
      });

      return jsonResponse(
        {
          success: false,
          error: {
            code: issue.code,
            message: issue.message,
            traceId: traceContext.traceId,
            rayId: traceContext.rayId,
          },
        },
        issue.status,
        traceContext
      );
    }
  },
};
