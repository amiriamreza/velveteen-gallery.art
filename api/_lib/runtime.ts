import Stripe from 'stripe'
import type { VercelResponse } from '@vercel/node'
import type { Deps, Reply } from './handlers.js'
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
