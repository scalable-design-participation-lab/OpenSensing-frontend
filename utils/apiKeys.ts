import { createHash, randomBytes } from 'crypto'

const KEY_PREFIX = 'osk_'

export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(24).toString('hex')
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
