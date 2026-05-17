"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { lensMainnet, CONTRACT } from "@/lib/wagmi";

const CLAIM_ABI = [
  {
    name: "claim",
    type: "function",
    inputs: [
      { name: "quantity", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
] as const;

const SUPPLY_ABI = [
  {
    name: "totalClaimed",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

function ProgressBar({
  minted,
  total,
  segments = 40,
}: {
  minted: number;
  total: number;
  segments?: number;
}) {
  const filled = Math.round((minted / total) * segments);
  return (
    <div className="progress">
      {Array.from({ length: segments }, (_, i) => {
        const on = i < filled;
        const last = i === filled - 1;
        return (
          <span
            key={i}
            className={`seg${on ? " on" : ""}${last ? " last" : ""}`}
          />
        );
      })}
    </div>
  );
}

interface ClaimTerminalProps {
  onConnect: () => void;
}

export function ClaimTerminal({ onConnect }: ClaimTerminalProps) {
  const { address, isConnected } = useAccount();
  const [qty, setQty] = useState(1);
  const [txStatus, setTxStatus] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [step, setStep] = useState("");
  const total = 303;

  const { data: supplyRaw, refetch: refetchSupply } = useReadContract({
    address: CONTRACT,
    abi: SUPPLY_ABI,
    functionName: "totalClaimed",
    chainId: lensMainnet.id,
    query: { refetchInterval: 15_000 },
  });

  const minted = supplyRaw !== undefined ? Number(supplyRaw) : null;

  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      refetchSupply();
      setTxStatus("success");
      setStep(txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-6)}` : "confirmed");
    }
  }, [txConfirmed, txHash, refetchSupply]);

  const handleClaim = async () => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (txStatus === "busy" || isPending) return;

    setTxStatus("busy");
    setStep("REQUESTING SIGNATURE...");

    try {
      await writeContractAsync({
        address: CONTRACT,
        abi: CLAIM_ABI,
        functionName: "claim",
        args: [BigInt(qty), []],
        value: parseUnits("1", 18) * BigInt(qty),
        chainId: lensMainnet.id,
        gas: BigInt(300_000),
      });

      const postSteps = [
        "BROADCASTING TO LENS...",
        `PAYING ${qty} GHO + GAS...`,
        "WRITING TO CHAIN...",
      ];
      for (const s of postSteps) {
        setStep(s);
        await new Promise((r) => setTimeout(r, 700));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const rejected = msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("cancel");
      if (rejected) {
        setTxStatus("idle");
        setStep("");
      } else {
        setTxStatus("error");
        setStep("TX FAILED. TRY AGAIN");
      }
    }
  };

  const reset = () => {
    setTxStatus("idle");
    setStep("");
    setQty(1);
  };

  const walletDisplay = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const mintedDisplay = minted !== null ? minted : "...";
  const pctDisplay = minted !== null ? ((minted / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="win">
      <div className="win__bar">
        <div className="title">
          <span className="ico"></span> claim_terminal.exe  VR 303
        </div>
        <div className="ctrls">
          <span className="ctrl">_</span>
          <span className="ctrl"></span>
          <span className="ctrl">x</span>
        </div>
      </div>
      <div className="win__body">
        <div className="claim__counter">
          <div>
            <div className="label">MINTED / SUPPLY</div>
            <div className="big">
              {String(mintedDisplay).padStart(3, "0")}
              <span className="of"> / {total}</span>
            </div>
          </div>
          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <ProgressBar minted={minted ?? 0} total={total} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label">% MINTED</div>
            <div className="big">
              {pctDisplay}
              <span style={{ fontSize: 22 }}>%</span>
            </div>
          </div>
        </div>

        <div className="field">
          <label>
            <span>// WALLET</span>
            <span className="hint">{isConnected ? "CONNECTED  LENS" : "NOT CONNECTED"}</span>
          </label>
          <div className="input">
            <input value={walletDisplay || "0x... connect a wallet to fill this in"} readOnly />
            <button className="suffix" onClick={onConnect}>
              {isConnected ? "CHANGE" : "CONNECT"}
            </button>
          </div>
        </div>

        <div className="claim__row2">
          <div className="claim__qty-wrap">
            <label className="claim__sublabel">// QUANTITY</label>
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>-</button>
              <div className="val">{String(qty).padStart(2, "0")}</div>
              <button onClick={() => setQty((q) => Math.min(303, q + 1))} disabled={qty >= 303}>+</button>
            </div>
          </div>
          <div className="claim__price-wrap">
            <label className="claim__sublabel">// EST. TOTAL</label>
            <div className="price-card">
              <div className="k">PAY ON LENS</div>
              <div><span className="v">{qty} GHO</span></div>
            </div>
          </div>
        </div>

        {txStatus === "success" ? (
          <button className="btn-claim is-success" onClick={reset}>
            <span>CLAIMED. VR 303 MINTED.</span>
            <span className="arr"></span>
          </button>
        ) : (
          <button
            className={`btn-claim${txStatus === "busy" || isPending ? " is-busy" : ""}`}
            onClick={handleClaim}
            disabled={txStatus === "busy" || isPending}
          >
            <span>
              {txStatus === "busy" || isPending
                ? step
                : isConnected
                ? `CLAIM VR 303 x 0${qty}`
                : "CONNECT WALLET TO CLAIM"}
              <span className="mini" style={{ display: "block" }}>
                {txStatus === "busy" || isPending
                  ? "DO NOT CLOSE THIS WINDOW..."
                  : `${qty} GHO  LENS NETWORK`}
              </span>
            </span>
            <span className="arr">{txStatus === "busy" || isPending ? "..." : ""}</span>
          </button>
        )}

        <div className="claim__notes">
          {txStatus === "success" ? (
            <>
              <div className="li">TX HASH  <strong>{step}</strong></div>
              <div className="li">YOUR VR 303 IS ON LENS.</div>
              <div className="li">CHECK LENSCAN, OPENSEA, OR FAMILY.</div>
            </>
          ) : txStatus === "error" ? (
            <>
              <div className="li" style={{ color: "red" }}>{step}</div>
              <div className="li">Add GHO on Lens, then try again.</div>
            </>
          ) : (
            <>
              <div className="li">No wallet limit. 1 GHO each, plus Lens gas.</div>
              <div className="li">Claim stops at 303 of 303 minted.</div>
              <div className="li">On-chain renderer. CC0 license.</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
