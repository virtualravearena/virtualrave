"use client";
import { AsciiSmiley } from "./AsciiSmiley";

const CONTRACT_SHORT = "0x303A...29Af";

export function Hero() {
  return (
    <section id="hero" className="hero">
      <video
        className="hero__bg-video"
        src="/video/bg.webm"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="hero__bg-scrim" />

      <div className="hero__grid">
        <div className="hero__chrome">
          <span className="chip"><span className="swatch" /><strong>DROP_01  VR 303</strong></span>
          <span className="chip">LENS MAINNET</span>
          <span className="chip">303 EDITIONS  1 GHO</span>
          <span className="chip">CONTRACT  {CONTRACT_SHORT}</span>
        </div>

        <div className="hero__stage">
          <span className="hero__caption tl">
            <span className="marker" />VIRTUAL RAVE VR 303 / 1981
          </span>
          <span className="hero__caption tr">
            ACID HISTORY<br />1981 TO 2026
          </span>
          <span className="hero__caption bl">
            <span className="lead" />HOVER, DRAG, PLAY
          </span>
          <span className="hero__caption br">
            EDITION OF 303<br />1 GHO ON LENS
          </span>
          <AsciiSmiley cols={38} rows={32} />
        </div>
      </div>

      <div className="hero__wordmark">
        <h1>
          VIRTUAL <span className="acid">rave<sup>303</sup></span>
        </h1>
        <p className="tagline">
          <span className="bar" />
          CLAIM 1 OF 303 EDITIONS
          <span className="bar" />
        </p>
      </div>

      <div className="hero__bottom-bar">
        <div><span className="k">// DROP</span><span className="v">VR 303 / 01</span></div>
        <div><span className="k">// EDITIONS</span><span className="v">303</span></div>
        <div><span className="k">// PRICE</span><span className="v">1 GHO</span></div>
        <div><span className="k">// CHAIN</span><span className="v">LENS</span></div>
      </div>
    </section>
  );
}
