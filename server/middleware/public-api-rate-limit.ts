import {
  defineEventHandler,
  getRequestURL,
  getRequestIP,
  createError,
} from 'h3'

const RATE_LIMIT = 60 // requests
const WINDOW_MS = 60_000 // per minute, per client IP

/**
 * In-memory, per-process rate limiter. This assumes the app runs as a
 * single long-lived Node server (Nitro's default node-server preset, as
 * used here via the persistent Knex pool) rather than serverless/multi-instance.
 * If this app is ever deployed across multiple instances, this limit
 * silently stops being enforced consistently and would need a shared store
 * (e.g. Redis) instead.
 */
const requestCounts = new Map<string, { count: number; windowStart: number }>()

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/public/')) return

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  const now = Date.now()
  const entry = requestCounts.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requestCounts.set(ip, { count: 1, windowStart: now })
  } else {
    entry.count += 1
    if (entry.count > RATE_LIMIT) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate limit exceeded. Try again later.',
      })
    }
  }
})
