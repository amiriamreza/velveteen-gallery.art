import type Stripe from 'stripe'
import {
  checkBid,
  minNextBid,
  parseConfig,
  reserveMet,
  statusOf,
  type Config,
} from './auction.js'
import { safeEqual, signToken, verifyToken } from './auth.js'
import type { Bid, Store } from './store.js'

export interface Deps {
  env: Record<string, string | undefined>
  store: Store
  stripe: Pick<Stripe, 'customers' | 'setupIntents'>
  now: () => number
}

export interface Reply {
  status: number
  body: unknown
  html?: string
}

const err = (status: number, code: string, message: string): Reply => ({ status, body: { error: code, message } })

async function snapshot(d: Deps, cfg: Config) {
  const core = await d.store.getCore(cfg.endsAt)
  const now = d.now()
  const bids = await d.store.listBids(50)
  return {
    cfg,
    core,
    now,
    bids,
    view: {
      now,
      status: statusOf(cfg, core, now),
      startsAt: cfg.startsAt,
      endsAt: core.endsAt,
      highBid: core.highBid,
      bidCount: core.bidCount,
      highBidderLabel: bids.length ? bids[bids.length - 1].label : null,
      minNext: minNextBid(core.highBid),
      reserveMet: reserveMet(cfg, core), // true / false / null (no reserve). The reserve amount is never sent.
      bids: bids
        .slice()
        .reverse()
        .map((b) => ({ n: b.n, label: b.label, amount: b.amount, at: b.at })),
      publishableKey: d.env.STRIPE_PUBLISHABLE_KEY || '',
    },
  }
}

export async function getState(d: Deps): Promise<Reply> {
  const cfg = parseConfig(d.env)
  const s = await snapshot(d, cfg)
  return { status: 200, body: s.view }
}

export async function register(d: Deps, body: any): Promise<Reply> {
  const cfg = parseConfig(d.env)
  const core = await d.store.getCore(cfg.endsAt)
  const st = statusOf(cfg, core, d.now())
  if (st === 'unconfigured') return err(409, 'not_open', 'Bidding is not open yet.')
  if (st === 'closed') return err(409, 'closed', 'This auction has closed.')

  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (name.length < 2 || name.length > 80) return err(400, 'bad_name', 'Enter your full name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return err(400, 'bad_email', 'Enter a valid email.')
  if (body?.acceptTerms !== true) return err(400, 'terms', 'Please accept the bidder terms.')

  const customer = await d.stripe.customers.create({
    name,
    email,
    metadata: { source: 'velveteen-auction' },
  })
  const si = await d.stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['card'],
    usage: 'off_session',
    metadata: { purpose: 'bid' },
  })
  return { status: 200, body: { clientSecret: si.client_secret, setupIntentId: si.id } }
}

export async function verify(d: Deps, body: any): Promise<Reply> {
  const secret = d.env.SESSION_SECRET
  if (!secret) return err(500, 'server', 'Server is not configured.')
  const id = String(body?.setupIntentId ?? '')
  if (!/^seti_[A-Za-z0-9]+$/.test(id)) return err(400, 'bad_request', 'Invalid request.')

  const si = await d.stripe.setupIntents.retrieve(id)
  if (si.metadata?.purpose !== 'bid' || si.status !== 'succeeded' || !si.customer || !si.payment_method)
    return err(400, 'card', 'Your card could not be saved. Please try again.')
  if (!(await d.store.claimSetup(id))) return err(409, 'used', 'This registration was already completed.')

  const customerId = typeof si.customer === 'string' ? si.customer : si.customer.id
  const pmId = typeof si.payment_method === 'string' ? si.payment_method : si.payment_method.id
  const c = (await d.stripe.customers.retrieve(customerId)) as Stripe.Customer
  const bidder = await d.store.createBidder({
    name: c.name || '',
    email: c.email || '',
    customerId,
    paymentMethodId: pmId,
    createdAt: d.now(),
  })
  return { status: 200, body: { token: signToken(secret, bidder.id), label: bidder.label } }
}

export async function placeBid(d: Deps, body: any): Promise<Reply> {
  const secret = d.env.SESSION_SECRET
  if (!secret) return err(500, 'server', 'Server is not configured.')
  const bidderId = verifyToken(secret, body?.token)
  if (!bidderId) return err(401, 'auth', 'Please register to bid.')
  const bidder = await d.store.getBidder(bidderId)
  if (!bidder) return err(401, 'auth', 'Please register to bid.')

  const amount = Number(body?.amount)
  const cfg = parseConfig(d.env)

  for (let attempt = 0; attempt < 4; attempt++) {
    const core = await d.store.getCore(cfg.endsAt)
    const now = d.now()
    const chk = checkBid(cfg, core, bidderId, amount, now)
    if (!chk.ok) return { status: 409, body: { error: chk.code, message: chk.message } }
    const bid: Bid = { n: core.bidCount + 1, bidderId, label: bidder.label, amount, at: now }
    if (await d.store.commitBid(core.bidCount, bid, chk.endsAt)) {
      const s = await snapshot(d, cfg)
      return { status: 200, body: { ok: true, extended: chk.extended, state: s.view } }
    }
    // someone else bid at the same moment: re-read and re-check
  }
  return err(409, 'busy', 'Another bid came in at the same moment. Please try again.')
}

const esc = (s: unknown) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function admin(d: Deps, key: string | undefined): Promise<Reply> {
  const expected = d.env.ADMIN_TOKEN
  if (!expected || !key || !safeEqual(key, expected)) return err(401, 'auth', 'Not authorised.')
  const cfg = parseConfig(d.env)
  const s = await snapshot(d, cfg)
  const top = s.bids.length ? s.bids[s.bids.length - 1] : null
  const winner = top ? await d.store.getBidder(top.bidderId) : null
  const test = (d.env.STRIPE_SECRET_KEY || '').startsWith('sk_test')
  const custUrl = winner ? `https://dashboard.stripe.com/${test ? 'test/' : ''}customers/${winner.customerId}` : ''
  const fmt = (t: number) => new Date(t).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  const rows = s.bids
    .slice()
    .reverse()
    .map((b) => `<tr><td>${b.n}</td><td>${esc(b.label)}</td><td>$${b.amount.toLocaleString('en-US')}</td><td>${fmt(b.at)}</td></tr>`)
    .join('')
  const html = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Auction admin</title>
<body style="font:16px system-ui;max-width:760px;margin:32px auto;padding:0 16px">
<h1>Auction admin</h1>
<p>Status: <b>${s.view.status}</b>${cfg.configured ? '' : ' (AUCTION_RESERVE is not set)'}<br>
Closes: ${cfg.configured ? fmt(s.core.endsAt) : 'n/a'}<br>
Reserve: ${cfg.reserve === null ? 'not set' : '$' + cfg.reserve.toLocaleString('en-US')}
${top ? ` (${s.core.highBid >= (cfg.reserve ?? 0) ? '<b>met</b>' : 'not met'})` : ''}<br>
Bids: ${s.core.bidCount}. High bid: ${top ? '$' + s.core.highBid.toLocaleString('en-US') : 'none'}</p>
${winner ? `<h2>${s.view.status === 'closed' ? 'Winner' : 'Current high bidder'}</h2>
<p>${esc(winner.name)}, ${esc(winner.email)}<br>
<a href="${custUrl}">Open customer in Stripe</a> (saved card is on this customer; charge it from the Stripe dashboard after close)</p>` : ''}
<h2>All bids</h2>
<table cellpadding="6" border="1" style="border-collapse:collapse"><tr><th>#</th><th>Bidder</th><th>Amount</th><th>Time</th></tr>${rows}</table>
</body>`
  return { status: 200, body: { ok: true }, html }
}
