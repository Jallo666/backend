import './RotazioneTracker.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import { canMoveInRotation } from '../game/questboard/qb_rules.js';

export default function RotazioneTracker({ game, openPieceTab }) {
  return (
    <div className="qbg-rotation">
      <div className="qbg-rot-section-label qbg-rot-section-player">⚔ TUE</div>
      {game.playerPieces.map(p => {
        const ready = canMoveInRotation(p.uid, game.playerRotation);
        const sleeping = !ready;
        return (
          <div
            key={p.uid}
            className={`qbg-rot-row ${ready ? "qbg-rot-ready" : "qbg-rot-done"}`}
            onClick={() => openPieceTab(p)}
          >
            <span className="qbg-rot-icon"><SilhouettePiece natura={p.natura} size={36} /></span>
            <div className="qbg-rot-info">
              <span className="qbg-rot-nome">
                {p.isRe && <span className="qbg-rot-crown">♛</span>}
                {p.nome}
                {sleeping && <span className="qbg-rot-zzz-inline">💤</span>}
              </span>
              <span className="qbg-rot-stats">❤ {p.hp} &nbsp;⚔ {p.atk} &nbsp;🛡 {p.def}</span>
            </div>
          </div>
        );
      })}

      <div className="qbg-rot-divider" />

      <div className="qbg-rot-section-label qbg-rot-section-ai">🤖 AI</div>
      {game.aiPieces.map(p => {
        const ready = canMoveInRotation(p.uid, game.aiRotation);
        const sleeping = !ready;
        return (
          <div
            key={p.uid}
            className={`qbg-rot-row qbg-rot-row-ai ${ready ? "qbg-rot-ready" : "qbg-rot-done"}`}
            onClick={() => openPieceTab(p)}
          >
            <span className="qbg-rot-icon"><SilhouettePiece natura={p.natura} size={36} /></span>
            <div className="qbg-rot-info">
              <span className="qbg-rot-nome">
                {p.isRe && <span className="qbg-rot-crown">♛</span>}
                {p.nome}
                {sleeping && <span className="qbg-rot-zzz-inline">💤</span>}
              </span>
              <span className="qbg-rot-stats">❤ {p.hp} &nbsp;⚔ {p.atk} &nbsp;🛡 {p.def}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
