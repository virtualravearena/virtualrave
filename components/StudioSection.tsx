"use client";
import { MutableRefObject } from "react";
import { TB303Sequencer, StudioBridge } from "./Studio";

export function StudioSection({
  bridgeRef,
}: {
  bridgeRef: MutableRefObject<StudioBridge | null>;
}) {
  return (
    <section id="studio" className="studio">
      <div className="studio__head">
        <div>
          <div className="section-tag">
            <span className="square" /> SECTION  03 / STUDIO
          </div>
          <h2 className="section-title">
            build <em>ACID</em> sounds
          </h2>
        </div>
        <p className="section-blurb">
          Use 16 steps, 13 notes, accent, slide, and four filter controls.
          Press RUN, tune the pattern, then export a MIDI file.
        </p>
      </div>

      <TB303Sequencer bridgeRef={bridgeRef} />
    </section>
  );
}
