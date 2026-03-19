import GameModal from './GameModal';
import { getHealAmount } from '../game/questboard/qb_rules.js';

export default function RoundEndNotification({ event, onDismiss }) {
  const { round, healAmount, side, nextHealAmount } = event;
  const nextRound = round + 1;
  const isDamage  = healAmount < 0;
  const isPlayer  = side === "player";

  const nextHeal = nextHealAmount ?? getHealAmount(nextRound);
  let nextCondition;
  if (nextHeal > 0)      nextCondition = `+${nextHeal} HP a fine ciclo`;
  else if (nextHeal < 0) nextCondition = `${nextHeal} HP a fine ciclo (danno!)`;
  else                   nextCondition = "Nessuna cura a fine ciclo";

  const titolo = isPlayer
    ? `Fine del tuo Round ${round}`
    : `Fine Round ${round} — Avversario`;

  const effetto = isDamage
    ? `${isPlayer ? "I tuoi pezzi subiscono" : "I pezzi nemici subiscono"} ${Math.abs(healAmount)} danni`
    : `${isPlayer ? "I tuoi pezzi recuperano" : "I pezzi nemici recuperano"} ${healAmount} HP`;

  return (
    <GameModal
      title={titolo}
      buttons={[{ label: "Continua", onClick: onDismiss }]}
    >
      <p style={{ color: isDamage ? "#ee4444" : "#44dd88", marginBottom: "0.4rem" }}>
        {effetto}
      </p>
      <p style={{ color: "#c8a060", fontSize: "11px" }}>
        Ciclo {nextRound}: <strong>{nextCondition}</strong>
      </p>
    </GameModal>
  );
}
