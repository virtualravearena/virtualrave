"use client";
import { CONTRACT } from "@/lib/wagmi";

export function Ticker() {
  const items = [
    "  VIRTUAL_RAVE",
    "DROP_01",
    "VR-303",
    "1 GHO",
    "303 EDITIONS",
    "LENS MAINNET",
    `CONTRACT ${CONTRACT}`,
    "LIVE NOW ",
  ];

  return (
    <div className="ticker">
      <div className="ticker__track">
        {[0, 1].map((group) => (
          <div className="ticker__group" key={group} aria-hidden={group === 1}>
            {items.map((s) => (
              <span key={`${group}-${s}`}><span className="dot"></span>&nbsp; {s}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
