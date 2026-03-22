import './CombatPreview.css';
import ConfirmModal from '../components/ConfirmModal';
import ModalPieceCard from '../components/ModalPieceCard';
import AbilitaList from '../components/AbilitaList';
import { resolveCombat } from '../game/questboard/qb_rules.js';

const BATTLE_QUOTES = [
  "«Per l'onore della gilda, avanza!»",
  "«Che il destino sorridà al più ardito!»",
  "«Spada contro scudo — che il migliore trionfi!»",
  "«Il coraggio decide più della forza!»",
  "«Non vi è gloria senza rischio, valoroso!»",
  "«In nome del Re, colpisci!»",
];

export default function CombatPreview({ attacker, defender, onConfirm, onCancel, mode = "player" }) {
  const result  = resolveCombat(attacker, defender);
  const defDies = result.defenderHp <= 0;
  const quote   = BATTLE_QUOTES[Math.floor(Math.random() * BATTLE_QUOTES.length)];
  const isAi    = mode === "ai";

  let esito, resultClass;
  if (defDies) {
    esito       = `${defender.nome} verrà eliminato!`;
    resultClass = isAi ? "qbg-cp-result-lose" : "qbg-cp-result-win";
  } else {
    esito       = `${defender.nome} subisce ${result.dmg} danni (${result.defenderHp} HP rimasti).`;
    resultClass = "qbg-cp-result-draw";
  }

  const title      = isAi ? "L'AVVERSARIO ATTACCA!" : "SFIDA AL DUELLO";
  const titleStyle = isAi
    ? { color: "#ee5555", textShadow: "0 0 16px rgba(220,40,40,0.6)" }
    : { color: "var(--hs-gold)", textShadow: "0 0 16px rgba(240,192,64,0.5)" };

  const buttons = isAi
    ? [{ label: "Continua!", onClick: onConfirm, variant: "gold" }]
    : [
        { label: "Attacca!", onClick: onConfirm, variant: "gold" },
        { label: "Annulla",  onClick: onCancel,  variant: "dark" },
      ];

  // In modalità AI i ruoli visivi si invertono
  const atkVariant = isAi ? "target" : "atk";
  const defVariant = isAi ? "atk"    : "target";

  const furtiva = result.furtivo    ? attacker.aura?.find(a => a.id === "attacco_furtivo") : null;
  const ira     = result.ira        ? attacker.aura?.find(a => a.id === "ira")              : null;
  const difesa  = result.auraActive ? defender.aura?.find(a => a.id === "difesa_possente")  : null;

  return (
    <ConfirmModal title={title} titleStyle={titleStyle} buttons={buttons} boxClassName={isAi ? "qbg-cp-box-ai" : undefined}>
      <div className="qbg-cp-matchup">
        <ModalPieceCard pezzo={attacker} variant={atkVariant} showHpBar />
        <span className="qbg-cp-vs">VS</span>
        <ModalPieceCard pezzo={defender} variant={defVariant} showHpBar />
      </div>

      <hr className="qbg-cp-separator" />

      <div className="qbg-cp-forecast">
        Danni inflitti: <strong style={{ color: "#f0c040" }}>{result.dmg}</strong>
      </div>
      {furtiva && <AbilitaList aura={[furtiva]} />}
      {ira     && <AbilitaList aura={[ira]}     />}
      {difesa  && <AbilitaList aura={[difesa]}  />}

      <div className={`qbg-cp-result ${resultClass}`}>{esito}</div>
      <div className="qbg-cp-quote">{quote}</div>
    </ConfirmModal>
  );
}
