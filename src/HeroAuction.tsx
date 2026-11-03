import { useEffect, useState } from 'react'

// Used only until the live auction data loads (or if it can't be reached).
// The server's AUCTION_ENDS_AT is the source of truth once /api/state answers.
const FALLBACK_ENDS = Date.parse('2026-12-06T21:00:00-05:00')

interface Live {
  status: 'unconfigured' | 'upcoming' | 'open' | 'closed'
  endsAt: number
  highBid: number
  bidCount: number
  reserveMet: boolean | null
}

const usd = (n: number) => '$' + n.toLocaleString('en-US')

export default function HeroAuction() {
  const [live, setLive] = useState<Live | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let dead = false
    const load = () =>
      fetch('/api/state')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((s: Live) => !dead && setLive(s))
        .catch(() => {})
    load()
    const a = setInterval(load, 15000)
    const b = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      dead = true
      clearInterval(a)
      clearInterval(b)
    }
  }, [])

  const endsAt = live?.endsAt ?? FALLBACK_ENDS
  const closed = live?.status === 'closed' || now >= endsAt
  const open = live?.status === 'open' && !closed
  const left = Math.max(0, endsAt - now)
  const d = Math.floor(left / 86400000)
  const h = Math.floor((left % 86400000) / 3600000)
  const m = Math.floor((left % 3600000) / 60000)

  const closes = new Date(endsAt).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })

  return (
    <aside className="hero-auction" aria-label="Auction">
      <div className="ha-top">
        <span className={'ha-badge' + (open ? ' on' : '')}>
          <i aria-hidden="true" />
          {closed ? 'Auction closed' : open ? 'Live auction' : 'Auction, bidding opens soon'}
        </span>
        {open && live && live.bidCount > 0 && (
          <span className="ha-bid">
            Current bid <b>{usd(live.highBid)}</b>
          </span>
        )}
      </div>
      <p className="ha-title">The painting is up for auction.</p>
      <ul>
        <li>
          {closed ? 'Closed' : 'Closes'} {closes}
          {!closed && ` · ${d}d ${h}h ${m}m left`}
        </li>
        <li>Bid with a card on file, charged only if you win. Or pay in ZEC.</li>
        <li>No buyer’s premium. Buyer pays shipping from the United States.</li>
        <li>A bid in the last 10 minutes extends the close by 10 minutes.</li>
        {open && live?.reserveMet === false && <li>Reserve not met.</li>}
      </ul>
      <a className="btn gold" href="/auction/">
        {open ? 'View the auction and bid' : 'View the auction'}
      </a>
    </aside>
  )
}
