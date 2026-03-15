import './GestPreview.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import gestaIcon from '../assets/icon/gesta.svg';
import { NATURA_COLORE } from '../game/questboard/qb_pieces.js';
import { applyAuraEffects } from '../game/questboard/qb_rules.js';

export default function GestPreview({ caster, target, gesta, onConfirm, onCancel, mode }) {
  const dannoEffettivo = applyAuraEffects(target, gesta.danno);
  const auraActive = dannoEffettivo < gesta.danno;
  const hpDopo    = Math.max(0, target.hp - dannoEffettivo);
  const eliminato = hpDopo <= 0;
  const hpPct     = Math.round((target.hp / target.hpMax) * 100);
  const isAi      = mode === "ai";

  return (
    <div className="gp-overlay">
      <div className={`gp-box${isAi ? " gp-box-ai" : ""}`}>
        <h2 className={`gp-title${isAi ? " gp-title-ai" : ""}`}>
          {isAi ? "🤖 L'AI usa una gesta!" : <><img src={gestaIcon} alt="" className="gp-gesta-icon" /> {gesta.nome}</>}
        </h2>

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

          <span className="gp-arrow"><img src={gestaIcon} alt="" className="gp-gesta-icon" /></span>

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

        {isAi && (
          <p className="gp-ai-label">{caster.nome} usa <strong>{gesta.icona} {gesta.nome}</strong> su {target.nome}</p>
        )}

        {auraActive && <p className="gp-aura-note">🛡 Difesa Possente: danno dimezzato!</p>}
        <p className={`gp-effect ${eliminato ? "gp-effect-kill" : ""}`}>
          {eliminato
            ? `${target.nome} verrà eliminato!`
            : `${target.nome}: ${target.hp} HP → ${hpDopo} HP  (-${dannoEffettivo})`}
        </p>

        <div className="gp-btns">
          {isAi ? (
            <button className="qbg-btn qbg-btn-gold" onClick={onConfirm}>⚡ OK</button>
          ) : (
            <>
              <button className="qbg-btn qbg-btn-orange" onClick={onConfirm}><img src={gestaIcon} alt="" className="gp-gesta-icon" /> Lancia!</button>
              <button className="qbg-btn qbg-btn-dark"  onClick={onCancel}>✕ Annulla</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
