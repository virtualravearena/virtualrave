"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

/* 
   SECTION  06 / EVENTS
   THE DECENTRALIZED RAVE FEDERATION  MANIFESTO v01  2026
   Underground transmission panel. Embedded inside the page.
   Dark/charcoal palette, restrained signal accents, brutalist type.
    */

const TICKER = [
  "SIGNAL ACTIVE",
  "STREAM EVERYTHING",
  "ARCHIVE RECORDING",
  "NO DAO",
  "RAVE FOREVER",
];

/* Body blocks: a paragraph (string), a bulleted list (string[]), or a typed heading.
   Verbatim text  only the rendering shape differs. */
type Block = string | string[] | { heading: string; tag?: string };
interface Principle { n: string; title: string; icon: string; teaser: string; body: Block[]; }

const PRINCIPLES: Principle[] = [
  { n: "01", title: "OPEN PARTICIPATION", icon: "◎", teaser: "anyone can organize. no gatekeepers.", body: [
    "Anyone can organize a federation event.",
    "No gatekeeping by genre, status, nationality, or popularity.",
    "Small crews matter.\nUnknown artists matter.\nLocal scenes matter.",
  ]},
  { n: "02", title: "LOCAL CONTROL", icon: "◧", teaser: "every city operates independently.", body: [
    "Every city operates independently.",
    "Tokyo should feel like Tokyo.\nBerlin should feel like Berlin.\nMexico City should feel like Mexico City.",
    "The federation connects scenes without forcing one identity.",
  ]},
  { n: "03", title: "GLOBAL ARCHIVE", icon: "▣", teaser: "every event preserved. permanently.", body: [
    "Rave culture disappears when nobody archives it.",
    "Every federation event contributes to a permanent global archive through:",
    ["livestreams", "recordings", "flyers", "photos", "lineups", "reports", "visual documentation"],
    "The archive matters as much as the event itself.",
  ]},
  { n: "04", title: "OPEN GENRES", icon: "≋", teaser: "no enforced sound. all frequencies welcome.", body: [
    "The federation does not enforce one sound.",
    "Accepted formats include:",
    ["techno", "house", "trance", "ambient", "jungle", "hardcore", "hyperpop", "experimental", "live AV", "hybrid formats"],
    "All genres and subgenres are welcome.",
    "Scenes evolve through experimentation, adaptation, and continuous creation.",
  ]},
  { n: "05", title: "INDEPENDENT ECONOMICS", icon: "$", teaser: "organizers keep 100%. no tax. no cut.", body: [
    "Organizers keep:",
    ["100% ticket revenue", "100% merch revenue", "100% local sponsorship revenue", "100% venue deals"],
    "The federation does not tax local organizers.",
    "The goal is long-term scene growth.",
  ]},
  { n: "06", title: "STREAM EVERYTHING", icon: "◉", teaser: "every set must broadcast. 320 kbps min.", body: [
    "All federation events must stream DJ sets.",
    "Accepted formats:",
    ["audio livestream", "video livestream", "hybrid livestream"],
    "Visuals are optional.",
    "One camera is enough.",
    "Use old gear, new gear, handycams, professional cameras, laptop webcams, cell phones, cybershots, CCTV cameras, or anything available.",
    "Streams should feel alive.\nCapture the crowd.\nCapture the energy.\nCapture the environment.",
    "Do not reduce the stream to a static DJ shot with a dead background.",
    "One audio stream is enough.",
    "Minimum recommended quality:\n320 kbps audio.",
    "If you have never streamed before, the federation provides guides covering:",
    ["low-cost streaming setups", "professional streaming setups", "audio routing", "livestream platforms", "archive workflows", "rave operations", "event logistics", "venue setup", "documentation workflows"],
    "The goal is accessibility, not production elitism.",
    "Documentation matters more than perfection.",
    "Raves are loud, temporary, chaotic, and unpredictable.",
    "The archive preserves what would otherwise disappear.",
    "No VIP mentality.\nNo class systems.\nNo poser culture.",
    "Build the vibe.\nRespect the crowd.\nRave until sunrise.",
  ]},
  { n: "07", title: "EVENT FORMATS", icon: "⌬", teaser: "virtual rave club. virtual rave afterhours.", body: [
    { heading: "Virtual Rave Club", tag: "FORMAT 01  MAIN" },
    "Main format.\nOpen schedule.\nMust include livestreaming.",
    "Recommended minimum attendance:\n100 people.",
    { heading: "Virtual Rave Afterhours", tag: "FORMAT 02  LATE-NIGHT" },
    "Late-night federation format.",
    "Requirements:",
    ["must begin between 05:00 and 07:00 local time", "minimum 50 attendees", "must continue after primary nightlife hours", "must include livestreaming"],
  ]},
  { n: "08", title: "FEDERATION SUPPORT", icon: "✚", teaser: "templates. reimbursements. introductions.", body: [
    "Federation organizers may receive:",
    ["flyer templates", "visual identity assets", "livestream reposting", "sticker reimbursement", "poster reimbursement", "archive placement", "artist recommendations", "sponsor introductions", "collectible onboarding", "federation visibility"],
    "The federation may reimburse part of the production costs for:",
    ["posters", "flyers", "stickers", "banners", "projections", "basic stream infrastructure", "promotional materials"],
    "These reimbursements depend on:",
    ["archive submission", "event execution", "attendance", "federation participation", "visible federation branding"],
    "Branding guidelines are flexible.",
    "This is your party.\nYour city.\nYour crowd.\nYour direction.",
    "Organizers are encouraged to build their own visual identity, aesthetics, and atmosphere.",
    "The federation provides guidance, references, templates, and support, not creative control.",
    "Minimal federation branding must remain visible on:",
    ["flyers", "posters", "livestreams", "event pages", "promotional assets"],
    "The rest is open for interpretation.",
    "Every city should develop its own visual language while remaining connected to the wider federation network.",
  ]},
  { n: "09", title: "CULTURAL RULES", icon: "△", teaser: "the only rules that aren't optional.", body: [
    "Do not fake attendance.\nDo not fake partnerships.\nDo not exploit artists.\nDo not destroy local scenes for short-term hype.",
    "Support independent culture.\nSupport long-term communities.\nSupport local organizers.",
  ]},
  { n: "10", title: "NO DAO GOVERNANCE", icon: "⊘", teaser: "no tokens. no votes. no whales.", body: [
    "The federation is not a DAO and will never be one.",
    "DAOs are failed utopias in real world systems when capital means control.",
    "There are:",
    ["no governance tokens", "no proposal systems", "no voting politics", "no whale control", "no treasury games"],
    "The federation operates through:",
    ["participation", "archives", "reputation", "cultural contribution", "local activity"],
  ]},
  { n: "11", title: "RAVE INDEX at AXIS.SHOW", icon: "✶", teaser: "the archival & discovery layer.", body: [
    "RAVE INDEX is the archival and discovery layer connecting AXIS and the Decentralized Rave Federation.",
    "It tracks and preserves federation activity worldwide while linking local scenes into a searchable global network.",
    "It records:",
    ["events", "cities", "livestreams", "flyers", "photos", "lineups", "recordings", "venue history", "scene reports", "artist profiles", "collective histories"],
    "Every federation event adds to the archive.",
    "Users can explore cities, crews, artists, venues, livestreams, and past events through AXIS.SHOW.",
    "The archive stays public, searchable, and permanent.",
    "RAVE INDEX does not control local scenes.",
    "It documents, connects, and preserves what people build.",
  ]},
  { n: "12", title: "THE MISSION", icon: "✦", teaser: "think local. act global.", body: [
    "Think local.\nAct global.",
    "Build local scenes.\nConnect cities globally.\nPreserve rave culture through permanent archives.",
    "The federation grows one event at a time through a shared network of independent local communities.",
  ]},
  { n: "13", title: "SYNCHRONIZED EVENTS", icon: "↻", teaser: "one continuous global rave signal.", body: [
    "When federation events overlap across cities, organizers are encouraged to interconnect through livestreams.",
    "A set played in Berlin can continue inside a club in Mexico City.\nAn afterhours in Tokyo can stream directly into a warehouse in Barcelona.\nA crowd in New York can listen live to a sunrise session happening somewhere else in the world.",
    "The federation exists physically and digitally at the same time.",
    "Local scenes remain independent while connected through a shared live network.",
    "Streams may be:",
    ["rebroadcast between venues", "projected inside clubs", "relayed through federation channels", "archived inside RAVE INDEX", "connected through radio-style programming", "synchronized across time zones"],
    "The goal is to create a continuous global rave signal.",
    "Different cities.\nDifferent sounds.\nOne connected movement.",
    "Every connected event expands the network in real time.",
  ]},
];

interface City { cc: string; name: string; tz: number; coord: string; }
const CITIES: City[] = [
  { cc: "DE", name: "BERLIN",    tz:  1, coord: "52.52N  13.40E"  },
  { cc: "PT", name: "LISBOA",    tz:  0, coord: "38.72N  09.13W"  },
  { cc: "MX", name: "CDMX",      tz: -6, coord: "19.43N  99.13W"  },
  { cc: "JP", name: "TOKYO",     tz:  9, coord: "35.68N  139.69E" },
  { cc: "US", name: "NEW YORK",  tz: -5, coord: "40.71N  74.00W"  },
  { cc: "ES", name: "BARCELONA", tz:  1, coord: "41.39N  02.16E"  },
];

type CityState = "rave" | "afterhours" | "pre-rave" | "dark";
function cityState(utcMin: number, tz: number): CityState {
  const local = ((utcMin + tz * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  const h = local / 60;
  if (h >= 19 || h < 7)  return "rave";        // 19:00 -> 06:59
  if (h >= 7  && h < 14) return "afterhours";  // 07:00 -> 13:59
  if (h >= 14 && h < 19) return "pre-rave";    // 14:00 -> 18:59
  return "dark";
}
const STATE_LABEL: Record<CityState, string> = {
  "rave":       "RAVE TIME",
  "afterhours": "AFTERHOURS",
  "pre-rave":   "PRE-RAVE",
  "dark":       "DARK",
};

function pad2(n: number) { return n.toString().padStart(2, "0"); }

function getUtcMinutesNow() {
  const d = new Date();
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function useUtcMinutes() {
  const [m, setM] = useState(0);
  useEffect(() => {
    setM(getUtcMinutesNow());
    const id = setInterval(() => {
      setM(getUtcMinutesNow());
    }, 30 * 1000);
    return () => clearInterval(id);
  }, []);
  return m;
}
function useBlink(intervalMs = 900) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(true);
    const id = setInterval(() => setOn(v => !v), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return on;
}
function localClock(utcMin: number, tz: number) {
  const local = ((utcMin + tz * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  return pad2(Math.floor(local / 60)) + ":" + pad2(local % 60);
}

function PrincipleModal({
  idx, onClose, onNext, onPrev,
}: {
  idx: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const p = PRINCIPLES[idx];
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onNext, onPrev]);

  if (!mounted) return null;

  const next = PRINCIPLES[(idx + 1) % PRINCIPLES.length];

  const modal = (
    <motion.div
      className="pmodal"
      role="dialog"
      aria-modal="true"
      aria-label={`File ${p.n}: ${p.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="pmodal__panel"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pmodal__head">
          <div className="pmodal__head-l">
            <span className="pmodal__n">FILE_{p.n}</span>
            <span className="pmodal__stamp">DRFv01 / 2026</span>
          </div>
          <button className="pmodal__x" onClick={onClose} aria-label="close file"></button>
        </div>

        <h4 className="pmodal__title">
          <span className="pmodal__icon" aria-hidden>{p.icon}</span>
          {p.title}
        </h4>

        <div className="pmodal__body">
          <span className="pmodal__bigicon" aria-hidden>{p.icon}</span>
          {(() => {
            /* Group blocks into sections: each heading starts a new section,
               everything until the next heading is that section's content. */
            const sections: { heading: string; tag?: string; blocks: Block[] }[] = [];
            let preface: Block[] = [];
            for (const b of p.body) {
              if (typeof b === "object" && !Array.isArray(b) && "heading" in b) {
                sections.push({ heading: b.heading, tag: b.tag, blocks: [] });
              } else if (sections.length > 0) {
                sections[sections.length - 1].blocks.push(b);
              } else {
                preface.push(b);
              }
            }
            const renderBlock = (block: Block, i: number) => {
              if (Array.isArray(block)) {
                return (
                  <ul key={i} className="pmodal__bullets">
                    {block.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                );
              }
              if (typeof block === "object") return null;
              const lines = block.split("\n");
              return (
                <p key={i}>
                  {lines.map((l, k) => (
                    <span key={k}>
                      {l}
                      {k < lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              );
            };
            return (
              <>
                {preface.map(renderBlock)}
                {sections.map((s, si) => (
                  <section key={si} className="pmodal__sub">
                    <header className="pmodal__sub-head">
                      <span className="pmodal__sub-no">{pad2(si + 1)}</span>
                      <div className="pmodal__sub-title-wrap">
                        {s.tag && <span className="pmodal__sub-tag">{s.tag}</span>}
                        <h5 className="pmodal__sub-title">{s.heading}</h5>
                      </div>
                    </header>
                    <div className="pmodal__sub-body">
                      {s.blocks.map(renderBlock)}
                    </div>
                  </section>
                ))}
              </>
            );
          })()}
        </div>

        <div className="pmodal__foot">
          <button className="pmodal__nav" onClick={onPrev} aria-label="previous file">
             PREV
          </button>
          <span className="pmodal__pager">{pad2(idx + 1)} / {pad2(PRINCIPLES.length)}</span>
          <button className="pmodal__nav pmodal__nav--next" onClick={onNext} aria-label="next file">
            FILE_{next.n} 
          </button>
        </div>

        <span className="pmodal__hint">ESC TO CLOSE    TO NAVIGATE</span>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
}

export function EventsSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [exampleOn, setExampleOn] = useState(false);
  const utcMin = useUtcMinutes();
  const blink = useBlink(820);

  return (
    <section id="events" className="drf">
      {/* === atmospheric layers === */}
      <div className="drf__bg" aria-hidden>
        <div className="drf__grain" />
        <div className="drf__scan" />
        <div className="drf__grid" />
        <div className="drf__vignette" />
      </div>

      {/* === broadcast header bar === */}
      <header className="drf__head">
        <div className="drf__head-l">
          <span className={`drf__rec${blink ? " is-on" : ""}`}> REC</span>
          <span className="drf__head-id">DRF // BROADCAST.SIGNAL v01</span>
        </div>
        <div className="drf__head-c">
          <span className="drf__head-stamp">FILE: drf-manifesto.v01.2026</span>
        </div>
        <div className="drf__head-r">
          <span className="drf__head-utc">UTC {pad2(Math.floor(utcMin/60))}:{pad2(utcMin%60)}</span>
          <span className={`drf__live${blink ? " is-on" : ""}`}>LIVE</span>
        </div>
      </header>

      {/* === HERO === */}
      <div className="drf__hero">
        <div className="drf__title-meta">
          <span className="section-tag drf__tag"><span className="square" /> SECTION  06 / EVENTS</span>
          <span className="drf__title-version">MANIFESTO v01  2026</span>
        </div>
        <h2 className="drf__h">
          <motion.span className="drf__h-line drf__h-line--small" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.05 }}>
            D E C E N T R A L I Z E D
          </motion.span>
          <motion.span className="drf__h-line drf__h-line--acid" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}>
            <span className="acid">rave</span>
          </motion.span>
          <motion.span className="drf__h-line drf__h-line--small" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.25 }}>
            F E D E R A T I O N
          </motion.span>
        </h2>
        <p className="drf__lead">
          A global network of independent rave scenes connected through archives, livestreams, and synchronized nightlife culture.
        </p>
        <div className="drf__intro">
          <p>The Decentralized Rave Federation connects independent rave scenes into a shared global network.</p>
          <p>Rave culture should stay open, local, independent, and globally connected.</p>
          <p>The federation does not own local scenes.</p>
        </div>
        <ul className="drf__credo">
          <li>Cities organize themselves.</li>
          <li>Organizers keep their profits.</li>
          <li>Crews build their own identities.</li>
          <li>Genres remain open.</li>
        </ul>
        <p className="drf__sublead">The federation exists to support, archive, and connect scenes worldwide.</p>
      </div>

      {/* === SIGNAL TICKER === */}
      <div className="drf__ticker" aria-hidden>
        <div className="drf__ticker-track">
          {[...Array(2)].flatMap((_, k) => TICKER.map((t, i) => (
            <span key={`${k}-${i}`} className="drf__ticker-item">
              <em className="drf__ticker-dot" /> {t}
            </span>
          )))}
        </div>
      </div>

      {/* === CITY SYNCHRONIZATION === */}
      <div className="drf__sync">
        <div className="drf__sub">
          <span className="drf__sub-no">// 02</span>
          <h3 className="drf__sub-h">CITY SYNC</h3>
          <p className="drf__sub-p">somewhere on earth, it is always 4am. local clocks, federation signal, one continuous broadcast.</p>
        </div>
        <ul className="drf__cities">
          {CITIES.map((c) => {
            const state = cityState(utcMin, c.tz);
            return (
              <li key={c.cc} className={`drf__city is-${state}`}>
                <div className="drf__city-l">
                  <span className="drf__city-cc">{c.cc}</span>
                  <div className="drf__city-name">
                    <strong>{c.name}</strong>
                    <small>{c.coord}</small>
                  </div>
                </div>
                <div className="drf__city-mid">
                  <span className="drf__city-clock">{localClock(utcMin, c.tz)}</span>
                  <span className="drf__city-tz">UTC{c.tz >= 0 ? `+${c.tz}` : c.tz}</span>
                </div>
                <div className="drf__city-r">
                  <span className={`drf__city-dot${blink && state !== "dark" ? " on" : ""}`} />
                  <span className="drf__city-status">{STATE_LABEL[state]}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="drf__chain" aria-hidden>
          <span className="drf__chain-line" />
          {CITIES.map((c, i) => (
            <span key={c.cc} className="drf__chain-node" style={{ animationDelay: `${i * 0.16}s` }}>
              <em />
              <small>{c.cc}</small>
            </span>
          ))}
        </div>
      </div>

      {/* === CORE PRINCIPLES  graphic card grid === */}
      <div className="drf__principles">
        <div className="drf__sub">
          <span className="drf__sub-no">// 03</span>
          <h3 className="drf__sub-h">CORE PRINCIPLES</h3>
          <p className="drf__sub-p">thirteen rules. tap a card to open the file. these are not proposals  this is how the federation operates.</p>
        </div>

        <div className="drf__cards" role="list">
          {PRINCIPLES.map((p, idx) => {
            const open = openIdx === idx;
            return (
              <motion.button
                key={p.n}
                type="button"
                role="listitem"
                className={`pcard${open ? " is-open" : ""}`}
                onClick={() => setOpenIdx(open ? null : idx)}
                aria-expanded={open}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                style={{ ['--pcard-i' as string]: idx }}
              >
                <span className="pcard__strip">
                  <span className="pcard__n">FILE_{p.n}</span>
                  <span className="pcard__sig"><em />REC</span>
                </span>
                <span className="pcard__face">
                  <span className={`pcard__ico${p.n === "05" ? " pcard__ico--tight" : ""}`} aria-hidden>{p.icon}</span>
                  <span className="pcard__scan" aria-hidden />
                  <span className="pcard__corner pcard__corner--tl" aria-hidden />
                  <span className="pcard__corner pcard__corner--tr" aria-hidden />
                  <span className="pcard__corner pcard__corner--bl" aria-hidden />
                  <span className="pcard__corner pcard__corner--br" aria-hidden />
                </span>
                <span className="pcard__meta">
                  <span className="pcard__title">{p.title}</span>
                  <span className="pcard__teaser">{p.teaser}</span>
                </span>
                <span className="pcard__cta">
                  <span>{open ? "CLOSE FILE" : "OPEN FILE"}</span>
                  <em className="pcard__cta-arrow">{open ? "" : ""}</em>
                </span>
              </motion.button>
            );
          })}
        </div>

      </div>

      {/*  modal overlay for the open principle file  */}
      <AnimatePresence>
        {openIdx !== null && (
          <PrincipleModal
            idx={openIdx}
            onClose={() => setOpenIdx(null)}
            onNext={() => setOpenIdx((openIdx + 1) % PRINCIPLES.length)}
            onPrev={() => setOpenIdx((openIdx - 1 + PRINCIPLES.length) % PRINCIPLES.length)}
          />
        )}
      </AnimatePresence>

      {/* === EXAMPLE FLYER (ONE) === */}
      <div className="drf__example">
        <div className="drf__sub">
          <span className="drf__sub-no">// 04</span>
          <h3 className="drf__sub-h">EXAMPLE NODE</h3>
          <p className="drf__sub-p">one card. one city. one of many possible federation events. your VR 303 gets you on the list  six cities, 303 spots each.</p>
        </div>
        <article className="drf__flyer">
          <div className="drf__flyer-strip">
            <span>NODE_01</span>
            <span><em className={`dot${blink ? " on" : ""}`} /> WARMING UP</span>
            <span>320 KBPS</span>
          </div>
          <div className="drf__flyer-top">
            <div>
              <div className="drf__flyer-day">14.06.26</div>
              <div className="drf__flyer-time">23:00  06:00 LOCAL</div>
            </div>
            <div className="drf__flyer-flag">
              <span className="cc">DE</span>
              <span className="no">N01 / 06</span>
            </div>
          </div>
          <div className="drf__flyer-city">BERLIN</div>
          <div className="drf__flyer-venue">WARSCHAUER 33 / KREUZBERG</div>
          <ul className="drf__flyer-line">
            <li>VIRTUAL RAVE LIVE</li>
            <li>OUTER PEACE</li>
            <li>K-300</li>
          </ul>
          <div className="drf__flyer-meta">
            <div><span>FORMAT</span><b>VIRTUAL RAVE CLUB</b></div>
            <div><span>STREAM</span><b>AUDIO + VIDEO</b></div>
            <div><span>ARCHIVE</span><b>AXIS.SHOW</b></div>
            <div><span>CAPACITY</span><b>303 / ROOM</b></div>
          </div>
          <div className="drf__flyer-bar"><span style={{ width: exampleOn ? "65%" : "64%" }} /></div>
          <div className="drf__flyer-cap">
            <span>{exampleOn ? 313 : 312} / 480 RSVP</span>
            <span>RSVP OPEN</span>
          </div>
          <button className={`drf__flyer-cta${exampleOn ? " is-on" : ""}`} onClick={() => setExampleOn(v => !v)}>
            {exampleOn ? "ON THE LIST " : "RSVP "}
          </button>
          <div className="drf__flyer-foot">
            <span>HOLDERS GET +1</span>
            <span>FEDERATION VISIBLE</span>
            <span>+ 5 MORE CITIES SOON</span>
          </div>
        </article>
      </div>

      {/* === CLOSING === */}
      <div className="drf__closing">
        <div className="drf__closing-rule">////////////////////////////////////////////////////////////</div>
        <div className="drf__chant">
          <div className="drf__chant-line">WELCOME TO THE DECENTRALIZED RAVE FEDERATION</div>
          <div className="drf__chant-big">RAVE TODAY</div>
          <div className="drf__chant-big">RAVE TOMORROW</div>
          <div className="drf__chant-big">RAVE FOREVER</div>
        </div>
        <div className="drf__sig">created by  SUNSHINE VENDETTA, 2026</div>
        <div className="drf__closing-rule">////////////////////////////////////////////////////////////</div>
      </div>
    </section>
  );
}
