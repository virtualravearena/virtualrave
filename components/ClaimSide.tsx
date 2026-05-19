"use client";
import { CONTRACT } from "@/lib/wagmi";

const previewSlides = [
  { src: "/assets/virtualrave-smiley.webp", alt: "Virtual Rave smiley artwork" },
  { src: "/assets/1.webp", alt: "Virtual Rave collaboration artwork 1" },
  { src: "/assets/2.webp", alt: "Virtual Rave collaboration artwork 2" },
  { src: "/assets/3.webp", alt: "Virtual Rave collaboration artwork 3" },
  { src: "/assets/4.webp", alt: "Virtual Rave collaboration artwork 4" },
];

const specs = [
  ["DROP", "VIRTUAL RAVE / VR 303"],
  ["TOKEN", "VirtualRaversLens"],
  ["EDITION", "01 of 07 COLLECTIONS"],
  ["SUPPLY", "303 / NO WALLET LIMIT"],
  ["PRICE", "1 GHO ON LENS"],
  ["CHAIN", "LENS MAINNET / 232"],
  ["STANDARD", "ERC-721"],
  ["RENDERER", "ON-CHAIN / ASCII"],
  ["LICENSE", "CC0 / PUBLIC DOMAIN"],
  ["RELEASE", "05/15/2026 / 17:02 UTC"],
];

export function ClaimSide() {
  return (
    <div className="claim__side">
      <div className="win">
        <div className="win__bar">
          <div className="title">
            <span className="ico">i</span> drop_specs.txt
          </div>
          <div className="ctrls">
            <span className="ctrl">_</span>
            <span className="ctrl"></span>
            <span className="ctrl">x</span>
          </div>
        </div>
        <div className="win__body" style={{ padding: "8px 16px" }}>
          <div className="spec-list">
            {specs.map(([k, v]) => (
              <div className="row" key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </div>
            ))}
            <div className="row">
              <span className="k">CONTRACT</span>
              <span
                className="v"
                style={{ fontSize: 10, wordBreak: "break-all" }}
              >
                {CONTRACT}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="win">
        <div className="win__bar">
          <div className="title">
            <span className="ico"></span> preview.bmp
          </div>
          <div className="ctrls">
            <span className="ctrl">_</span>
            <span className="ctrl"></span>
            <span className="ctrl">x</span>
          </div>
        </div>
        <div className="win__body preview-card" style={{ padding: 0 }}>
          <div className="frame">
            <span className="corner tl">VR 303 / 1 / 303</span>
            <div className="preview-card__slides">
              {previewSlides.map((slide, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  style={{ animationDelay: `${index * 2.4}s` }}
                />
              ))}
            </div>
            <span className="corner br">LENS / 1 GHO / CC0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
