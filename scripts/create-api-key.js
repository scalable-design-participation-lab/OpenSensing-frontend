#!/usr/bin/env node
/**
 * Usage: node scripts/create-api-key.js "some label"
 * Generates a new public API key, stores its hash in the api_keys table,
 * and prints the plaintext key once. Save it — it cannot be recovered later.
 */
require('dotenv').config()
const knex = require('knex')
const { createHash, randomBytes } = require('crypto')

// Keep in sync with utils/apiKeys.ts (that file is TS-only and can't be
// required from this plain Node script).
const KEY_PREFIX = 'osk_'
const generateApiKey = () => KEY_PREFIX + randomBytes(24).toString('hex')
const hashApiKey = (key) => createHash('sha256').update(key).digest('hex')

async function main() {
  const label = process.argv[2] || null

  const db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    },
  })

  try {
    const key = generateApiKey()
    const keyHash = hashApiKey(key)

    await db('api_keys').insert({ key_hash: keyHash, label })

    console.log('API key created. Save this now — it will not be shown again:\n')
    console.log(key)
  } finally {
    await db.destroy()
  }
}

main().catch((err) => {
  console.error('Failed to create API key:', err)
  process.exit(1)
})
