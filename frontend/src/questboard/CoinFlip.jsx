import { useState } from "react";
import "./QuestBoardGame.css";

export default function CoinFlip({ onChoice }) {
  const [result, setResult] = useState(null);

  const flip = () => setResult(Math.random() < 0.5 ? "heads" : "tails");

  return (
    <div className="qbg-overlay">
      <div className="qbg-dialog">
        <h2 className="qbg-dialog-title">⚜ Tiro di Moneta</h2>
        {!result ? (
          <>
            <p className="qbg-dialog-sub">Chi va per primo?</p>
            <button className="qbg-btn qbg-btn-gold" onClick={flip}>🪙 Lancia la moneta</button>
          </>
        ) : (
          <>
            <div className="qbg-coin-result">
              <span className={`qbg-coin ${result}`}>{result === "heads" ? "👑" : "🗡"}</span>
              <p>{result === "heads" ? "Testa — hai vinto!" : "Croce"}</p>
            </div>
            <p className="qbg-dialog-sub">Vuoi andare per primo?</p>
            <div className="qbg-dialog-row">
              <button className="qbg-btn qbg-btn-gold" onClick={() => onChoice(true)}>Sì, primo</button>
              <button className="qbg-btn qbg-btn-dark"  onClick={() => onChoice(false)}>No, secondo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
