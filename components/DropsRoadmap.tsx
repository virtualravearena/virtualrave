"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

//  Data 

interface Drop {
  num: string;
  model: string;
  year: string;
  role: string;
  chain: string;
  date: string;
  live: boolean;
  pattern: string;
  desc: string;
  longDesc: string;
  specs: [string, string][];
  img: string;
  imgCredit: string;
}

const drops: Drop[] = [
  {
    num: "303", model: "303", year: "1981", role: "the bassline",
    chain: "LENS", date: "LIVE NOW", live: true,
    pattern: "1010110110101010",
    desc: "The acid bass synth. Used units sold for about $50. Chicago producers made it a house tool.",
    longDesc: "Roland sold the TB-303 as a guitar practice tool. It failed in stores. Used units dropped to about $50. By 1982, pawn shops in Chicago were full of them. DJ Pierre, Spanky, and Herb J pushed the pattern into acid house.",
    specs: [
      ["OSCILLATOR", "VCO: saw + square"],
      ["FILTER", "18dB/oct resonant LP"],
      ["RELEASE", "1981  79,800"],
      ["DISCONTINUED", "1984"],
      ["SUPPLY", "303 NFTs  LENS"],
      ["PRICE", "1 GHO EACH"],
    ],
    img: "/assets/tb303.jpg",
    imgCredit: "Wikimedia Commons / CC-BY-SA",
  },
  {
    num: "909", model: "909", year: "1983", role: "the kick",
    chain: "BASE", date: "SUMMER 2026", live: false,
    pattern: "1000100010001000",
    desc: "The techno kick. Detroit used it. Berlin used it. It still hits hard.",
    longDesc: "The TR-909 used analog circuits for the kick and hats. It used samples for the snare and claps. Larry Heard and Derrick May used it. You still hear the 909 in modern techno.",
    specs: [
      ["VOICES", "11: analog + PCM"],
      ["SEQUENCER", "64-step, 96 PPQN"],
      ["RELEASE", "1983  150,000"],
      ["DISCONTINUED", "1985"],
      ["SUPPLY", "909 NFTs  BASE"],
      ["PRICE", "TBA"],
    ],
    img: "/assets/tb303.jpg",
    imgCredit: "Wikimedia Commons / CC-BY-SA",
  },
  {
    num: "808", model: "808", year: "1980", role: "the boom",
    chain: "MEGA ETH", date: "FALL 2026", live: false,
    pattern: "1001001010010010",
    desc: "The sub boom. You know it from Miami bass, hip-hop, and car systems.",
    longDesc: "Roland's TR-808 failed in stores because it did not sound like real drums. Its bass drum can fill a room. Its cowbell is easy to spot. After prices dropped, Afrika Bambaataa, Marvin Gaye, and hip-hop producers made it a studio standard.",
    specs: [
      ["VOICES", "16: fully analog"],
      ["BASS DRUM", "tuneable sub boom"],
      ["RELEASE", "1980  150,000"],
      ["DISCONTINUED", "1983"],
      ["SUPPLY", "808 NFTs  MEGA ETH"],
      ["PRICE", "TBA"],
    ],
    img: "/assets/tb303.jpg",
    imgCredit: "Wikimedia Commons / CC-BY-SA",
  },
  {
    num: "707", model: "707", year: "1985", role: "the snap",
    chain: "SONEIUM", date: "2027", live: false,
    pattern: "1010101011101010",
    desc: "The early house drum box. It is direct, bright, and easy to program.",
    longDesc: "The TR-707 used PCM samples instead of analog synthesis. It cost less than the 909 and was easier to find than the 808. Prince and New Order used it. Its snare and clap cut through a mix.",
    specs: [
      ["VOICES", "11: PCM samples"],
      ["SEQUENCER", "64-step, MIDI sync"],
      ["RELEASE", "1985  69,800"],
      ["DISCONTINUED", "1987"],
      ["SUPPLY", "707 NFTs  SONEIUM"],
      ["PRICE", "TBA"],
    ],
    img: "/assets/tb303.jpg",
    imgCredit: "Wikimedia Commons / CC-BY-SA",
  },
  {
    num: "606", model: "606", year: "1981", role: "the pocket",
    chain: "ABSTRACT", date: "2027", live: false,
    pattern: "1001010110010101",
    desc: "The small analog box. It runs on batteries and fits in a bag.",
    longDesc: "The TR-606 Drumatix paired with the TB-303. It was battery powered, analog, and small. Bedroom producers, DIY punk bands, and early electro acts used it because it was cheap and direct.",
    specs: [
      ["VOICES", "6: fully analog"],
      ["POWER", "battery + DC adapter"],
      ["RELEASE", "1981  34,800"],
      ["DISCONTINUED", "1984"],
      ["SUPPLY", "606 NFTs  ABSTRACT"],
      ["PRICE", "TBA"],
    ],
    img: "/assets/tb303.jpg",
    imgCredit: "Wikimedia Commons / CC-BY-SA",
  },
  {
    num: "505", model: "505", year: "1986", role: "the workhorse",
    chain: "HYPERLIQUID", date: "2027", live: false,
    pattern: "1001001010001000",
    desc: "The budget rhythm box. You could learn drums on it without a studio budget.",
    longDesc: "The TR-505 was Roland's budget PCM machine. It came with samples, MIDI, and a lower price. Many bedroom studios used it from 1986 to 1992. Learn drums on a 505, then move to a 909.",
    specs: [
      ["VOICES", "17: PCM samples"],
      ["MIDI", "in / out / thru"],
      ["RELEASE", "1986  49,800"],
      ["DISCONTINUED", "1988"],
      ["SUPPLY", "505 NFTs  HYPERLIQUID"],
      ["PRICE", "TBA"],
    ],
    img: "/assets/tb303.jpg",
    imgCredit: "Wikimedia Commons / CC-BY-SA",
  },
  {
    num: "1000", model: "1000", year: "FUTURE", role: "the future",
    chain: "SOLANA", date: "TBA", live: false,
    pattern: "1010111010101110",
    desc: "The future slot. No fixed supply. No fixed date.",
    longDesc: "Every listed machine is documented and discontinued. The 1000 is different. It is an open edition for new scenes, new records, and new tools.",
    specs: [
      ["VOICES", ": TBA"],
      ["ARCHITECTURE", "undefined"],
      ["RELEASE", "FUTURE"],
      ["DISCONTINUED", "never"],
      ["SUPPLY", "OPEN EDITION  SOLANA"],
      ["PRICE", "TBA"],
    ],
    img: "/assets/tb303.jpg",
    imgCredit: "concept only, no machine exists",
  },
];

//  Pad grid 

function PadSign({ pattern, live }: { pattern: string; live: boolean }) {
  return (
    <div className="padsign">
      {pattern.split("").map((c, i) => (
        <span key={i} className={c === "1" ? "on" : ""} />
      ))}
    </div>
  );
}

//  Spring config 

const SPRING = { damping: 28, stiffness: 90, mass: 1.8 };

//  Card 

function DropCard({
  d,
  i,
  onOpen,
}: {
  d: Drop;
  i: number;
  onOpen: (d: Drop) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const scale   = useSpring(1, SPRING);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ox = e.clientX - rect.left - rect.width  / 2;
    const oy = e.clientY - rect.top  - rect.height / 2;
    rotateX.set((oy / (rect.height / 2)) * -10);
    rotateY.set((ox / (rect.width  / 2)) *  10);
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const handleEnter = () => scale.set(1.04);
  const handleLeave = () => {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    if (ref.current) {
      ref.current.style.setProperty("--mx", "50%");
      ref.current.style.setProperty("--my", "50%");
    }
  };

  const handleClick = () => {
    if (d.live) onOpen(d);
  };

  return (
    <motion.article
      ref={ref as React.Ref<HTMLElement>}
      className={`drop-card${d.live ? " is-live" : " is-future"}${d.live ? " is-clickable" : ""}`}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
        "--mx": "50%",
        "--my": "50%",
      } as unknown as React.CSSProperties}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
    >
      <div className="drop-card__spotlight" />

      <div className="drop-card__head" style={{ transform: "translateZ(8px)" }}>
        <span className="idx">DROP  0{i + 1}</span>
        <span className="status"><span className="frost-date">{d.date}</span></span>
      </div>

      <div className="drop-card__numeral" style={{ transform: "translateZ(18px)" }}>{d.num}</div>

      <div className="drop-card__model" style={{ transform: "translateZ(12px)" }}>
        <span className="frost-model">{d.model}</span>
        <small><span className="frost-year">{d.year}</span>  {d.role}</small>
      </div>

      <div style={{ transform: "translateZ(10px)" }}>
        <PadSign pattern={d.pattern} live={d.live} />
      </div>

      <p className="drop-card__desc" style={{ transform: "translateZ(6px)" }}>{d.desc}</p>

      <div className="drop-card__foot" style={{ transform: "translateZ(8px)" }}>
        <span>ed. {d.num}</span>
        <span className="chain"><span className="frost-chain">{d.chain}</span> </span>
      </div>

      {d.live && (
        <div className="drop-card__open-hint" style={{ transform: "translateZ(14px)" }}>
          VIEW
        </div>
      )}
    </motion.article>
  );
}



function DropModal({ d, onClose }: { d: Drop; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      className="dm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
    >
      <motion.div
        className="dm"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* window chrome bar */}
        <div className="dm__bar">
          <span className="dm__bar-tag">
            <span className="dm__bar-ico"></span>
            roland_tb{d.model}.exe  hardware_archive
          </span>
          <div className="dm__bar-ctrls">
            <span />
            <span />
            <button className="dm__close" onClick={onClose} aria-label="Close"></button>
          </div>
        </div>

        {/* body */}
        <div className="dm__body">

          {/* LEFT, photo and caption */}
          <div className="dm__photo-col">
            <div className="dm__photo-frame">
              <div className="dm__photo-corner dm__photo-corner--tl">TB{d.model}</div>
              <div className="dm__photo-corner dm__photo-corner--tr">{d.year}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.img}
                alt={`Roland TB-${d.model}`}
                className="dm__photo"
              />
              <div className="dm__photo-corner dm__photo-corner--bl">ROLAND CORP  JAPAN</div>
              <div className="dm__photo-corner dm__photo-corner--br">{d.imgCredit}</div>
              {/* scan line effect */}
              <div className="dm__scanlines" />
            </div>

            {/* pad pattern under photo */}
            <div className="dm__pattern">
              <div className="dm__pattern-label">PATTERN  {d.num}</div>
              <div className="dm__pads">
                {d.pattern.split("").map((c, i) => (
                  <motion.span
                    key={i}
                    className={`dm__pad${c === "1" ? " on" : ""}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.03, duration: 0.2, ease: "backOut" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT, info */}
          <div className="dm__info-col">
            {/* header */}
            <div className="dm__model-head">
              <div className="dm__drop-tag">DROP 01 / 07</div>
              <div className="dm__numeral">{d.num}</div>
              <div className="dm__role">
                <em>{d.model}</em>
                <span></span>
                <span>{d.role}</span>
              </div>
            </div>

            {/* long description */}
            <p className="dm__longdesc">{d.longDesc}</p>

            {/* specs table */}
            <div className="dm__specs">
              <div className="dm__specs-title">// TECH SPECS</div>
              {d.specs.map(([k, v]) => (
                <div className="dm__spec-row" key={k}>
                  <span className="dm__spec-k">{k}</span>
                  <span className="dm__spec-v">{v}</span>
                </div>
              ))}
            </div>

            {/* live badge + CTA */}
            <div className="dm__cta-row">
              <div className="dm__live-badge">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                ></motion.span>
                LIVE NOW
              </div>
              <a href="#claim" className="dm__cta-btn" onClick={onClose}>
                CLAIM VR303
                <span className="dm__cta-arr"></span>
              </a>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

//  Section 

export function DropsRoadmap() {
  const [active, setActive] = useState<Drop | null>(null);

  const handleOpen = useCallback((d: Drop) => setActive(d), []);
  const handleClose = useCallback(() => setActive(null), []);

  return (
    <>
      <section id="drops" className="drops">
        <div className="drops__head">
          <div className="drops__head-l">
            <div className="section-tag"><span className="square" /> SECTION · 05 / DROPS</div>
            <h2 className="section-title">7 drops, <em>7 chains</em> so far…</h2>
            <div className="drops__sigils" aria-hidden>
              {["303","909","808","707","606","505","1000"].map((s) => (
                <span key={s} className="drops__sigil">{s}</span>
              ))}
            </div>
          </div>

          <div className="drops__manifest">
            <div className="drops__strip">
              <span className="drops__strip-dot" />
              <span className="drops__strip-label">TRANSMISSION · CHAIN-AGNOSTIC CULTURE</span>
              <span className="drops__strip-tag">VR // ONE UNIVERSE</span>
            </div>

            <blockquote className="drops__quote">
              <span className="drops__quote-mark drops__quote-mark--open" aria-hidden>“</span>
              <p className="drops__line">
                the space split itself into <span className="drops__line-strike">chain tribes</span>.
              </p>
              <p className="drops__line drops__line--mute">
                one community fights another over <em>platforms</em>, <em>metrics</em>, and <em>things</em> nobody cares outside the bubble.
              </p>
              <p className="drops__line drops__line--shout">
                we do <span className="drops__line-not">not</span> care about that.
              </p>
              <p className="drops__line drops__line--credo">
                we care about <em>music</em>, <em>culture</em>, <em>live events</em>, <em>archives</em>, and <em>real people</em> gathering together. <br /><br />we are multi chain, multi world, multi culture.
              </p>
              <span className="drops__quote-mark drops__quote-mark--close" aria-hidden>”</span>
            </blockquote>

            <div className="drops__machines">
              <span className="drops__machines-k">// ENCODED ON THE LEGENDARY MACHINES</span>
              <p className="drops__machines-p">
                Every drop is coded onto a <strong>machine that built this movement</strong> —
                the boxes Chicago, Detroit and Berlin found in pawn shops, and turned into the
                blueprint for acid, house and techno. <span className="drops__machines-tail">303 · 909 · 808 · 707 · 606 · 505 · 1000</span>
              </p>
            </div>

            <div className="drops__credo">
              <span className="drops__credo-line">Virtual Rave expands across multiple chains under one shared universe.</span>
              <span className="drops__credo-line drops__credo-line--accent">
                different drops · different chains · <em>same culture</em>.
              </span>
            </div>
          </div>
        </div>
        <div className="drops__grid">
          {drops.map((d, i) => (
            <DropCard key={d.num} d={d} i={i} onOpen={handleOpen} />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {active && <DropModal d={active} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
}
