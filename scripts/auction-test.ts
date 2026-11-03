// Run: npm run test:auction
import assert from 'node:assert/strict'
import { admin, getState, placeBid, register, verify, type Deps } from '../api/_lib/handlers.js'
import type { Bid, Bidder, Store } from '../api/_lib/store.js'
import type { Core } from '../api/_lib/auction.js'
import { signToken, verifyToken } from '../api/_lib/auth.js'

function memStore(): Store {
  let core: Core | null = null
  const bids: Bid[] = []
  const bidders = new Map<string, Bidder>()
  const seen = new Set<string>()
  let seq = 0
  const tick = () => new Promise((r) => setTimeout(r, 1))
  return {
    async getCore(ends) {
      await tick()
      core ??= { endsAt: ends, highBid: 0, highBidder: '', bidCount: 0 }
      return { ...core }
    },
    async listBids(n) {
      return bids.slice(-n)
    },
    async commitBid(expected, bid, newEnds) {
      await tick()
      if (!core || core.bidCount !== expected) return false
      core = { endsAt: newEnds, highBid: bid.amount, highBidder: bid.bidderId, bidCount: expected + 1 }
      bids.push(bid)
      return true
    },
    async createBidder(b) {
      const id = 'bd_' + ++seq
      const full = { ...b, id, label: `Bidder ${seq}` }
      bidders.set(id, full)
      return full
    },
    async getBidder(id) {
      return bidders.get(id) ?? null
    },
    async claimSetup(id) {
      if (seen.has(id)) return false
      seen.add(id)
      return true
    },
  }
}

function fakeStripe() {
  const cust = new Map<string, any>()
  const sis = new Map<string, any>()
  let n = 0
  return {
    customers: {
      create: async (p: any) => {
        const c = { id: 'cus_' + ++n, ...p }
        cust.set(c.id, c)
        return c
      },
      retrieve: async (id: string) => cust.get(id),
    },
    setupIntents: {
      create: async (p: any) => {
        const si = { id: 'seti_' + ++n, client_secret: 'sec_' + n, status: 'succeeded', payment_method: 'pm_' + n, ...p }
        sis.set(si.id, si)
        return si
      },
      retrieve: async (id: string) => sis.get(id),
    },
  } as any
}

const T0 = Date.parse('2026-11-20T12:00:00Z')
const ENDS = '2026-12-06T21:00:00-05:00'
const endsMs = Date.parse(ENDS)

function mk(over: Record<string, string> = {}, now = T0) {
  const clock = { t: now }
  const d: Deps = {
    env: { AUCTION_RESERVE: '1500', AUCTION_ENDS_AT: ENDS, SESSION_SECRET: 's3cret', ADMIN_TOKEN: 'adm', STRIPE_PUBLISHABLE_KEY: 'pk_test_x', ...over },
    store: memStore(),
    stripe: fakeStripe(),
    now: () => clock.t,
  }
  return { d, clock }
}

async function join(d: Deps, name: string, email = 'a@b.co') {
  const r: any = await register(d, { name, email, acceptTerms: true })
  assert.equal(r.status, 200)
  const v: any = await verify(d, { setupIntentId: r.body.setupIntentId })
  assert.equal(v.status, 200)
  return v.body as { token: string; label: string }
}

let passed = 0
async function t(name: string, fn: () => Promise<void>) {
  await fn()
  passed++
  console.log('ok  ', name)
}

await t('unconfigured (no reserve) refuses everything', async () => {
  const { d } = mk({ AUCTION_RESERVE: '' })
  const s: any = await getState(d)
  assert.equal(s.body.status, 'unconfigured')
  const r: any = await register(d, { name: 'Ann Lee', email: 'a@b.co', acceptTerms: true })
  assert.equal(r.status, 409)
})

await t('registration validates input and requires terms', async () => {
  const { d } = mk()
  assert.equal(((await register(d, { name: 'A', email: 'a@b.co', acceptTerms: true })) as any).status, 400)
  assert.equal(((await register(d, { name: 'Ann Lee', email: 'nope', acceptTerms: true })) as any).status, 400)
  assert.equal(((await register(d, { name: 'Ann Lee', email: 'a@b.co' })) as any).status, 400)
})

await t('setup intent cannot be reused', async () => {
  const { d } = mk()
  const r: any = await register(d, { name: 'Ann Lee', email: 'a@b.co', acceptTerms: true })
  assert.equal(((await verify(d, { setupIntentId: r.body.setupIntentId })) as any).status, 200)
  assert.equal(((await verify(d, { setupIntentId: r.body.setupIntentId })) as any).status, 409)
})

await t('bid rules: start, increments, no self-outbid', async () => {
  const { d } = mk()
  const a = await join(d, 'Ann Lee')
  const b = await join(d, 'Bo Chen', 'b@b.co')
  let r: any = await placeBid(d, { token: a.token, amount: 699 })
  assert.equal(r.body.error, 'too_low')
  r = await placeBid(d, { token: a.token, amount: 700.5 })
  assert.equal(r.body.error, 'bad_amount')
  r = await placeBid(d, { token: a.token, amount: 700 })
  assert.equal(r.status, 200)
  r = await placeBid(d, { token: a.token, amount: 800 })
  assert.equal(r.body.error, 'already_high')
  r = await placeBid(d, { token: b.token, amount: 724 })
  assert.equal(r.body.error, 'too_low')
  r = await placeBid(d, { token: b.token, amount: 725 })
  assert.equal(r.status, 200)
  assert.equal(r.body.state.highBid, 725)
  assert.equal(r.body.state.highBidderLabel, 'Bidder 2')
  r = await placeBid(d, { token: b.token, amount: 100001 })
  assert.equal(r.body.error, 'bad_amount')
})

await t('reserve stays hidden and flips when met', async () => {
  const { d } = mk()
  const a = await join(d, 'Ann Lee')
  const b = await join(d, 'Bo Chen', 'b@b.co')
  await placeBid(d, { token: a.token, amount: 1400 })
  let s: any = await getState(d)
  assert.equal(s.body.reserveMet, false)
  await placeBid(d, { token: b.token, amount: 1500 })
  s = await getState(d)
  assert.equal(s.body.reserveMet, true)
  const raw = JSON.stringify(s.body)
  assert.ok(!/reserve":1500|"reserve"/.test(raw), 'reserve amount must not be exposed')
  assert.ok(!raw.includes('bd_'), 'bidder ids must not be exposed')
})

await t('no reserve (AUCTION_RESERVE=0) shows no reserve flag', async () => {
  const { d } = mk({ AUCTION_RESERVE: '0' })
  const s: any = await getState(d)
  assert.equal(s.body.status, 'open')
  assert.equal(s.body.reserveMet, null)
})

await t('anti-sniping extends by 10 minutes only inside the last 10', async () => {
  const { d, clock } = mk()
  const a = await join(d, 'Ann Lee')
  const b = await join(d, 'Bo Chen', 'b@b.co')
  let r: any = await placeBid(d, { token: a.token, amount: 700 })
  assert.equal(r.body.extended, false)
  assert.equal(r.body.state.endsAt, endsMs)
  clock.t = endsMs - 9 * 60 * 1000
  r = await placeBid(d, { token: b.token, amount: 725 })
  assert.equal(r.body.extended, true)
  assert.equal(r.body.state.endsAt, endsMs + 10 * 60 * 1000)
  clock.t = endsMs - 11 * 60 * 1000 // before the new close minus window: still extends? new close is +10m, so we are 21m out
  r = await placeBid(d, { token: a.token, amount: 750 })
  assert.equal(r.body.extended, false)
  assert.equal(r.body.state.endsAt, endsMs + 10 * 60 * 1000)
})

await t('bids rejected after close, including the extended close', async () => {
  const { d, clock } = mk()
  const a = await join(d, 'Ann Lee')
  clock.t = endsMs + 1
  const r: any = await placeBid(d, { token: a.token, amount: 700 })
  assert.equal(r.body.error, 'closed')
  const s: any = await getState(d)
  assert.equal(s.body.status, 'closed')
})

await t('not open before AUCTION_STARTS_AT', async () => {
  const { d } = mk({ AUCTION_STARTS_AT: '2026-11-25T00:00:00Z' })
  const a = await join(d, 'Ann Lee')
  const r: any = await placeBid(d, { token: a.token, amount: 700 })
  assert.equal(r.body.error, 'not_open')
})

await t('simultaneous bids: exactly one wins the same slot', async () => {
  const { d } = mk()
  const a = await join(d, 'Ann Lee')
  const b = await join(d, 'Bo Chen', 'b@b.co')
  const [x, y]: any[] = await Promise.all([
    placeBid(d, { token: a.token, amount: 700 }),
    placeBid(d, { token: b.token, amount: 700 }),
  ])
  const oks = [x, y].filter((r) => r.status === 200).length
  assert.equal(oks, 1)
  const s: any = await getState(d)
  assert.equal(s.body.bidCount, 1)
})

await t('tokens: tampered, wrong secret, expired are rejected', async () => {
  const tok = signToken('s3cret', 'bd_1')
  assert.equal(verifyToken('s3cret', tok), 'bd_1')
  assert.equal(verifyToken('other', tok), null)
  assert.equal(verifyToken('s3cret', tok.slice(0, -2) + 'xx'), null)
  assert.equal(verifyToken('s3cret', signToken('s3cret', 'bd_1', -1000)), null)
  const { d } = mk()
  const r: any = await placeBid(d, { token: 'garbage', amount: 700 })
  assert.equal(r.status, 401)
})

await t('admin: needs the key, escapes names', async () => {
  const { d } = mk()
  const a = await join(d, '<script>alert(1)</script>')
  await placeBid(d, { token: a.token, amount: 700 })
  assert.equal(((await admin(d, 'wrong')) as any).status, 401)
  assert.equal(((await admin(d, undefined)) as any).status, 401)
  const r: any = await admin(d, 'adm')
  assert.equal(r.status, 200)
  assert.ok(!r.html.includes('<script>alert'))
  assert.ok(r.html.includes('&lt;script&gt;'))
  assert.ok(r.html.includes('dashboard.stripe.com'))
})

console.log(`\n${passed} tests passed`)
