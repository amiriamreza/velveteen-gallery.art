import { createHmac, timingSafeEqual } from 'node:crypto'

const b64 = (b: Buffer) => b.toString('base64url')

export function signToken(secret: string, bidderId: string, ttlMs = 45 * 24 * 3600 * 1000): string {
  const payload = b64(Buffer.from(JSON.stringify({ b: bidderId, e: Date.now() + ttlMs })))
  const sig = b64(createHmac('sha256', secret).update(payload).digest())
  return `${payload}.${sig}`
}

export function verifyToken(secret: string, token: unknown): string | null {
  if (typeof token !== 'string') return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const good = createHmac('sha256', secret).update(payload).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== good.length || !timingSafeEqual(given, good)) return null
  try {
    const { b, e } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof b !== 'string' || typeof e !== 'number' || e < Date.now()) return null
    return b
  } catch {
    return null
  }
}

export function safeEqual(a: string, b: string): boolean {
  const x = createHmac('sha256', 'k').update(a).digest()
  const y = createHmac('sha256', 'k').update(b).digest()
  return timingSafeEqual(x, y)
}
