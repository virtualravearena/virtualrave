// VR-303 synth engine. TypeScript module with no window globals at module scope.

export interface Step {
  on: boolean;
  note: string;
  accent: boolean;
  slide: boolean;
}

export interface Track {
  id: string;
  title: string;
  by: string;
  dur: string;
  bpm: number;
  cutoff: number;
  res: number;
  envMod: number;
  decay: number;
  year: number;
}

export interface SynthParams {
  cutoff: number;
  res: number;
  envMod: number;
  decay: number;
}

export interface SynthGraph {
  osc: OscillatorNode;
  subOsc: OscillatorNode;
  subGain: GainNode;
  filter: BiquadFilterNode;
  amp: GainNode;
  master: GainNode;
  shaper: WaveShaperNode;
  delay: DelayNode;
  feedback: GainNode;
  wet: GainNode;
}

export const DEFAULT_SYNTH_PARAMS: SynthParams = {
  cutoff: 0.48,
  res: 0.78,
  envMod: 0.65,
  decay: 0.55,
};

export function noteToFreq(note: string): number {
  const map: Record<string, number> = {
    C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4, "F#": -3,
    G: -2, "G#": -1, A: 0, "A#": 1, B: 2,
  };
  const m = note.match(/^([A-G]#?)(\d+)$/);
  if (!m) return 440;
  const semis = map[m[1]] + (parseInt(m[2], 10) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

export function makeSoftClipCurve(amount: number): Float32Array {
  const k = amount;
  const N = 1024;
  const c = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = (i * 2) / N - 1;
    c[i] = (((3 + k) * x) / (3 + k * Math.abs(x))) * 0.65;
  }
  return c;
}

export const EMPTY_PATTERN: Step[] = Array.from({ length: 16 }, () => ({
  on: false,
  note: "C3",
  accent: false,
  slide: false,
}));

export function getStepDuration(bpm: number): number {
  return 60 / Math.max(60, Math.min(220, bpm)) / 4;
}

export function buildSynthGraph(
  ctx: AudioContext | OfflineAudioContext,
  bpm: number,
  params: SynthParams = DEFAULT_SYNTH_PARAMS,
  startAt: number = 0,
): SynthGraph {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = noteToFreq("C2");

  const subOsc = ctx.createOscillator();
  subOsc.type = "square";
  subOsc.frequency.value = noteToFreq("C1");

  const subGain = ctx.createGain();
  subGain.gain.value = 0.14;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  filter.Q.value = 14;

  const amp = ctx.createGain();
  amp.gain.value = 0.0008;

  const master = ctx.createGain();
  master.gain.value = 0.48;

  const shaper = ctx.createWaveShaper();
  shaper.curve = makeSoftClipCurve(5) as unknown as Float32Array<ArrayBuffer>;
  shaper.oversample = "2x";

  const delay = ctx.createDelay();
  delay.delayTime.value = getStepDuration(bpm) * 1.5;

  const feedback = ctx.createGain();
  feedback.gain.value = 0.22;

  const wet = ctx.createGain();
  wet.gain.value = 0.18;

  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(shaper);
  osc.connect(filter);
  subOsc.connect(subGain).connect(filter);
  filter.connect(amp).connect(master);
  master.connect(delay);
  master.connect(shaper);
  shaper.connect(ctx.destination);

  osc.start(startAt);
  subOsc.start(startAt);

  return {
    osc,
    subOsc,
    subGain,
    filter,
    amp,
    master,
    shaper,
    delay,
    feedback,
    wet,
  };
}

function applyStepToGraph(
  graph: SynthGraph,
  params: SynthParams,
  step: Step,
  next: Step | undefined,
  time: number,
  stepDur: number,
): void {
  if (!step.on) return;
  const slide = step.slide && !!next?.on;
  const dur = slide ? stepDur * 1.95 : next?.on ? stepDur * 0.98 : stepDur * 0.9;
  const f0 = noteToFreq(step.note);
  const f1 = slide && next ? noteToFreq(next.note) : f0;

  graph.osc.frequency.cancelScheduledValues(time);
  graph.subOsc.frequency.cancelScheduledValues(time);
  graph.osc.frequency.setTargetAtTime(f0, time, 0.004);
  graph.subOsc.frequency.setTargetAtTime(f0 * 0.5, time, 0.004);
  if (slide) {
    const slideAt = time + dur * 0.35;
    graph.osc.frequency.setValueAtTime(f0, slideAt);
    graph.osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), time + dur);
    graph.subOsc.frequency.setValueAtTime(f0 * 0.5, slideAt);
    graph.subOsc.frequency.exponentialRampToValueAtTime(
      Math.max(20, f1 * 0.5),
      time + dur,
    );
  }

  const Q = 4 + params.res * 26;
  graph.filter.Q.setValueAtTime(Q, time);
  const cutoffBase = 90 + params.cutoff * 1400;
  const envAmt = params.envMod * 5200 * (step.accent ? 1.55 : 1);
  const decayT = 0.04 + params.decay * 0.32 * (step.accent ? 0.55 : 1);
  graph.filter.frequency.cancelScheduledValues(time);
  graph.filter.frequency.setValueAtTime(cutoffBase + envAmt, time);
  graph.filter.frequency.exponentialRampToValueAtTime(
    Math.max(40, cutoffBase),
    time + decayT,
  );

  const peak = step.accent ? 0.62 : 0.36;
  const floor = next?.on ? 0.018 : 0.0008;
  graph.amp.gain.cancelScheduledValues(time);
  graph.amp.gain.setTargetAtTime(peak, time, 0.006);
  graph.amp.gain.setTargetAtTime(peak * 0.72, time + 0.026, 0.018);
  graph.amp.gain.setTargetAtTime(floor, time + dur, next?.on ? 0.035 : 0.055);
}

export function schedulePatternStep(
  graph: SynthGraph,
  pattern: Step[],
  params: SynthParams,
  idx: number,
  time: number,
  stepDur: number,
): void {
  const length = Math.max(1, pattern.length || 16);
  const step = pattern[idx % length];
  if (!step || !step.on) return;
  const next = pattern[(idx + 1) % length];
  applyStepToGraph(graph, params, step, next, time, stepDur);
}

export class Synth303Engine {
  ctx: AudioContext | null = null;
  graph: SynthGraph | null = null;
  params: SynthParams = { ...DEFAULT_SYNTH_PARAMS };
  bpm = 138;
  playing = false;
  currentStep = 0;
  pattern: Step[] = EMPTY_PATTERN;
  nextTime = 0;
  timer: ReturnType<typeof setTimeout> | null = null;
  onStep: ((i: number) => void) | null = null;

  _ensure() {
    if (this.ctx) return;
    const AC =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AC();
    this.graph = buildSynthGraph(this.ctx, this.bpm, this.params);
  }

  setParam(name: keyof SynthParams, val: number) {
    this.params[name] = val;
  }

  setPattern(p: Step[]) {
    this.pattern = p;
  }

  setBpm(bpm: number) {
    this.bpm = Math.max(60, Math.min(220, bpm));
    if (this.graph) this.graph.delay.delayTime.value = getStepDuration(this.bpm) * 1.5;
  }

  play() {
    this._ensure();
    if (this.ctx!.state === "suspended") this.ctx!.resume();
    if (this.playing) return;
    this.playing = true;
    this.currentStep = 0;
    this.nextTime = this.ctx!.currentTime + 0.05;
    this._scheduler();
  }

  stop() {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.onStep) this.onStep(-1);
    if (this.ctx && this.graph) {
      this.graph.amp.gain.cancelScheduledValues(this.ctx.currentTime);
      this.graph.amp.gain.setTargetAtTime(0.0008, this.ctx.currentTime, 0.018);
    }
  }

  _scheduler() {
    if (!this.playing) return;
    const stepDur = getStepDuration(this.bpm);
    const length = Math.max(1, this.pattern.length || 16);
    while (this.nextTime < this.ctx!.currentTime + 0.1) {
      const idx = this.currentStep;
      const time = this.nextTime;
      this._schedule(idx, time, stepDur);
      if (this.onStep) {
        const ms = Math.max(0, (time - this.ctx!.currentTime) * 1000);
        setTimeout(() => {
          if (this.playing) this.onStep!(idx);
        }, ms);
      }
      this.nextTime += stepDur;
      this.currentStep = (idx + 1) % length;
    }
    this.timer = setTimeout(() => this._scheduler(), 25);
  }

  _schedule(idx: number, time: number, stepDur: number) {
    const graph = this.graph;
    if (!graph) return;
    schedulePatternStep(graph, this.pattern, this.params, idx, time, stepDur);
  }

  preview(note: string = "A2") {
    this._ensure();
    if (this.ctx!.state === "suspended") this.ctx!.resume();
    if (!this.graph) return;
    const previewStep: Step = { on: true, note, accent: true, slide: false };
    applyStepToGraph(
      this.graph,
      this.params,
      previewStep,
      undefined,
      this.ctx!.currentTime,
      0.25,
    );
  }
}

export function exportPatternAsMidi(
  pattern: Step[],
  bpm: number,
  name: string,
): Blob {
  const noteToMidi = (note: string) => {
    const map: Record<string, number> = {
      C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
      "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
    };
    const m = (note || "A2").match(/^([A-G]#?)(-?\d+)$/);
    if (!m) return 60;
    return (parseInt(m[2], 10) + 1) * 12 + map[m[1]];
  };

  const vlq = (n: number): number[] => {
    if (n <= 0) return [0];
    const out: number[] = [];
    let v = n;
    while (v > 0) {
      out.unshift(v & 0x7f);
      v >>= 7;
    }
    for (let i = 0; i < out.length - 1; i++) out[i] |= 0x80;
    return out;
  };

  const asc = (s: string) => s.split("").map((c) => c.charCodeAt(0) & 0x7f);

  const tpq = 480;
  const stepTicks = tpq / 4;
  const upb = Math.round(60000000 / Math.max(1, bpm || 132));

  const ev: { t: number; b: number[] }[] = [];
  ev.push({
    t: 0,
    b: [
      0xff, 0x51, 0x03,
      (upb >> 16) & 0xff,
      (upb >> 8) & 0xff,
      upb & 0xff,
    ],
  });

  const nm = ("VIRTUAL RAVE / " + (name || "VR-303")).slice(0, 48);
  ev.push({ t: 0, b: [0xff, 0x03, nm.length, ...asc(nm)] });
  ev.push({ t: 0, b: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] });

  for (let i = 0; i < 16; i++) {
    const s = pattern[i];
    if (!s || !s.on) continue;
    const num = noteToMidi(s.note);
    const vel = s.accent ? 112 : 88;
    const start = i * stepTicks;
    const next = pattern[(i + 1) % 16];
    const slide = s.slide && next && next.on;
    const dur = Math.max(
      24,
      slide
        ? Math.round(stepTicks * 1.85)
        : Math.round(stepTicks * 0.85),
    );
    ev.push({ t: start, b: [0x90, num, vel] });
    ev.push({ t: start + dur, b: [0x80, num, 64] });
  }

  ev.push({ t: 16 * stepTicks, b: [0xff, 0x2f, 0x00] });
  ev.sort((a, b) => a.t - b.t);

  let lastT = 0;
  const trk: number[] = [];
  for (const e of ev) {
    const d = e.t - lastT;
    trk.push(...vlq(d), ...e.b);
    lastT = e.t;
  }

  const head = [
    0x4d, 0x54, 0x68, 0x64,
    0, 0, 0, 6,
    0, 0,
    0, 1,
    (tpq >> 8) & 0xff, tpq & 0xff,
  ];
  const tl = trk.length;
  const trkChunk = [
    0x4d, 0x54, 0x72, 0x6b,
    (tl >> 24) & 0xff,
    (tl >> 16) & 0xff,
    (tl >> 8) & 0xff,
    tl & 0xff,
    ...trk,
  ];

  return new Blob([new Uint8Array(head.concat(trkChunk))], {
    type: "audio/midi",
  });
}
