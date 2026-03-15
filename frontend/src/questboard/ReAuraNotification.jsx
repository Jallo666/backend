import './ReAuraNotification.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import coronaIcon from '../assets/icon/corona.svg';
import { NATURA_COLORE } from '../game/questboard/qb_pieces.js';

export default function ReAuraNotification({ event, onDismiss }) {
  const { re, newHp, newHpMax, deadPieceName } = event;
  const hpPct = Math.round((newHp / newHpMax) * 100);
  const isPlayer = re.side === "player";

  return (
    <div className="ran-overlay">
      <div className="ran-box">
        <div className="ran-title"><img src={coronaIcon} alt="" style={{ width: 18, height: 18, verticalAlign: "middle", marginRight: 6, filter: "drop-shadow(0 0 6px #f0c040)" }} />Forza del Popolo</div>

        <div className="ran-re">
          <div className={`ran-re-icon ran-re-icon-${re.side}`}>
            <SilhouettePiece natura={re.natura} size={64} />
          </div>
          <div className="ran-re-info">
            <span className="ran-re-nome">{re.nome}</span>
            {re.natura && (
              <span className="ran-re-natura" style={{ color: NATURA_COLORE[re.natura] ?? "#888" }}>
                {re.natura}
              </span>
            )}
            <span className={`ran-re-badge ${isPlayer ? "ran-badge-player" : "ran-badge-ai"}`}>
              {isPlayer ? "TUO RE" : "RE NEMICO"}
            </span>
          </div>
        </div>

        <hr className="ran-separator" />

        <p className="ran-body">
          <strong>{deadPieceName}</strong> è caduto.
        </p>
        <p className="ran-effect">
          Il Re perde <strong style={{ color: "#ee4444" }}>2 HP massimi</strong>
        </p>

        <div className="ran-hp-row">
          <span className="ran-hp-label">HP</span>
          <div className="ran-hp-bar">
            <div className="ran-hp-fill" style={{ width: `${hpPct}%` }} />
          </div>
          <span className="ran-hp-val">{newHp} / {newHpMax}</span>
        </div>

        <div className="ran-btns">
          <button className="qbg-btn qbg-btn-gold" onClick={onDismiss}>OK</button>
        </div>
      </div>
    </div>
  );
}
