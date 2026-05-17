"use client";
import { useState, useEffect, useRef, useCallback, MutableRefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StudioBridge } from "./Studio";

//  Types 

export interface MixtapeTrack {
  id: string;
  title: string;
  by: string;
  year: number;
  bpm: number;
  dur: string;
  url: string;
  genre: string;
}

//  VU Meter bars (animated with framer-motion) 

function VUMeter({ playing }: { playing: boolean }) {
  const bars = 16;
  return (
    <span className="meter-bars" style={{ display: "flex", alignItems: "flex-end", height: 22, gap: 2 }}>
      {Array.from({ length: bars }, (_, i) => (
        <motion.span
          key={i}
          style={{
            flex: 1,
            minWidth: 2,
            background: playing ? "var(--vr-black)" : "rgba(0,0,0,0.25)",
            display: "block",
            transformOrigin: "bottom",
          }}
          animate={playing ? {
            scaleY: [0.2, 1, 0.3, 0.8, 0.15, 0.9, 0.4, 1],
            transition: {
              duration: 0.8 + (i % 4) * 0.15,
              repeat: Infinity,
              repeatType: "mirror",
              delay: i * 0.04,
              ease: "easeInOut",
            }
          } : { scaleY: 0.15 }}
        />
      ))}
    </span>
  );
}

//  Progress bar 

function ProgressBar({
  current,
  duration,
  onSeek,
}: {
  current: number;
  duration: number;
  onSeek: (pct: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [scrubPct, setScrubPct] = useState<number | null>(null);
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const displayPct = scrubPct ?? pct;

  const getPct = (clientX: number) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const scrubTo = (clientX: number) => {
    const next = getPct(clientX);
    setScrubPct(next * 100);
    onSeek(next);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubTo(e.clientX);
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    scrubTo(e.clientX);
    e.preventDefault();
    e.stopPropagation();
  };

  const stopScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    setScrubPct(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopScrub}
      onPointerCancel={stopScrub}
      onLostPointerCapture={stopScrub}
      role="slider"
      aria-label="track progress"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, Math.round(duration))}
      aria-valuenow={Math.max(0, Math.round(current))}
      style={{
        height: 4,
        background: "rgba(0,0,0,0.15)",
        cursor: "ew-resize",
        position: "relative",
        flex: 1,
        touchAction: "none",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          background: "var(--vr-black)",
          width: `${displayPct}%`,
        }}
        transition={{ ease: "linear", duration: 0.25 }}
      />
    </div>
  );
}

function fmtTime(s: number): string {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

//  Single track row 

function TrackRow({
  track,
  index,
  isActive,
  isPaused,
  current,
  duration,
  onPlay,
  onSeek,
}: {
  track: MixtapeTrack;
  index: number;
  isActive: boolean;
  isPaused: boolean;
  current: number;
  duration: number;
  onPlay: () => void;
  onSeek: (pct: number) => void;
}) {
  return (
    <motion.li
      className={`tape${isActive ? " is-on" : ""}`}
      layout
      initial={false}
    >
      {/* Main row button */}
      <button className="tape__play" onClick={onPlay}>
        <span className="tape__num">{String(index + 1).padStart(2, "0")}</span>

        <span className="tape__title">
          <motion.span
            className="title"
            animate={isActive ? { color: "var(--vr-black)" } : {}}
          >
            {track.title}
          </motion.span>
          <span className="by">by {track.by}  {track.year}</span>
        </span>

        <span className="tape__meter">
          <VUMeter playing={isActive && !isPaused} />
        </span>

        <span className="tape__bpm">{track.bpm} BPM</span>
        <span className="tape__dur">{isActive ? fmtTime(current) : track.dur}</span>

        <span className="tape__ico">
          {isActive && !isPaused ? "■" : "▶"}
        </span>
      </button>

      {/* Expanded controls when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="controls"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "8px 18px 12px",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: ".14em",
            }}>
              {/* Genre tag */}
              <span style={{
                padding: "2px 8px",
                background: "var(--vr-black)",
                color: "var(--vr-yellow)",
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: ".18em",
                textTransform: "uppercase",
              }}>
                {track.genre}
              </span>

              {/* Time */}
              <span style={{ opacity: .6, fontFamily: "var(--term)", fontSize: 14 }}>
                {fmtTime(current)}
              </span>

              {/* Seekbar */}
              <ProgressBar current={current} duration={duration} onSeek={onSeek} />

              {/* Duration */}
              <span style={{ opacity: .6, fontFamily: "var(--term)", fontSize: 14 }}>
                {fmtTime(duration)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// Volume knob, same pattern as VR-303 Knob in Studio.tsx.

function VolumeKnob({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const drag = useRef<{ y: number; v: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, v: value };
    document.body.style.cursor = "ns-resize";
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const dy = drag.current.y - e.clientY;
      onChange(Math.max(0, Math.min(1, drag.current.v + dy / 180)));
    };
    const onUp = () => {
      if (drag.current) { drag.current = null; document.body.style.cursor = ""; }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onChange]);

  const angle = -135 + value * 270;
  return (
    <div
      className="knob-w"
      onPointerDown={onDown}
      role="slider"
      aria-label="Volume"
      aria-valuenow={Math.round(value * 100)}
      tabIndex={0}
    >
      <div className="knob-d">
        <div className="knob-rot" style={{ transform: `rotate(${angle}deg)` }}>
          <span className="knob-tick" style={{ background: "var(--vr-yellow)" }} />
        </div>
        <span className="knob-arc" />
      </div>
      <span className="knob-l">VOL</span>
      <span className="knob-v">{Math.round(value * 100).toString().padStart(2, "0")}</span>
    </div>
  );
}

// Static track list. Grove hashes are permanent, with no runtime fetch needed.

export const TRACKS: MixtapeTrack[] = [
  { id: "01", title: "Live at Amnesia Ibiza",        by: "DJ Alfredo",                    year: 1989, bpm: 125, dur: "61:09",   url: "https://api.grove.storage/d7c8f4cbdb0a0fb8658a74d33aa8ac3f7beb7ec0a1b6dcd65d660d1d4b57a10c", genre: "BALEARIC"     },
  { id: "02", title: "Live at Fantazia Summertime",  by: "Ratpack",                       year: 1992, bpm: 130, dur: "45:33",   url: "https://api.grove.storage/568134352938ec1583932f0ab24cdc621864c598ef9dc50052d99d432c07c296",  genre: "JUNGLE"       },
  { id: "03", title: "Live at Tribal Party",         by: "Daft Punk",                     year: 1997, bpm: 132, dur: "98:07",   url: "https://api.grove.storage/b67e08234651d84e635cc3fc3a37a48e9dc8e93aeb669397b21ec5223db59dbd",  genre: "FRENCH HOUSE" },
  { id: "04", title: "Live at Fuse In Festival",     by: "Richie Hawtin",                 year: 2005, bpm: 140, dur: "1:26:23", url: "https://api.grove.storage/0c71da80d1b02e54200a98625a5b1edabcce57770dbdcf97f2f518ad46a4e3bf",  genre: "TECHNO"       },
  { id: "05", title: "Live at Circoloco Ibiza DC10", by: "Tania Vulcano",                 year: 2006, bpm: 128, dur: "1:40:00", url: "https://api.grove.storage/0368f38ff0abaf653c4106e375c9d7abba15bcb69571b12e5ac12791713b764e",  genre: "MINIMAL"      },
  { id: "06", title: "Live at SynkLab",              by: "Gesaffelstein b2b The Hacker",  year: 2010, bpm: 132, dur: "2:12:27", url: "https://api.grove.storage/0d4ddbe6a252ec33e2b31a8781f3e4eece13108a5f731c0aab12a33899f75ac7",  genre: "DARK TECHNO"  },
  { id: "07", title: "Live at Netherlands",          by: "Avicii",                        year: 2011, bpm: 128, dur: "1:29:06", url: "https://api.grove.storage/0f617d51c8b872ee96f5877c5ef6a8594c8f7e7002d06855a499e4116c0ba4b1",  genre: "PROG HOUSE"   },
  { id: "08", title: "Live at France",               by: "Justice",                       year: 2012, bpm: 124, dur: "2:00:22", url: "https://api.grove.storage/f155714d8c54bb11c149b1b17071070ec81147ee4f2f298f5880150d27c4f682",  genre: "ELECTRO"      },
  { id: "09", title: "Live at NYC",                  by: "MSTRKRFT",                      year: 2014, bpm: 128, dur: "58:03",   url: "https://api.grove.storage/77c0f3810205a31eb7333ef9f06ba437bfd376faeb0a2b265dabbbfe3c0e3944",  genre: "FIDGET"       },
  { id: "10", title: "Live at UK",                   by: "My Nu Leng",                    year: 2015, bpm: 135, dur: "56:07",   url: "https://api.grove.storage/5a945bcedb81f39cc0947718abbc75d2cdc2ef63e5e29e8cb076a4850d4223cd",  genre: "UK BASS"      },
  { id: "11", title: "Live at NYC",                  by: "Sienna Sleep",                  year: 2020, bpm: 122, dur: "31:51",   url: "https://api.grove.storage/c018410e4d5ca6284f77634465d0c37fe5f92d06c46d70b9a09e588286f687f7",  genre: "HYPERTRANCE"  },
  { id: "12", title: "Live at Bangface Weekender",   by: "Evian Christ",                  year: 2022, bpm: 145, dur: "57:45",   url: "https://api.grove.storage/c51ff459d2f2c169ceb0a6320c405ea4f47891c5697482e8dbecaac3abd64018",  genre: "RAVE"         },
  { id: "13", title: "Skrillex b2b Jamie XX",        by: "Skrillex b2b Jamie XX",         year: 2025, bpm: 140, dur: "1:15:37", url: "https://api.grove.storage/d7e897a6b2eacb49ec1e8280382dd25198ceededa5db03f59f6e0058631f9aeb",  genre: "BASS"         },
  { id: "14", title: "Live at London",               by: "Fred again.. b2b T. Bangalter", year: 2026, bpm: 130, dur: "1:56:23", url: "https://api.grove.storage/92874419197836cac95e6d496f38bc38f86e785fffafe4b8b389f714fee06742",  genre: "ELECTRONIC"   },
];

//  Shared audio hook 

export interface MixtapeAudio {
  activeId: string | null;
  paused: boolean;
  current: number;
  duration: number;
  volume: number;
  activeTrack: MixtapeTrack | null;
  play: (track: MixtapeTrack) => void;
  togglePause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
}

export function useMixtapeAudio(): MixtapeAudio {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volume;
    audioRef.current = audio;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => { setActiveId(null); setPaused(false); setCurrent(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback((track: MixtapeTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (activeId === track.id) {
      if (paused) { audio.play(); setPaused(false); }
      else { audio.pause(); setPaused(true); }
      return;
    }
    audio.pause();
    audio.crossOrigin = "anonymous";
    audio.src = track.url;
    audio.load();
    audio.play().catch(console.warn);
    setActiveId(track.id);
    setPaused(false);
    setCurrent(0);
  }, [activeId, paused]);

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeId) return;
    if (paused) { audio.play(); setPaused(false); }
    else { audio.pause(); setPaused(true); }
  }, [activeId, paused]);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration)) return;
    const next = Math.max(0, Math.min(1, pct)) * audio.duration;
    audio.currentTime = next;
    setCurrent(next);
  }, []);

  const activeTrack = TRACKS.find(t => t.id === activeId) ?? null;

  const playNext = useCallback(() => {
    const idx = TRACKS.findIndex(t => t.id === activeId);
    const next = TRACKS[(idx + 1) % TRACKS.length];
    if (next) play(next);
  }, [activeId, play]);

  const playPrev = useCallback(() => {
    const idx = TRACKS.findIndex(t => t.id === activeId);
    const prev = TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length];
    if (prev) play(prev);
  }, [activeId, play]);

  return { activeId, paused, current, duration, volume, activeTrack, play, togglePause, playNext, playPrev, seek, setVolume };
}

//  Mixtape section 

export function MixtapeSection({
  bridgeRef,
  audio,
}: {
  bridgeRef: MutableRefObject<StudioBridge | null>;
  audio: MixtapeAudio;
}) {
  const { activeId, paused, current, duration, volume, play, seek, setVolume } = audio;
  const handleVolume = useCallback((v: number) => setVolume(v), [setVolume]);

  return (
    <section id="mixtape" className="mixtape">
      <div className="mixtape__head">
        <div>
          <div className="section-tag"><span className="square" /> SECTION  04 / MIXTAPE</div>
          <h2 className="section-title">play<em>a live</em> rave recordings</h2>
        </div>
        <p className="section-blurb">
          Play 14 live sets that we love, from 1989 to 2026. Each one is a unique moment in rave history, captured in all its raw, unpolished glory. Press play, then tune in and zone out.
        </p>
      </div>

      {TRACKS.length === 0 ? (
        <div style={{
          fontFamily: "var(--mono)",
          fontSize: 12,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          opacity: .55,
          padding: "28px 0",
          borderTop: "1.5px solid var(--vr-black)",
        }}>
          <div>// NO TRACKS FOUND</div>
          <div style={{ marginTop: 6 }}>run npm run upload:grove to rebuild the Grove manifest</div>
        </div>
      ) : (
        <motion.ol className="mixtape__list" layout>
          {TRACKS.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              index={i}
              isActive={activeId === t.id}
              isPaused={paused}
              current={activeId === t.id ? current : 0}
              duration={activeId === t.id ? duration : 0}
              onPlay={() => play(t)}
              onSeek={seek}
            />
          ))}
        </motion.ol>
      )}

      {/* Global now-playing bar, appears when a track is active */}
      <AnimatePresence>
        {activeId && (
          <motion.div
            key="nowplaying"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              marginTop: 18,
              padding: "10px 18px",
              background: "var(--vr-black)",
              color: "var(--vr-yellow)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: ".16em",
              textTransform: "uppercase",
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
               REC
            </motion.span>
            <span style={{ fontFamily: "var(--display)", fontSize: 14, letterSpacing: 0 }}>
              {audio.activeTrack?.title}
            </span>
            <span style={{ opacity: .6 }}>
              {audio.activeTrack?.by}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--term)", fontSize: 18 }}>
              {fmtTime(current)} / {fmtTime(duration)}
            </span>
            <VolumeKnob value={volume} onChange={handleVolume} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
