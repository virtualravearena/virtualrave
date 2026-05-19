"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MintCeremony, type CeremonyContext, type CeremonyAct } from "./MintCeremony";

interface PreviewState {
  open: boolean;
  act: CeremonyAct;
  ctx: CeremonyContext;
  buttonRect: DOMRect | null;
}

// Intro is 8 bars at 134 BPM = 14.33s. The drop is scheduled to start when intro ends
// (so the "welcome to the rave" vocal in the last 4 bars always plays). Visual acts time
// to land on the same moment.
const SCRIPT: { act: CeremonyAct; durationMs: number; patch?: Partial<CeremonyContext> }[] = [
  { act: 0, durationMs: 2400, patch: {} },                                            // broadcasting
  { act: 1, durationMs: 5800, patch: { txHash: "0x9f3a2be1c7d44e08a155f02c19a8b3f7e612d04a8c91be2f773d50a8b1ce72e1" } }, // decrypting (covers 6 lines * ~700ms)
  { act: 2, durationMs: 6130, patch: { blockNumber: 12 } },                           // confirming → total 14.33s
  { act: 3, durationMs: 1790, patch: {} },                                            // the drop (1 bar at 134)
  { act: 4, durationMs: Infinity, patch: {} },                                        // archived — user tears or closes
];

export function CeremonyPreviewButton() {
  const [state, setState] = useState<PreviewState>({
    open: false,
    act: 0,
    ctx: {
      edition: 57,
      wallet: "0x9f2acd17e8b3c4f50d6a78bc1ef902a334d57c91",
      lensHandle: null,
      lensAddress: null,
      txHash: null,
      blockNumber: null,
      errorMessage: null,
    },
    buttonRect: null,
  });
  const [slowChain, setSlowChain] = useState(false);
  const [forceError, setForceError] = useState(false);
  const [withLens, setWithLens] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const timersRef = useRef<number[]>([]);

  // Only render in non-prod OR when ?ceremony=1 is in URL
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDev = process.env.NODE_ENV !== "production";
    const isPreviewParam = window.location.search.includes("ceremony=1");
    setVisible(isDev || isPreviewParam);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const startCeremony = useCallback(
    (startAct: CeremonyAct = 0) => {
      clearTimers();
      const rect = btnRef.current?.getBoundingClientRect() ?? null;
      setState((s) => ({
        ...s,
        open: true,
        act: startAct,
        ctx: {
          edition: 57,
          wallet: "0x9f2acd17e8b3c4f50d6a78bc1ef902a334d57c91",
          lensHandle: withLens ? "sargent.lens" : null,
          lensAddress: withLens ? "0x303feeD7e375080e9dBF16e6DD214122BA31A6bd" : null,
          txHash: null,
          blockNumber: null,
          errorMessage: null,
        },
        buttonRect: rect,
      }));
      setPanelOpen(false);

      // Schedule the script
      let cum = 0;
      const startIdx = SCRIPT.findIndex((s) => s.act === startAct);
      const slice = startIdx === -1 ? SCRIPT : SCRIPT.slice(startIdx);
      slice.forEach((step, i) => {
        const dur = slowChain && step.act === 2 ? 14000 : step.durationMs;
        const fireAt = cum;
        cum += dur;
        const id = window.setTimeout(() => {
          if (forceError && step.act === 2) {
            setState((s) => ({
              ...s,
              act: -1,
              ctx: { ...s.ctx, errorMessage: "test error: simulated revert (0x77a5352e)" },
            }));
            return;
          }
          setState((s) => ({
            ...s,
            act: step.act,
            ctx: { ...s.ctx, ...(step.patch ?? {}) },
          }));
        }, fireAt);
        timersRef.current.push(id);

        // Stream block numbers during ACT 2
        if (step.act === 2) {
          const blocksDuration = slowChain ? 14000 : step.durationMs;
          for (let b = 1; b <= 6; b++) {
            const bid = window.setTimeout(() => {
              setState((s) => ({
                ...s,
                ctx: { ...s.ctx, blockNumber: b },
              }));
            }, fireAt + (blocksDuration / 7) * b);
            timersRef.current.push(bid);
          }
        }
      });
    },
    [clearTimers, slowChain, forceError, withLens],
  );

  const close = useCallback(() => {
    clearTimers();
    setState((s) => ({ ...s, open: false }));
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!visible) return null;

  return (
    <>
      <div className="mc-preview-dock">
        <button
          ref={btnRef}
          className="mc-preview-run"
          onClick={() => startCeremony(0)}
          aria-label="Run ceremony preview"
        >
          ▶ RUN CEREMONY
        </button>
        <button
          className="mc-preview-toggle"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
        >
          {panelOpen ? "▾" : "▴"} dev
        </button>
        {panelOpen && (
          <div className="mc-preview-panel">
            <div className="mc-preview-panel__head">CAPTAIN&apos;S QA</div>
            <div className="mc-preview-panel__group">
              <div className="mc-preview-panel__label">JUMP TO ACT</div>
              <div className="mc-preview-panel__row">
                {([0, 1, 2, 3, 4] as CeremonyAct[]).map((a) => (
                  <button key={a} className="mc-preview-chip" onClick={() => startCeremony(a)}>
                    {a}
                  </button>
                ))}
                <button className="mc-preview-chip mc-preview-chip--err" onClick={() => {
                  clearTimers();
                  setState((s) => ({
                    ...s,
                    open: true,
                    act: -1,
                    buttonRect: btnRef.current?.getBoundingClientRect() ?? null,
                    ctx: { ...s.ctx, errorMessage: "test error: simulated revert (0x77a5352e)" },
                  }));
                }}>
                  err
                </button>
              </div>
            </div>
            <label className="mc-preview-check">
              <input type="checkbox" checked={slowChain} onChange={(e) => setSlowChain(e.target.checked)} />
              <span>fake slow chain (act 2 × 14s)</span>
            </label>
            <label className="mc-preview-check">
              <input type="checkbox" checked={forceError} onChange={(e) => setForceError(e.target.checked)} />
              <span>force error path</span>
            </label>
            <label className="mc-preview-check">
              <input type="checkbox" checked={withLens} onChange={(e) => setWithLens(e.target.checked)} />
              <span>minted via orb / lens profile</span>
            </label>
            <div className="mc-preview-panel__hint">
              press M to mute · Esc to abort
            </div>
          </div>
        )}
      </div>

      <MintCeremony
        open={state.open}
        act={state.act}
        ctx={state.ctx}
        buttonRect={state.buttonRect}
        onClose={close}
      />
    </>
  );
}
