"use client";
export function Strip({ alt }: { alt?: boolean }) {
  const phrase = "VR 303    303 EDITIONS    1 GHO ON LENS    CC0 ARTWORK    COLLECT YOURS    ";
  const list = Array.from({ length: 6 }, () => phrase).join(" ");
  return (
    <div className={`strip ${alt ? "strip--alt" : ""}`}>
      <div className="strip__track">
        <span>{list}</span>
        <span>{list}</span>
      </div>
    </div>
  );
}
