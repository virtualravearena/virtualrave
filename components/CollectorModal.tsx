"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getVr303Artwork } from "@/lib/vr303Artwork";
import { lenscanTokenUrl, padTokenId } from "@/lib/vr303Constants";
import { CONTRACT } from "@/lib/wagmi";
import type { CollectorRecord } from "@/lib/collectors";

interface CollectorModalProps {
  record: CollectorRecord;
  onClose: () => void;
}

export function CollectorModal({ record, onClose }: CollectorModalProps) {
  const [copied, setCopied] = useState(false);
  const metadata = record.metadata ?? null;
  const displayEdition = metadata?.edition ?? record.tokenId + 1;
  const padded = padTokenId(displayEdition);
  const artworkUrl = metadata?.image ?? getVr303Artwork(record.tokenId);
  const attributes = metadata?.attributes ?? [];
  const mintedAt = metadata?.date ? new Date(metadata.date).toLocaleString() : null;
  const tokenLabel = padTokenId(record.tokenId);

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
            vr303_{padded}.exe  token_{tokenLabel}_edition_{padded}_of_303
          </span>
          <div className="dm__bar-ctrls">
            <span />
            <span />
            <button className="dm__close" onClick={onClose} aria-label="Close"></button>
          </div>
        </div>

        <div className="dm__body cwall-modal__body">
          <div className="cwall-modal__art">
            <div className="cwall-modal__art-hud cwall-modal__art-hud--top">
              <span>LOCKED IMAGE</span>
              <span>EDITION {padded}</span>
            </div>
            {artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artworkUrl} alt={`VR 303 edition ${displayEdition}`} />
            ) : (
              <span className="cwall-tile__fallback">[ NO ART ]</span>
            )}
            <div className="cwall-modal__art-hud cwall-modal__art-hud--bottom">
              <span>TOKEN {tokenLabel}</span>
              <span>303 RAVE FILE</span>
            </div>
          </div>

          <div className="cwall-modal__info">
            <div className="cwall-modal__title-wrap">
              <div className="cwall-modal__eyebrow">
                <span>COLLECTOR FILE</span>
                <span>ON-CHAIN ARTIFACT</span>
              </div>
              <div className="cwall-modal__title">
                EDITION <em>{padded}</em> / 303
              </div>
              <div className="cwall-modal__ticker">
                <span>VIRTUAL RAVERS 303</span>
                <span>TRAITS {attributes.length}</span>
                <span>{metadata?.compiler ?? "CHAIN VERIFIED"}</span>
              </div>
            </div>

            {metadata ? (
              <div className="cwall-modal__lead">
                <p>{metadata.description}</p>
                <div className="cwall-modal__source">
                  <span>// {metadata.name}</span>
                  <span>{metadata.compiler}</span>
                </div>
              </div>
            ) : null}

            <div className="spec-list cwall-modal__spec-list">
              <div className="row">
                <span className="k">COLLECTOR</span>
                <span className="v cwall-modal__address">
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
                <span className="k">CONTRACT</span>
                <span className="v cwall-modal__address">
                  <a href={lenscanTokenUrl(CONTRACT, record.tokenId)} target="_blank" rel="noopener noreferrer">
                    {CONTRACT}
                  </a>
                </span>
              </div>
              <div className="row">
                <span className="k">TOKEN ID</span>
                <span className="v">{record.tokenId}</span>
              </div>
              {mintedAt ? (
                <div className="row">
                  <span className="k">MINTED</span>
                  <span className="v">{mintedAt}</span>
                </div>
              ) : null}
              {metadata ? (
                <div className="row">
                  <span className="k">IMAGE</span>
                  <span className="v cwall-modal__uri">
                    {metadata.image}
                  </span>
                </div>
              ) : null}
            </div>

            {attributes.length > 0 ? (
              <div className="cwall-modal__trait-panel">
                <div className="cwall-modal__section-head">
                  <span>TRAIT MANIFEST</span>
                  <span>{attributes.length} SIGNALS</span>
                </div>
                <div className="cwall-modal__traits">
                  {attributes.map((attr, index) => (
                    <div key={`${attr.trait_type}:${attr.value}`} className="cwall-modal__trait">
                      <span className="cwall-modal__trait-index">{padTokenId(index + 1)}</span>
                      <span className="cwall-modal__trait-k">{attr.trait_type}</span>
                      <span className="cwall-modal__trait-v">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="cwall-modal__trait-panel cwall-modal__trait-panel--empty">
                <div className="cwall-modal__section-head">
                  <span>TRAIT MANIFEST</span>
                  <span>NO LOCAL SIGNAL</span>
                </div>
                <p>Metadata has not been attached to this collector record yet.</p>
              </div>
            )}

            {metadata ? (
              <div className="cwall-modal__foot">
                <span className="cwall-modal__dna">DNA {metadata.dna}</span>
                <span className="cwall-modal__edition">EDITION {padded}</span>
              </div>
            ) : null}

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
