import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import heroImg from './assets/hero-grass.jpg'
import paintingImg from './assets/painting-acrylic.jpg'
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
import boothImg from './assets/process-booth.jpg'
import paintingProcImg from './assets/process-painting.jpg'
import yurtImg from './assets/process-yurt.jpg'
import rocketImg from './assets/process-rocket.jpg'

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

const animSrc = Object.values(
  import.meta.glob('./assets/animated.{mp4,webm}', { eager: true, query: '?url', import: 'default' }),
)[0] as string | undefined
const animPoster = Object.values(
  import.meta.glob('./assets/animated-poster.{jpg,png}', { eager: true, query: '?url', import: 'default' }),
)[0] as string | undefined

const INSTAGRAM = 'https://instagram.com/velveteengallery'
const X_URL = 'https://x.com/velveteen0x'
const FARCASTER = 'https://farcaster.xyz/velveteen'

function Socials() {
  return (
    <div className="socials">
      <a className="btn" href={INSTAGRAM} target="_blank" rel="noreferrer"><b>Instagram</b> @velveteengallery</a>
      <a className="btn" href={X_URL} target="_blank" rel="noreferrer"><b>X</b> @velveteen0x</a>
      <a className="btn" href={FARCASTER} target="_blank" rel="noreferrer"><b>Farcaster</b> @velveteen</a>
    </div>
  )
}
const TITLE = 'Nomads in Orbit'

type Spot = {
  id: string
  name: string
  where: string
  logo: string
  x: number
  y: number
}

// x and y are percent coordinates on painting-acrylic.jpg. Change them here to move a pin.
const SPOTS: Spot[] = [
  { id: 'astana', name: 'Astana Hub', where: 'The eye of the left drone', logo: lAstana, x: 26.4, y: 29.5 },
  { id: 'higgs', name: 'Higgsfield', where: 'Orange squiggle by the right drone rope', logo: lHiggsfield, x: 45.3, y: 35.0 },
  { id: 'vector', name: 'Vector Vol', where: 'Top of the green tapestry', logo: lVectorvol, x: 22.2, y: 40.4 },
  { id: 'olive', name: 'Olive', where: 'Blue tile on the yurt wall', logo: lOlive, x: 39.4, y: 42.5 },
  { id: 'soup', name: 'Soup', where: 'Brown tile on the yurt wall', logo: lSoup, x: 39.4, y: 44.4 },
  { id: 'farcaster', name: 'Farcaster', where: 'Hidden on the stove', logo: lFarcaster, x: 37.4, y: 49.6 },
  { id: 'zn', name: 'ZCash Names', where: 'Crater on the moon', logo: lZcashNames, x: 56.9, y: 33.2 },
  { id: 'eth', name: 'Ethereum', where: 'Crater on the moon', logo: lEthereum, x: 65.9, y: 34.3 },
  { id: 'sol', name: 'Solana', where: 'Crater on the moon', logo: lSolana, x: 52.7, y: 37.3 },
  { id: 'zec', name: 'Zcash', where: 'Crater on the moon', logo: lZcash, x: 59.2, y: 38.7 },
  { id: 'btc', name: 'Bitcoin', where: 'Crater on the moon', logo: lBitcoin, x: 61.9, y: 41.5 },
  { id: 'ns', name: 'Network School', where: 'The flag', logo: lNS, x: 79.0, y: 61.7 },
  { id: 'nvidia', name: 'NVIDIA', where: 'Glowing eye on the floating island', logo: lNvidia, x: 62.8, y: 68.7 },
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
        const px = pb.left + (pb.width * s.x) / 100 - wb.left
        const py = pb.top + (pb.height * s.y) / 100 - wb.top
        const sx = (left ? cb.right : cb.left) - wb.left
        const sy = cb.top + cb.height / 2 - wb.top
        const d = Math.hypot(px - sx, py - sy) || 1
        const R = 2
        out.push({
          id: s.id,
          x1: (left ? cb.right : cb.left) - wb.left,
          y1: cb.top + cb.height / 2 - wb.top,
          x2: px - ((px - sx) / d) * R,
          y2: py - ((py - sy) / d) * R,
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

const PROCESS: { src: string; alt: string; text: string; pos: string }[] = [
  { src: boothImg, alt: 'The digital piece on a screen at the Network School booth at Digital Bridge', text: 'Digital piece shown NS booth at Digital Bridge Conference 2026', pos: 'center 55%' },
  { src: paintingProcImg, alt: 'Velveteen painting the acrylic piece at the Alem.AI office', text: 'Painting in progress at Alem.AI office', pos: 'center 35%' },
  { src: yurtImg, alt: 'Inside a yurt with felt carpets and tassels at Shymbulak Mountain Resort', text: 'Inside of Shymbulak Mountain Resort Yurt in Almaty', pos: 'center 50%' },
  { src: rocketImg, alt: 'Velveteen crouching in front of Baikonur replica rockets at sunset', text: 'Standing with replica of Baikonur and rockets', pos: 'center 40%' },
]

type Shot = { src: string; title: string; text: string; wide?: boolean; tall?: boolean }

const SHOTS: Shot[] = [
  { src: balajiImg, title: 'Balaji Srinivasan', text: 'Founder of Network School' },
  { src: nvidiaImg, title: 'NVIDIA in Kazakhstan', text: 'Held up at the fireside chat with Jensen Huang, October 23, 2026.', wide: true },
  { src: oliveImg, title: 'Sepehr Vali, Olive', text: 'Founder of Olive, the on-chain options exchange built on Solana.' },
  { src: farcasterImg, title: 'The Farcaster team', text: 'At the Network School wall in Astana.' },
  { src: vectorvolImg, title: 'The Vector Vol team', text: 'Studio visit with the painting.' },
  { src: nsGroupImg, title: 'Network School members', text: 'In front of the digital piece on the LED wall.', wide: true, tall: true },
]

const WALL: { src: string; title: string; alt: string }[][] = [
  [
    { src: formaImg, title: 'Forma Bristol Pop up', alt: 'Acrylic painting of a bridge, a red phone box and a pink unicorn on a yellow ground' },
    { src: islandImg, title: 'Island DAO v4, Koh Samui, Thailand', alt: 'Acrylic painting of a monitor lizard drinking from a purple coconut on a beach at sunset' },
  ],
  [
    { src: parkImg, title: 'The Last Sundance Park City', alt: 'Velveteen sitting on the road in Park City with a painting of a deer in front of mountains' },
  ],
  [
    { src: mtnImg, title: 'MTN DAO v9 Salt Lake City', alt: 'Acrylic painting of a goat climbing coloured blocks under a green and purple night sky' },
    { src: nsPaintImg, title: 'Network School Malaysia', alt: 'Acrylic painting of a pink turtle carrying a green city, floating over a bay' },
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
        <a href="#top" className="brand">Velveteen Gallery</a>
        <nav>
          <a href="#piece">KZ art</a>
          <a href="#animated">Animated</a>
          <a href="#hidden">In the Paint</a>
          <a href="#community">Community art</a>
          <a href="#people">KZ art founders</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <main id="top">
        <section className="band g-yellow hero">
          <div className="hero-text">
            <h1>A Kazakh story: dinosaurs retire, tech rises</h1>
            <p className="lede">
              {TITLE} is a 12 × 12 in acrylic painting and digital piece with a looping animation, made in Astana, Kazakhstan in 2026. Embedded in the tapestry of the piece are motifs and companies that have shaped Kazakhstan’s rise in tech.
            </p>
            <Socials />
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
                <span>Sized to 6912 x 12000 px and 6912 x 3840 animated, drawn with about 2945 layers in Photoshop using a Wacom Cintiq Pro.</span>
              </figcaption>
            </figure>
            <figure className="rv fill">
              <div className="pic">
                <img src={robotImg} alt="The acrylic painting in front of the Digital Bridge robot in Astana" />
              </div>
              <figcaption>
                <b>Acrylic painting, 12 × 12 in</b>
                <span>Diligently painted by hand. Shown outside of Alem.AI with the Digital Bridge robot in Astana.</span>
              </figcaption>
            </figure>
          </div>
          <div className="process">
            {PROCESS.map((p) => (
              <figure key={p.text} className="rv">
                <div className="pic">
                  <img src={p.src} alt={p.alt} loading="lazy" style={{ objectPosition: p.pos }} />
                </div>
                <figcaption>
                  <span>{p.text}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="animated" className="band g-red">
          <div className="head rv">
            <h2>The animated version.</h2>
          </div>
          <div className="anim">
            <figure className="rv">
              <div className="pic">
                {animSrc ? (
                  <video src={animSrc} poster={animPoster} autoPlay muted loop playsInline preload="auto" aria-label="Looping animation of Nomads in Orbit" />
                ) : (
                  <div className="soon">The animation is on its way.</div>
                )}
              </div>
              <figcaption>
                <b>{TITLE}, in motion</b>
              </figcaption>
            </figure>
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
          <p className="more rv">
            To see all of my work, visit my Instagram{' '}
            <a href={INSTAGRAM} target="_blank" rel="noreferrer">@velveteengallery</a>
          </p>
        </section>

        <section id="people" className="band g-lav">
          <div className="head rv">
            <h2>The painting, with the founders it carries.</h2>
            <p className="sub">Photographed across Astana, from Network School to Digital Bridge.</p>
          </div>
          <div className="grid">
            {SHOTS.map((s) => (
              <figure key={s.title} className={'shot rv' + (s.wide ? ' wide' : '') + (s.tall ? ' tall' : '')}>
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
            <h2>Hi, I’m Velveteen :)</h2>
            <p>
              I’m a visual artist working in acrylics, digital illustration and velvet art. I studied industrial design at NC State and have worked as a graphic designer across many industries, including pharma, education and tech. I’m also the founder of <a href="https://chymira.com/" target="_blank" rel="noreferrer">Chymira</a>, a brand strategy and pitch deck studio for deep tech founders.
            </p>
            <p>
              The Web3 community has shaped my life and my art. In 2021, Des Femmes Magazine commissioned me to illustrate an NFT holiday collection, and it sold out within a week. In 2023 I was commissioned to live paint at a Bitcoin-themed pool party, which led to live painting in cities around the world. In March 2026, my first physical piece went up in a gallery: Art Side of the Moon at BLVKBOOK Gallery in LA during the Oscars, a collaboration with Pink Floyd.
            </p>
            <p>
              In May 2026 I left the US on a one-way ticket to Singapore, and I’ve lived as a digital nomad ever since. I’ve been to 10 countries so far, and I’ve live painted at the communities and pop-ups I’ve found along the way. My art is rooted in the place where it’s made.
            </p>
            <h3>Artist statement</h3>
            <p>
              I make vibrant, animal-centred compositions on canvas, combining acrylic paint with jewelry velvet for extra texture. My mission is simple: to bring people happiness and joy.
            </p>
            <p>
              Velvet has been part of my life since I was six, when a Lisa Frank velvet art kit became the best gift I’d ever received. In 2020 I developed my own style of doodling small shapes that together form a larger image. I used it to draw thirty animal compositions on velvet, bound as The Velveteen Bubble (2021). When I prepared my first gallery piece in March 2026, I added velvet to a canvas for the first time, and it elevated the work.
            </p>
            <p>
              Painting live shapes the work too. I paint in front of people, in the communities and streets where the piece will live, so each art piece carries a little of its surroundings and magic &lt;3
            </p>
            <Socials />
          </div>
        </section>
      </main>

      <footer>
        <span>© 2026 Velveteen Gallery</span>
        <a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram</a>
        <a href={X_URL} target="_blank" rel="noreferrer">X</a>
        <a href={FARCASTER} target="_blank" rel="noreferrer">Farcaster</a>
        <a href="https://www.miriamreza.com" target="_blank" rel="noreferrer">miriamreza.com</a>
      </footer>
    </>
  )
}
