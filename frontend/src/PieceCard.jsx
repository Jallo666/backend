import './PieceCard.css';
import SilhouettePiece from './SilhouettePiece.jsx';
import { NATURA_COLORE } from './game/questboard/qb_pieces.js';

export default function PieceCard({ piece, onClose }) {
  const isPlayer = piece.side === "player";
  const hpPct = Math.round((piece.hp / piece.hpMax) * 100);
  return (
    <div className="qbg-piece-card">
      <div className="qbg-card-header">
        <span className={`qbg-card-icon qbg-card-icon-${piece.side}`}>
          <SilhouettePiece natura={piece.natura} size={80} />
        </span>
        <span className="qbg-card-title">
          {piece.nome}
          {piece.isRe && <> &nbsp;<span style={{ color: "#f0c040" }}>♛ RE</span></>}
          {piece.natura && (
            <span className="qbg-card-natura" style={{ color: NATURA_COLORE[piece.natura] ?? "#888", borderColor: NATURA_COLORE[piece.natura] ?? "#888" }}>
              {piece.natura}
            </span>
          )}
        </span>
        <span className={`qbg-card-team ${isPlayer ? "qbg-card-team-player" : "qbg-card-team-ai"}`}>
          {isPlayer ? "TUO" : "NEMICO"}
        </span>
        <button className="qbg-card-close" onClick={onClose}>✕</button>
      </div>
      <div className={`qbg-card-silhouette qbg-card-icon-${piece.side}`}>
        <SilhouettePiece natura={piece.natura} size={110} />
      </div>
      <div className="qbg-card-stats">
        {[
          { icon: "❤", val: `${piece.hp}/${piece.hpMax}`, lbl: "HP" },
          { icon: "⚔", val: piece.atk, lbl: "ATK" },
          { icon: "🛡", val: piece.def, lbl: "DEF" },
          { icon: "👟", val: piece.mov, lbl: "MOV" },
        ].map(s => (
          <div key={s.lbl} className="qbg-card-stat">
            <span className="qbg-card-stat-icon">{s.icon}</span>
            <span className="qbg-card-stat-val">{s.val}</span>
            <span className="qbg-card-stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>
      <div className="qbg-card-hp-bar">
        <div className="qbg-card-hp-fill" style={{ width: `${hpPct}%` }} />
      </div>
      <div className="qbg-card-hp-text">{piece.hp} / {piece.hpMax} HP</div>

      {piece.gesta?.length > 0 && (
        <div className="qbg-card-gesta">
          <div className="qbg-card-gesta-title">✨ Gesta</div>
          {piece.gesta.map(g => (
            <div key={g.id} className="qbg-card-gesta-row">
              <span className="qbg-card-gesta-nome">{g.icona} {g.nome}</span>
              <span className="qbg-card-gesta-desc">{g.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
