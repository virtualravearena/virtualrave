"use client";

import { RaveClock, RAVE_BPM } from "./raveClock";

export interface MintAudioController {
  ctx: AudioContext;
  clock: RaveClock;
  start: () => Promise<void>;
  triggerDrop: () => void;
  setMuted: (m: boolean) => void;
  stop: () => void;
  isMuted: () => boolean;
  duckSynth: (toGain: number, seconds: number) => void;
}

const INTRO_URL = "/sounds/intro.wav";
const DROP_URL = "/sounds/drop.wav";
const MUTE_KEY = "vr303-mint-muted";

async function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return await ctx.decodeAudioData(arr);
  } catch {
    return null;
  }
}

export async function createMintAudio(): Promise<MintAudioController> {
  const AC =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  if (ctx.state === "suspended") await ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);

  const bedGain = ctx.createGain();
  bedGain.gain.value = 0.85;
  bedGain.connect(master);

  let muted = false;
  if (typeof localStorage !== "undefined") {
    muted = localStorage.getItem(MUTE_KEY) === "1";
    master.gain.value = muted ? 0 : 1;
  }

  const clock = new RaveClock();
  clock.attach(ctx);

  // Pre-load both stems
  const [introBuf, dropBuf] = await Promise.all([
    loadBuffer(ctx, INTRO_URL),
    loadBuffer(ctx, DROP_URL),
  ]);

  let introSrc: AudioBufferSourceNode | null = null;
  let dropSrc: AudioBufferSourceNode | null = null;
  let dropFired = false;
  let introStartedAt = 0;
  const introDuration = introBuf?.duration ?? 0;

  function playBuffer(buf: AudioBuffer | null, when: number, loop: boolean): AudioBufferSourceNode | null {
    if (!buf) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    src.connect(bedGain);
    src.start(when);
    return src;
  }

  function scheduleIntroLoop(startAt: number) {
    // Play intro non-looping so the vocal at the end always plays.
    // When it ends, if no drop yet, restart from the top.
    const src = playBuffer(introBuf, startAt, false);
    if (!src) return;
    introSrc = src;
    introStartedAt = startAt;
    src.onended = () => {
      if (dropFired) return;
      if (src !== introSrc) return; // superseded
      scheduleIntroLoop(ctx.currentTime + 0.001);
    };
  }

  function timeOfNextIntroEnd(): number {
    if (!introBuf || !introStartedAt) return ctx.currentTime;
    return introStartedAt + introDuration;
  }

  async function start() {
    if (ctx.state === "suspended") await ctx.resume();
    const startAt = ctx.currentTime + 0.08;
    clock.start();
    dropFired = false;
    // Play intro through to the end (including the "welcome" vocal in the last 4 bars).
    // If the drop hasn't fired yet when it ends, loop from the top.
    scheduleIntroLoop(startAt);
  }

  function triggerDrop() {
    if (dropFired) return;
    dropFired = true;
    // The intro vocal lives in the last 4 bars. Always let the current intro finish
    // before the drop hits, so users hear "welcome to the rave" then the beat lands.
    const when = timeOfNextIntroEnd();
    // Drop loops end-to-end seamlessly (clean cut at boundaries)
    dropSrc = playBuffer(dropBuf, when, true);
    // intro is non-looping; it will end naturally at `when`. Don't stop it early.
  }

  function duckSynth(_to: number, _seconds: number) {
    // no synth layer — kept as no-op for API stability
  }

  function setMuted(m: boolean) {
    muted = m;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(m ? 0 : 1, ctx.currentTime + 0.12);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    }
  }

  function stop() {
    try { introSrc?.stop(); } catch {}
    try { dropSrc?.stop(); } catch {}
    clock.stop();
    void ctx.close();
  }

  return {
    ctx,
    clock,
    start,
    triggerDrop,
    setMuted,
    stop,
    isMuted: () => muted,
    duckSynth,
  };
}

export function getStoredMute(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export { RAVE_BPM };
