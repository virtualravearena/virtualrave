"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Transmission = {
  idx: string;
  era: string;
  kicker: string;
  title: ReactNode;
  body: ReactNode[];
  tags?: string[];
  variant?: "default" | "punch" | "archive" | "federation";
};

const K = ({ children, sm = false }: { children: ReactNode; sm?: boolean }) => (
  <em className={`mfst__key${sm ? " mfst__key--sm" : ""}`}>{children}</em>
);

const TRANSMISSIONS: Transmission[] = [
  {
    idx: "01",
    era: "1981",
    kicker: "the source / chicago · detroit",
    title: (
      <>discarded hardware, <K sm>rewritten</K> as culture.</>
    ),
    body: [
      "The Roland TB-303 launched in 1981 as a bass machine for guitar players. It failed commercially.",
      "Used units later appeared cheaply across Chicago record stores and pawn shops, where producers started pushing the machine beyond its intended purpose.",
      <>Chicago and Detroit transformed discarded hardware into <K sm>acid house</K>, techno, and entirely new nightlife movements that reshaped music culture worldwide.</>,
    ],
    tags: ["TB-303", "ACID HOUSE", "TECHNO"],
  },
  {
    idx: "02",
    era: "1988 / 1989",
    kicker: "second summer of love",
    title: (
      <>scenes formed <K sm>city by city</K>. night by night. flyer by flyer.</>
    ),
    body: [
      <>Rave culture spread through <K sm>pirate radio</K>, underground flyers, mixtapes, illegal warehouses, clubs, and word-of-mouth networks long before social media existed.</>,
      "The Second Summer of Love connected acid house, underground dance music, fashion, graphics, and nightlife into a worldwide cultural movement.",
    ],
    tags: ["PIRATE RADIO", "WAREHOUSE", "FLYER NETWORKS"],
  },
  {
    idx: "03",
    era: "seven machines",
    kicker: "drops · 7 chains",
    title: (
      <>different chains. <K sm>one</K> shared universe.</>
    ),
    body: [
      "Virtual Rave maps seven legendary machines across seven different chains.",
      <>The <K sm>culture</K> matters more than platform tribalism.</>,
    ],
    tags: ["303", "909", "808", "707", "606", "505", "1000"],
  },
  {
    idx: "04",
    era: "rps-01 / drf",
    kicker: "rave public standard",
    title: (
      <><K sm>cc0</K> keeps the artwork public.</>
    ),
    body: [
      "People can remix it, print it, wear it, organize with it, build on top of it, start labels, create artist projects, launch brands, host events, or simply collect and enjoy it.",
      <>RPS-01, the Rave Public Standard, defines how the network archives <K sm>culture</K>, connects scenes, names events, and keeps participation open.</>,
      "The Decentralized Rave Federation expands that system into real nightlife communities, local organizers, livestreams, archives, and interconnected cities worldwide.",
    ],
    tags: ["CC0", "RPS-01", "DRF"],
    variant: "federation",
  },
  {
    idx: "05",
    era: "no governance",
    kicker: "not a dao",
    title: (
      <><K sm>no</K> voting. <K sm>no</K> proposals. <K sm>no</K> token parliament.</>
    ),
    body: [
      "Virtual Rave is not a DAO.",
      "Communities grow through participation, events, archives, and local scenes. Not governance theater.",
    ],
    tags: ["NO DAO", "NO WHALES", "NO DRAMA"],
    variant: "punch",
  },
  {
    idx: "06",
    era: "real scenes",
    kicker: "local · global",
    title: (
      <>think <K sm>local</K>. act <K sm>global</K>.</>
    ),
    body: [
      <>Virtual Rave supports local communities, independent organizers, live events, and <K sm>global connections</K> between cities.</>,
    ],
    tags: ["CITY NETWORKS", "ORGANIZERS", "LIVE"],
  },
  {
    idx: "07",
    era: "permanent archives",
    kicker: "memory of the night",
    title: (
      <>most nightlife disappears after the night ends. <K sm>we keep it.</K></>
    ),
    body: [
      <>Virtual Rave preserves the <K sm>culture</K> through recordings, livestreams, flyers, photos, lineups, and city archives.</>,
    ],
    tags: ["RECORDINGS", "LIVESTREAMS", "FLYERS", "PHOTOS", "LINEUPS"],
    variant: "archive",
  },
];

const MACHINES = ["303", "909", "808", "707", "606", "505", "1000"];

export function About() {
  return (
    <section id="about" className="mfst">
      {/* === HEAD =========================================================== */}
      <header className="mfst__head">
        <div className="mfst__head-meta">
          <div className="section-tag">
            <span className="square" /> SECTION · 07 / MANIFESTO
          </div>
          <div className="mfst__filecode">
            <span className="mfst__filecode-k">FILE</span>
            <span className="mfst__filecode-v">vr-manifesto.v01.2026</span>
            <span className="mfst__filecode-dot" />
            <span className="mfst__filecode-k">STATUS</span>
            <span className="mfst__filecode-v mfst__filecode-v--live">TRANSMITTING</span>
          </div>
        </div>

        <div className="mfst__title-wrap">
          <h2 className="mfst__title">
            <span className="mfst__title-line mfst__title-line--1">why</span>
            <span className="mfst__title-line mfst__title-line--2">
              <em>virtual</em>
            </span>
            <span className="mfst__title-line mfst__title-line--3">
              rave <span className="mfst__title-amp">/</span> <span className="mfst__title-trail">exists.</span>
            </span>
          </h2>
        </div>

        <div className="mfst__lede">
          <div className="mfst__lede-rule" />
          <p className="mfst__lede-text mfst__lede-text--opener">
            <em className="mfst__key">Rave</em> <em className="mfst__key">culture</em> was never supposed to become locked inside platforms, chains, algorithms, or closed communities. <span className="mfst__lede-mute">Yet sometimes it feels exactly like that.</span>
          </p>
          <p className="mfst__lede-text">
            The <em className="mfst__key mfst__key--sm">culture</em> came from small clubs, pirate radio, warehouse parties, flyers, record stores, afterhours, and people building scenes together from nothing.
          </p>

          <div className="mfst__triad">
            <div className="mfst__triad-item">
              <span className="mfst__triad-k">the machines</span>
              <span className="mfst__triad-v">changed <span className="mfst__triad-script">music.</span></span>
            </div>
            <div className="mfst__triad-item">
              <span className="mfst__triad-k">the internet</span>
              <span className="mfst__triad-v">changed <span className="mfst__triad-script">distribution.</span></span>
            </div>
            <div className="mfst__triad-item">
              <span className="mfst__triad-k">blockchain</span>
              <span className="mfst__triad-v">changed <span className="mfst__triad-script">ownership.</span></span>
            </div>
          </div>

          <p className="mfst__lede-credo">
            Very few projects connect all three through a <em className="mfst__key mfst__key--sm">language</em> both cultural <span className="mfst__lede-amp">&amp;</span> tech-forward communities understand.
          </p>

          <div className="mfst__goal">
            <span className="mfst__goal-pin">GOAL</span>
            <p>
              <em className="mfst__key mfst__key--sm">Virtual Rave</em> moves into live events, archives, city networks, livestreams, open culture, and permanent documentation of nightlife scenes. To connect <em className="mfst__key mfst__key--sm">real scenes</em> across different cities under one shared universe.
            </p>
          </div>
        </div>
      </header>

      {/* === MACHINE TICKER ================================================ */}
      <div className="mfst__ticker" aria-hidden>
        <div className="mfst__ticker-track">
          {[...MACHINES, ...MACHINES, ...MACHINES].map((m, i) => (
            <span key={`${m}-${i}`} className="mfst__ticker-item">
              <span className="mfst__ticker-num">{m}</span>
              <span className="mfst__ticker-dot">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* === TRANSMISSIONS ================================================= */}
      <div className="mfst__rail">
        <ol className="mfst__list">
          {TRANSMISSIONS.map((t, i) => (
            <motion.li
              key={t.idx}
              className={`mfst__t mfst__t--${t.variant ?? "default"}`}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: i * 0.04,
              }}
            >
              <div className="mfst__t-rail">
                <span className="mfst__t-rail-dot" />
                <span className="mfst__t-rail-time">T{i.toString().padStart(2, "0")}:{(i * 17 % 60).toString().padStart(2, "0")}</span>
              </div>

              <div className="mfst__t-idx">{t.idx}</div>

              <header className="mfst__t-head">
                <span className="mfst__t-kicker">// {t.kicker}</span>
                <span className="mfst__t-era">{t.era}</span>
              </header>

              <h3 className="mfst__t-title">{t.title}</h3>

              <div className="mfst__t-body">
                {t.body.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>

              {t.tags && (
                <div className="mfst__t-tags">
                  {t.tags.map((tag) => (
                    <span key={tag} className="mfst__t-tag">{tag}</span>
                  ))}
                </div>
              )}

              {t.variant === "punch" && (
                <div className="mfst__t-stamp" aria-hidden>
                  <span>×</span><span>×</span><span>×</span>
                </div>
              )}

              {t.variant === "archive" && (
                <div className="mfst__t-scan" aria-hidden />
              )}
            </motion.li>
          ))}
        </ol>
      </div>

      {/* === SIGN-OFF ====================================================== */}
      <footer className="mfst__signoff">
        <div className="mfst__signoff-l">
          <span className="mfst__signoff-pin">// END OF TRANSMISSION</span>
          <p className="mfst__signoff-line">
            different drops · different chains · <em>same culture</em>.
          </p>
        </div>
        <div className="mfst__signoff-r">
          <div className="mfst__signoff-meta">
            <span>vr / 303</span>
            <span>cc0</span>
            <span>rps-01</span>
            <span>drf</span>
            <span>2026 →</span>
          </div>
        </div>
      </footer>
    </section>
  );
}
