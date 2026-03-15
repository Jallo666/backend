import { useState } from 'react';
import './RotazioneTracker.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import { canMoveInRotation, canUseArdore } from '../game/questboard/qb_rules.js';
import ardoreIcon from '../assets/icon/ardore.svg';
import gestaIcon  from '../assets/icon/gesta.svg';

function PieceRow({ p, rotation, ardoreTracker, isAi, collapsed, onClick, selected }) {
  const ready = canMoveInRotation(p.uid, rotation);
  const hasArdore  = (p.ardore?.length ?? 0) > 0;
  const hasGesta   = (p.gesta?.length ?? 0) > 0;
  const ardoreAvail = hasArdore && canUseArdore(p.uid, ardoreTracker ?? { used: new Set() }) && p.canAct !== false;
  const gestaAvail  = hasGesta  && p.canAct !== false;
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
          {(hasArdore || hasGesta) && (
            <span className="qbg-rot-abilities">
              {hasArdore && <span className={ardoreAvail ? 'qbg-ab-on' : 'qbg-ab-off'}><img src={ardoreIcon} alt="ardore" /></span>}
              {hasGesta  && <span className={gestaAvail  ? 'qbg-ab-on' : 'qbg-ab-off'}><img src={gestaIcon}  alt="gesta"  /></span>}
            </span>
          )}
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
          <PieceRow key={p.uid} p={p} rotation={game.playerRotation} ardoreTracker={game.playerArdoreTracker} isAi={false} collapsed={collapsed} onClick={openPieceTab} selected={p.uid === selectedUid} />
        ))}

        {!collapsed && <>
          <div className="qbg-rot-divider" />
          <div className="qbg-rot-section-label qbg-rot-section-ai">🤖 AI</div>
        </>}
        {game.aiPieces.map(p => (
          <PieceRow key={p.uid} p={p} rotation={game.aiRotation} ardoreTracker={game.aiArdoreTracker} isAi={true} collapsed={collapsed} onClick={openPieceTab} selected={p.uid === selectedUid} />
        ))}
      </div>
    </div>
  );
}
