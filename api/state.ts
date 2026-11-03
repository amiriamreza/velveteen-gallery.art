import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getState } from './_lib/handlers.js'
import { deps, send } from './_lib/runtime.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    send(res, await getState(deps()))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'server', message: 'Something went wrong.' })
  }
}
