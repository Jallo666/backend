import { useState } from "react";
import "./GameOptionsModal.css";

export default function GameOptionsModal({ onClose, onRestart, onRetire }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="gom-overlay">
        <div className="gom-box">
          <h2 className="gom-title">⚠ SEI SICURO DI RITIRARTI?</h2>
          <div className="gom-btns">
            <button className="qbg-btn qbg-btn-gold" onClick={onRetire}>Sì, ritirati</button>
            <button className="qbg-btn qbg-btn-dark"  onClick={() => setConfirm(false)}>No, continua</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gom-overlay">
      <div className="gom-box">
        <h2 className="gom-title">⚙ Opzioni</h2>
        <div className="gom-btns">
          <button className="qbg-btn qbg-btn-gold" onClick={onRestart}>↺ Ricomincia</button>
          <button className="qbg-btn qbg-btn-dark"  onClick={() => setConfirm(true)}>⚑ Ritirati</button>
        </div>
        <button className="gom-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
