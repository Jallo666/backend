import { useState } from 'react';
import './RotazioneTracker.css';
import RotPieceRow from './RotPieceRow.jsx';

export default function RotazioneTracker({ game, openPieceTab, selectedUid, opponentNome, playerNome, utente, debuffs = [] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`qbg-rotation ${collapsed ? "qbg-rotation-collapsed" : ""}`}>
      <button className="qbg-rot-toggle" onClick={() => setCollapsed(v => !v)}>
        {collapsed ? "›" : "‹"}
      </button>

      <div className="qbg-rot-content">
        {!collapsed && (
          <div className="qbg-rot-section-header qbg-rot-section-player">
            <div className="qbg-rot-avatar qbg-rot-avatar-player">
              {utente?.avatar
                ? <img src={utente.avatar} alt="avatar" className="qbg-hud-avatar-img" />
                : <span className="qbg-hud-avatar-initials">{utente?.nome?.[0] ?? "?"}{utente?.cognome?.[0] ?? ""}</span>
              }
            </div>
            <span className="qbg-rot-section-nome">{playerNome}</span>
          </div>
        )}
        {game.playerPieces.map(p => (
          <RotPieceRow key={p.uid} p={p} rotation={game.playerRotation} isAi={false} collapsed={collapsed} onClick={openPieceTab} selected={p.uid === selectedUid} debuffs={debuffs} />
        ))}

        {!collapsed && <>
          <div className="qbg-rot-divider" />
          <div className="qbg-rot-section-header qbg-rot-section-ai">
            <div className="qbg-rot-avatar qbg-rot-avatar-ai">
              {game.opponentAvatarImg
                ? <img src={game.opponentAvatarImg} alt={opponentNome} className="qbg-hud-avatar-img"
                       style={{ objectPosition: game.opponentAvatarPos ?? 'center' }} />
                : <span className="qbg-hud-avatar-initials">🤖</span>
              }
            </div>
            <span className="qbg-rot-section-nome">{opponentNome ?? "AI"}</span>
          </div>
        </>}
        {game.aiPieces.map(p => (
          <RotPieceRow key={p.uid} p={p} rotation={game.aiRotation} isAi={true} collapsed={collapsed} onClick={openPieceTab} selected={p.uid === selectedUid} debuffs={debuffs} />
        ))}
      </div>
    </div>
  );
}
