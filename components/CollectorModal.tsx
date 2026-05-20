"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getVr303Artwork } from "@/lib/vr303Artwork";
import {
  lenscanBlockUrl,
  lenscanTokenUrl,
  lenscanTxUrl,
  padTokenId,
  truncateAddress,
} from "@/lib/vr303Constants";
import { CONTRACT } from "@/lib/wagmi";
import type { CollectorRecord } from "@/lib/collectors";

interface CollectorModalProps {
  record: CollectorRecord;
  onClose: () => void;
}

function formatUtc(ts: number): string {
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  );
}

export function CollectorModal({ record, onClose }: CollectorModalProps) {
  const [copied, setCopied] = useState(false);
  const padded = padTokenId(record.tokenId);
  const artworkUrl = getVr303Artwork(record.tokenId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(record.owner);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      className="dm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
    >
      <motion.div
        className="dm dm--collector"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm__bar">
          <span className="dm__bar-tag">
            <span className="dm__bar-ico"></span>
            vr303_{padded}.exe  edition_{padded}_of_303
          </span>
          <div className="dm__bar-ctrls">
            <span />
            <span />
            <button className="dm__close" onClick={onClose} aria-label="Close"></button>
          </div>
        </div>

        <div className="dm__body cwall-modal__body">
          <div className="cwall-modal__art">
            {artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artworkUrl} alt={`VR 303 edition ${record.tokenId}`} />
            ) : (
              <span className="cwall-tile__fallback">[ NO ART ]</span>
            )}
          </div>

          <div className="cwall-modal__info">
            <div className="cwall-modal__title">
              EDITION <em>{padded}</em> / 303
            </div>

            <div className="spec-list">
              <div className="row">
                <span className="k">COLLECTOR</span>
                <span className="v" style={{ fontSize: 11, wordBreak: "break-all" }}>
                  {record.owner}
                  <button
                    type="button"
                    className="cwall-modal__copy"
                    onClick={handleCopy}
                  >
                    {copied ? "[ COPIED ]" : "[ COPY ]"}
                  </button>
                </span>
              </div>
              <div className="row">
                <span className="k">BLOCK</span>
                <span className="v">
                  <a href={lenscanBlockUrl(record.blockNumber)} target="_blank" rel="noopener noreferrer">
                    {record.blockNumber}
                  </a>
                </span>
              </div>
              <div className="row">
                <span className="k">MINTED</span>
                <span className="v">{formatUtc(record.blockTimestamp)}</span>
              </div>
              <div className="row">
                <span className="k">TX HASH</span>
                <span className="v" style={{ fontSize: 11 }}>
                  <a href={lenscanTxUrl(record.txHash)} target="_blank" rel="noopener noreferrer">
                    {truncateAddress(record.txHash, 8, 6)}
                  </a>
                </span>
              </div>
              <div className="row">
                <span className="k">CONTRACT</span>
                <span className="v" style={{ fontSize: 11, wordBreak: "break-all" }}>
                  <a href={lenscanTokenUrl(CONTRACT, record.tokenId)} target="_blank" rel="noopener noreferrer">
                    {CONTRACT}
                  </a>
                </span>
              </div>
            </div>

            <div className="cwall-modal__cta">
              <a
                className="dm__cta-btn"
                href={lenscanTokenUrl(CONTRACT, record.tokenId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                VIEW ON LENSCAN
                <span className="dm__cta-arr"></span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
