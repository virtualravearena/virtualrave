"use client";
import { useConnect } from "wagmi";
import { OrbLoginPanel, type OrbSession } from "./OrbLoginPanel";

interface WalletModalProps {
  onClose: () => void;
  orbSession: OrbSession | null;
  onOrbAuthenticated: (session: OrbSession) => void;
  onOrbLogout: () => void;
}

export function WalletModal({
  onClose,
  orbSession,
  onOrbAuthenticated,
  onOrbLogout,
}: WalletModalProps) {
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
        <OrbLoginPanel
          session={orbSession}
          onAuthenticated={onOrbAuthenticated}
          onLogout={onOrbLogout}
          onAuthSuccess={onClose}
        />
        <div className="modal__label">
          then choose your wallet  lens network
        </div>
        <div className="modal__wallets">
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
