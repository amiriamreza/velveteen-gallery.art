import type { VercelRequest, VercelResponse } from '@vercel/node'
import { admin } from './_lib/handlers.js'
import { deps, fail, send } from './_lib/runtime.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const key = typeof req.query.key === 'string' ? req.query.key : undefined
    send(res, await admin(deps(), key))
  } catch (e) {
    fail(req, res, e)
  }
}
