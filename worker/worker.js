const UPSTREAM_BASE = "https://cms.blasalviz.com";

// Browser origins allowed to call this proxy
const ALLOWED_ORIGINS = new Set([
  "https://lisablas.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = ALLOWED_ORIGINS.has(origin);

    // CORS preflight
    if (request.method === "OPTIONS") {
      if (!allowed) return new Response("Forbidden", { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Build upstream URL: preserve path + query string
    const { pathname, search } = new URL(request.url);
    const upstreamURL = UPSTREAM_BASE + pathname + search;

    // Forward headers, strip Host, inject token
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("Authorization", `Bearer ${env.DIRECTUS_TOKEN}`);

    const upstreamRes = await fetch(upstreamURL, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
    });

    // Relay response, adding CORS headers when the origin is allowed
    const resHeaders = new Headers(upstreamRes.headers);
    if (allowed) {
      for (const [k, v] of Object.entries(corsHeaders(origin))) {
        resHeaders.set(k, v);
      }
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: resHeaders,
    });
  },
};
