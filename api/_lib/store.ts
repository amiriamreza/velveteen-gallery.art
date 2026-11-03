import { Redis } from '@upstash/redis'
import type { Core } from './auction.js'

export interface Bid {
  n: number
  bidderId: string
  label: string
  amount: number
  at: number
}

export interface Bidder {
  id: string
  label: string
  name: string
  email: string
  customerId: string
  paymentMethodId: string
  createdAt: number
}

export interface Store {
  getCore(initialEndsAt: number): Promise<Core>
  listBids(limit: number): Promise<Bid[]>
  /** Compare-and-set: only succeeds if bidCount still equals expectedCount. */
  commitBid(expectedCount: number, bid: Bid, newEndsAt: number): Promise<boolean>
  createBidder(b: Omit<Bidder, 'id' | 'label'>): Promise<Bidder>
  getBidder(id: string): Promise<Bidder | null>
  /** True the first time a SetupIntent id is claimed. */
  claimSetup(setupIntentId: string): Promise<boolean>
}

const CAS = `
local c = tonumber(redis.call('HGET', KEYS[1], 'bidCount') or '0')
if c ~= tonumber(ARGV[1]) then return 0 end
redis.call('HSET', KEYS[1], 'highBid', ARGV[2], 'highBidder', ARGV[3], 'bidCount', tostring(c + 1), 'endsAt', ARGV[4])
redis.call('RPUSH', KEYS[2], ARGV[5])
return 1
`

export function redisStore(env: Record<string, string | undefined>): Store {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('Redis is not configured')
  const r = new Redis({ url, token, automaticDeserialization: false })

  return {
    async getCore(initialEndsAt) {
      await r.hsetnx('a:core', 'endsAt', String(initialEndsAt))
      const h = ((await r.hgetall('a:core')) || {}) as Record<string, string>
      return {
        endsAt: Number(h.endsAt || initialEndsAt),
        highBid: Number(h.highBid || 0),
        highBidder: h.highBidder || '',
        bidCount: Number(h.bidCount || 0),
      }
    },
    async listBids(limit) {
      const rows = (await r.lrange('a:bids', -limit, -1)) as string[]
      return rows.map((x) => JSON.parse(x) as Bid)
    },
    async commitBid(expected, bid, newEnds) {
      const res = await r.eval(
        CAS,
        ['a:core', 'a:bids'],
        [String(expected), String(bid.amount), bid.bidderId, String(newEnds), JSON.stringify(bid)],
      )
      return Number(res) === 1
    },
    async createBidder(b) {
      const seq = await r.incr('a:seq')
      const id = 'bd_' + globalThis.crypto.randomUUID().replace(/-/g, '')
      const full: Bidder = { ...b, id, label: `Bidder ${seq}` }
      await r.set(`b:${id}`, JSON.stringify(full))
      await r.rpush('a:bidders', id)
      return full
    },
    async getBidder(id) {
      const v = (await r.get(`b:${id}`)) as string | null
      return v ? (JSON.parse(v) as Bidder) : null
    },
    async claimSetup(siId) {
      const ok = await r.set(`si:${siId}`, '1', { nx: true })
      return ok === 'OK'
    },
  }
}
