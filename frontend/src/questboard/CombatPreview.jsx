import './CombatPreview.css';
import SilhouettePiece from '../SilhouettePiece.jsx';
import { NATURA_COLORE } from '../game/questboard/qb_pieces.js';
import { resolveCombat } from '../game/questboard/qb_rules.js';

const BATTLE_QUOTES = [
  "«Per l'onore della gilda, avanza!»",
  "«Che il destino sorridà al più ardito!»",
  "«Spada contro scudo — che il migliore trionfi!»",
  "«Il coraggio decide più della forza!»",
  "«Non vi è gloria senza rischio, valoroso!»",
  "«In nome del Re, colpisci!»",
];

// mode: "player" (player attacks, can cancel) | "ai" (ai attacks, read-only)
export default function CombatPreview({ attacker, defender, onConfirm, onCancel, mode = "player" }) {
  const result  = resolveCombat(attacker, defender);
  const defDies = result.defenderHp <= 0;
  const quote   = BATTLE_QUOTES[Math.floor(Math.random() * BATTLE_QUOTES.length)];

  let esito, resultClass;
  if (defDies) {
    esito = mode === "ai"
      ? `${defender.nome} verrà eliminato!`
      : `${defender.nome} verrà eliminato!`;
    resultClass = mode === "ai" ? "qbg-cp-result-lose" : "qbg-cp-result-win";
  } else {
    esito = mode === "ai"
      ? `${defender.nome} subisce ${result.dmg} danni (${result.defenderHp} HP rimasti).`
      : `${defender.nome} subisce ${result.dmg} danni (${result.defenderHp} HP rimasti).`;
    resultClass = "qbg-cp-result-draw";
  }
  const title = mode === "ai" ? "☠ L'AVVERSARIO ATTACCA! ☠" : "⚔ SFIDA AL DUELLO ⚔";

  return (
    <div className="qbg-combat-preview">
      <div className={`qbg-cp-box ${mode === "ai" ? "qbg-cp-box-ai" : ""}`}>
        <div className={`qbg-cp-title ${mode === "ai" ? "qbg-cp-title-ai" : ""}`}>{title}</div>

        <div className="qbg-cp-matchup">
          <div className="qbg-cp-piece qbg-cp-piece-atk">
            <SilhouettePiece natura={attacker.natura} size={56} />
            <span className="qbg-cp-piece-name">{attacker.nome}</span>
            {attacker.natura && <span className="qbg-cp-natura" style={{ color: NATURA_COLORE[attacker.natura] ?? "#888" }}>{attacker.natura}</span>}
            <span className="qbg-cp-piece-stats">❤{attacker.hp} ⚔{attacker.atk} 🛡{attacker.def}</span>
            <div className="qbg-cp-hp-bar">
              <div className="qbg-cp-hp-fill" style={{ width: `${(attacker.hp / attacker.hpMax) * 100}%` }} />
            </div>
          </div>

          <span className="qbg-cp-vs">VS</span>

          <div className="qbg-cp-piece qbg-cp-piece-def">
            <SilhouettePiece natura={defender.natura} size={56} />
            <span className="qbg-cp-piece-name">{defender.nome}</span>
            {defender.natura && <span className="qbg-cp-natura" style={{ color: NATURA_COLORE[defender.natura] ?? "#888" }}>{defender.natura}</span>}
            <span className="qbg-cp-piece-stats">❤{defender.hp} ⚔{defender.atk} 🛡{defender.def}</span>
            <div className="qbg-cp-hp-bar">
              <div className="qbg-cp-hp-fill" style={{ width: `${(defender.hp / defender.hpMax) * 100}%` }} />
            </div>
          </div>
        </div>

        <hr className="qbg-cp-separator" />

        <div className="qbg-cp-forecast">
          Danni inflitti: <strong style={{ color: "#f0c040" }}>{result.dmg}</strong>
        </div>

        <div className={`qbg-cp-result ${resultClass}`}>{esito}</div>
        <div className="qbg-cp-quote">{quote}</div>

        <div className="qbg-cp-btns">
          {mode === "ai" ? (
            <button className="qbg-btn qbg-btn-gold" onClick={onConfirm}>Continua!</button>
          ) : (
            <>
              <button className="qbg-btn qbg-btn-gold" onClick={onConfirm}>⚔ Attacca!</button>
              <button className="qbg-btn qbg-btn-dark" onClick={onCancel}>🏃 Ritirati</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
