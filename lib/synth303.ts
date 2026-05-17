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

function noteToFreq(note: string): number {
  const map: Record<string, number> = {
    C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4, "F#": -3,
    G: -2, "G#": -1, A: 0, "A#": 1, B: 2,
  };
  const m = note.match(/^([A-G]#?)(\d+)$/);
  if (!m) return 440;
  const semis = map[m[1]] + (parseInt(m[2], 10) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

function makeSoftClipCurve(amount: number): Float32Array {
  const k = amount;
  const N = 1024;
  const c = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = (i * 2) / N - 1;
    c[i] = (((3 + k) * x) / (3 + k * Math.abs(x))) * 0.65;
  }
  return c;
}

const EMPTY_PATTERN: Step[] = Array.from({ length: 16 }, () => ({
  on: false,
  note: "C3",
  accent: false,
  slide: false,
}));

interface SynthParams {
  cutoff: number;
  res: number;
  envMod: number;
  decay: number;
}

export class Synth303Engine {
  ctx: AudioContext | null = null;
  osc: OscillatorNode | null = null;
  subOsc: OscillatorNode | null = null;
  subGain: GainNode | null = null;
  filter: BiquadFilterNode | null = null;
  amp: GainNode | null = null;
  master: GainNode | null = null;
  shaper: WaveShaperNode | null = null;
  delay: DelayNode | null = null;
  params: SynthParams = { cutoff: 0.48, res: 0.78, envMod: 0.65, decay: 0.55 };
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

    this.osc = this.ctx.createOscillator();
    this.osc.type = "sawtooth";
    this.osc.frequency.value = noteToFreq("C2");

    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = "square";
    this.subOsc.frequency.value = noteToFreq("C1");

    this.subGain = this.ctx.createGain();
    this.subGain.gain.value = 0.14;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 320;
    this.filter.Q.value = 14;

    this.amp = this.ctx.createGain();
    this.amp.gain.value = 0.0008;

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.48;
    this.shaper = this.ctx.createWaveShaper();
    this.shaper.curve = makeSoftClipCurve(5) as Float32Array<ArrayBuffer>;
    this.shaper.oversample = "2x";
    this.delay = this.ctx.createDelay();
    this.delay.delayTime.value = (60 / this.bpm) * 0.375;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.22;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.18;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(wet).connect(this.shaper);
    this.osc.connect(this.filter);
    this.subOsc.connect(this.subGain).connect(this.filter);
    this.filter.connect(this.amp).connect(this.master);
    this.osc.start();
    this.subOsc.start();

    this.master.connect(this.delay);
    this.master.connect(this.shaper);
    this.shaper.connect(this.ctx.destination);
  }

  setParam(name: keyof SynthParams, val: number) {
    this.params[name] = val;
  }

  setPattern(p: Step[]) {
    this.pattern = p;
  }

  setBpm(bpm: number) {
    this.bpm = Math.max(60, Math.min(220, bpm));
    if (this.delay) this.delay.delayTime.value = (60 / this.bpm) * 0.375;
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
    if (this.ctx && this.amp) {
      this.amp.gain.cancelScheduledValues(this.ctx.currentTime);
      this.amp.gain.setTargetAtTime(0.0008, this.ctx.currentTime, 0.018);
    }
  }

  _scheduler() {
    if (!this.playing) return;
    const stepDur = 60 / this.bpm / 4;
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
      this.currentStep = (idx + 1) % 16;
    }
    this.timer = setTimeout(() => this._scheduler(), 25);
  }

  _schedule(idx: number, time: number, stepDur: number) {
    const s = this.pattern[idx];
    if (!s || !s.on) return;
    const next = this.pattern[(idx + 1) % 16];
    const slide = s.slide && next && next.on;
    const nextOn = !!next?.on;
    const dur = slide ? stepDur * 1.95 : nextOn ? stepDur * 0.98 : stepDur * 0.9;
    this._note(time, s.note, dur, s.accent, slide, next?.note, nextOn);
  }

  _note(
    time: number,
    note: string,
    dur: number,
    accent: boolean,
    slide: boolean,
    nextNote?: string,
    nextOn: boolean = false,
  ) {
    const ctx = this.ctx!;
    const osc = this.osc!;
    const subOsc = this.subOsc!;
    const filter = this.filter!;
    const amp = this.amp!;
    const f0 = noteToFreq(note);
    const f1 = slide && nextNote ? noteToFreq(nextNote) : f0;

    osc.frequency.cancelScheduledValues(time);
    subOsc.frequency.cancelScheduledValues(time);
    osc.frequency.setTargetAtTime(f0, time, 0.004);
    subOsc.frequency.setTargetAtTime(f0 * 0.5, time, 0.004);
    if (slide) {
      const slideAt = time + dur * 0.35;
      osc.frequency.setValueAtTime(f0, slideAt);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), time + dur);
      subOsc.frequency.setValueAtTime(f0 * 0.5, slideAt);
      subOsc.frequency.exponentialRampToValueAtTime(
        Math.max(20, f1 * 0.5),
        time + dur,
      );
    }

    const Q = 4 + this.params.res * 26;
    filter.Q.setValueAtTime(Q, time);
    const cutoffBase = 90 + this.params.cutoff * 1400;
    const envAmt = this.params.envMod * 5200 * (accent ? 1.55 : 1);
    const decayT = 0.04 + this.params.decay * 0.32 * (accent ? 0.55 : 1);
    filter.frequency.cancelScheduledValues(time);
    filter.frequency.setValueAtTime(cutoffBase + envAmt, time);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(40, cutoffBase),
      time + decayT,
    );

    const peak = accent ? 0.62 : 0.36;
    const floor = nextOn ? 0.018 : 0.0008;
    amp.gain.cancelScheduledValues(time);
    amp.gain.setTargetAtTime(peak, time, 0.006);
    amp.gain.setTargetAtTime(peak * 0.72, time + 0.026, 0.018);
    amp.gain.setTargetAtTime(floor, time + dur, nextOn ? 0.035 : 0.055);
  }

  preview(note: string = "A2") {
    this._ensure();
    if (this.ctx!.state === "suspended") this.ctx!.resume();
    this._note(this.ctx!.currentTime, note, 0.25, true, false);
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
