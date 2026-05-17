"use client";
import { useMemo, useState, useRef, useEffect } from "react";

const SMILEY_WORD = "0x303AC1D";

function buildSmileyGrid(cols: number, rows: number) {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const R = Math.min(cols, rows) / 2 - 0.4;

  const grid: {kind: string, char: string}[][] = [];
  let wi = 0;
  for (let y = 0; y < rows; y++) {
    const row: {kind: string, char: string}[] = [];
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = (y - cy) * 1.08;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let kind: string | null = null;

      if (dist > R) {
        kind = "bg";
      } else if (dist > R - 1.0) {
        kind = "ring";
      } else {
        kind = "face";
      }

      if (!kind) kind = "face";

      let char = " ";
      if (kind === "face" || kind === "ring") {
        char = SMILEY_WORD[wi % SMILEY_WORD.length];
        wi++;
      }
      row.push({ kind, char });
    }
    grid.push(row);
  }
  return grid;
}

export function AsciiSmiley({ cols = 38, rows = 32 }: { cols?: number; rows?: number }) {
  const grid = useMemo(() => buildSmileyGrid(cols, rows), [cols, rows]);
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: -4, ry: 12 });
  const [hovered, setHovered] = useState(false);
  const [autoT, setAutoT] = useState(0);

  useEffect(() => {
    let raf: number;
    let t = 0;
    const tick = () => { t += 1; setAutoT(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -ny * 28, ry: nx * 36 });
  };
  const onEnter = () => setHovered(true);
  const onLeave = () => {
    setHovered(false);
    setTilt({ rx: -4, ry: 12 });
  };

  const ambRy = Math.sin(autoT / 240) * 6;
  const ambRx = Math.cos(autoT / 300) * 3;

  return (
    <div
      ref={ref}
      className={`asciismiley${hovered ? " is-hovered" : ""}`}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform: `perspective(900px) rotateX(${tilt.rx + ambRx}deg) rotateY(${tilt.ry + ambRy}deg) scale(${hovered ? 1.035 : 1})` }}
    >
      <div className="asciismiley__ringtext" aria-hidden="true">
        <svg viewBox="0 0 400 400">
          <defs>
            <path id="vr-ring-path" d="M 200 200 m -180 0 a 180 180 0 1 1 360 0 a 180 180 0 1 1 -360 0" />
          </defs>
          <text>
            <textPath href="#vr-ring-path" startOffset="0">
               ACID HOUSE 303  SECOND SUMMER OF LOVE  VIRTUAL RAVE  VR303  LENS NETWORK  ACID HOUSE 303  SECOND SUMMER OF LOVE 
            </textPath>
          </text>
        </svg>
      </div>
      <div className="asciismiley__halo" aria-hidden="true" />
      <div className="asciismiley__features" aria-hidden="true">
        <img className="asciismiley__eyes" src="/smiley/eyeopen.svg" alt="" />
        <img className="asciismiley__smile" src="/smiley/smile.svg" alt="" />
      </div>
      {grid.map((row, y) => (
        <div className="row" key={y}>
          {row.map((c, x) => (
            <span key={x} className={`cell is-${c.kind}`} data-char={c.char}>
              {c.char || " "}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
