// Pure auction rules. No imports, so it can be tested on its own.

export const SNIPE_WINDOW_MS = 10 * 60 * 1000
export const SNIPE_EXTEND_MS = 10 * 60 * 1000
export const START_BID = 700

/** Minimum raise, in USD, based on the current high bid. */
export function increment(high: number): number {
  if (high < 1000) return 25
  if (high < 2500) return 50
  if (high < 5000) return 100
  return 250
}

export function minNextBid(highBid: number): number {
  return highBid > 0 ? highBid + increment(highBid) : START_BID
}

export interface Core {
  endsAt: number
  highBid: number
  highBidder: string
  bidCount: number
}

export interface Config {
  configured: boolean
  startsAt: number
  endsAt: number
  /** USD, or null when AUCTION_RESERVE is not set (bidding stays closed). 0 means no reserve. */
  reserve: number | null
}

export function parseConfig(env: Record<string, string | undefined>): Config {
  const reserveRaw = env.AUCTION_RESERVE
  const reserve = reserveRaw === undefined || reserveRaw === '' ? null : Number(reserveRaw)
  const startsAt = env.AUCTION_STARTS_AT ? Date.parse(env.AUCTION_STARTS_AT) : 0
  // Default close: Dec 6 2026, 9:00 PM US Eastern (UTC-5)
  const endsAt = Date.parse(env.AUCTION_ENDS_AT || '2026-12-06T21:00:00-05:00')
  const ok =
    reserve !== null &&
    Number.isFinite(reserve) &&
    reserve >= 0 &&
    Number.isFinite(endsAt) &&
    Number.isFinite(startsAt)
  return { configured: ok, startsAt: ok ? startsAt : 0, endsAt: ok ? endsAt : 0, reserve: ok ? reserve : null }
}

export type Status = 'unconfigured' | 'upcoming' | 'open' | 'closed'

export function statusOf(cfg: Config, core: Core, now: number): Status {
  if (!cfg.configured) return 'unconfigured'
  if (now < cfg.startsAt) return 'upcoming'
  if (now >= core.endsAt) return 'closed'
  return 'open'
}

export function reserveMet(cfg: Config, core: Core): boolean | null {
  if (cfg.reserve === null || cfg.reserve === 0) return null // nothing to show
  return core.highBid >= cfg.reserve
}

export type BidCheck =
  | { ok: true; endsAt: number; extended: boolean }
  | { ok: false; code: string; message: string }

export function checkBid(cfg: Config, core: Core, bidderId: string, amount: number, now: number): BidCheck {
  const st = statusOf(cfg, core, now)
  if (st === 'unconfigured') return { ok: false, code: 'not_open', message: 'Bidding is not open yet.' }
  if (st === 'upcoming') return { ok: false, code: 'not_open', message: 'Bidding has not opened yet.' }
  if (st === 'closed') return { ok: false, code: 'closed', message: 'This auction has closed.' }
  if (!Number.isInteger(amount)) return { ok: false, code: 'bad_amount', message: 'Enter a whole dollar amount.' }
  if (core.highBidder === bidderId)
    return { ok: false, code: 'already_high', message: 'You are already the high bidder.' }
  const min = minNextBid(core.highBid)
  if (amount < min)
    return {
      ok: false,
      code: 'too_low',
      // The starting price is not published, so the first bid is not told the number.
      message:
        core.highBid === 0
          ? 'Your bid is below the starting price.'
          : `The minimum bid is $${min.toLocaleString('en-US')}.`,
    }
  const extended = core.endsAt - now <= SNIPE_WINDOW_MS
  return { ok: true, endsAt: extended ? core.endsAt + SNIPE_EXTEND_MS : core.endsAt, extended }
}
