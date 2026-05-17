"use client";

const CC0_PERMS = [
  { ico: "$", label: "COMMERCIAL USE", body: "Sell merch, prints, releases, zines, games, or products." },
  { ico: "*", label: "MODIFY AND REMIX", body: "Edit the art, change colors, animate it, or combine it with other work." },
  { ico: "#", label: "MERCH AND PRINT", body: "Use it on shirts, posters, stickers, records, flyers, tapes, and packaging." },
  { ico: "</>", label: "BUILD ON IT", body: "Use it in contracts, apps, sites, games, avatars, and worlds." },
];

const CC0_LIMITS = [
  { label: "CLAIM COPYRIGHT", body: "You cannot take public domain VR 303 art and claim exclusive rights over it." },
  { label: "RESTRICT OTHERS", body: "You cannot stop other people from using the same public domain artwork." },
];

const CC0_STEPS = [
  "Find or download your VR 303 edition.",
  "Use it in any personal, public, or commercial project.",
  "Credit Virtual Rave only if you want to.",
  "Share, sell, remix, or build without asking permission.",
];

export function ClaimCC0License() {
  return (
    <div className="win cc0-win claim__cc0">
      <div className="win__bar">
        <div className="title">
          <span className="ico"></span> cc0_license.txt
        </div>
        <div className="ctrls">
          <span className="ctrl">_</span>
          <span className="ctrl"></span>
          <span className="ctrl">x</span>
        </div>
      </div>
      <div className="win__body" style={{ padding: "12px 16px 16px" }}>
        <div className="cc0-header">
          <span className="cc0-badge">CC0</span>
          <div>
            <div className="cc0-title">NO RIGHTS RESERVED</div>
            <div className="cc0-sub">Creative Commons Zero, public domain dedication</div>
          </div>
        </div>

        <p className="cc0-lead">
          VR 303 artwork is dedicated to the public domain. RPS-01 sits on top of that and explains how the network uses it. You can use the art for personal, public, and commercial work. You do not need permission.
        </p>

        <div className="cc0-section">
          <div className="cc0-section-title">WHAT YOU CAN DO</div>
          <div className="cc0-grid">
            {CC0_PERMS.map(({ ico, label, body }) => (
              <div className="cc0-item" key={label}>
                <span className="cc0-ico">{ico}</span>
                <div>
                  <div className="cc0-item-label">{label}</div>
                  <div className="cc0-item-body">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cc0-section cc0-section--warn">
          <div className="cc0-section-title">WHAT YOU CANNOT DO</div>
          <div className="cc0-grid cc0-grid--limits">
            {CC0_LIMITS.map(({ label, body }) => (
              <div className="cc0-item" key={label}>
                <span className="cc0-ico">!</span>
                <div>
                  <div className="cc0-item-label">{label}</div>
                  <div className="cc0-item-body">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cc0-section cc0-section--steps">
          <div className="cc0-section-title">HOW TO USE IT</div>
          <ol className="cc0-steps">
            {CC0_STEPS.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>

        <div className="cc0-section">
          <div className="cc0-section-title">RPS-01</div>
          <div className="cc0-grid">
            <div className="cc0-note">CC0 keeps the art free.</div>
            <div className="cc0-note">RPS-01 handles network signals, nodes, and archive rules.</div>
          </div>
        </div>

        <div className="cc0-grid">
          <div className="cc0-note">USE IT. SHARE IT. REMIX IT. SELL IT.</div>
          <div className="cc0-note">ATTRIBUTION IS WELCOME. IT IS NOT REQUIRED.</div>
        </div>
      </div>
    </div>
  );
}
