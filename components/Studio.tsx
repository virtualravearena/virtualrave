"use client";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  MutableRefObject,
} from "react";
import {
  Synth303Engine,
  SynthParams,
  Step,
  Track,
  exportPatternAsMidi,
} from "@/lib/synth303";
import { exportPatternAsWav, exportRecordedTakeAsWav } from "@/lib/audioExport";
import { generatePattern, getPatternSignature } from "@/lib/patternGenerator";
import { MIDI_PATTERNS, MIDI_PATTERN_MAP, MidiPattern } from "@/lib/midiPatterns";

// ---------------------------------------------------------------------------
// Tutorial content
// ---------------------------------------------------------------------------
const TUTORIAL_STEPS: { target: string; title: string; body: string; placement?: "top" | "bottom" }[] = [
  { target: "transport",   title: "TRANSPORT",         body: "Press RUN to start. Use minus or plus to set BPM. RUN starts the loop now.", placement: "bottom" },
  { target: "presets",     title: "MIDI BANK",         body: "Load one of your 10 acid patterns. Click a name to hear it.", placement: "bottom" },
  { target: "piano",       title: "PIANO  NOTE PICKER", body: "Pick from 13 keys. The key you click changes the selected step.", placement: "bottom" },
  { target: "steps",       title: "16-STEP ROW",       body: "Click a step to select it. Click it again to cycle octave 1, 2, 3, 4, then mute.", placement: "top" },
  { target: "accentslide", title: "ACCENT + SLIDE",    body: "ACCENT adds volume and filter bite. SLIDE bends into the next note. Toggle each step.", placement: "top" },
  { target: "knobs",       title: "FILTER KNOBS",      body: "Drag up or down. CUTOFF opens the filter. RESONANCE adds bite. ENVMOD shapes the sweep. DECAY sets length.", placement: "top" },
  { target: "export",      title: "EXPORT MIDI",       body: "Download a .MID file. Drop it into Ableton, FL Studio, Logic, or any DAW.", placement: "top" },
];

const TUTORIAL_SKIP_KEY = "vr303-tutorial-skip";

// ---------------------------------------------------------------------------
// Knob
// ---------------------------------------------------------------------------
function Knob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const drag = useRef<{ y: number; v: number; id: number } | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { y: e.clientY, v: value, id: e.pointerId };
    document.body.style.cursor = "ns-resize";
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
    e.stopPropagation();
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    e.preventDefault();
    onChange(Math.max(0, Math.min(1, drag.current.v + (drag.current.y - e.clientY) / 180)));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    drag.current = null;
    document.body.style.cursor = "";
  };

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const stop = (e: TouchEvent) => {
      if (drag.current) e.preventDefault();
    };
    el.addEventListener("touchstart", stop, { passive: false });
    el.addEventListener("touchmove", stop, { passive: false });
    return () => {
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("touchmove", stop);
    };
  }, []);

  const angle = -135 + value * 270;
  return (
    <div
      ref={elRef}
      className="knob-w"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="slider"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      tabIndex={0}
    >
      <div className="knob-d">
        <div className="knob-rot" style={{ transform: `rotate(${angle}deg)` }}>
          <span className="knob-tick" style={{ background: "var(--vr-yellow)" }} />
        </div>
        <span className="knob-arc" />
      </div>
      <span className="knob-l">{label}</span>
      <span className="knob-v">{Math.round(value * 100).toString().padStart(2, "0")}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KeyboardLegend, stateless single-octave piano keyboard.
// Click a key to assign that note to the CURRENTLY SELECTED step.
// ---------------------------------------------------------------------------

const LEGEND_WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B", "C"];
// Black keys positioned by index of the white key they sit BETWEEN.
// e.g. C# sits between white index 0 (C) and 1 (D).
const LEGEND_BLACK_KEYS: { label: string; afterWhite: number }[] = [
  { label: "C#", afterWhite: 0 },
  { label: "D#", afterWhite: 1 },
  { label: "F#", afterWhite: 3 },
  { label: "G#", afterWhite: 4 },
  { label: "A#", afterWhite: 5 },
];

// Semitone offsets from low C for each key position:
// white keys: C=0, D=2, E=4, F=5, G=7, A=9, B=11, C(high)=12
// black keys: C#=1, D#=3, F#=6, G#=8, A#=10
const WHITE_KEY_INDICES = [0, 2, 4, 5, 7, 9, 11, 12];
const BLACK_KEY_INDICES = [1, 3, 6, 8, 10];
const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C"];

interface KeyboardLegendProps {
  onKeyClick: (keyIdx: number) => void;
}

function KeyboardLegend({ onKeyClick }: KeyboardLegendProps) {
  const whiteCount = LEGEND_WHITE_KEYS.length; // 8
  return (
    <div className="tb303__keyboard" data-tut="piano">
      <div className="tb303__keyboard-whites">
        {LEGEND_WHITE_KEYS.map((label, i) => (
          <button
            key={`w${i}`}
            type="button"
            className="tb303__key tb303__key--w"
            onClick={() => onKeyClick(WHITE_KEY_INDICES[i])}
          >
            <span className="tb303__key-label">{label}</span>
          </button>
        ))}
      </div>
      <div className="tb303__keyboard-blacks">
        {LEGEND_BLACK_KEYS.map((b, i) => (
          <button
            key={`b${i}`}
            type="button"
            className="tb303__key tb303__key--b"
            style={{ left: `${((b.afterWhite + 1) / whiteCount) * 100}%` }}
            onClick={() => onKeyClick(BLACK_KEY_INDICES[i])}
          >
            <span className="tb303__key-label">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepRow, 16 numbered step buttons. Click selects; click again cycles octave.
// Pitch is set via the piano above. Keep only LED and step number in the row.
// ---------------------------------------------------------------------------

interface StepRowProps {
  pattern: Step[];
  cur: number;
  selected: number;
  onSelect: (i: number) => void;
}

function StepRow({ pattern, cur, selected, onSelect }: StepRowProps) {
  return (
    <div className="tb303__grid" data-tut="steps">
      <div className="tb303__rowlabel">STEP</div>
      <div className="tb303__steps">
        {pattern.map((s, i) => {
          const oct = s.on ? (parseInt(s.note.replace(/^[A-G]#?/, ""), 10) || 0) : 0;
          return (
            <button
              key={i}
              className={[
                "step",
                s.on ? "on" : "",
                s.on ? `oct-${oct}` : "",
                i === cur ? "cur" : "",
                i === selected ? "sel" : "",
                s.accent ? "acc" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => onSelect(i)}
              title={s.on ? `step ${i + 1}  ${s.note}` : `step ${i + 1}  empty`}
            >
              <span className="step-led" />
              <span className="step-idx">{(i + 1).toString().padStart(2, "0")}</span>
              {s.on && <span className="step-oct">{oct}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AccentSlideRows, accent and slide mini-button rows.
// ---------------------------------------------------------------------------

interface AccentSlideRowsProps {
  pattern: Step[];
  onAccent: (i: number) => void;
  onSlide: (i: number) => void;
}

function AccentSlideRows({ pattern, onAccent, onSlide }: AccentSlideRowsProps) {
  return (
    <div className="tb303__grid" data-tut="accentslide">
      <div className="tb303__rowlabel">ACCENT</div>
      <div className="tb303__steps tb303__steps--mini">
        {pattern.map((s, i) => (
          <button key={i} className={`mini${s.accent ? " on" : ""}`} onClick={() => onAccent(i)}>
            <span>A</span>
          </button>
        ))}
      </div>
      <div className="tb303__rowlabel">SLIDE</div>
      <div className="tb303__steps tb303__steps--mini">
        {pattern.map((s, i) => (
          <button key={i} className={`mini${s.slide ? " on" : ""}`} onClick={() => onSlide(i)}>
            <span></span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tutorial, spotlight coachmark overlay. Each step highlights one control.
// The spotlit element is clickable; the rest of the page is darkened by
// four positioned overlays around it (so clicks pass through the gap).
// ---------------------------------------------------------------------------

function Tutorial({ onClose }: { onClose: (dontShowAgain: boolean) => void }) {
  const [idx, setIdx] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const step = TUTORIAL_STEPS[idx];
  const last = idx === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-tut="${step.target}"]`) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      const pad = 8;
      setRect({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
      // make sure the highlighted control is on screen
      if (r.top < 0 || r.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    measure();
    // re-measure on resize and after a tick for scroll-into-view to settle
    const t = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step.target]);

  const close = () => onClose(dontShow);

  if (!rect) {
    // fallback: full backdrop with centered tooltip if target not found
    return (
      <div className="vr-coach">
        <div className="vr-coach__shade vr-coach__shade--full" onClick={close} />
        <div className="vr-coach__tip vr-coach__tip--center">
          <CoachContent step={step} idx={idx} total={TUTORIAL_STEPS.length} last={last} dontShow={dontShow} setDontShow={setDontShow} onBack={() => setIdx(i => Math.max(0, i - 1))} onNext={() => setIdx(i => i + 1)} onClose={close} />
        </div>
      </div>
    );
  }

  // Position tooltip above or below the spotlight based on `placement`
  const placement = step.placement ?? "bottom";
  const tipStyle: React.CSSProperties = placement === "bottom"
    ? { top: rect.top + rect.height + 16, left: Math.max(16, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - 416)) }
    : { top: Math.max(16, rect.top - 16), left: Math.max(16, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - 416)), transform: "translateY(-100%)" };

  return (
    <div className="vr-coach">
      {/* Four shades around the spotlight, leaving the hole clickable */}
      <div className="vr-coach__shade" style={{ top: 0, left: 0, width: "100vw", height: rect.top }} onClick={close} />
      <div className="vr-coach__shade" style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }} onClick={close} />
      <div className="vr-coach__shade" style={{ top: rect.top, left: rect.left + rect.width, width: `calc(100vw - ${rect.left + rect.width}px)`, height: rect.height }} onClick={close} />
      <div className="vr-coach__shade" style={{ top: rect.top + rect.height, left: 0, width: "100vw", height: `calc(100vh - ${rect.top + rect.height}px)` }} onClick={close} />

      {/* Glow ring around the spotlight */}
      <div
        className="vr-coach__ring"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
      />

      {/* Tooltip */}
      <div className="vr-coach__tip" style={tipStyle}>
        <CoachContent step={step} idx={idx} total={TUTORIAL_STEPS.length} last={last} dontShow={dontShow} setDontShow={setDontShow} onBack={() => setIdx(i => Math.max(0, i - 1))} onNext={() => setIdx(i => i + 1)} onClose={close} />
      </div>
    </div>
  );
}

function CoachContent({ step, idx, total, last, dontShow, setDontShow, onBack, onNext, onClose }: {
  step: { title: string; body: string };
  idx: number;
  total: number;
  last: boolean;
  dontShow: boolean;
  setDontShow: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="vr-coach__head">
        <span className="vr-coach__num">{(idx + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}</span>
        <button className="vr-coach__x" onClick={onClose} aria-label="close"></button>
      </div>
      <h3 className="vr-coach__title">{step.title}</h3>
      <p className="vr-coach__body">{step.body}</p>
      <div className="vr-coach__foot">
        <label className="vr-coach__skip">
          <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} />
          <span>DON'T SHOW AGAIN</span>
        </label>
        <div className="vr-coach__nav">
          <button className="vr-coach__btn" onClick={onBack} disabled={idx === 0}> BACK</button>
          {last
            ? <button className="vr-coach__btn vr-coach__btn--primary" onClick={onClose}>GOT IT</button>
            : <button className="vr-coach__btn vr-coach__btn--primary" onClick={onNext}>NEXT </button>}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// padOrTruncate, normalize any incoming pattern to the 16-step sequencer.
// ---------------------------------------------------------------------------
const padOrTruncate = (p: Step[]): Step[] => {
  const out = p.slice(0, 16).map(s => ({ ...s }));
  while (out.length < 16) out.push({ on: false, note: "C3", accent: false, slide: false });
  return out;
};

const clonePattern = (p: Step[]): Step[] => padOrTruncate(p).map(s => ({ ...s }));

type TakeEvent = {
  t: number;
  kind: "transport" | "edit" | "bpm" | "knob" | "preset";
  detail: string;
};

type TakeSnapshot = {
  pattern: Step[];
  bpm: number;
  knobs: SynthParams;
  events: TakeEvent[];
  durationMs: number;
};

const pickMidiPattern = (seed?: string): MidiPattern => {
  if (seed && MIDI_PATTERN_MAP[seed]) return MIDI_PATTERN_MAP[seed];

  const numericSeed = seed ? parseInt(seed.replace(/\D/g, ""), 10) : NaN;
  if (Number.isFinite(numericSeed)) {
    return MIDI_PATTERNS[(numericSeed - 1 + MIDI_PATTERNS.length) % MIDI_PATTERNS.length];
  }

  return MIDI_PATTERNS[Math.floor(Math.random() * MIDI_PATTERNS.length)];
};

// ---------------------------------------------------------------------------
// StudioBridge
// ---------------------------------------------------------------------------
export interface StudioBridge {
  loadTrack: (track: Track) => void;
  loadTrackWithPattern: (track: Track, pattern: Step[]) => void;
  stop: () => void;
  isPlaying: () => boolean;
  activeTrack: () => string;
}

// ---------------------------------------------------------------------------
// TB303Sequencer
// ---------------------------------------------------------------------------
export function TB303Sequencer({ bridgeRef }: { bridgeRef: MutableRefObject<StudioBridge | null> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<Synth303Engine | null>(null);
  const initial = useMemo<Step[]>(() => clonePattern(MIDI_PATTERNS[0].pattern), []);

  const [pattern, setPattern] = useState<Step[]>(initial);
  const [cur, setCur] = useState(-1);
  const [selectedStep, setSelectedStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordPhase, setRecordPhase] = useState<"idle" | "counting" | "recording" | "stopped">("idle");
  const [recordCountdown, setRecordCountdown] = useState<number | null>(null);
  const [recordElapsedMs, setRecordElapsedMs] = useState(0);
  const [bpm, setBpm] = useState(MIDI_PATTERNS[0].bpm);
  const [activeTrack, setActiveTrack] = useState(MIDI_PATTERNS[0].id);
  const [knobs, setKnobs] = useState({ cutoff: 0.48, res: 0.78, envMod: 0.65, decay: 0.55 });

  const [showTutorial, setShowTutorial] = useState(false);
  const recordingRef = useRef(false);
  const patternRef = useRef<Step[]>(initial);
  const bpmRef = useRef(MIDI_PATTERNS[0].bpm);
  const knobsRef = useRef<SynthParams>({ cutoff: 0.48, res: 0.78, envMod: 0.65, decay: 0.55 });
  const takeStartedAtRef = useRef<number | null>(null);
  const takeEventsRef = useRef<{ t: number; kind: "transport" | "edit" | "bpm" | "knob" | "preset"; detail: string }[]>([]);
  const lastTakeRef = useRef<{ t: number; kind: "transport" | "edit" | "bpm" | "knob" | "preset"; detail: string }[]>([]);
  const recentGeneratedSignaturesRef = useRef<string[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const takeStartSnapshotRef = useRef<Omit<TakeSnapshot, "events" | "durationMs"> | null>(null);
  const lastTakeSnapshotRef = useRef<TakeSnapshot | null>(null);
  const lastTakeDurationMsRef = useRef(0);
  const takeStartedWallClockRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(TUTORIAL_SKIP_KEY) === "1") return;

    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShowTutorial(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const closeTutorial = (dontShowAgain: boolean) => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(TUTORIAL_SKIP_KEY, "1");
    }
    setShowTutorial(false);
  };

  useEffect(() => { synthRef.current = new Synth303Engine(); return () => { synthRef.current?.stop(); }; }, []);
  useEffect(() => { if (synthRef.current) synthRef.current.onStep = i => setCur(i); }, []);
  useEffect(() => { patternRef.current = pattern; synthRef.current?.setPattern(pattern); }, [pattern]);
  useEffect(() => { bpmRef.current = bpm; synthRef.current?.setBpm(bpm); }, [bpm]);
  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearTimeout(recordTimerRef.current);
      if (recordTickRef.current) clearInterval(recordTickRef.current);
      if (stopFlashTimerRef.current) clearTimeout(stopFlashTimerRef.current);
    };
  }, []);
  useEffect(() => {
    const s = synthRef.current; if (!s) return;
    knobsRef.current = knobs;
    s.setParam("cutoff", knobs.cutoff); s.setParam("res", knobs.res);
    s.setParam("envMod", knobs.envMod); s.setParam("decay", knobs.decay);
  }, [knobs]);

  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const formatDuration = useCallback((ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const pushTakeEvent = useCallback((kind: TakeEvent["kind"], detail: string) => {
    if (!recordingRef.current) return;
    const startedAt = takeStartedAtRef.current ?? now();
    if (takeStartedAtRef.current === null) takeStartedAtRef.current = startedAt;
    takeEventsRef.current.push({ t: Math.max(0, now() - startedAt), kind, detail });
  }, []);

  const startRecording = useCallback(() => {
    if (recordTimerRef.current) clearTimeout(recordTimerRef.current);
    if (recordTickRef.current) clearInterval(recordTickRef.current);
    if (stopFlashTimerRef.current) clearTimeout(stopFlashTimerRef.current);

    setRecording(false);
    setRecordPhase("counting");
    setRecordCountdown(5);
    setRecordElapsedMs(0);
    takeStartedAtRef.current = null;
    takeStartedWallClockRef.current = null;
    takeStartSnapshotRef.current = null;
    takeEventsRef.current = [];
    lastTakeDurationMsRef.current = 0;

    let count = 5;
    const tick = () => {
      setRecordCountdown(count);
      if (count <= 1) {
        recordTimerRef.current = setTimeout(() => {
          takeStartedAtRef.current = now();
          takeStartedWallClockRef.current = Date.now();
          takeStartSnapshotRef.current = {
            pattern: clonePattern(patternRef.current),
            bpm: bpmRef.current,
            knobs: { ...knobsRef.current },
          };
          takeEventsRef.current = [];
          recordingRef.current = true;
          setRecording(true);
          setRecordPhase("recording");
          setRecordCountdown(null);
          setRecordElapsedMs(0);
          recordTickRef.current = setInterval(() => {
            if (takeStartedWallClockRef.current === null) return;
            setRecordElapsedMs(Date.now() - takeStartedWallClockRef.current);
          }, 250);
          pushTakeEvent("transport", "record");
        }, 1000);
        return;
      }
      count -= 1;
      recordTimerRef.current = setTimeout(tick, 1000);
    };

    tick();
  }, []);

  const finishRecording = useCallback((reason: string) => {
    if (recordTimerRef.current) {
      clearTimeout(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (recordTickRef.current) {
      clearInterval(recordTickRef.current);
      recordTickRef.current = null;
    }
    if (stopFlashTimerRef.current) {
      clearTimeout(stopFlashTimerRef.current);
      stopFlashTimerRef.current = null;
    }

    if (recordPhase === "counting") {
      setRecordPhase("stopped");
      setRecordCountdown(null);
      setRecordElapsedMs(0);
      stopFlashTimerRef.current = setTimeout(() => setRecordPhase("idle"), 1200);
      return;
    }

    if (!recordingRef.current && takeEventsRef.current.length === 0) return;
    if (takeStartedWallClockRef.current !== null) {
      lastTakeDurationMsRef.current = Date.now() - takeStartedWallClockRef.current;
    }
    if (recordingRef.current) {
      pushTakeEvent("transport", reason);
      lastTakeRef.current = takeEventsRef.current.slice();
      const startSnapshot = takeStartSnapshotRef.current ?? {
        pattern: clonePattern(patternRef.current),
        bpm: bpmRef.current,
        knobs: { ...knobsRef.current },
      };
      lastTakeSnapshotRef.current = {
        ...startSnapshot,
        events: takeEventsRef.current.slice(),
        durationMs: lastTakeDurationMsRef.current,
      };
    } else {
      // Preserve the last completed take snapshot when exporting or finishing
      // after the take has already stopped, so we don't overwrite it with
      // later edits to the current pattern.
      lastTakeRef.current = takeEventsRef.current.slice();
    }
    takeStartedAtRef.current = null;
    takeStartedWallClockRef.current = null;
    takeStartSnapshotRef.current = null;
    recordingRef.current = false;
    setRecording(false);
    setRecordPhase("stopped");
    setRecordCountdown(null);
    setRecordElapsedMs(lastTakeDurationMsRef.current);
    stopFlashTimerRef.current = setTimeout(() => setRecordPhase("idle"), 1200);
  }, [pushTakeEvent, recordPhase]);

  const togglePlay = useCallback(() => {
    const s = synthRef.current; if (!s) return;
    if (playing) {
      s.stop();
      setPlaying(false);
      setCur(-1);
      finishRecording("stop");
      return;
    }

    if (recordingRef.current && takeStartedAtRef.current === null) {
      takeStartedAtRef.current = now();
      takeEventsRef.current = [];
    }

    pushTakeEvent("transport", "play");
    s.play();
    setPlaying(true);
  }, [playing, finishRecording, pushTakeEvent]);

  const toggleRecord = useCallback(() => {
    if (recordPhase === "counting") {
      finishRecording("record");
      return;
    }
    if (recordingRef.current || recordPhase === "recording") {
      finishRecording("record");
      return;
    }
    startRecording();
  }, [finishRecording, recordPhase, startRecording]);

  const setTrackedBpm = useCallback((next: number) => {
    setBpm(next);
    pushTakeEvent("bpm", String(next));
  }, [pushTakeEvent]);

  const randomize = useCallback(() => {
    const generated = generatePattern(undefined, recentGeneratedSignaturesRef.current);
    const signature = getPatternSignature(generated);
    recentGeneratedSignaturesRef.current = [...recentGeneratedSignaturesRef.current.slice(-12), signature];
    setPattern(generated);
    setActiveTrack("generated");
    pushTakeEvent("preset", "generated");
  }, [pushTakeEvent]);

  const exportMidi = useCallback(() => {
    const blob = exportPatternAsMidi(pattern, bpm, activeTrack);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `virtual-rave-303-${activeTrack}-${bpm}bpm-${new Date().toISOString().slice(0, 10)}.mid`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }, [pattern, bpm, activeTrack]);

  const exportWav = useCallback(async () => {
    finishRecording("export");
    const snapshot = lastTakeSnapshotRef.current;
    const blob = snapshot
      ? await exportRecordedTakeAsWav(
          snapshot.pattern,
          snapshot.bpm,
          snapshot.knobs,
          snapshot.events,
          snapshot.durationMs,
          { tailSeconds: 0 },
        )
      : await exportPatternAsWav(pattern, bpm, knobs, { tailSeconds: 0 });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const exportBpm = snapshot?.bpm ?? bpm;
    a.download = `virtual-rave-303-${activeTrack}-${exportBpm}bpm-${new Date().toISOString().slice(0, 10)}.wav`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }, [activeTrack, bpm, finishRecording, knobs, pattern]);

  useEffect(() => {
    if (!bridgeRef) return;
    bridgeRef.current = {
      loadTrack: (track) => {
        const source = pickMidiPattern(track.id);
        setPattern(clonePattern(source.pattern)); setBpm(source.bpm);
        setKnobs({ cutoff: track.cutoff, res: track.res, envMod: track.envMod, decay: track.decay });
        setActiveTrack(source.id);
        pushTakeEvent("preset", source.id);
        if (!playing) { synthRef.current?.play(); setPlaying(true); }
      },
      loadTrackWithPattern: (track, pat) => {
        setPattern(padOrTruncate(pat)); setBpm(track.bpm);
        setKnobs({ cutoff: track.cutoff, res: track.res, envMod: track.envMod, decay: track.decay });
        setActiveTrack(track.id);
        pushTakeEvent("preset", track.id);
        if (!playing) { synthRef.current?.play(); setPlaying(true); }
      },
      stop: () => { synthRef.current?.stop(); setPlaying(false); setCur(-1); finishRecording("stop"); },
      isPlaying: () => playing,
      activeTrack: () => activeTrack,
    };
  }, [bridgeRef, playing, activeTrack, finishRecording, pushTakeEvent]);

  // Piano key click  assign note letter to the currently selected step.
  const pressKey = (keyIdx: number) => {
    pushTakeEvent("edit", `key:${KEY_NAMES[keyIdx]}`);
    setPattern(p => {
      const np = p.map(s => ({ ...s }));
      const s = np[selectedStep];
      const keyName = KEY_NAMES[keyIdx];
      if (s.on) {
        // Step already on. Replace note letter and keep octave.
        const oct = parseInt(s.note.replace(/^[A-G]#?/, ""), 10) || 3;
        s.note = `${keyName}${oct}`;
      } else {
        // Step was muted. Turn on at octave 3.
        s.on = true;
        s.note = `${keyName}3`;
      }
      return np;
    });
  };

  // Step click selects. Re-click cycles octave 1, 2, 3, 4, then mute.
  const selectStep = (i: number) => {
    if (i !== selectedStep) {
      setSelectedStep(i);
      pushTakeEvent("edit", `select:${i + 1}`);
      return;
    }
    // Re-clicked the same selected step. Cycle octave or mute.
    setPattern(p => {
      const np = p.map(s => ({ ...s }));
      const s = np[i];
      if (!s.on) {
        // Muted. Re-arm at octave 1 and keep prior note letter.
        const keyName = s.note.replace(/\d+$/, "") || "C";
        s.on = true;
        s.note = `${keyName}1`;
        return np;
      }
      const currentOct = parseInt(s.note.replace(/^[A-G]#?/, ""), 10);
      const keyName = s.note.replace(/\d+$/, "");
      if (currentOct >= 4) {
        s.on = false;
        s.accent = false;
        s.slide = false;
      } else {
        s.note = `${keyName}${currentOct + 1}`;
      }
      return np;
    });
    pushTakeEvent("edit", `cycle:${i + 1}`);
  };

  const toggleAccent = (i: number) => {
    setPattern(p => { const np = p.map(s => ({ ...s })); np[i].accent = !np[i].accent; return np; });
    pushTakeEvent("edit", `accent:${i + 1}`);
  };
  const toggleSlide  = (i: number) => {
    setPattern(p => { const np = p.map(s => ({ ...s })); np[i].slide  = !np[i].slide;  return np; });
    pushTakeEvent("edit", `slide:${i + 1}`);
  };

  const presets = MIDI_PATTERNS.map(p => ({ id: p.id, l: p.title.toUpperCase() }));

  const loadPreset = (id: string) => {
    const source = MIDI_PATTERN_MAP[id] ?? MIDI_PATTERNS[0];
    setPattern(clonePattern(source.pattern));
    setTrackedBpm(source.bpm);
    setActiveTrack(source.id);
    pushTakeEvent("preset", source.id);
  };

  return (
    <div className="tb303" ref={rootRef}>
      <div className="tb303__bar">
        <div className="tb303__brand">
          <span className="dot" />
          <span className="brand-l">VR<sup></sup>303</span>
          <span className="brand-r">COMPUTER CONTROLLED / BASSLINE</span>
          <button
            className="tb303__help"
            onClick={() => setShowTutorial(true)}
            aria-label="show tutorial"
            title="show tutorial"
          >
            ?
          </button>
        </div>
        <div className="tb303__presets" data-tut="presets">
          {presets.map(p => (
            <button key={p.id} className={`preset${activeTrack === p.id ? " is-on" : ""}`} onClick={() => loadPreset(p.id)}>{p.l}</button>
          ))}
        </div>
      </div>

      <div className="tb303__transport" data-tut="transport">
        <button className={`tb303__play${playing ? " is-on" : ""}`} onClick={togglePlay} aria-label="play / stop">
          <span className="ico">{playing ? "" : ""}</span>
          <span className="lbl">{playing ? "STOP" : "RUN"}</span>
        </button>
        <button
          className={`tb303__export tb303__record${recording || recordPhase === "counting" ? " is-on" : ""}`}
          onClick={toggleRecord}
          aria-pressed={recording || recordPhase === "counting"}
          aria-label="record performance"
          title="record performance"
        >
          <span className="ico"></span>
          <span className="lbl">
            {recordPhase === "counting"
              ? recordCountdown?.toString() ?? "REC"
              : recordPhase === "recording"
                ? "STOP"
                : recordPhase === "stopped"
                  ? "DONE"
                  : "RECORD"}
          </span>
          <span className="sub">
            {recordPhase === "counting"
              ? "COUNT"
              : recordPhase === "recording"
                ? formatDuration(recordElapsedMs)
                : recordPhase === "stopped"
                  ? formatDuration(recordElapsedMs || lastTakeDurationMsRef.current)
                  : "TAKE"}
          </span>
        </button>
        <div className="tb303__bpm">
          <span className="k">TEMPO</span>
          <div className="bpm-ctl">
            <button onClick={() => setTrackedBpm(Math.max(60, bpm - 1))}></button>
            <span className="bpm-v">{bpm}</span>
            <button onClick={() => setTrackedBpm(Math.min(220, bpm + 1))}>+</button>
          </div>
          <span className="k">BPM</span>
        </div>
        <button className="tb303__export" onClick={exportMidi} title="download .mid" data-tut="export">
          <span className="ico"></span><span className="lbl">EXPORT</span><span className="sub">.MID</span>
        </button>
        <button className="tb303__export" onClick={() => void exportWav()} title="download .wav">
          <span className="ico"></span><span className="lbl">EXPORT</span><span className="sub">WAV</span>
        </button>
        <button className="tb303__export tb303__random" onClick={randomize} title="randomize pattern">
          <span className="ico"></span><span className="lbl">RANDOM</span><span className="sub">PATT</span>
        </button>
      </div>

      <div className="tb303__body">
        <KeyboardLegend onKeyClick={pressKey} />
        <StepRow pattern={pattern} cur={cur} selected={selectedStep} onSelect={selectStep} />
        <AccentSlideRows pattern={pattern} onAccent={toggleAccent} onSlide={toggleSlide} />

        <div className="tb303__knobs" data-tut="knobs">
          <Knob label="CUTOFF"    value={knobs.cutoff}  onChange={v => { setKnobs(k => ({ ...k, cutoff: v })); pushTakeEvent("knob", `cutoff:${v.toFixed(3)}`); }} />
          <Knob label="RESONANCE" value={knobs.res}      onChange={v => { setKnobs(k => ({ ...k, res: v })); pushTakeEvent("knob", `res:${v.toFixed(3)}`); }} />
          <Knob label="ENVMOD"   value={knobs.envMod}  onChange={v => { setKnobs(k => ({ ...k, envMod: v })); pushTakeEvent("knob", `envMod:${v.toFixed(3)}`); }} />
          <Knob label="DECAY"     value={knobs.decay}   onChange={v => { setKnobs(k => ({ ...k, decay: v })); pushTakeEvent("knob", `decay:${v.toFixed(3)}`); }} />
        </div>
      </div>

      <div className="tb303__foot">
        <span> SELECT STEP  CLICK PIANO KEY TO SET NOTE</span>
        <span>RE-CLICK STEP: OCT 1 TO 4, THEN MUTE</span>
        <span>EXPORT MIDI  TAKE IT TO ABLETON</span>
      </div>

      {showTutorial && <Tutorial onClose={closeTutorial} />}
    </div>
  );
}
