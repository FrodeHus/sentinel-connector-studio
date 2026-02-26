#!/usr/bin/env node
/**
 * Lightweight CORS proxy for the API test dialog.
 *
 * Usage:  node scripts/cors-proxy.mjs          (default port 3100)
 *         PORT=9000 node scripts/cors-proxy.mjs
 *
 * Set NODE_TLS_REJECT_UNAUTHORIZED=0 to allow self-signed certificates:
 *         NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/cors-proxy.mjs
 *
 * The proxy accepts requests at:
 *   POST http://localhost:3100/proxy
 *   Body: JSON with { url, method, headers, body }
 *
 * It forwards the request to the target URL and returns the response
 * with permissive CORS headers so the browser doesn't block it.
 */

import { createServer } from "node:http"

const PORT = parseInt(process.env.PORT || "3100", 10)

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => resolve(Buffer.concat(chunks).toString()))
    req.on("error", reject)
  })
}

const server = createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders())
    res.end()
    return
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { ...corsHeaders(), "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "ok" }))
    return
  }

  if (req.method !== "POST" || req.url !== "/proxy") {
    res.writeHead(404, corsHeaders())
    res.end("Not found")
    return
  }

  try {
    const raw = await readBody(req)
    const { url, method = "GET", headers = {}, body, allowInsecure = false } = JSON.parse(raw)

    if (!url) {
      res.writeHead(400, { ...corsHeaders(), "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Missing 'url' in request body" }))
      return
    }

    const fetchOptions = {
      method,
      headers,
      body: body != null ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    }

    // Temporarily disable TLS verification for this request when requested
    if (allowInsecure && url.startsWith("https")) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
    }

    let upstream
    try {
      upstream = await fetch(url, fetchOptions)
    } finally {
      // Restore TLS verification
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
    }

    const responseBody = await upstream.text()

    res.writeHead(upstream.status, {
      ...corsHeaders(),
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "X-Proxy-Status": String(upstream.status),
    })
    res.end(responseBody)
  } catch (e) {
    const cause = e.cause?.code || e.cause?.message || ""
    let detail = e.message
    if (cause.includes("SELF_SIGNED_CERT") || cause.includes("UNABLE_TO_VERIFY")) {
      detail = `TLS certificate error: ${cause}. Enable the "TLS insecure" toggle in the API test dialog to allow self-signed certificates.`
    } else if (cause) {
      detail = `${e.message} (${cause})`
    }
    console.error(`Proxy error for ${req.url}:`, detail)
    res.writeHead(502, { ...corsHeaders(), "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: detail }))
  }
})

server.listen(PORT, () => {
  console.log(`CORS proxy listening on http://localhost:${PORT}`)
  console.log("Press Ctrl+C to stop")
})
