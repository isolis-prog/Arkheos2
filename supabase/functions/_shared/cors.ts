// Shared CORS helper for all edge functions.
//
// Single source of truth — import `corsHeaders` (and optional helpers) from
// here instead of redefining the headers per function. This guarantees that
// every function accepts the full set of headers the supabase-js v2 SDK sends
// across all its versions/runtimes (web, react-native, deno, etc.) and that a
// header added later only needs to be added in one place.

/**
 * Canonical CORS headers for browser-callable edge functions.
 *
 * `Access-Control-Allow-Headers` is the **superset** of headers any
 * `@supabase/supabase-js` v2 client may send, including the newer
 * `x-supabase-client-*` runtime fingerprints. Adding more headers to the list
 * is safe; removing any risks 4xx preflight failures from real clients.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type",
    "x-supabase-client-platform",
    "x-supabase-client-platform-version",
    "x-supabase-client-runtime",
    "x-supabase-client-runtime-version",
  ].join(", "),
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

/**
 * If the request is a CORS preflight (`OPTIONS`), return a ready-to-send
 * `Response`. Otherwise returns `null` so the caller can proceed.
 *
 * Usage:
 *   const pre = handleCorsPreflight(req);
 *   if (pre) return pre;
 */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

/**
 * Build a JSON `Response` with CORS headers already merged in.
 * Use this for **every** response (including errors) to keep CORS consistent.
 */
export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
