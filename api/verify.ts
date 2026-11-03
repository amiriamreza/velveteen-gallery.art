import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verify } from './_lib/handlers.js'
import { deps, fail, send } from './_lib/runtime.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return void res.status(405).json({ error: 'method' })
  try {
    send(res, await verify(deps(), req.body))
  } catch (e) {
    fail(req, res, e)
  }
}
