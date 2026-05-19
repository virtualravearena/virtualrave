"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const I = {
  NoCopy: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <circle cx={32} cy={32} r={26} stroke="currentColor" strokeWidth={3} />
      <path d="M40 24 Q32 18 26 24 Q20 30 26 38 Q32 46 40 40" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <line x1={12} y1={12} x2={52} y2={52} stroke="currentColor" strokeWidth={4} />
    </svg>
  ),
  Lock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <path d="M20 30 V22 a12 12 0 0 1 24 0 V30" stroke="currentColor" strokeWidth={3} />
      <rect x={14} y={30} width={36} height={26} stroke="currentColor" strokeWidth={3} />
      <path d="M28 38 L36 46 M36 38 L28 46" stroke="currentColor" strokeWidth={2.5} />
    </svg>
  ),
  User: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <circle cx={32} cy={24} r={10} stroke="currentColor" strokeWidth={3} />
      <path d="M14 54 Q14 38 32 38 Q50 38 50 54" stroke="currentColor" strokeWidth={3} />
      <circle cx={32} cy={32} r={28} stroke="currentColor" strokeWidth={2} strokeDasharray="3 3" />
    </svg>
  ),
  Infinity: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 32" fill="none" {...p}>
      <path
        d="M20 16 a8 8 0 1 1 12 6 l-8 -12 a8 8 0 1 0 -12 6 a8 8 0 0 1 8 -6"
        stroke="currentColor"
        strokeWidth={3}
        fill="none"
      />
      <path d="M44 16 a8 8 0 1 0 -12 -6 l8 12 a8 8 0 1 1 12 -6 a8 8 0 0 0 -8 6" stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Pencil: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <path d="M10 50 L14 38 L42 10 L54 22 L26 50 L14 54 Z" stroke="currentColor" strokeWidth={3} strokeLinejoin="miter" />
      <path d="M38 14 L50 26" stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Tshirt: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <path
        d="M16 14 L8 22 L14 30 L22 24 L22 56 L42 56 L42 24 L50 30 L56 22 L48 14 L40 14 Q40 22 32 22 Q24 22 24 14 Z"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="miter"
      />
    </svg>
  ),
  Note: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <circle cx={20} cy={48} r={6} stroke="currentColor" strokeWidth={3} />
      <circle cx={48} cy={42} r={6} stroke="currentColor" strokeWidth={3} />
      <path d="M26 48 V14 L54 10 V42" stroke="currentColor" strokeWidth={3} />
      <path d="M26 22 L54 18" stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Code: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <rect x={6} y={12} width={52} height={36} stroke="currentColor" strokeWidth={3} />
      <path d="M22 24 L14 32 L22 40" stroke="currentColor" strokeWidth={3} />
      <path d="M42 24 L50 32 L42 40" stroke="currentColor" strokeWidth={3} />
      <line x1={36} y1={22} x2={30} y2={42} stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Disc: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <circle cx={32} cy={32} r={26} stroke="currentColor" strokeWidth={3} />
      <circle cx={32} cy={32} r={6} stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Key: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <circle cx={22} cy={22} r={12} stroke="currentColor" strokeWidth={3} />
      <path d="M32 30 L52 50 L48 54 L44 50 L48 46 L42 40" stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Laptop: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <rect x={10} y={14} width={44} height={28} stroke="currentColor" strokeWidth={3} />
      <path d="M4 48 L60 48 L56 54 L8 54 Z" stroke="currentColor" strokeWidth={3} strokeLinejoin="miter" />
    </svg>
  ),
  Globe: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <circle cx={32} cy={32} r={24} stroke="currentColor" strokeWidth={3} />
      <ellipse cx={32} cy={32} rx={10} ry={24} stroke="currentColor" strokeWidth={3} />
      <line x1={8} y1={32} x2={56} y2={32} stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  File: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <path d="M14 6 L42 6 L54 18 L54 58 L14 58 Z" stroke="currentColor" strokeWidth={3} strokeLinejoin="miter" />
      <path d="M42 6 L42 18 L54 18" stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Cube: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <path d="M32 6 L56 18 L56 46 L32 58 L8 46 L8 18 Z" stroke="currentColor" strokeWidth={3} strokeLinejoin="miter" />
      <path d="M8 18 L32 30 L56 18 M32 30 L32 58" stroke="currentColor" strokeWidth={3} />
    </svg>
  ),
  Play: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <rect x={6} y={14} width={52} height={36} stroke="currentColor" strokeWidth={3} />
      <polygon points="24,24 24,40 40,32" fill="currentColor" />
    </svg>
  ),
  Print: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" fill="none" {...p}>
      <rect x={14} y={6} width={36} height={16} stroke="currentColor" strokeWidth={3} />
      <rect x={6} y={22} width={52} height={24} stroke="currentColor" strokeWidth={3} />
      <rect x={14} y={38} width={36} height={20} stroke="currentColor" strokeWidth={3} />
      <circle cx={50} cy={30} r={2} fill="currentColor" />
    </svg>
  ),
  Plus: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="none" {...p}>
      <line x1={4} y1={16} x2={28} y2={16} stroke="currentColor" strokeWidth={3.5} />
      <line x1={16} y1={4} x2={16} y2={28} stroke="currentColor" strokeWidth={3.5} />
    </svg>
  ),
  Equals: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="none" {...p}>
      <line x1={4} y1={11} x2={28} y2={11} stroke="currentColor" strokeWidth={3.5} />
      <line x1={4} y1={21} x2={28} y2={21} stroke="currentColor" strokeWidth={3.5} />
    </svg>
  ),
};

const PILLARS = [
  { Ico: I.NoCopy, head: "NO COPYRIGHT", body: "The art stays in the public domain." },
  { Ico: I.Lock, head: "NO RESTRICTIONS", body: "Use it for any purpose, in any format." },
  { Ico: I.User, head: "NO ATTRIBUTION", body: "Credit is optional." },
  { Ico: I.Infinity, head: "GLOBAL & PERMANENT", body: "You can use it anywhere, for good." },
];

const MOVES = [
  { Ico: I.Pencil, label: "REMIX IT", desc: "Change the colors, add effects, or redraw it yourself.", img: "/store/remix.webp" },
  { Ico: I.Tshirt, label: "PUT IT ON PRODUCTS", desc: "Put it on prints, shirts, mugs, stickers, and packaging.", img: "/store/hat.webp" },
  { Ico: I.Note, label: "USE IN YOUR MUSIC", desc: "Use it in album art, sleeves, videos, visuals, and covers.", img: "/store/mixtape.webp" },
  { Ico: I.Code, label: "BUILD DIGITAL", desc: "Use it in games, sites, apps, worlds, and renderers.", img: "/store/game.webp" },
];

const CATALOG: { Ico: (p: React.SVGProps<SVGSVGElement>) => ReactNode; head: string; items: { label: string; img: string }[] }[] = [
  {
    Ico: I.Tshirt,
    head: "APPAREL & STREETWEAR",
    items: [
      { label: "HOODIES", img: "/assets/cc0/cat-hoodie.png" },
      { label: "TEES", img: "/assets/cc0/cat-tee.png" },
      { label: "HEADWEAR", img: "/assets/cc0/cat-cap.png" },
    ],
  },
  {
    Ico: I.Disc,
    head: "PHYSICAL MEDIA",
    items: [
      { label: "VINYL", img: "/assets/cc0/cat-vinyl.png" },
      { label: "CDS", img: "/assets/cc0/cat-cd.png" },
      { label: "CASSETTES", img: "/assets/cc0/cat-tape.png" },
    ],
  },
  {
    Ico: I.Key,
    head: "ACCESSORIES",
    items: [
      { label: "KEYCHAINS", img: "/assets/cc0/cat-key.png" },
      { label: "PINS", img: "/assets/cc0/cat-pin.png" },
      { label: "BEANIES", img: "/assets/cc0/cat-beanie.png" },
      { label: "STICKERS", img: "/assets/cc0/cat-sticker.png" },
    ],
  },
  {
    Ico: I.Laptop,
    head: "DIGITAL & WEB",
    items: [
      { label: "NFT SETS", img: "/assets/cc0/cat-nft.png" },
      { label: "3D / VR", img: "/assets/cc0/cat-3d.png" },
      { label: "DAO SITES", img: "/assets/cc0/cat-dao.png" },
    ],
  },
  {
    Ico: I.Globe,
    head: "EVENTS",
    items: [
      { label: "FLYERS", img: "/assets/cc0/cat-flyer.png" },
      { label: "STAGE VISUALS", img: "/assets/cc0/cat-led.png" },
      { label: "AR FILTERS", img: "/assets/cc0/cat-ar.png" },
    ],
  },
];

const FORMATS = [
  { Ico: I.File, label: "PNG / JPG" },
  { Ico: I.File, label: "SVG / VECTOR" },
  { Ico: I.Cube, label: "GLB / 3D" },
  { Ico: I.Play, label: "GIF / MP4" },
  { Ico: I.Print, label: "PRINT READY" },
];

const COLLAB_LIST = [
  "Open-source projects",
  "Community brands",
  "Remixes and collabs",
  "Classes and workshops",
  "Nonprofit work",
  "Sample packs and visuals",
];

function isPlaceholder(src: string) {
  return !src || src.startsWith("/assets/cc0/");
}

function Slot({ src, alt, label, ratio }: { src: string; alt: string; label?: string; ratio?: string }) {
  const ph = isPlaceholder(src);
  return (
    <figure className="cc0g-slot">
      <div className="cc0g-slot__img" style={{ aspectRatio: ratio ?? "1 / 1" }}>
        {!ph && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} />
        )}
        <span className="cc0g-slot__ph" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/virtualrave-smiley.webp" alt="" />
        </span>
      </div>
      {label && <figcaption className="cc0g-slot__cap">{label}</figcaption>}
    </figure>
  );
}

function Win({ title, ico, children, className = "" }: { title: string; ico?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`win cc0g-win ${className}`}>
      <div className="win__bar">
        <div className="title">
          <span className="ico">{ico ?? ""}</span>
          {title}
        </div>
        <div className="ctrls">
          <span className="ctrl">_</span>
          <span className="ctrl"></span>
          <span className="ctrl">x</span>
        </div>
      </div>
      <div className="win__body cc0g-win__body">{children}</div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function CC0Guide() {
  return (
    <section id="cc0" className="cc0g">
      <div className="cc0g__head">
        <div>
          <div className="section-tag">
            <span className="square" /> INTERLUDE  CC0 PLAYBOOK
          </div>
          <h2 className="section-title">
            use it. <em>anywhere.</em>
          </h2>
        </div>
        <p className="section-blurb">
          CC0 keeps the art public domain. RPS-01 is our public standard for how the network uses it.
        </p>
      </div>

      <motion.div
        className="cc0g__pillars"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        transition={{ staggerChildren: 0.08 }}
      >
        {PILLARS.map(({ Ico, head, body }) => (
          <motion.div key={head} className="cc0g__pillar" variants={fadeUp}>
            <div className="cc0g__pillar-ico"><Ico width={36} height={36} /></div>
            <div className="cc0g__pillar-head">{head}</div>
            <div className="cc0g__pillar-body">{body}</div>
          </motion.div>
        ))}
      </motion.div>

      <Win title="four_moves.exe" ico="" className="cc0g__moves-win">
        <div className="cc0g__moves-head">
          <h3 className="cc0g__moves-title">
            from <em>art</em> <span className="arr">to</span> anything
          </h3>
          <p className="cc0g__moves-lead">
            One image can support many uses. Pick a path, then ship it.
          </p>
        </div>

        <div className="cc0g__moves">
          {MOVES.map(({ Ico, label, desc, img }, i) => (
            <motion.div
              key={label}
              className="cc0g__move"
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <span className="cc0g__move-num">0{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cc0g__move-smiley" src="/assets/virtualrave-smiley.webp" alt="" />
              <I.Plus width={16} height={16} className="cc0g__op" />
              <Ico width={36} height={36} className="cc0g__move-tool" />
              <I.Equals width={16} height={16} className="cc0g__op" />
              <Slot src={img} alt={label} />
              <div className="cc0g__move-text">
                <div className="cc0g__move-label">{label}</div>
                <div className="cc0g__move-desc">{desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Win>

      <Win title="rps_01.txt" ico="" className="cc0g__catalog-win">
        <div className="cc0g__catalog-head">
          <h3 className="cc0g__catalog-title">rave public standard</h3>
          <p className="cc0g__catalog-lead">
            RPS-01 names how the network uses CC0. The art stays free. The standard explains signals, nodes, and archive rules.
          </p>
        </div>

        <div className="cc0g__catalog">
          <div className="cc0g__cat">
            <div className="cc0g__cat-head">
              <I.File width={18} height={18} /> WHAT YOU CAN DO
            </div>
            <div className="cc0g__cat-row cc0g__cat-row--3">
              <Slot src="/store/skateboard.webp" alt="Skateboard merch" label="Make merch and flyers." />
              <Slot src="/store/rave.webp" alt="Rave event" label="Run events and raves." />
              <Slot src="/store/arcade.webp" alt="Arcade game" label="Build games and music projects." />
            </div>
          </div>
          <div className="cc0g__cat">
            <div className="cc0g__cat-head">
              <I.Globe width={18} height={18} /> WHAT RPS-01 ADDS
            </div>
            <div className="cc0g__cat-row cc0g__cat-row--3">
              <Slot src="/store/verified.webp" alt="Verified rave signals" label="Verified rave signals." />
              <Slot src="/store/nodes.webp" alt="Independent city nodes" label="Independent city nodes." />
              <Slot src="/store/archive.webp" alt="Major Raver archiving" label="Major Raver archiving." />
            </div>
          </div>
          <div className="cc0g__cat">
            <div className="cc0g__cat-head">
              <I.Lock width={18} height={18} /> WHAT IT DOES NOT DO
            </div>
            <div className="cc0g__cat-row cc0g__cat-row--3">
              <Slot src="/store/nodao.webp" alt="No DAO voting" label="No DAO voting." />
              <Slot src="/store/nowhale.webp" alt="No proposals" label="No proposals." />
              <Slot src="/store/notoken.webp" alt="No token parliament" label="No token parliament." />
            </div>
          </div>
        </div>
      </Win>

      <div className="cc0g__bottom">
        <Win title="formats.dir" ico="" className="cc0g__fmt-win">
          <div className="cc0g__fmt-head">drop it into any format</div>
          <div className="cc0g__fmt-row">
            {FORMATS.map(({ Ico, label }) => (
              <div className="cc0g__fmt" key={label}>
                <Ico width={36} height={36} />
                <div>{label}</div>
              </div>
            ))}
          </div>
        </Win>

        <Win title="collaborate.net" ico="" className="cc0g__collab-win">
          <div className="cc0g__collab-head">build together, faster</div>
          <p className="cc0g__collab-lead">
            CC0 removes permission checks. Teams and communities can build on the same work without extra approval.
          </p>

          <div className="cc0g__net" aria-hidden="true">
            <svg className="cc0g__net-lines" viewBox="0 0 240 140" preserveAspectRatio="none">
              <g stroke="currentColor" strokeWidth={1} fill="none" strokeDasharray="3 4">
                <line x1={120} y1={70} x2={30} y2={20} />
                <line x1={120} y1={70} x2={210} y2={20} />
                <line x1={120} y1={70} x2={30} y2={120} />
                <line x1={120} y1={70} x2={210} y2={120} />
              </g>
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cc0g__net-node n1" src="/assets/1.webp" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cc0g__net-node n2" src="/assets/2.webp" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cc0g__net-node n3" src="/assets/3.webp" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cc0g__net-node n4" src="/assets/4.webp" alt="" />
            <div className="cc0g__net-center"><I.Globe width={48} height={48} /></div>
          </div>

          <ul className="cc0g__collab-list">
            {COLLAB_LIST.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Win>
      </div>

      <div className="cc0g__outro">
        <span> CREATE WITH NO LIMITS.</span>
        <span> SHARE WITHOUT EXTRA STEPS.</span>
        <span> BUILD ON THE SAME WORK.</span>
        <span> CC0 / PUBLIC DOMAIN.</span>
      </div>
    </section>
  );
}
