import './ArdorePreview.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import ardoreIcon from '../assets/icon/ardore.svg';
import { NATURA_COLORE } from '../game/questboard/qb_pieces.js';

export default function ArdorePreview({ caster, target, ardore, onConfirm, onCancel, mode }) {
  const hpDopo    = Math.max(0, target.hp - ardore.danno);
  const eliminato = hpDopo <= 0;
  const hpPct     = Math.round((target.hp / target.hpMax) * 100);
  const isAi      = mode === "ai";

  return (
    <div className="ap-overlay">
      <div className={`ap-box${isAi ? " ap-box-ai" : ""}`}>
        <h2 className={`ap-title${isAi ? " ap-title-ai" : ""}`}>
          {isAi ? "🤖 L'AI usa Ardore!" : <><img src={ardoreIcon} alt="" className="ap-ardore-icon" /> {ardore.nome}</>}
        </h2>

        <div className="ap-matchup">
          {/* Caster */}
          <div className="ap-piece ap-piece-caster">
            <SilhouettePiece natura={caster.natura} size={54} />
            <span className="ap-piece-name">{caster.nome}</span>
            {caster.natura && (
              <span className="ap-natura" style={{ color: NATURA_COLORE[caster.natura] ?? "#888" }}>
                {caster.natura}
              </span>
            )}
            <span className="ap-piece-hp">❤ {caster.hp}</span>
          </div>

          <span className="ap-arrow"><img src={ardoreIcon} alt="" className="ap-ardore-icon" /></span>

          {/* Target */}
          <div className="ap-piece ap-piece-target">
            <SilhouettePiece natura={target.natura} size={54} />
            <span className="ap-piece-name">{target.nome}</span>
            {target.natura && (
              <span className="ap-natura" style={{ color: NATURA_COLORE[target.natura] ?? "#888" }}>
                {target.natura}
              </span>
            )}
            <span className="ap-piece-hp">❤ {target.hp}</span>
            <div className="ap-hp-bar">
              <div className="ap-hp-fill" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
        </div>

        <hr className="ap-separator" />

        {isAi && (
          <p className="ap-ai-label">{caster.nome} usa <strong>{ardore.icona} {ardore.nome}</strong> su {target.nome}</p>
        )}

        <p className={`ap-effect ${eliminato ? "ap-effect-kill" : ""}`}>
          {eliminato
            ? `${target.nome} verrà eliminato!`
            : `${target.nome}: ${target.hp} HP → ${hpDopo} HP  (-${ardore.danno})`}
        </p>

        {!isAi && (
          <p className="ap-bonus-label">⚡ Azione Bonus — potrai ancora muoverti dopo</p>
        )}

        <div className="ap-btns">
          {isAi ? (
            <button className="qbg-btn qbg-btn-gold" onClick={onConfirm}>⚡ OK</button>
          ) : (
            <>
              <button className="qbg-btn qbg-btn-blue" onClick={onConfirm}><img src={ardoreIcon} alt="" className="ap-ardore-icon" /> Spara!</button>
              <button className="qbg-btn qbg-btn-dark"  onClick={onCancel}>✕ Annulla</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
