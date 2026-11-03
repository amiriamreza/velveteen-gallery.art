import Stripe from 'stripe'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Deps, Reply } from './handlers.js'
import { safeEqual } from './auth.js'
import { redisStore } from './store.js'

export function deps(): Deps {
  const env = process.env
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return {
    env,
    store: redisStore(env),
    stripe: new Stripe(env.STRIPE_SECRET_KEY),
    now: () => Date.now(),
  }
}

export function send(res: VercelResponse, r: Reply) {
  res.setHeader('Cache-Control', 'no-store')
  if (r.html) {
    res.setHeader('X-Robots-Tag', 'noindex')
    return void res.status(r.status).setHeader('Content-Type', 'text/html; charset=utf-8').send(r.html)
  }
  res.status(r.status).json(r.body)
}

/**
 * Generic error for visitors. The owner can add ?debug=ADMIN_TOKEN to the URL
 * to see the real cause (also always written to the function logs).
 */
export function fail(req: VercelRequest, res: VercelResponse, e: unknown) {
  console.error(e)
  const body: Record<string, unknown> = { error: 'server', message: 'Something went wrong.' }
  const key = typeof req.query?.debug === 'string' ? req.query.debug : ''
  const admin = process.env.ADMIN_TOKEN
  if (admin && key && safeEqual(key, admin)) {
    body.detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
  }
  res.setHeader('Cache-Control', 'no-store')
  res.status(500).json(body)
}
