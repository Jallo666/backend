import { useState } from 'react';
import './RotazioneTracker.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import { canMoveInRotation } from '../game/questboard/qb_rules.js';

function PieceRow({ p, rotation, isAi, collapsed, onClick, selected }) {
  const ready = canMoveInRotation(p.uid, rotation);
  return (
    <div
      className={`qbg-rot-row ${isAi ? "qbg-rot-row-ai" : ""} ${ready ? "qbg-rot-ready" : "qbg-rot-done"} ${selected ? "qbg-rot-selected" : ""}`}
      onClick={() => onClick(p)}
    >
      <span className="qbg-rot-icon"><SilhouettePiece natura={p.natura} size={36} /></span>
      {!collapsed && (
        <div className="qbg-rot-info">
          <span className="qbg-rot-nome">
            {p.isRe && <span className="qbg-rot-crown">♛</span>}
            {p.nome}
            {!ready && <span className="qbg-rot-zzz-inline">💤</span>}
          </span>
          <span className="qbg-rot-stats">❤ {p.hp} &nbsp;⚔ {p.atk} &nbsp;🛡 {p.def}</span>
        </div>
      )}
    </div>
  );
}

export default function RotazioneTracker({ game, openPieceTab, selectedUid }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`qbg-rotation ${collapsed ? "qbg-rotation-collapsed" : ""}`}>
      <button className="qbg-rot-toggle" onClick={() => setCollapsed(v => !v)}>
        {collapsed ? "›" : "‹"}
      </button>

      <div className="qbg-rot-content">
        {!collapsed && <div className="qbg-rot-section-label qbg-rot-section-player">⚔ TUE</div>}
        {game.playerPieces.map(p => (
          <PieceRow key={p.uid} p={p} rotation={game.playerRotation} isAi={false} collapsed={collapsed} onClick={openPieceTab} selected={p.uid === selectedUid} />
        ))}

        {!collapsed && <>
          <div className="qbg-rot-divider" />
          <div className="qbg-rot-section-label qbg-rot-section-ai">🤖 AI</div>
        </>}
        {game.aiPieces.map(p => (
          <PieceRow key={p.uid} p={p} rotation={game.aiRotation} isAi={true} collapsed={collapsed} onClick={openPieceTab} selected={p.uid === selectedUid} />
        ))}
      </div>
    </div>
  );
}
