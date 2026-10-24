import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import heroImg from './assets/hero-grass.jpg'
import paintingImg from './assets/painting.jpg'
import lightsImg from './assets/painting-lights.jpg'
import robotImg from './assets/painting-robot.jpg'
import digitalImg from './assets/digital.jpg'
import nvidiaImg from './assets/nvidia-event.jpg'
import balajiImg from './assets/balaji.jpg'
import oliveImg from './assets/olive.jpg'
import vectorvolImg from './assets/vectorvol.jpg'
import nsGroupImg from './assets/ns-group.jpg'
import farcasterImg from './assets/farcaster.jpg'
import miriamImg from './assets/miriam-1.jpg'
import miriam2Img from './assets/miriam-2.jpg'
import formaImg from './assets/paint/forma.jpg'
import islandImg from './assets/paint/island.jpg'
import mtnImg from './assets/paint/mtn.jpg'
import nsPaintImg from './assets/paint/ns.jpg'
import parkImg from './assets/paint/parkcity.jpg'

import lAstana from './assets/logo-astana-hub.png'
import lBitcoin from './assets/logo-bitcoin.png'
import lEthereum from './assets/logo-ethereum.png'
import lFarcaster from './assets/logo-farcaster.png'
import lHiggsfield from './assets/logo-higgsfield.png'
import lNS from './assets/logo-network-school.png'
import lNvidia from './assets/logo-nvidia.png'
import lOlive from './assets/logo-olive.png'
import lSolana from './assets/logo-solana.png'
import lSoup from './assets/logo-soup.png'
import lVectorvol from './assets/logo-vectorvol.png'
import lZcash from './assets/logo-zcash.png'
import lZcashNames from './assets/logo-zcash-names.png'

const INSTAGRAM = 'https://instagram.com/velveteengallery'
const TITLE = 'KZ in Space'

type Spot = {
  id: string
  name: string
  where: string
  logo: string
  x: number
  y: number
}

// x and y are percent coordinates on painting.jpg. Change them here to move a pin.
const SPOTS: Spot[] = [
  { id: 'astana', name: 'Astana Hub', where: 'The eye of the left drone', logo: lAstana, x: 16, y: 11 },
  { id: 'higgs', name: 'Higgsfield', where: 'Orange squiggle by the right drone rope', logo: lHiggsfield, x: 45.5, y: 21 },
  { id: 'vector', name: 'Vector Vol', where: 'Top of the green tapestry', logo: lVectorvol, x: 10, y: 31 },
  { id: 'olive', name: 'Olive', where: 'Blue tile on the yurt wall', logo: lOlive, x: 36.5, y: 34.5 },
  { id: 'soup', name: 'Soup', where: 'Brown tile on the yurt wall', logo: lSoup, x: 36.5, y: 37.8 },
  { id: 'farcaster', name: 'Farcaster', where: 'Hidden on the stove', logo: lFarcaster, x: 33.5, y: 47 },
  { id: 'zn', name: 'ZCash Names', where: 'Crater on the moon', logo: lZcashNames, x: 63.5, y: 17.5 },
  { id: 'eth', name: 'Ethereum', where: 'Crater on the moon', logo: lEthereum, x: 77.5, y: 19.5 },
  { id: 'sol', name: 'Solana', where: 'Crater on the moon', logo: lSolana, x: 57, y: 25 },
  { id: 'zec', name: 'Zcash', where: 'Crater on the moon', logo: lZcash, x: 67, y: 27.5 },
  { id: 'btc', name: 'Bitcoin', where: 'Crater on the moon', logo: lBitcoin, x: 71, y: 32.5 },
  { id: 'ns', name: 'Network School', where: 'The flag', logo: lNS, x: 94.5, y: 70.5 },
  { id: 'nvidia', name: 'NVIDIA', where: 'Glowing eye on the floating island', logo: lNvidia, x: 71.5, y: 79.5 },
]

const LEFT = SPOTS.filter((s) => s.x < 50)
const RIGHT = SPOTS.filter((s) => s.x >= 50).sort((a, b) => a.y - b.y)

type Line = { id: string; x1: number; y1: number; x2: number; y2: number }

function Annotated() {
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLDivElement>(null)
  const cards = useRef<Record<string, HTMLDivElement | null>>({})
  const [lines, setLines] = useState<Line[]>([])
  const [active, setActive] = useState<string | null>(null)

  useLayoutEffect(() => {
    const calc = () => {
      const w = wrap.current
      const p = img.current
      if (!w || !p) return
      if (window.innerWidth < 900) {
        setLines([])
        return
      }
      const wb = w.getBoundingClientRect()
      const pb = p.getBoundingClientRect()
      const out: Line[] = []
      for (const s of SPOTS) {
        const c = cards.current[s.id]
        if (!c) continue
        const cb = c.getBoundingClientRect()
        const left = s.x < 50
        out.push({
          id: s.id,
          x1: (left ? cb.right : cb.left) - wb.left,
          y1: cb.top + cb.height / 2 - wb.top,
          x2: pb.left + (pb.width * s.x) / 100 - wb.left,
          y2: pb.top + (pb.height * s.y) / 100 - wb.top,
        })
      }
      setLines(out)
    }
    calc()
    window.addEventListener('resize', calc)
    const t = window.setTimeout(calc, 500)
    const im = img.current?.querySelector('img')
    im?.addEventListener('load', calc)
    return () => {
      window.removeEventListener('resize', calc)
      window.clearTimeout(t)
      im?.removeEventListener('load', calc)
    }
  }, [])

  const card = (s: Spot) => (
    <div
      key={s.id}
      ref={(el) => {
        cards.current[s.id] = el
      }}
      className={'spot' + (active === s.id ? ' on' : '')}
      onMouseEnter={() => setActive(s.id)}
      onMouseLeave={() => setActive(null)}
    >
      <span className="num">{SPOTS.indexOf(s) + 1}</span>
      <div className="logo">
        <img src={s.logo} alt={s.name} loading="lazy" />
      </div>
      <div className="meta">
        <b>{s.name}</b>
        <small>{s.where}</small>
      </div>
    </div>
  )

  return (
    <div className="annot" ref={wrap}>
      <div className="col">{LEFT.map(card)}</div>
      <div className="paint" ref={img}>
        <div className="pic">
          <img src={paintingImg} alt="Acrylic painting with company logos hidden in the scene" />
        </div>
        {SPOTS.map((s) => (
          <span
            key={s.id}
            className={'pin' + (active === s.id ? ' on' : '')}
            style={{ left: s.x + '%', top: s.y + '%' }}
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
          >
            {SPOTS.indexOf(s) + 1}
          </span>
        ))}
      </div>
      <div className="col">{RIGHT.map(card)}</div>
      <svg className="lines" aria-hidden="true">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#FBF200" />
          </marker>
        </defs>
        {lines.map((l) => (
          <line
            key={l.id}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            className={active === l.id ? 'on' : ''}
            markerEnd="url(#arr)"
          />
        ))}
      </svg>
    </div>
  )
}

type Shot = { src: string; title: string; text: string; wide?: boolean }

const SHOTS: Shot[] = [
  { src: balajiImg, title: 'Balaji Srinivasan', text: 'Founder of Network School, with the finished painting.' },
  { src: nvidiaImg, title: 'NVIDIA in Kazakhstan', text: 'Held up at the fireside chat with Jensen Huang, October 23, 2026.', wide: true },
  { src: oliveImg, title: 'Sepehr Vali, Olive', text: 'Founder of Olive, the on-chain options exchange built on Solana.' },
  { src: farcasterImg, title: 'The Farcaster team', text: 'At the Network School wall in Astana.' },
  { src: vectorvolImg, title: 'The Vector Vol team', text: 'Studio visit with the painting.' },
  { src: nsGroupImg, title: 'Network School members', text: 'In front of the digital piece on the LED wall.', wide: true },
]

const WALL: { src: string; title: string; alt: string }[][] = [
  [
    { src: formaImg, title: 'Forma Final', alt: 'Acrylic painting of a bridge, a red phone box and a pink unicorn on a yellow ground' },
    { src: islandImg, title: 'Island DAO', alt: 'Acrylic painting of a monitor lizard drinking from a purple coconut on a beach at sunset' },
  ],
  [
    { src: parkImg, title: 'Park City', alt: 'Velveteen sitting on the road in Park City with a painting of a deer in front of mountains' },
  ],
  [
    { src: mtnImg, title: 'MTN DAO', alt: 'Acrylic painting of a goat climbing coloured blocks under a green and purple night sky' },
    { src: nsPaintImg, title: 'NS MY', alt: 'Acrylic painting of a pink turtle carrying a green city, floating over a bay' },
  ],
]

function Filters() {
  return (
    <svg className="defs" aria-hidden="true" focusable="false">
      <defs>
        <filter id="rough" x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="edge" x="-2%" y="-35%" width="104%" height="170%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.07" numOctaves="3" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.rv')
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
}

export default function App() {
  useReveal()
  return (
    <>
      <Filters />
      <header className="nav">
        <a href="#top" className="brand">Velveteen</a>
        <nav>
          <a href="#piece">The Piece</a>
          <a href="#hidden">In the Paint</a>
          <a href="#community">Paintings</a>
          <a href="#people">The People</a>
          <a href="#about">About</a>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram</a>
        </nav>
      </header>

      <main id="top">
        <section className="band g-yellow hero">
          <div className="hero-text">
            <h1>Kazakh myth, painted with the people building what comes next.</h1>
            <p className="lede">
              {TITLE} is a 12 × 12 in acrylic painting and a digital illustration, made in Astana, Kazakhstan in 2026. Thirteen company logos are hidden inside it.
            </p>
            <div className="cta">
              <a className="btn gold" href="#hidden">Find the logos</a>
              <a className="btn" href={INSTAGRAM} target="_blank" rel="noreferrer">@velveteengallery</a>
            </div>
          </div>
          <div className="hero-img">
            <div className="pic">
              <img src={heroImg} alt="The painting on an easel in the grass in Astana" />
            </div>
          </div>
        </section>

        <section id="piece" className="band g-sky">
          <div className="head rv">
            <h2>One scene, two versions.</h2>
          </div>
          <div className="two">
            <figure className="rv">
              <div className="pic">
                <img src={digitalImg} alt="Digital illustration of drone-carried yurts, a pegasus, satellites and a rocket" />
              </div>
              <figcaption>
                <b>Digital illustration</b>
                <span>The original scene, shown on the LED wall at Alem in Astana.</span>
              </figcaption>
            </figure>
            <div className="stack">
              <figure className="rv">
                <div className="pic">
                  <img src={lightsImg} alt="The painting in front of a light installation" />
                </div>
                <figcaption>
                  <b>Acrylic painting, 12 × 12 in</b>
                  <span>Painted from the digital piece, with the logos added by hand.</span>
                </figcaption>
              </figure>
              <figure className="rv">
                <div className="pic">
                  <img src={robotImg} alt="The painting in front of the Digital Bridge robot in Astana" />
                </div>
                <figcaption>
                  <b>With the Digital Bridge robot</b>
                  <span>Astana, during Digital Bridge week.</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="hidden" className="band g-purple">
          <div className="head rv">
            <h2>Thirteen logos, hidden in plain sight.</h2>
            <p className="sub">Each mark is painted into the scene. Follow the arrows to find where.</p>
          </div>
          <Annotated />
        </section>

        <section className="band g-orange meaning">
          <div className="head rv">
            <h2>The old world is retiring. The yurt is going to space.</h2>
          </div>
          <div className="cols rv">
            <p>
              Two dinosaurs share tea beside a stove inside a yurt. They stand for the fossil past, settling in for a quiet retirement. The yurt itself is lifted by drones, the way Kazakhstan is lifting its own future off the ground.
            </p>
            <p>
              Around them is the new frontier. Tulpar, the winged horse of Kazakh myth, runs across the sky. A robot plants a flag on a floating island for Network School. The moon carries the marks of the chains and protocols being built here.
            </p>
            <p>
              Kazakh ornament holds the whole thing together. The gold pattern on the blue banner is traditional, the way a nomad home carries its identity wherever it goes. In the digital version, a golden bird rises above a rocket, a satellite and a robot arm, with the flag of Kazakhstan running down the side.
            </p>
          </div>
        </section>

        <section id="community" className="band g-ink">
          <div className="head rv">
            <h2>More paintings from the communities I pass through.</h2>
          </div>
          <div className="wall">
            {WALL.map((col, i) => (
              <div className="c" key={i}>
                {col.map((w) => (
                  <figure key={w.title} className="rv">
                    <div className="pic">
                      <img src={w.src} alt={w.alt} loading="lazy" />
                    </div>
                    <figcaption>
                      <b>{w.title}</b>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section id="people" className="band g-lav">
          <div className="head rv">
            <h2>The painting, with the founders it carries.</h2>
            <p className="sub">Photographed across Astana, from Network School to Digital Bridge.</p>
          </div>
          <div className="grid">
            {SHOTS.map((s) => (
              <figure key={s.title} className={'shot rv' + (s.wide ? ' wide' : '')}>
                <div className="pic">
                  <img src={s.src} alt={s.title} loading="lazy" />
                </div>
                <figcaption>
                  <b>{s.title}</b>
                  <span>{s.text}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="about" className="band g-yellow about">
          <div className="about-img rv">
            <div className="pic">
              <img src={miriamImg} alt="Velveteen with the painting in Astana" />
            </div>
            <div className="b">
              <div className="pic">
                <img src={miriam2Img} alt="Velveteen outside the Expo sphere in Astana" />
              </div>
            </div>
          </div>
          <div className="about-text rv">
            <h2>Hi, I'm Miriam, also known as Velveteen.</h2>
            <p>
              I'm a visual artist working in acrylics, velvet paintings and digital illustration. I studied industrial design at NC State, where I graduated magna cum laude and picked up hands-on fabrication in laser cutting, CNC and 3D printing. I won the Cary Young Visual Arts Scholarship, and I've spent about six years as a graphic designer.
            </p>
            <p>
              My roots are in Web3. My first NFT collection sold out within a week in 2021, and I've stayed close to the Solana community and to top NFT galleries in the US. I'm also the founder of <a href="https://chymira.com" target="_blank" rel="noreferrer">Chymira</a>, a brand strategy and pitch deck studio for deep tech founders. Today I'm a digital nomad, and this piece was made in Astana while working out of Alem.AI with Network School.
            </p>
            <h3>Artist statement</h3>
            <p>
              I paint the places and communities I pass through, and the people building in them. Kazakh myth and ornament give the work a spine. Bright acrylic and a little humor keep it from getting stiff.
            </p>
            <p>
              Hiding real company logos inside a folk scene is a way to say that technology belongs to a culture and a place. The founders in these photos are not sponsors of the picture. They are part of it.
            </p>
            <a className="btn gold" href={INSTAGRAM} target="_blank" rel="noreferrer">Follow @velveteengallery</a>
          </div>
        </section>
      </main>

      <footer>
        <span>© 2026 Velveteen</span>
        <a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram</a>
        <a href="https://www.miriamreza.com" target="_blank" rel="noreferrer">miriamreza.com</a>
      </footer>
    </>
  )
}
