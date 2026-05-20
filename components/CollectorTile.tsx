"use client";
import { useState } from "react";
import { getVr303Artwork } from "@/lib/vr303Artwork";
import { padTokenId, truncateAddress } from "@/lib/vr303Constants";
import type { CollectorRecord } from "@/lib/collectors";

interface CollectorTileProps {
  record: CollectorRecord;
  isYours: boolean;
  onOpen: (record: CollectorRecord) => void;
}

export function CollectorTile({ record, isYours, onOpen }: CollectorTileProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const displayEdition = record.metadata?.edition ?? record.tokenId + 1;
  const artworkUrl = record.metadata?.image ?? getVr303Artwork(record.tokenId);
  const showFallback = !artworkUrl || imgFailed;

  return (
    <button
      type="button"
      className={`cwall-tile${isYours ? " cwall-tile--yours" : ""}`}
      onClick={() => onOpen(record)}
      aria-label={`Edition ${padTokenId(displayEdition)} of 303, token ${record.tokenId}, collected by ${record.owner}`}
    >
      <span className="cwall-tile__corner cwall-tile__corner--tl">
        {padTokenId(displayEdition)} / 303
      </span>

      {showFallback ? (
        <span className="cwall-tile__fallback">[ NO ART ]</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="cwall-tile__img"
          src={artworkUrl}
          alt={`VR 303 edition ${displayEdition}`}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      )}

      <span className="cwall-tile__owner">
        {truncateAddress(record.owner)}
      </span>

      {isYours ? <span className="cwall-tile__badge">YOURS</span> : null}
    </button>
  );
}
