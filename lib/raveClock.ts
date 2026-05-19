"use client";

import { useEffect, useState } from "react";

export const RAVE_BPM = 134;
export const RAVE_BAR_SEC = (60 / RAVE_BPM) * 4; // 1 bar = 4 beats
export const RAVE_BEAT_SEC = 60 / RAVE_BPM;
export const RAVE_STEP_SEC = RAVE_BEAT_SEC / 4; // 16th note

export interface BeatTick {
  ctxTime: number;        // AudioContext time when audio started
  beat: number;           // 0..3 within current bar
  bar: number;            // bars since start
  step: number;           // 0..15 within bar (16th notes)
  phase: number;          // 0..1 within current beat
  totalBeats: number;     // monotonic
}

export class RaveClock {
  private ctx: AudioContext | null = null;
  private startedAt = 0;
  private running = false;
  private listeners = new Set<(t: BeatTick) => void>();
  private rafId: number | null = null;

  attach(ctx: AudioContext) {
    this.ctx = ctx;
  }

  start() {
    if (!this.ctx) return;
    if (this.running) return;
    this.running = true;
    this.startedAt = this.ctx.currentTime;
    const loop = () => {
      if (!this.running || !this.ctx) return;
      const elapsed = this.ctx.currentTime - this.startedAt;
      const totalBeats = elapsed / RAVE_BEAT_SEC;
      const bar = Math.floor(totalBeats / 4);
      const beat = Math.floor(totalBeats) % 4;
      const phase = totalBeats - Math.floor(totalBeats);
      const step = Math.floor((totalBeats % 4) * 4);
      const tick: BeatTick = {
        ctxTime: this.ctx.currentTime,
        beat,
        bar,
        step,
        phase,
        totalBeats,
      };
      this.listeners.forEach((cb) => cb(tick));
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  reset() {
    if (this.ctx) this.startedAt = this.ctx.currentTime;
  }

  /** Time of the next downbeat (beat 0 of next bar), in AudioContext seconds. */
  nextDownbeat(): number {
    if (!this.ctx) return 0;
    const elapsed = this.ctx.currentTime - this.startedAt;
    const barsElapsed = elapsed / RAVE_BAR_SEC;
    const nextBar = Math.ceil(barsElapsed + 0.001);
    return this.startedAt + nextBar * RAVE_BAR_SEC;
  }

  subscribe(cb: (t: BeatTick) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export function useBeat(clock: RaveClock | null): BeatTick | null {
  const [tick, setTick] = useState<BeatTick | null>(null);
  useEffect(() => {
    if (!clock) return;
    const unsubscribe = clock.subscribe(setTick);
    return () => { unsubscribe(); };
  }, [clock]);
  return tick;
}

