import { Client } from "pg";

export interface Env {
  // Hyperdrive binding injected by Cloudflare Workers runtime
  HYPERDRIVE: Hyperdrive;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (!env.HYPERDRIVE) {
      return Response.json(
        {
          error: "HYPERDRIVE binding is missing. Please configure it in wrangler.toml.",
        },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Hyperdrive provides a unique generated connection string to connect to
    // your database via Hyperdrive that can be used with your existing tools
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await client.connect();

    try {
      // Sample SQL query to verify database connectivity
      const result = await client.query("SELECT * FROM pg_tables");

      return Response.json(
        {
          success: true,
          rowCount: result.rows.length,
          result: result.rows,
        },
        {
          status: 200,
          headers: CORS_HEADERS,
        }
      );
    } catch (e) {
      return Response.json(
        {
          success: false,
          error: e instanceof Error ? e.message : String(e),
        },
        {
          status: 500,
          headers: CORS_HEADERS,
        }
      );
    } finally {
      // Closes the connection in the background without holding up the HTTP response
      ctx.waitUntil(client.end());
    }
  },
};
