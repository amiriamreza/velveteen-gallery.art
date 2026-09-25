import { useEffect, useState } from 'react'
import alemScreen from './assets/alem-screen.jpg'
import bitbaselVenue from './assets/bitbasel-venue.jpg'
import pinkFloydOscars from './assets/pink-floyd-oscars.jpg'
import timesSquareNftNyc from './assets/times-square-nft-nyc.jpg'
import bitbaselLivePaint from './assets/bitbasel-live-paint.jpg'

const DEADLINE = new Date('2026-09-25T00:00:00Z').getTime()

interface Tier {
  tag: string
  price: string
  name: string
  desc: string
  includes: string[]
  avail: string
  featured?: boolean
  stripeUrl: string
  dataTier: string
}

const TIERS: Tier[] = [
  {
    tag: 'Tier 1',
    price: '$1,000',
    name: 'Logo Placement',
    desc: 'Your logo embedded directly into the digital piece. Clean, credited, permanent.',
    includes: [
      'Logo embedded in the digital artwork',
      'Photo of the placement sent to you',
      'Credited when the piece is unveiled',
    ],
    avail: 'Multiple spots available',
    stripeUrl: 'https://buy.stripe.com/5kQ28scQCfjq4RkgGp4Ni00',
    dataTier: 'Tier 1: $1,000 Logo Placement',
  },
  {
    tag: 'Tier 2',
    price: '$5,000',
    name: 'Custom Illustration',
    desc: 'A custom illustration built into the scene alongside your logo. Your brand becomes part of the world, not just a mark on it.',
    includes: [
      'Custom illustration + logo, digital piece',
      'Placement chosen for visibility',
      'Photo + short video of the placement',
      'Credited when the piece is unveiled',
    ],
    avail: '5 spots available',
    featured: true,
    stripeUrl: 'https://buy.stripe.com/bJeaEY8Am6MU3Ng89T4Ni01',
    dataTier: 'Tier 2: $5,000 Custom Illustration',
  },
  {
    tag: 'Tier 3',
    price: '$10,000',
    name: 'Digital + Physical',
    desc: 'Placement on both the digital piece and the companion 12×12 in acrylic painting, shown alongside it in Astana.',
    includes: [
      'Placement on the digital piece',
      'Placement on the physical acrylic painting',
      'Featured in event documentation from both shows',
      'Direct credit as a lead sponsor',
    ],
    avail: '2 spots available',
    stripeUrl: 'https://buy.stripe.com/8x2bJ2dUGc7egA2fCl4Ni02',
    dataTier: 'Tier 3: $10,000 Digital + Physical',
  },
]

const FAQS = [
  {
    q: 'What happens after I claim a tier?',
    a: "You'll hear back directly by email or DM with payment details and a short brief for your logo/illustration file. Nothing is charged automatically from this page.",
  },
  {
    q: 'What file format does my logo need to be?',
    a: "Vector (SVG or AI) preferred, high-res PNG with transparent background otherwise. If you're going for Tier 2's custom illustration, brand colors and any reference imagery are helpful but not required.",
  },
  {
    q: 'Can I pay in crypto?',
    a: 'Yes, USDC is accepted alongside standard card payment. Details are sent once you claim a tier.',
  },
  {
    q: 'What if a tier fills up before I claim it?',
    a: 'Reach out anyway. Placement within a tier has some flexibility, and Tier 1 in particular can accommodate more than one sponsor.',
  },
  {
    q: 'Is this piece really going to both events?',
    a: 'Yes. Both the digital piece and the companion acrylic painting will be shown at Alem.ai during Digital Bridge in Astana, and again together at BitBasel in Miami. The exact timing and schedule within each event is still being finalized.',
  },
]

function useCountdown(deadline: number) {
  const [remaining, setRemaining] = useState(() => deadline - Date.now())

  useEffect(() => {
    const id = setInterval(() => setRemaining(deadline - Date.now()), 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (remaining <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((remaining % (1000 * 60)) / 1000)
  return { days, hours, mins, secs }
}

function handleTierClick(dataTier: string) {
  try {
    sessionStorage.setItem('selectedTier', dataTier)
  } catch {
    // ignore
  }
}

export default function App() {
  const { days, hours, mins, secs } = useCountdown(DEADLINE)

  return (
    <>
      <header>
        <nav>
          <a href="#top" className="brand">Velveteen</a>
          <ul className="nav-links">
            <li><a href="#tiers">Sponsor tiers</a></li>
            <li><a href="#events">Events</a></li>
            <li><a href="#perks">What you get</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <a href="#tiers" className="nav-cta">Sponsor the piece</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="wrap">
            <div className="hero-grid">
              <div>
                <h1>Your logo on my art attends Digital Bridge Astana 2026 and BitBasel Miami 2026.</h1>
                <p className="hero-sub">A large-scale piece built around Kazakhstan's own mythology and its shift from fossil fuels to a space-tech future: drones lifting yurts, dinosaurs retiring, rockets launching. One piece, two of the biggest stages in tech and digital art this year.</p>
                <div className="hero-events">
                  <span className="hero-event-chip"><span className="dot" />Digital Bridge, Astana, October 2026</span>
                  <span className="hero-event-chip"><span className="dot" />BitBasel, Miami, Dec 2026</span>
                </div>
                <div className="hero-actions">
                  <a href="#tiers" className="btn-primary">See sponsor tiers</a>
                  <a href="#about" className="btn-ghost">About the artist</a>
                </div>
              </div>
              <div className="funding-card">
                <div className="amount-label">Raised so far</div>
                <div className="amount">$0 <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 400 }}>of $30,000 goal</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: '1%' }} /></div>
                <div className="funding-meta">
                  <span>0 sponsors so far</span>
                  <span>3 tiers open</span>
                </div>
                <div className="countdown">
                  <div className="countdown-label">Sponsorship window closes</div>
                  <div className="countdown-grid">
                    <div className="countdown-unit"><div className="num">{days}</div><div className="unit">days</div></div>
                    <div className="countdown-unit"><div className="num">{hours}</div><div className="unit">hrs</div></div>
                    <div className="countdown-unit"><div className="num">{mins}</div><div className="unit">min</div></div>
                    <div className="countdown-unit"><div className="num">{secs}</div><div className="unit">sec</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tiers">
          <div className="wrap">
            <div className="section-kicker">Pick a tier</div>
            <h2>Three ways in, three levels of placement</h2>
            <p className="section-lede">Every tier gets your brand permanently embedded in the artwork. Higher tiers get more custom work and more surface area, digital and physical.</p>

            <div className="tier-grid">
              {TIERS.map((tier) => (
                <div className={`tier-card${tier.featured ? ' featured' : ''}`} key={tier.tag}>
                  <span className="tier-tag">{tier.tag}</span>
                  <div className="tier-price">{tier.price}</div>
                  <div className="tier-name">{tier.name}</div>
                  <p className="tier-desc">{tier.desc}</p>
                  <ul className="tier-includes">
                    {tier.includes.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <div className="tier-avail">{tier.avail}</div>
                  <a
                    href={tier.stripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tier"
                    onClick={() => handleTierClick(tier.dataTier)}
                  >
                    Claim this tier
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="events">
          <div className="wrap">
            <div className="section-kicker">Where the piece shows up</div>
            <h2>Two stages, one piece</h2>
            <p className="section-lede">The same artwork travels from a government-facing tech conference in Central Asia to one of the most visible digital art fairs in the US.</p>
            <div className="event-grid">
              <div className="event-card">
                <div className="event-date">October 2026</div>
                <div className="event-name">AI &amp; Digital Bridge</div>
                <div className="event-place">Astana, Kazakhstan</div>
                <p className="event-desc">Created on the ground in Astana during Digital Bridge week, drawing directly on Kazakh mythology and the country's own fossil-fuel-to-space-tech narrative. The digital piece plays as a looping animation on screen at Alem.ai, with a companion 12×12 in acrylic painting on display alongside it. Exact timing within the conference is still being scheduled.</p>
                <img src={alemScreen} alt="Large screen display at Alem.ai during AI & Digital Bridge" style={{ borderRadius: 'var(--radius-sm)', marginTop: 18, border: '1px solid var(--line)' }} />
                <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', marginTop: 8 }}>The screen at Alem.ai, where the piece will play during Digital Bridge week.</p>
              </div>
              <div className="event-card">
                <div className="event-date">December 2026</div>
                <div className="event-name">BitBasel</div>
                <div className="event-place">Miami, USA</div>
                <p className="event-desc">The piece travels to Miami during Art Basel week, with placement secured directly through BitBasel's founder. More than 100k collectors, institutions, galleries, luxury brands, and cultural leaders converge on Miami for the world's most influential week in contemporary art. Exact timing within the event is still being scheduled.</p>
                <img src={bitbaselVenue} alt="BitBasel Miami poolside stage and event setup" style={{ borderRadius: 'var(--radius-sm)', marginTop: 18, border: '1px solid var(--line)' }} />
                <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', marginTop: 8 }}>BitBasel Miami's poolside stage, the venue the piece is headed for.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="perks">
          <div className="wrap">
            <div className="section-kicker">Sponsor perks</div>
            <h2>What every sponsor gets</h2>
            <p className="section-lede">From the $1,000 tier up, no tier is an afterthought.</p>
            <div className="perks-grid">
              <div className="perk">
                <div className="perk-icon">1</div>
                <div className="perk-text">Your logo or illustration embedded directly in the artwork, at the tier you choose</div>
              </div>
              <div className="perk">
                <div className="perk-icon">2</div>
                <div className="perk-text">A photo of your placement, sent directly to you once it's in</div>
              </div>
              <div className="perk">
                <div className="perk-icon">3</div>
                <div className="perk-text">Public exposure at two real events: Digital Bridge Astana and BitBasel Miami</div>
              </div>
              <div className="perk">
                <div className="perk-icon">4</div>
                <div className="perk-text">Permanent placement. This isn't a one-day activation, it's part of the piece going forward</div>
              </div>
            </div>
          </div>
        </section>

        <section id="about">
          <div className="wrap">
            <div className="section-kicker">About the artist</div>
            <div className="about-grid">
              <div className="about-avatar">V</div>
              <div>
                <div className="about-name">Hey, I'm Velveteen</div>
                <div className="about-handle">@Velveteen0x</div>
                <div className="about-body">
                  <p>I've been an artist for as long as I can remember. It's always been my purpose, my mission is simple: spark joy through vibrant color. I work across acrylic painting, digital illustration, and velvet art.</p>
                  <p>Earlier this year, I stepped away from the entrepreneurial projects I'd spent years supporting to claim that identity unapologetically, as an artist first, no longer an afterthought to everything else I was building. It paid off fast: my first gallery placement came in March 2026, a collaboration with Pink Floyd at the Oscars in LA, alongside a sidequest walking the runway at LA Fashion Week.</p>
                  <p>I've also been part of the crypto community for years. My first NFT collection, a 2021 collaboration with Des Femmes Magazine, sold out within a week.</p>
                  <p>In May, I bought a one-way ticket to Singapore. Over the past four months I've lived and worked across eight countries, live painting community-specific pieces for MTN DAO (Salt Lake City), Forma (Bristol, UK), Island DAO (Koh Samui, Thailand), Jake &amp; Debbie's (Da Nang, Vietnam), and Network School. Each piece is made for the community it's created in, not just displayed at it.</p>
                  <p>I'm in Astana this September building a large-scale piece rooted in real research into Kazakh mythology, architecture, and the country's own transition from a fossil-fuel economy to a space-tech future. It's headed to Digital Bridge, then BitBasel Miami.</p>
                  <p>Sponsorship funds the production month on the ground: materials, the companion acrylic piece, and getting the work from Astana to Miami intact.</p>
                  <p>This is year one of putting myself forward as an artist, full time and on the record. Sponsoring this piece means becoming an early supporter of that trajectory, not just a name on a one-off activation.</p>
                  <p>Follow the process as it happens on Instagram at <a href="https://www.instagram.com/velveteengallery" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>@velveteengallery</a>.</p>
                </div>
                <div className="credentials">
                  <div className="credential">
                    <img src={pinkFloydOscars} alt="Velveteen at the Pink Floyd x Oscars gallery exhibit in LA" />
                    <div className="credential-body">
                      <strong>Pink Floyd × Oscars</strong>
                      Gallery placement, LA
                      <div className="credential-date">March 13, 2026</div>
                    </div>
                  </div>
                  <div className="credential">
                    <img src={timesSquareNftNyc} alt="Velveteen's art on a Times Square billboard during NFT NYC" />
                    <div className="credential-body">
                      <strong>NFT NYC</strong>
                      Times Square billboard
                      <div className="credential-date">September 1, 2026</div>
                    </div>
                  </div>
                  <div className="credential">
                    <img src={bitbaselLivePaint} alt="Velveteen painting live at BitBasel" />
                    <div className="credential-body">
                      <strong>BitBasel Miami</strong>
                      December 2026
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq">
          <div className="wrap-narrow">
            <div className="section-kicker">FAQ</div>
            <h2>Questions, answered</h2>
            {FAQS.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer id="claim">
        <div className="wrap">
          <div className="footer-row">
            <div>
              <div className="brand" style={{ marginBottom: 8 }}>Velveteen</div>
              <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Questions before sponsoring? Reach out directly.</p>
            </div>
            <ul className="footer-links">
              <li><a href="https://x.com/Velveteen0x" target="_blank" rel="noopener noreferrer">DM on X</a></li>
              <li><a href="https://www.instagram.com/velveteengallery" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            </ul>
          </div>
          <div className="footer-note">To claim a tier, DM @Velveteen0x on X with the tier you want. You'll get payment details and next steps directly.</div>
          <div className="legal-links" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 640 }}>
            <details className="legal-item">
              <summary style={{ fontSize: '12.5px', color: 'var(--text-dim)', cursor: 'pointer' }}>Terms</summary>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>By sponsoring a tier on this piece, you're purchasing the logo or illustration placement described on this page, not a guarantee of returns, resale value, or a specific level of exposure. Placement position within a tier may vary. Sponsorship funds go directly toward producing, transporting, and exhibiting the artwork. If the piece is not completed or shown at the stated venues for reasons outside my control, sponsors will be offered a full refund or a credit toward a future piece, sponsor's choice.</p>
            </details>
            <details className="legal-item">
              <summary style={{ fontSize: '12.5px', color: 'var(--text-dim)', cursor: 'pointer' }}>Privacy</summary>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>I collect only what's needed to fulfill your sponsorship: your name, email, brand name, and logo file. This information is used solely to coordinate placement, send you confirmation photos, and share updates about the piece. It is never sold or shared with third parties.</p>
            </details>
            <details className="legal-item">
              <summary style={{ fontSize: '12.5px', color: 'var(--text-dim)', cursor: 'pointer' }}>Content Policy</summary>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>Logos and illustrations must be your own brand assets or work you have the right to use. I reserve the right to decline any submission that infringes on another party's intellectual property, contains hate speech, or is otherwise inappropriate for public exhibition. If declined, you'll be offered a refund.</p>
            </details>
          </div>
        </div>
      </footer>
    </>
  )
}
