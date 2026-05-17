"use client";

const CONTRACT = "0x303AC1D2736C70A9BaE4FC46aAe1c6Ed41C629Af";

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
            <img
              src="/assets/virtualrave-smiley.png"
              alt="Virtual Rave smiley artwork"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                imageRendering: "pixelated",
              }}
            />
            <span className="corner br">LENS / 1 GHO / CC0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
