import { useEffect, useState } from 'react'

/*
  AUCTION SETTINGS. Edit these values, nothing else needs touching.
  - openingBid: the starting price in USD.
  - endsAt: the closing time. Kazakhstan time is UTC+5 (Astana), written as +05:00.
  - bids: add a real bid here when one arrives, newest first.
    Example: { name: 'Anon collector', amount: 52000, at: '2026-11-03' }
  Nothing here is processed automatically. Bids and payments are arranged
  by direct message, so this list is updated by hand.
*/
const AUCTION = {
  openingBid: 50000,
  minIncrement: 2500,
  endsAt: '2026-11-30T20:00:00+05:00',
  bids: [] as { name: string; amount: number; at: string }[],
  bidLink: 'https://instagram.com/direct/new/?text=I%20would%20like%20to%20bid%20on%20Nomads%20in%20Orbit',
  askLink: 'https://x.com/velveteen0x',
}

const PAY = ['Cash', 'Credit card', 'Zelle', 'BTC', 'SOL', 'USDC', 'ZEC']

const usd = (n: number) => '$' + n.toLocaleString('en-US')

function useCountdown(endsAt: string) {
  const end = new Date(endsAt).getTime()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ms = Math.max(0, end - now)
  const s = Math.floor(ms / 1000)
  return {
    over: ms === 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

export default function Auction() {
  const c = useCountdown(AUCTION.endsAt)
  const top = AUCTION.bids.length ? Math.max(...AUCTION.bids.map((b) => b.amount)) : 0
  const next = top ? top + AUCTION.minIncrement : AUCTION.openingBid
  const closes = new Date(AUCTION.endsAt).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
    timeZoneName: 'short',
  })
  const units: [number, string][] = [
    [c.d, 'days'],
    [c.h, 'hrs'],
    [c.m, 'min'],
    [c.s, 'sec'],
  ]

  return (
    <aside className="auction" aria-label="Live auction">
      <div className="au-top">
        <span className={'au-status' + (c.over ? ' closed' : '')}>
          <i aria-hidden="true" />
          {c.over ? 'Auction closed' : 'Live auction'}
        </span>
        <span className="au-lot">Original acrylic, 12 × 12 in</span>
      </div>

      <div className="au-price">
        <div>
          <small>{top ? 'Current bid' : 'Opening bid'}</small>
          <b>{usd(top || AUCTION.openingBid)}</b>
        </div>
        <div className="au-clock" role="timer" aria-label="Time left">
          {c.over ? (
            <span className="au-over">Bidding has ended</span>
          ) : (
            units.map(([n, l]) => (
              <span key={l}>
                <b>{String(n).padStart(2, '0')}</b>
                <small>{l}</small>
              </span>
            ))
          )}
        </div>
      </div>
      {!c.over && <p className="au-ends">Closes {closes}</p>}

      <div className="au-cta">
        <a className="btn gold" href={AUCTION.bidLink} target="_blank" rel="noreferrer">
          Place a bid, {usd(next)}+
        </a>
        <a className="au-ask" href={AUCTION.askLink} target="_blank" rel="noreferrer">
          Ask a question
        </a>
      </div>

      <div className="au-row">
        <h3>Accepted payment</h3>
        <ul className="au-chips">
          {PAY.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="au-note">Payment details are sent privately to the winning bidder.</p>
      </div>

      <div className="au-row">
        <h3>Bid history</h3>
        {AUCTION.bids.length ? (
          <ol className="au-bids">
            {AUCTION.bids.map((b) => (
              <li key={b.at + b.amount}>
                <span>{b.name}</span>
                <span>{b.at}</span>
                <b>{usd(b.amount)}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className="au-note">No bids yet. The first bid opens the board.</p>
        )}
      </div>
    </aside>
  )
}
