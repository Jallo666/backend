import "./QuestBoardGame.css";

export default function GameOverModal({ winner, onBack }) {
  return (
    <div className="qbg-overlay">
      <div className="qbg-dialog">
        <h2 className={`qbg-dialog-title ${winner === "player" ? "qbg-win" : "qbg-lose"}`}>
          {winner === "player" ? "⚜ VITTORIA!" : winner === "ai" ? "☠ SCONFITTA" : "⚖ PAREGGIO"}
        </h2>
        {winner === "player" && <p className="qbg-dialog-sub">+50 💎 gemme</p>}
        <button className="qbg-btn qbg-btn-gold" onClick={onBack}>← Torna alla Locanda</button>
      </div>
    </div>
  );
}
