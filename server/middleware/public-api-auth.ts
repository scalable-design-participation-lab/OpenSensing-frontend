import {
  defineEventHandler,
  getRequestURL,
  getHeader,
  createError,
} from 'h3'
import db from '~/utils/db'
import { hashApiKey } from '~/utils/apiKeys'
import { logger } from '~/utils/logger'

const RATE_LIMIT = 60 // requests
const WINDOW_MS = 60_000 // per minute, per API key

/**
 * In-memory, per-process rate limiter. This assumes the app runs as a
 * single long-lived Node server (Nitro's default node-server preset, as
 * used here via the persistent Knex pool) rather than serverless/multi-instance.
 * If this app is ever deployed across multiple instances, this limit
 * silently stops being enforced consistently and would need a shared store
 * (e.g. Redis) instead.
 */
const requestCounts = new Map<number, { count: number; windowStart: number }>()

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/public/')) return

  const apiKey = getHeader(event, 'x-api-key')
  if (!apiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing x-api-key header',
    })
  }

  const keyHash = hashApiKey(apiKey)
  const record = await db('api_keys')
    .select('id', 'revoked')
    .where({ key_hash: keyHash })
    .first()

  if (!record || record.revoked) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid API key' })
  }

  const now = Date.now()
  const entry = requestCounts.get(record.id)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requestCounts.set(record.id, { count: 1, windowStart: now })
  } else {
    entry.count += 1
    if (entry.count > RATE_LIMIT) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate limit exceeded. Try again later.',
      })
    }
  }

  db('api_keys')
    .where({ id: record.id })
    .update({ last_used_at: new Date() })
    .catch((err) => logger.error('Failed to update api_keys.last_used_at', err))
})
