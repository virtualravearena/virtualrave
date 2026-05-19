import {
  type SynthParams,
  type Step,
  DEFAULT_SYNTH_PARAMS,
  buildSynthGraph,
  getStepDuration,
  schedulePatternStep,
} from "./synth303";

export interface OfflineRenderOptions {
  sampleRate?: number;
  tailSeconds?: number;
}

export interface RecordedTakeEvent {
  t: number;
  kind: "transport" | "edit" | "bpm" | "knob" | "preset";
  detail: string;
}

function resolveParams(params?: Partial<SynthParams>): SynthParams {
  return {
    cutoff: params?.cutoff ?? DEFAULT_SYNTH_PARAMS.cutoff,
    res: params?.res ?? DEFAULT_SYNTH_PARAMS.res,
    envMod: params?.envMod ?? DEFAULT_SYNTH_PARAMS.envMod,
    decay: params?.decay ?? DEFAULT_SYNTH_PARAMS.decay,
  };
}

function createOfflineContext(durationSeconds: number, sampleRate: number): OfflineAudioContext {
  const frameCount = Math.max(1, Math.ceil(durationSeconds * sampleRate));
  const OfflineCtx =
    globalThis.OfflineAudioContext ??
    (globalThis as typeof globalThis & {
      webkitOfflineAudioContext?: typeof OfflineAudioContext;
    }).webkitOfflineAudioContext;

  if (!OfflineCtx) {
    throw new Error("OfflineAudioContext is not available in this environment.");
  }

  return new OfflineCtx(2, frameCount, sampleRate);
}

export async function renderPatternOffline(
  pattern: Step[],
  bpm: number,
  params?: Partial<SynthParams>,
  options: OfflineRenderOptions = {},
): Promise<AudioBuffer> {
  const resolvedParams = resolveParams(params);
  const stepDur = getStepDuration(bpm);
  const stepCount = Math.max(1, pattern.length || 16);
  const sampleRate = Math.max(22050, options.sampleRate ?? 44100);
  const tailSeconds = Math.max(0.35, options.tailSeconds ?? 0.9);
  const durationSeconds = stepDur * stepCount + tailSeconds;
  const offline = createOfflineContext(durationSeconds, sampleRate);
  const graph = buildSynthGraph(offline, bpm, resolvedParams, 0);

  for (let i = 0; i < stepCount; i++) {
    schedulePatternStep(graph, pattern, resolvedParams, i, i * stepDur, stepDur);
  }

  return offline.startRendering();
}

function readKnobEvent(detail: string): [keyof SynthParams, number] | null {
  const [name, value] = detail.split(":");
  if (name !== "cutoff" && name !== "res" && name !== "envMod" && name !== "decay") {
    return null;
  }

  const next = Number(value);
  if (!Number.isFinite(next)) return null;
  return [name, Math.max(0, Math.min(1, next))];
}

function readBpmEvent(detail: string): number | null {
  const next = Number(detail);
  if (!Number.isFinite(next)) return null;
  return Math.max(60, Math.min(220, next));
}

function scheduleRealtimeKnobAutomation(
  graph: ReturnType<typeof buildSynthGraph>,
  events: RecordedTakeEvent[],
  durationSeconds: number,
): void {
  for (const event of events) {
    if (event.kind !== "knob") continue;
    const knob = readKnobEvent(event.detail);
    if (!knob) continue;

    const time = event.t / 1000;
    if (time < 0 || time > durationSeconds) continue;
    const [name, value] = knob;

    if (name === "res") {
      graph.filter.Q.setTargetAtTime(4 + value * 26, time, 0.012);
    }

    if (name === "cutoff") {
      graph.filter.frequency.setTargetAtTime(90 + value * 1400, time, 0.012);
    }
  }
}

export async function renderRecordedTakeOffline(
  pattern: Step[],
  bpm: number,
  params: Partial<SynthParams>,
  events: RecordedTakeEvent[],
  durationMs: number,
  options: OfflineRenderOptions = {},
): Promise<AudioBuffer> {
  const sampleRate = Math.max(22050, options.sampleRate ?? 44100);
  const tailSeconds = Math.max(0, options.tailSeconds ?? 0.35);
  const durationSeconds = Math.max(0.05, durationMs / 1000) + tailSeconds;
  const offline = createOfflineContext(durationSeconds, sampleRate);
  const resolvedParams = resolveParams(params);
  const graph = buildSynthGraph(offline, bpm, resolvedParams, 0);
  const sortedEvents = events.slice().sort((a, b) => a.t - b.t);
  const currentParams: SynthParams = { ...resolvedParams };
  let currentBpm = Math.max(60, Math.min(220, bpm));
  let eventIndex = 0;
  let stepIndex = 0;
  let time = 0;

  while (time < durationSeconds) {
    const timeMs = time * 1000;

    while (eventIndex < sortedEvents.length && sortedEvents[eventIndex].t <= timeMs) {
      const event = sortedEvents[eventIndex];
      if (event.kind === "knob") {
        const knob = readKnobEvent(event.detail);
        if (knob) currentParams[knob[0]] = knob[1];
      }

      if (event.kind === "bpm") {
        const nextBpm = readBpmEvent(event.detail);
        if (nextBpm !== null) {
          currentBpm = nextBpm;
          graph.delay.delayTime.setValueAtTime(getStepDuration(currentBpm) * 1.5, time);
        }
      }

      eventIndex += 1;
    }

    const stepDur = getStepDuration(currentBpm);
    schedulePatternStep(graph, pattern, currentParams, stepIndex, time, stepDur);
    time += stepDur;
    stepIndex += 1;
  }

  scheduleRealtimeKnobAutomation(graph, sortedEvents, durationSeconds);
  return offline.startRendering();
}

function writeString(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i) & 0xff);
  }
}

export function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const channels = Math.max(1, buffer.numberOfChannels);
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const sampleRate = buffer.sampleRate;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  const channelData = Array.from({ length: channels }, (_, i) =>
    buffer.getChannelData(i),
  );
  let offset = 44;

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i] ?? 0));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export async function exportPatternAsWav(
  pattern: Step[],
  bpm: number,
  params?: Partial<SynthParams>,
  options?: OfflineRenderOptions,
): Promise<Blob> {
  const rendered = await renderPatternOffline(pattern, bpm, params, options);
  return encodeAudioBufferToWav(rendered);
}

export async function exportRecordedTakeAsWav(
  pattern: Step[],
  bpm: number,
  params: Partial<SynthParams>,
  events: RecordedTakeEvent[],
  durationMs: number,
  options?: OfflineRenderOptions,
): Promise<Blob> {
  const rendered = await renderRecordedTakeOffline(
    pattern,
    bpm,
    params,
    events,
    durationMs,
    options,
  );
  return encodeAudioBufferToWav(rendered);
}
