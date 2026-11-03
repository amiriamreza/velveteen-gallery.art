import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js'
import paintingImg from '../assets/painting-flat.jpg'
import { CONTACT, SPEC } from '../spec'

interface PublicBid {
  n: number
  label: string
  amount: number
  at: number
}
interface AState {
  now: number
  status: 'unconfigured' | 'upcoming' | 'open' | 'closed'
  startsAt: number
  endsAt: number
  highBid: number
  bidCount: number
  highBidderLabel: string | null
  minNext: number | null
  reserveMet: boolean | null
  bids: PublicBid[]
  publishableKey: string
}
interface Me {
  token: string
  label: string
}

const usd = (n: number) => '$' + n.toLocaleString('en-US')
const ME_KEY = 'vg-bidder'

function loadMe(): Me | null {
  try {
    const v = JSON.parse(localStorage.getItem(ME_KEY) || 'null')
    return v && v.token && v.label ? v : null
  } catch {
    return null
  }
}
function saveMe(m: Me | null) {
  try {
    if (m) localStorage.setItem(ME_KEY, JSON.stringify(m))
    else localStorage.removeItem(ME_KEY)
  } catch {
    /* storage unavailable: bidder just registers again next visit */
  }
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.message || 'Something went wrong. Please try again.')
  return j as T
}

function useAuction() {
  const [state, setState] = useState<AState | null>(null)
  const [offline, setOffline] = useState(false)
  const offset = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const s = await api<AState>('/api/state')
      offset.current = s.now - Date.now()
      setState(s)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    const vis = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [refresh])

  return { state, setState, offline, refresh, offset }
}

function useNow(offset: React.MutableRefObject<number>) {
  const [now, setNow] = useState(() => Date.now() + offset.current)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset.current), 1000)
    return () => clearInterval(t)
  }, [offset])
  return now
}

function Countdown({ ms }: { ms: number }) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const parts: [number, string][] = [
    [Math.floor(s / 86400), 'days'],
    [Math.floor((s % 86400) / 3600), 'hours'],
    [Math.floor((s % 3600) / 60), 'min'],
    [s % 60, 'sec'],
  ]
  return (
    <div className="a-clock" role="timer" aria-label="Time remaining">
      {parts.map(([n, l]) => (
        <div key={l}>
          <b>{String(n).padStart(2, '0')}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  )
}

function RegisterForm({ publishableKey, onDone }: { publishableKey: string; onDone: (m: Me) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const mount = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<Stripe | null>(null)
  const cardRef = useRef<StripeCardElement | null>(null)

  useEffect(() => {
    let dead = false
    let card: StripeCardElement | null = null
    loadStripe(publishableKey).then((stripe) => {
      if (dead || !stripe || !mount.current) return
      stripeRef.current = stripe
      card = stripe.elements().create('card', {
        style: { base: { color: '#EDE8F5', fontSize: '17px', '::placeholder': { color: '#8D86A3' } } },
      })
      card.mount(mount.current)
      cardRef.current = card
    })
    return () => {
      dead = true
      card?.destroy()
    }
  }, [publishableKey])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!stripeRef.current || !cardRef.current) return setError('The card form is still loading. Try again in a moment.')
    setBusy(true)
    try {
      const reg = await api<{ clientSecret: string; setupIntentId: string }>('/api/register', {
        name,
        email,
        acceptTerms: terms,
      })
      const res = await stripeRef.current.confirmCardSetup(reg.clientSecret, {
        payment_method: { card: cardRef.current, billing_details: { name, email } },
      })
      if (res.error) throw new Error(res.error.message || 'Your card could not be saved.')
      const me = await api<Me>('/api/verify', { setupIntentId: reg.setupIntentId })
      saveMe(me)
      onDone(me)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="a-form" onSubmit={submit}>
      <h3>Register to bid</h3>
      <p className="a-note">Your card is saved, not charged. It is charged only if you win.</p>
      <label>
        Full name
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <label>
        Card
        <div ref={mount} className="a-card" />
      </label>
      <label className="a-check">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
        <span>
          I have read the <a href="#terms">bidder terms</a>, and I authorize Velveteen Gallery to charge this card for my
          winning bid, plus shipping, if I win.
        </span>
      </label>
      {error && <p className="a-error" role="alert">{error}</p>}
      <button className="a-btn" disabled={busy}>
        {busy ? 'Saving card…' : 'Register'}
      </button>
    </form>
  )
}

function BidForm({ s, me, onState, onSignOut }: { s: AState; me: Me; onState: (s: AState) => void; onSignOut: () => void }) {
  const [amount, setAmount] = useState(s.minNext === null ? '' : String(s.minNext))
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const touched = useRef(false)

  useEffect(() => {
    if (!touched.current) setAmount(s.minNext === null ? '' : String(s.minNext))
  }, [s.minNext])

  const n = Number(amount)
  const valid = Number.isInteger(n) && n > 0 && (s.minNext === null || n >= s.minNext)
  const leading = s.highBidderLabel === me.label

  async function place() {
    setBusy(true)
    setMsg(null)
    try {
      const r = await api<{ extended: boolean; state: AState }>('/api/bid', { token: me.token, amount: n })
      onState(r.state)
      touched.current = false
      setConfirm(false)
      setMsg({
        ok: true,
        text: r.extended ? 'Bid placed. The auction was extended by 10 minutes.' : 'Bid placed. You are the high bidder.',
      })
    } catch (e) {
      setConfirm(false)
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="a-form">
      <p className="a-who">
        Bidding as <b>{me.label}</b> · <button type="button" className="a-link" onClick={onSignOut}>not you?</button>
      </p>
      {leading ? (
        <p className="a-lead">You are the high bidder.</p>
      ) : s.bids.length > 0 && s.bids.some((b) => b.label === me.label) ? (
        <p className="a-out">You have been outbid.</p>
      ) : null}
      <label>
        Your bid (USD)
        <div className="a-amt">
          <span>$</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              touched.current = true
              setAmount(e.target.value.replace(/[^0-9]/g, ''))
              setConfirm(false)
            }}
          />
        </div>
      </label>
      <p className="a-note">
        {s.minNext === null ? 'Enter the amount you wish to bid.' : `Minimum ${usd(s.minNext)}.`} No buyer’s premium.
      </p>
      {!confirm ? (
        <button className="a-btn" disabled={!valid || leading} onClick={() => setConfirm(true)}>
          Place bid
        </button>
      ) : (
        <div className="a-confirm">
          <p>
            Confirm a binding bid of <b>{usd(n)}</b>?
          </p>
          <div>
            <button className="a-btn" disabled={busy} onClick={place}>
              {busy ? 'Placing…' : 'Yes, place bid'}
            </button>
            <button className="a-ghost" disabled={busy} onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {msg && <p className={msg.ok ? 'a-okmsg' : 'a-error'} role="status">{msg.text}</p>}
    </div>
  )
}

export default function AuctionPage() {
  const { state: s, setState, offline, offset } = useAuction()
  const now = useNow(offset)
  const [me, setMe] = useState<Me | null>(loadMe)

  const closes = useMemo(
    () =>
      s
        ? new Date(s.endsAt).toLocaleString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
          })
        : '',
    [s?.endsAt], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const open = s?.status === 'open'
  const closed = s?.status === 'closed'

  return (
    <>
      <header className="a-nav">
        <a href="/" className="a-back">← Velveteen Gallery</a>
        <a href={CONTACT} target="_blank" rel="noreferrer">Message on Instagram</a>
      </header>

      <main className="a-main">
        <div className="a-art">
          <img src={paintingImg} alt="Nomads in Orbit, acrylic painting, 12 by 12 inches" />
        </div>

        <section className="a-info" aria-labelledby="a-title">
          <p className="a-eyebrow">Auction</p>
          <h1 id="a-title">Nomads in Orbit</h1>
          <p className="a-sub">Velveteen, 2026. Acrylic on canvas, 12 × 12 in.</p>

          {offline && !s && <p className="a-note">Bidding opens soon. Check back here.</p>}

          {s && (
            <>
              <div className="a-price">
                <small>Current bid</small>
                <b>{s.bidCount ? usd(s.highBid) : 'No bids yet'}</b>
                <span className="a-meta">
                  {s.bidCount} {s.bidCount === 1 ? 'bid' : 'bids'}
                  {s.reserveMet === false && ' · Reserve not met'}
                  {s.reserveMet === true && ' · Reserve met'}
                </span>
              </div>

              {open && (
                <>
                  <Countdown ms={s.endsAt - now} />
                  <p className="a-note">Closes {closes}. A bid in the last 10 minutes extends the close by 10 minutes.</p>
                </>
              )}
              {closed && <p className="a-closed">Auction closed. {s.bidCount ? `Final bid ${usd(s.highBid)}.` : 'There were no bids.'}</p>}
              {s.status === 'upcoming' && <p className="a-note">Bidding opens {new Date(s.startsAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.</p>}
              {s.status === 'unconfigured' && <p className="a-note">Bidding opens soon.</p>}

              {open && (
                <div className="a-panel">
                  {me ? (
                    <BidForm
                      s={s}
                      me={me}
                      onState={setState}
                      onSignOut={() => {
                        saveMe(null)
                        setMe(null)
                      }}
                    />
                  ) : s.publishableKey ? (
                    <RegisterForm publishableKey={s.publishableKey} onDone={setMe} />
                  ) : (
                    <p className="a-note">Registration is unavailable right now. Please check back soon.</p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <section className="a-wide" aria-labelledby="hist">
        <div>
          <h2 id="hist">Bid history</h2>
          {s && s.bids.length ? (
            <ol className="a-bids">
              {s.bids.map((b) => (
                <li key={b.n}>
                  <span>{b.label}</span>
                  <span>{new Date(b.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  <b>{usd(b.amount)}</b>
                </li>
              ))}
            </ol>
          ) : (
            <p className="a-note">No bids yet.</p>
          )}
        </div>
        <div>
          <h2>About the work</h2>
          <dl className="a-spec">
            {SPEC.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="a-note">
            The painting is the lot. It ships from the United States, and it comes with the story of its making. See the full
            piece and its animated version on the <a href="/#animated">main page</a>.
          </p>
        </div>
      </section>

      <section id="terms" className="a-terms" aria-labelledby="terms-h">
        <h2 id="terms-h">Bidder terms</h2>
        <ol>
          <li><b>Registration.</b> To bid, you register with your name, email and a card. The card is saved with Stripe and is not charged when you register. Velveteen Gallery never sees your card number.</li>
          <li><b>Starting price.</b> The painting has a starting price that is not published. Bids below it are not accepted. There is no upper limit on bids.</li>
          <li><b>Bids are binding.</b> A bid is an offer to buy at that price. Minimum raises are $25 up to $1,000, $50 up to $2,500, $100 up to $5,000, and $250 above that.</li>
          <li><b>Reserve.</b> The painting is offered with a reserve price that is not published. The page shows whether the reserve has been met. If the reserve is not met by the close, the seller is not obliged to sell.</li>
          <li><b>Closing.</b> The auction closes at the time shown. A bid placed in the final 10 minutes extends the close by 10 minutes, every time, until no bid arrives in the last 10 minutes.</li>
          <li><b>Payment.</b> The winner is contacted by email after the close and has 7 days to pay. By default the saved card is charged the winning bid plus shipping. If you prefer, you can pay in ZEC (Zcash) by arrangement, at the spot rate on the day of payment, which is shared with you before you send anything.</li>
          <li><b>No buyer’s premium.</b> You pay the winning bid, plus shipping and any tax that applies.</li>
          <li><b>Shipping.</b> The painting ships from the United States with a tracked, insured carrier. The cost is quoted after the close and is paid by the buyer.</li>
          <li><b>Non-payment.</b> If payment is not completed within the payment window, the seller may cancel the sale and offer the painting to the next bidder.</li>
          <li><b>Seller bids.</b> The seller and anyone acting for the seller do not bid.</li>
        </ol>
        <p className="a-note">Questions before you register? <a href={CONTACT} target="_blank" rel="noreferrer">Message me on Instagram</a>.</p>
      </section>

      <footer className="a-foot">
        <a href="/">Velveteen Gallery</a>
        <span>© 2026</span>
      </footer>
    </>
  )
}
