"use client";
import { CONTRACT } from "@/lib/wagmi";

export function Footer() {
  return (
    <footer id="foot" className="foot">
      <div className="foot__grid">
        <div className="foot__cell">
          <h4>// END OF PAGE</h4>
          <p className="foot__big">collect <em>one</em><br />use <em>yours</em></p>
        </div>
        <div className="foot__cell">
          <h4>// THE MACHINES</h4>
          <div className="foot__list">
            <a href="#claim"><span>303  VR 303</span><span className="ext">LENS</span></a>
            <a href="#drops"><span>909  TR 909</span><span className="ext foot__ext--blur">BASE</span></a>
            <a href="#drops"><span>808  TR 808</span><span className="ext foot__ext--blur">MEGA</span></a>
            <a href="#drops"><span>707  TR 707</span><span className="ext foot__ext--blur">SONE</span></a>
            <a href="#drops"><span>606  TR 606</span><span className="ext foot__ext--blur">ABST</span></a>
            <a href="#drops"><span>505  TR 505</span><span className="ext foot__ext--blur">HYPER</span></a>
            <a href="#drops"><span>1000  TR 1000</span><span className="ext foot__ext--blur">SOL</span></a>
          </div>
        </div>
        <div className="foot__cell">
          <h4>// LINKS</h4>
          <div className="foot__list">
            <a href="https://x.com/virtualrave" target="_blank" rel="noreferrer"><span>x.com/virtualrave</span><span className="ext"></span></a>
            <a href="mailto:hey@virtualrave.xyz"><span>hey@virtualrave.xyz</span><span className="ext">@</span></a>
          </div>
        </div>
      </div>
      <div className="foot__bottom">
        <span> 2026  VIRTUAL RAVE  CC0</span>
        <span style={{ fontFamily: "var(--mono)" }}>{CONTRACT}  LENS 232</span>
        <span> FOR EVERY KID WHO HEARD ACID HOUSE FOR THE FIRST TIME </span>
      </div>
    </footer>
  );
}
