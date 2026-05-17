const UPSTREAM_BASE = "https://cms.blasalviz.com";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

const ALLOWED_ORIGINS = new Set([
  "https://lisablas.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function handleLogin(request, env, origin) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { username, password } = body ?? {};
  let role = null;

  if (username === "admin" && password === env.ADMIN_PASSWORD) {
    role = "admin";
  } else if (username === "camidi" && password === env.STAFF_PASSWORD) {
    role = "staff";
  }

  if (!role) {
    return json({ error: "Invalid credentials" }, 401);
  }

  const token = randomToken();
  await env.SESSIONS.put(token, role, { expirationTtl: SESSION_TTL_SECONDS });

  const cors = corsHeaders(origin);
  return json({ token, role }, 200, cors);
}

async function validateSession(request, env) {
  const token = request.headers.get("X-Session-Token");
  if (!token) return null;
  const role = await env.SESSIONS.get(token);
  return role ?? null; // "admin" | "staff" | null
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

    const { pathname } = new URL(request.url);

    // Auth endpoint — no session required
    if (pathname === "/auth/login" && request.method === "POST") {
      if (!allowed) return new Response("Forbidden", { status: 403 });
      return handleLogin(request, env, origin);
    }

    // All other routes require a valid session
    const role = await validateSession(request, env);
    if (!role) {
      const cors = allowed ? corsHeaders(origin) : {};
      return json({ error: "Unauthorized" }, 401, cors);
    }

    // Build upstream URL: preserve path + query string
    const { search } = new URL(request.url);
    const upstreamURL = UPSTREAM_BASE + pathname + search;

    // Forward headers, strip Host, inject Directus token
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("x-session-token");
    headers.set("Authorization", `Bearer ${env.DIRECTUS_TOKEN}`);

    const upstreamRes = await fetch(upstreamURL, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
    });

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
