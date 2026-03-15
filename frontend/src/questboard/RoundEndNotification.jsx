import './RoundEndNotification.css';
import { getHealAmount } from '../game/questboard/qb_rules.js';

export default function RoundEndNotification({ event, onDismiss }) {
  const { round, healAmount } = event;
  const nextRound = round + 1;
  const isDamage = healAmount < 0;

  const nextHeal = getHealAmount(nextRound);
  let nextCondition;
  if (nextHeal > 0)      nextCondition = `+${nextHeal} HP a fine ciclo`;
  else if (nextHeal < 0) nextCondition = `${nextHeal} HP a fine ciclo (danno!)`;
  else                   nextCondition = "Nessuna cura a fine ciclo";

  return (
    <div className="ren-overlay">
      <div className="ren-box">
        <div className={`ren-title ${isDamage ? "ren-title-damage" : ""}`}>
          Fine Ciclo {round}
        </div>

        <hr className="ren-separator" />

        <p className="ren-effect" style={{ color: isDamage ? "#ee4444" : "#44dd88" }}>
          {isDamage
            ? `Tutti i pezzi subiscono ${Math.abs(healAmount)} danni`
            : `Tutti i pezzi recuperano ${healAmount} HP`}
        </p>

        <p className="ren-next">
          Ciclo {nextRound}: <strong>{nextCondition}</strong>
        </p>

        <div className="ren-btns">
          <button className="qbg-btn qbg-btn-gold" onClick={onDismiss}>Continua</button>
        </div>
      </div>
    </div>
  );
}
