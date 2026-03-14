import './GestPreview.css';
import SilhouettePiece from './SilhouettePiece.jsx';
import { NATURA_COLORE } from './game/questboard/qb_pieces.js';

export default function GestPreview({ caster, target, gesta, onConfirm, onCancel }) {
  const hpDopo    = Math.max(0, target.hp - gesta.danno);
  const eliminato = hpDopo <= 0;
  const hpPct     = Math.round((target.hp / target.hpMax) * 100);

  return (
    <div className="gp-overlay">
      <div className="gp-box">
        <h2 className="gp-title">{gesta.icona} {gesta.nome}</h2>

        <div className="gp-matchup">
          {/* Caster */}
          <div className="gp-piece gp-piece-caster">
            <SilhouettePiece natura={caster.natura} size={54} />
            <span className="gp-piece-name">{caster.nome}</span>
            {caster.natura && (
              <span className="gp-natura" style={{ color: NATURA_COLORE[caster.natura] ?? "#888" }}>
                {caster.natura}
              </span>
            )}
            <span className="gp-piece-hp">❤ {caster.hp}</span>
          </div>

          <span className="gp-arrow">→</span>

          {/* Target */}
          <div className="gp-piece gp-piece-target">
            <SilhouettePiece natura={target.natura} size={54} />
            <span className="gp-piece-name">{target.nome}</span>
            {target.natura && (
              <span className="gp-natura" style={{ color: NATURA_COLORE[target.natura] ?? "#888" }}>
                {target.natura}
              </span>
            )}
            <span className="gp-piece-hp">❤ {target.hp}</span>
            <div className="gp-hp-bar">
              <div className="gp-hp-fill" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
        </div>

        <hr className="gp-separator" />

        <p className={`gp-effect ${eliminato ? "gp-effect-kill" : ""}`}>
          {eliminato
            ? `${target.nome} verrà eliminato!`
            : `${target.nome}: ${target.hp} HP → ${hpDopo} HP  (-${gesta.danno})`}
        </p>

        <div className="gp-btns">
          <button className="qbg-btn qbg-btn-gold" onClick={onConfirm}>🔥 Lancia!</button>
          <button className="qbg-btn qbg-btn-dark"  onClick={onCancel}>✕ Annulla</button>
        </div>
      </div>
    </div>
  );
}
