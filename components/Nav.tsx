"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MixtapeAudio } from "./Mixtape";
import { TRACKS } from "./Mixtape";

interface NavProps {
  onConnect: () => void;
  walletShort: string | null;
  playerOpen: boolean;
  togglePlayer: () => void;
  audio: MixtapeAudio;
}

const LINKS = [
  { n: "01", l: "COLLECT",   href: "#claim" },
  { n: "02", l: "IP RIGHTS", href: "#cc0" },
  { n: "03", l: "STUDIO",     href: "#studio" },
  { n: "04", l: "MIXTAPE",    href: "#mixtape" },
  { n: "05", l: "DROPS",    href: "#drops" },
  { n: "06", l: "EVENTS",     href: "#events" },
  { n: "07", l: "ABOUT",      href: "#about" },
];

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function MiniVU({ playing }: { playing: boolean }) {
  return (
    <span className="miniplayer__vu">
      {Array.from({ length: 8 }, (_, i) => (
        <motion.span
          key={i}
          className="miniplayer__vu-bar"
          animate={playing ? { scaleY: [0.2, 1, 0.3, 0.9, 0.15, 0.8, 0.4, 1] } : { scaleY: 0.15 }}
          transition={playing ? {
            duration: 0.7 + (i % 3) * 0.18,
            repeat: Infinity,
            repeatType: "mirror",
            delay: i * 0.05,
            ease: "easeInOut",
          } : { duration: 0.2 }}
        />
      ))}
    </span>
  );
}

function MiniSeek({ current, duration, onSeek }: { current: number; duration: number; onSeek: (pct: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [scrubPct, setScrubPct] = useState<number | null>(null);
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const displayPct = scrubPct ?? pct;

  const getPct = (clientX: number) => {
    if (!ref.current) return 0;
    const r = ref.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  };

  const scrubTo = (clientX: number) => {
    const next = getPct(clientX);
    setScrubPct(next * 100);
    onSeek(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubTo(e.clientX);
    e.preventDefault();
    e.stopPropagation();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    scrubTo(e.clientX);
    e.preventDefault();
    e.stopPropagation();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    setScrubPct(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    e.preventDefault();
    e.stopPropagation();
  };
  const onPointerCancel = (e: React.PointerEvent) => {
    dragging.current = false;
    setScrubPct(null);
    e.stopPropagation();
  };

  return (
    <div
      ref={ref}
      className="mixpanel__seekbar"
      role="slider"
      aria-label="track progress"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, Math.round(duration))}
      aria-valuenow={Math.max(0, Math.round(current))}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
    >
      <div className="mixpanel__seekbar-fill" style={{ width: `${displayPct}%` }} />
    </div>
  );
}

function MixPanel({ audio, onClose }: { audio: MixtapeAudio; onClose: () => void }) {
  const { activeId, paused, current, duration, volume, play, togglePause, playNext, playPrev, seek, setVolume } = audio;
  const isPlaying = !!activeId && !paused;
  const activeTrack = TRACKS.find(t => t.id === activeId) ?? null;
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      className="mixpanel"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      onClick={e => e.stopPropagation()}
    >
      {/* title bar */}
      <div className="mixpanel__bar">
        <span className="mixpanel__bar-title">
          <span className="mixpanel__bar-ico">▶</span>
          mixtape.exe
        </span>
        <button className="mixpanel__close" onClick={onClose} aria-label="close">×</button>
      </div>

      {/* now-playing strip, always visible */}
      <div className="mixpanel__now">
        {activeTrack ? (
          <>
            <div className="mixpanel__now-info">
              <span className="mixpanel__now-genre">{activeTrack.genre}</span>
              <span className="mixpanel__now-title">{activeTrack.title}</span>
              <span className="mixpanel__now-by">{activeTrack.by}  {activeTrack.year}</span>
            </div>
            <div className="mixpanel__now-right">
              <MiniVU playing={isPlaying} />
              <motion.span
                className="mixpanel__rec"
                animate={{ opacity: isPlaying ? [1, 0.3, 1] : 0.4 }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                 {isPlaying ? "PLAYING" : "PAUSED"}
              </motion.span>
            </div>
          </>
        ) : (
          <span className="mixpanel__now-idle">pick a track below</span>
        )}
      </div>

      {/* seek + time */}
      <div className="mixpanel__seek-row">
        <span className="mixpanel__time">{fmtTime(current)}</span>
        <MiniSeek current={current} duration={duration} onSeek={seek} />
        <span className="mixpanel__time">{fmtTime(duration)}</span>
      </div>

      {/* transport + volume */}
      <div className="mixpanel__controls">
        <button className="mixpanel__btn mixpanel__btn--skip" onClick={playPrev} disabled={!activeId} aria-label="previous">◀◀</button>
        <button
          className="mixpanel__btn"
          onClick={togglePause}
          disabled={!activeId}
          aria-label={isPlaying ? "pause" : "play"}
        >
          {isPlaying ? "■" : "▶"}
        </button>
        <button className="mixpanel__btn mixpanel__btn--skip" onClick={playNext} disabled={!activeId} aria-label="next">▶▶</button>
        <div className="mixpanel__vol">
          <span className="mixpanel__vol-label">VOL</span>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="mixpanel__vol-slider"
            aria-label="volume"
          />
          <span className="mixpanel__vol-val">{Math.round(volume * 100)}</span>
        </div>
      </div>

      {/* track list */}
      <div className="mixpanel__list" ref={listRef}>
        {TRACKS.map((t, i) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              className={`mixpanel__row${active ? " is-on" : ""}`}
              onClick={() => play(t)}
            >
              <span className="mixpanel__row-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="mixpanel__row-info">
                <span className="mixpanel__row-title">{t.year}  {t.title}</span>
                <span className="mixpanel__row-meta">{t.by}  {t.bpm} BPM</span>
              </span>
              <span className="mixpanel__row-dur">{active ? fmtTime(current) : t.dur}</span>
              <span className="mixpanel__row-ico">{active && !paused ? "■" : "▶"}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function Nav({ onConnect, walletShort, playerOpen, togglePlayer, audio }: NavProps) {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const soundBtnRef = useRef<HTMLButtonElement>(null);

  const isPlaying = !!audio.activeId && !audio.paused;

  // close on outside click or page scroll
  useEffect(() => {
    if (!playerOpen) return;

    const close = (target?: Node | null) => {
      if (
        target &&
        (panelRef.current?.contains(target) || soundBtnRef.current?.contains(target))
      ) return;
      togglePlayer();
    };

    const onMouseDown = (e: MouseEvent) => close(e.target as Node);
    const onScroll = () => close(null); // page scroll always closes

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [playerOpen, togglePlayer]);

  // section observer
  useEffect(() => {
    const ids = LINKS.map(l => l.href.slice(1));
    const map: Record<string, number> = {};
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { map[e.target.id] = e.intersectionRatio; });
      const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] > 0) setActive(`#${top[0]}`);
    }, { threshold: [0, 0.2, 0.5] });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  // scrolled state + mobile menu auto-close
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setMobileOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setActive(href);
    setMobileOpen(false);
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  };

  const soundBtnClass = `pillnav__sound${playerOpen ? " is-active" : ""}${isPlaying && !playerOpen ? " is-playing" : ""}`;
  const soundBtnContent = isPlaying && !playerOpen
    ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>♫</motion.span>
    : <span>{playerOpen ? "×" : "♫"}</span>;

  return (
    <>
      {/*  Desktop pill nav (bottom)  */}
      <nav className="pillnav" data-scrolled={scrolled}>
        <div className="pillnav__brand">
          <span className="pillnav__glyph">
            <img src="/favicon.png" alt="" aria-hidden="true" />
          </span>
          <img className="pillnav__name pillnav__logoText" src="/logo_text.webp" alt="VR 303" />
        </div>

        <div className="pillnav__links" onMouseLeave={() => setHovered(null)}>
          {LINKS.map(x => {
            const isActive = active === x.href;
            const isHov = hovered === x.href;
            return (
              <a
                key={x.href}
                href={x.href}
                className="pillnav__item"
                data-active={isActive}
                onMouseEnter={() => setHovered(x.href)}
                onClick={e => { e.preventDefault(); handleNav(x.href); }}
              >
                {(isActive || isHov) && (
                  <motion.span className="pillnav__pill" layoutId="pill" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <span className="pillnav__num">{x.n}</span>
                <span className="pillnav__label">{x.l}</span>
              </a>
            );
          })}
        </div>

        <div className="pillnav__right">
          <span className="pillnav__live">
            <span className="pillnav__dot" />
            LENS
          </span>
          <button ref={soundBtnRef} className={soundBtnClass} onClick={e => { e.stopPropagation(); togglePlayer(); }} title="mixtape">{soundBtnContent}</button>
          <button className="pillnav__cta" onClick={onConnect}>
            <span className="pillnav__cursor">▮</span>
            {walletShort ?? "CONNECT"}
          </button>
        </div>
      </nav>

      {/* Mix panel, shared fixed overlay */}
      <AnimatePresence>
        {playerOpen && (
          <div ref={panelRef} className="mixpanel-anchor">
            <MixPanel audio={audio} onClose={togglePlayer} />
          </div>
        )}
      </AnimatePresence>

      {/*  Mobile pill bar (bottom)  */}
      <div className="pillnav-m">
        <div className="pillnav-m__bar">
          <div className="pillnav-m__brand">
            <span className="pillnav__glyph pillnav__glyph--sm">
              <img src="/favicon.png" alt="" aria-hidden="true" />
            </span>
            <img className="pillnav-m__name pillnav__logoText pillnav__logoText--sm" src="/logo_text.webp" alt="VR 303" />
          </div>
          <div className="pillnav-m__row">
            <button className={`${soundBtnClass} pillnav__sound--sm`} onClick={e => { e.stopPropagation(); togglePlayer(); }}>{soundBtnContent}</button>
            <button className="pillnav__cta pillnav__cta--sm" onClick={onConnect}>
              {walletShort ?? "CONNECT"}
            </button>
            <button
              className={`pillnav-m__burger${mobileOpen ? " is-open" : ""}`}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="pillnav-m__drawer"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
            >
              {LINKS.map(x => (
                <a
                  key={x.href}
                  href={x.href}
                  className={`pillnav-m__link${active === x.href ? " is-active" : ""}`}
                  onClick={e => { e.preventDefault(); handleNav(x.href); }}
                >
                  <span className="pillnav__num">{x.n}</span>
                  {x.l}
                  {active === x.href && <motion.span layoutId="mpill" className="pillnav-m__ind" />}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
