import { MIDI_PATTERNS } from "./midiPatterns";
import type { Step } from "./synth303";

export interface PatternGeneratorOptions {
  seed?: string | number;
  recentSignatures?: Iterable<string>;
}

const STEP_COUNT = 16;

const NOTE_POOL = [
  "C1",
  "D#1",
  "F1",
  "G1",
  "A#1",
  "C2",
  "D#2",
  "F2",
  "G2",
  "A#2",
  "C3",
  "D#3",
  "F3",
  "G3",
  "A#3",
  "C4",
  "D#4",
  "F4",
  "G4",
  "A#4",
];

const ARCHETYPES = ["anchor-fill", "offbeat-syncopation", "ratchet-climb", "call-response", "minimal-sparse"] as const;

type Archetype = (typeof ARCHETYPES)[number];

function makeStep(on: boolean, note: string, accent: boolean, slide: boolean): Step {
  return { on, note, accent, slide };
}

function clonePattern(pattern: Step[]): Step[] {
  return pattern.map((step) => ({ ...step }));
}

function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeSeed(seed?: string | number): string {
  if (typeof seed === "string" && seed.length > 0) return seed;
  if (typeof seed === "number" && Number.isFinite(seed)) return String(seed);

  const globalCrypto = globalThis.crypto as Crypto | undefined;
  if (globalCrypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    globalCrypto.getRandomValues(buf);
    return `${Date.now().toString(36)}-${buf[0].toString(36)}`;
  }

  return Date.now().toString(36);
}

function choose<T>(rng: () => number, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)]!;
}

function chance(rng: () => number, probability: number): boolean {
  return rng() < probability;
}

function clampStepCount(active: number): number {
  return Math.max(5, Math.min(12, active));
}

function buildEmptyPattern(): Step[] {
  return Array.from({ length: STEP_COUNT }, () => makeStep(false, "C2", false, false));
}

function noteIndex(note: string): number {
  const idx = NOTE_POOL.indexOf(note);
  return idx >= 0 ? idx : 5;
}

function noteAtIndex(index: number): string {
  const wrapped = ((index % NOTE_POOL.length) + NOTE_POOL.length) % NOTE_POOL.length;
  return NOTE_POOL[wrapped]!;
}

function patternSignature(pattern: Step[]): string {
  return pattern
    .map((step) => `${step.on ? 1 : 0}${step.note}:${step.accent ? 1 : 0}${step.slide ? 1 : 0}`)
    .join("|");
}

function rotateMotif(pattern: Step[], offset: number): Step[] {
  const out = buildEmptyPattern();
  for (let i = 0; i < STEP_COUNT; i++) {
    out[(i + offset) % STEP_COUNT] = { ...pattern[i]! };
  }
  return out;
}

function synthesizeAnchorFill(rng: () => number): Step[] {
  const pattern = buildEmptyPattern();
  const baseIndex = 5 + Math.floor(rng() * 4);
  const anchor = noteAtIndex(baseIndex);
  const fill = noteAtIndex(baseIndex + (chance(rng, 0.5) ? 3 : 2));
  const hitSteps = [0, 4, 8, 12];

  hitSteps.forEach((step, idx) => {
    const useFill = idx === 1 || idx === 3 ? chance(rng, 0.6) : chance(rng, 0.25);
    pattern[step] = makeStep(true, useFill ? fill : anchor, idx % 2 === 1, false);
  });

  [2, 6, 10, 14].forEach((step) => {
    if (chance(rng, 0.55)) {
      pattern[step] = makeStep(true, noteAtIndex(baseIndex + (chance(rng, 0.5) ? 1 : -1)), chance(rng, 0.35), false);
    }
  });

  return pattern;
}

function synthesizeOffbeatSyncopation(rng: () => number): Step[] {
  const pattern = buildEmptyPattern();
  const baseIndex = 5 + Math.floor(rng() * 6);
  const primary = noteAtIndex(baseIndex);
  const upper = noteAtIndex(baseIndex + 2);
  const lower = noteAtIndex(baseIndex - 1);
  const steps = [1, 3, 5, 7, 9, 11, 13, 15];

  steps.forEach((step, idx) => {
    const note = idx % 3 === 0 ? primary : idx % 2 === 0 ? upper : lower;
    pattern[step] = makeStep(true, note, chance(rng, 0.4), false);
  });

  [4, 8, 12].forEach((step) => {
    if (chance(rng, 0.5)) pattern[step] = makeStep(true, primary, true, false);
  });

  return pattern;
}

function synthesizeRatchetClimb(rng: () => number): Step[] {
  const pattern = buildEmptyPattern();
  const baseIndex = 5 + Math.floor(rng() * 3);
  const motif = [
    noteAtIndex(baseIndex),
    noteAtIndex(baseIndex + 1),
    noteAtIndex(baseIndex + 3),
    noteAtIndex(baseIndex + 4),
  ];
  const start = chance(rng, 0.5) ? 0 : 2;

  for (let i = 0; i < STEP_COUNT; i++) {
    const shouldHit = i % 2 === start % 2 || (i === 15 && chance(rng, 0.4));
    if (!shouldHit) continue;
    const motifIndex = Math.floor(i / 2) % motif.length;
    const rising = i >= 8 ? 1 : 0;
    const note = noteAtIndex(noteIndex(motif[motifIndex]!) + rising + (chance(rng, 0.2) ? 1 : 0));
    pattern[i] = makeStep(true, note, i % 4 === 3 || chance(rng, 0.18), false);
  }

  [3, 7, 11].forEach((step) => {
    const next = pattern[step + 1];
    if (pattern[step] && next?.on) pattern[step]!.slide = true;
  });

  return pattern;
}

function synthesizeCallResponse(rng: () => number): Step[] {
  const pattern = buildEmptyPattern();
  const baseIndex = 5 + Math.floor(rng() * 5);
  const call = noteAtIndex(baseIndex + (chance(rng, 0.5) ? 0 : 2));
  const response = noteAtIndex(baseIndex + 4);
  const motifA = [0, 1, 4, 5];
  const motifB = [8, 9, 12, 13];

  motifA.forEach((step, idx) => {
    const note = idx % 2 === 0 ? call : response;
    pattern[step] = makeStep(true, note, idx === 1 || idx === 3, false);
  });
  motifB.forEach((step, idx) => {
    const note = idx % 2 === 0 ? response : call;
    pattern[step] = makeStep(true, note, idx === 1 || idx === 3 || chance(rng, 0.2), false);
  });

  [2, 6, 10, 14].forEach((step) => {
    if (chance(rng, 0.35)) {
      pattern[step] = makeStep(true, noteAtIndex(baseIndex + (chance(rng, 0.5) ? -1 : 1)), chance(rng, 0.25), false);
    }
  });

  return pattern;
}

function synthesizeMinimalSparse(rng: () => number): Step[] {
  const pattern = buildEmptyPattern();
  const baseIndex = 5 + Math.floor(rng() * 4);
  const root = noteAtIndex(baseIndex);
  const fifth = noteAtIndex(baseIndex + 4);
  const octave = noteAtIndex(baseIndex + 7);
  const steps = [0, 3, 7, 11, 14];

  steps.forEach((step, idx) => {
    const note = idx === 0 ? root : idx === 2 ? fifth : idx === 4 ? octave : noteAtIndex(baseIndex + (idx % 2 === 0 ? 2 : -1));
    pattern[step] = makeStep(true, note, idx === 2 || chance(rng, 0.2), false);
  });

  if (chance(rng, 0.45)) {
    pattern[8] = makeStep(true, fifth, true, false);
  }

  return pattern;
}

function generateCandidate(seedText: string): Step[] {
  const rng = mulberry32(hashSeed(seedText));
  const archetype = choose(rng, ARCHETYPES);

  let pattern: Step[];
  switch (archetype) {
    case "anchor-fill":
      pattern = synthesizeAnchorFill(rng);
      break;
    case "offbeat-syncopation":
      pattern = synthesizeOffbeatSyncopation(rng);
      break;
    case "ratchet-climb":
      pattern = synthesizeRatchetClimb(rng);
      break;
    case "call-response":
      pattern = synthesizeCallResponse(rng);
      break;
    case "minimal-sparse":
    default:
      pattern = synthesizeMinimalSparse(rng);
      break;
  }

  const activeCount = pattern.reduce((count, step) => count + (step.on ? 1 : 0), 0);
  const bounded = clampStepCount(activeCount);

  if (activeCount > bounded) {
    const activeSteps = pattern.map((step, index) => ({ step, index })).filter(({ step }) => step.on);
    while (activeSteps.length > bounded) {
      const removeIndex = Math.floor(rng() * activeSteps.length);
      const removed = activeSteps.splice(removeIndex, 1)[0];
      if (removed) pattern[removed.index] = makeStep(false, "C2", false, false);
    }
  } else if (activeCount < bounded) {
    const inactiveSteps = pattern.map((step, index) => ({ step, index })).filter(({ step }) => !step.on);
    while (inactiveSteps.length && pattern.reduce((count, step) => count + (step.on ? 1 : 0), 0) < bounded) {
      const addIndex = Math.floor(rng() * inactiveSteps.length);
      const added = inactiveSteps.splice(addIndex, 1)[0];
      if (!added) break;
      const left = pattern[(added.index - 1 + STEP_COUNT) % STEP_COUNT];
      const right = pattern[(added.index + 1) % STEP_COUNT];
      const pool = left?.on ? noteIndex(left.note) : right?.on ? noteIndex(right.note) : 5;
      const note = noteAtIndex(pool + (chance(rng, 0.35) ? 1 : 0) + (chance(rng, 0.15) ? -1 : 0));
      pattern[added.index] = makeStep(true, note, chance(rng, 0.32), false);
    }
  }

  for (let i = 0; i < STEP_COUNT; i++) {
    const current = pattern[i]!;
    const next = pattern[(i + 1) % STEP_COUNT]!;
    if (!current.on) continue;
    if (!next.on) {
      current.slide = false;
      continue;
    }
    if (current.note === next.note && chance(rng, 0.7)) {
      current.slide = true;
    } else if (chance(rng, 0.18)) {
      current.slide = true;
    }
    if (current.accent && chance(rng, 0.12)) {
      current.slide = true;
    }
  }

  if (!pattern.some((step) => step.on)) {
    pattern[0] = makeStep(true, "C2", true, false);
    pattern[4] = makeStep(true, "D#2", false, false);
    pattern[8] = makeStep(true, "F2", true, false);
    pattern[12] = makeStep(true, "G2", false, false);
  }

  return pattern;
}

function isPresetCollision(pattern: Step[], usedSignatures: Set<string>): boolean {
  const signature = patternSignature(pattern);
  return usedSignatures.has(signature);
}

function buildUsedSignatures(recentSignatures?: Iterable<string>): Set<string> {
  const signatures = new Set<string>();
  for (const preset of MIDI_PATTERNS) signatures.add(patternSignature(preset.pattern));
  if (recentSignatures) {
    for (const signature of recentSignatures) signatures.add(signature);
  }
  return signatures;
}

export function getPatternSignature(pattern: Step[]): string {
  return patternSignature(pattern);
}

export function generateUniquePattern(seed?: string | number, recentSignatures?: Iterable<string>): Step[] {
  const baseSeed = normalizeSeed(seed);
  const usedSignatures = buildUsedSignatures(recentSignatures);

  let attempt = 0;
  let candidate = generateCandidate(baseSeed);
  while (attempt < 64 && isPresetCollision(candidate, usedSignatures)) {
    attempt += 1;
    candidate = generateCandidate(`${baseSeed}:${attempt}`);
  }

  if (attempt >= 64 && isPresetCollision(candidate, usedSignatures)) {
    const fallback = rotateMotif(candidate, 1);
    if (!isPresetCollision(fallback, usedSignatures)) return clonePattern(fallback);
  }

  return clonePattern(candidate);
}

export function generatePattern(seed?: string | number, recentSignatures?: Iterable<string>): Step[] {
  return generateUniquePattern(seed, recentSignatures);
}
