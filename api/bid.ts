import type { VercelRequest, VercelResponse } from '@vercel/node'
import { placeBid } from './_lib/handlers.js'
import { deps, send } from './_lib/runtime.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return void res.status(405).json({ error: 'method' })
  try {
    send(res, await placeBid(deps(), req.body))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'server', message: 'Something went wrong.' })
  }
}
