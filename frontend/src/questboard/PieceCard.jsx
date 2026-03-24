import './PieceCard.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import coronaIcon from '../assets/icon/corona.svg';
import AbilitaList from '../components/AbilitaList.jsx';
import { TagNatura, TagRazza, TagMateriale, TagLivello } from '../components/PieceTag.jsx';
import { livelloPerRicetta } from '../game/questboard/qb_pieces.js';

export default function PieceCard({ piece, onClose, onGestaClick, onArdoreClick, ardoreUsed, isSelected, debuffs = [] }) {
  const isPlayer = piece.side === "player";
  const livello  = livelloPerRicetta(piece.id);
  const hpPct = Math.round((piece.hp / piece.hpMax) * 100);
  const isImmobilized = debuffs.some(d => d.targetUid === piece.uid && d.effect === "immobilize");
  return (
    <div className={`qbg-piece-card${isSelected ? " qbg-card-selected" : ""}`}>
      <div className="qbg-card-header">
        <span className={`qbg-card-icon qbg-card-icon-${piece.side}`}>
          <SilhouettePiece natura={piece.natura} pieceId={piece.id} size={80} />
        </span>
        <span className="qbg-card-title">
          {piece.nome}
          {piece.isRe && <> &nbsp;<img src={coronaIcon} alt="RE" style={{ width: 16, height: 16, verticalAlign: "middle", filter: "drop-shadow(0 0 4px #f0c040)" }} /></>}
          {(piece.natura || piece.razza || piece.materiale) && (
            <div className="qbg-card-tags">
              {piece.natura    && <TagNatura natura={piece.natura} />}
              {piece.razza     && <TagRazza razza={piece.razza} />}
              {piece.materiale && <TagMateriale materiale={piece.materiale} />}
              <TagLivello livello={livello} />
            </div>
          )}
        </span>
        <span className={`qbg-card-team ${isPlayer ? "qbg-card-team-player" : "qbg-card-team-ai"}`}>
          {isPlayer ? "TUO" : "NEMICO"}
        </span>
        <button className="qbg-card-close" onClick={onClose}>✕</button>
      </div>
      <div className={`qbg-card-silhouette qbg-card-icon-${piece.side}`}>
        <SilhouettePiece natura={piece.natura} pieceId={piece.id} size={110} />
      </div>
      <div className="qbg-card-stats">
        {[
          { icon: "❤", val: `${piece.hp}/${piece.hpMax}`, lbl: "HP" },
          { icon: "⚔", val: piece.atk, lbl: "ATK" },
          { icon: "🛡", val: piece.def, lbl: "DEF" },
          { icon: "👟", val: isImmobilized ? <span style={{ color: "#e04040" }}>0</span> : piece.mov, lbl: "MOV" },
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
      {isImmobilized && <div className="qbg-card-debuff">🔒 Immobilizzato</div>}

      <AbilitaList
        cardMode
        gesta={piece.gesta}
        aura={piece.aura}
        ardore={piece.ardore}
        onGestaClick={onGestaClick}
        onArdoreClick={onArdoreClick}
        ardoreUsed={ardoreUsed}
      />
    </div>
  );
}
