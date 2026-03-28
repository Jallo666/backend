import './LogPieceContent.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import PieceStats from '../components/PieceStats.jsx';
import HpGauge from '../components/HpGauge.jsx';
import AbilitaList from '../components/AbilitaList.jsx';
import { TagNatura, TagRazza, TagMateriale, TagLivello, TagRe, TagDebuff, TagDormiente, TagSide } from '../components/PieceTag.jsx';
import { livelloPerRicetta } from '../game/questboard/qb_pieces.js';

export default function LogPieceContent({ pieceCard, setPieceCard, setActiveTab, onGestaClick, onArdoreClick, ardoreUsed, debuffs = [], isDormiente = false, selectedUid }) {
  const piece = pieceCard;
  const isPlayer = piece.side === "player";
  const livello  = livelloPerRicetta(piece.id);
  const pieceDebuffs = debuffs.filter(d => d.targetUid === piece.uid);
  const isImmobilized = pieceDebuffs.some(d => d.effect === "immobilize");
  const statsPiece = isImmobilized ? { ...piece, mov: <span style={{ color: "#e04040" }}>0</span> } : piece;
  const DEBUFF_LABEL = { immobilize: "Immobilizzato" };
  const isActiveOnBoard = selectedUid === piece.uid;

  return (
    <div className={`lpc-card${isActiveOnBoard ? " lpc-card-active" : ""}`}>

      {/* Header */}
      <div className="lpc-header">
        <span className="lpc-title">
          {piece.nome}
          <TagLivello livello={livello} />
          {piece.isRe && <TagRe />}
        </span>
        <TagSide side={piece.side} />
        <button className="lpc-close" onClick={() => { setPieceCard(null); setActiveTab('diario'); }}>✕</button>
      </div>

      {/* Silhouette + Stats + Tag */}
      <div className="lpc-hero">
        <div className={`lpc-silhouette ${isPlayer ? "lpc-silhouette-player" : "lpc-silhouette-ai"}`}>
          <SilhouettePiece natura={piece.natura} pieceId={piece.id} size={180} />
        </div>
        <PieceStats piece={statsPiece} />
        <div className="lpc-tags">
          {piece.natura    && <TagNatura natura={piece.natura} />}
          {piece.razza     && <TagRazza razza={piece.razza} />}
          {piece.materiale && <TagMateriale materiale={piece.materiale} />}
        </div>
      </div>

      {/* HP */}
      <HpGauge hp={piece.hp} hpMax={piece.hpMax} />

      {/* Status */}
      {(pieceDebuffs.length > 0 || isDormiente) && (
        <div className="lpc-status">
          <span className="lpc-status-label">Stato</span>
          <div className="lpc-status-tags">
            {isDormiente && <TagDormiente />}
            {pieceDebuffs.map((d, i) => (
              <TagDebuff key={i} label={DEBUFF_LABEL[d.effect] ?? d.effect} />
            ))}
          </div>
        </div>
      )}

      {/* Abilità in fondo */}
      <div className="lpc-abilities">
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

    </div>
  );
}
