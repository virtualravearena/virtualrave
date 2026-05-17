"use client";
import { ClaimTerminal } from "./ClaimTerminal";
import { ClaimSide } from "./ClaimSide";
import { ClaimCC0License } from "./ClaimCC0License";

interface ClaimSectionProps {
  onConnect: () => void;
}

export function ClaimSection({ onConnect }: ClaimSectionProps) {
  return (
    <section id="claim" className="claim">
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" />

      <div className="claim__head">
        <div>
          <div className="section-tag">
            <span className="square" /> SECTION  01 / CLAIM
          </div>
          <h2 className="section-title">
            claim <em>VR 303</em>
          </h2>
        </div>
        <p className="section-blurb">
          Claim your VR 303 on Lens. Each edition costs 1 GHO. Supply stays fixed at 303.
        </p>
      </div>
      <div className="claim__grid">
        <ClaimTerminal onConnect={onConnect} />
        <ClaimSide />
        <ClaimCC0License />
      </div>
    </section>
  );
}
