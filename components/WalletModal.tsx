"use client";
import { useConnect } from "wagmi";

interface WalletModalProps {
  onClose: () => void;
}

export function WalletModal({ onClose }: WalletModalProps) {
  const { connect, connectors } = useConnect();

  const walletIcons: Record<string, string> = {
    injected: "",
    walletConnect: "",
    metaMask: "",
    coinbaseWallet: "",
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="win__bar">
          <div className="title">
            <span className="ico"></span> connect_wallet.dlg
          </div>
          <div className="ctrls">
            <span className="ctrl" onClick={onClose}>
              
            </span>
          </div>
        </div>
        <div
          style={{
            padding: "10px 16px 0",
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          choose your wallet  lens network
        </div>
        <div style={{ marginTop: 8 }}>
          {connectors.map((connector) => (
            <div
              key={connector.uid}
              className="opt"
              onClick={() => {
                connect({ connector });
                onClose();
              }}
            >
              <span className="name">
                <span className="ic">
                  {walletIcons[connector.id] ?? ""}
                </span>
                {connector.name}
              </span>
              <span className="arr"></span>
            </div>
          ))}
        </div>
        <div className="modal__foot">
          <span>CHECK THE WALLET PROMPT BEFORE YOU SIGN</span>
          <span>LENS  CHAIN 232</span>
        </div>
      </div>
    </div>
  );
}
