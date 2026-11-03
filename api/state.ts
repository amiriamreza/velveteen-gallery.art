import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getState } from './_lib/handlers.js'
import { deps, fail, send } from './_lib/runtime.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    send(res, await getState(deps()))
  } catch (e) {
    fail(req, res, e)
  }
}
