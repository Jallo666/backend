import './ArdorePreview.css';
import ConfirmModal from '../components/ConfirmModal';
import ModalPieceCard from '../components/ModalPieceCard';
import AbilitaList from '../components/AbilitaList';
import ardoreIcon from '../assets/icon/ardore.svg';
import { applyAuraEffects, resolveCombat } from '../game/questboard/qb_rules.js';

export default function ArdorePreview({ caster, target, ardore, onConfirm, onCancel, mode, opponentNome = "AI" }) {
  const isCura      = ardore.tipo === "cura";
  const isMovimento = ardore.tipo === "movimento";
  const isSelf      = caster.uid === target.uid;

  const combatResult   = isMovimento ? resolveCombat(caster, target) : null;
  const dannoEffettivo = isCura ? 0 : isMovimento ? combatResult.dmg : applyAuraEffects(target, ardore.danno ?? 0);
  const auraActive     = isMovimento ? combatResult.auraActive : (!isCura && dannoEffettivo < (ardore.danno ?? 0));
  const hpDopo = isCura
    ? Math.min(target.hpMax, target.hp + ardore.cura)
    : isMovimento
      ? combatResult.defenderHp
      : Math.max(0, target.hp - dannoEffettivo);
  const curato    = isCura ? hpDopo - target.hp : 0;
  const eliminato = !isCura && hpDopo <= 0;
  const isAi      = mode === "ai";

  const difesaPossente = auraActive ? target.aura?.find(a => a.id === "difesa_possente") : null;

  const title = isAi ? `${opponentNome} usa Ardore!` : ardore.nome;
  const titleStyle = isAi
    ? { color: "#8099ee", textShadow: "0 0 16px rgba(40,80,220,0.6)" }
    : { color: "#6090ff", textShadow: "0 0 16px rgba(60,120,255,0.5)" };

  const playerLabel = isCura
    ? "✨ Cura!"
    : isMovimento
      ? "⚡ Carica!"
      : <><img src={ardoreIcon} alt="" className="ap-ardore-icon" /> Spara!</>;

  const buttons = isAi
    ? [{ label: "⚡ OK", onClick: onConfirm, variant: "gold" }]
    : [
        { label: playerLabel, onClick: onConfirm, variant: "blue" },
        { label: "✕ Annulla", onClick: onCancel, variant: "dark" },
      ];

  return (
    <ConfirmModal title={title} titleStyle={titleStyle} buttons={buttons} boxClassName={isAi ? "ap-box-ai" : undefined}>
      <div className="ap-matchup">
        {isSelf ? (
          <ModalPieceCard pezzo={caster} variant="caster" showHpBar />
        ) : (<>
          <ModalPieceCard pezzo={caster} variant="caster" showHpBar />
          <span className="ap-arrow"><img src={ardoreIcon} alt="" className="ap-ardore-icon" /></span>
          <ModalPieceCard pezzo={target} variant="target" showHpBar />
        </>)}
      </div>

      <hr className="ap-separator" />

      {isAi && <>
        <p className="ap-ai-label">{caster.nome} usa su <strong>{target.nome}</strong>:</p>
        <AbilitaList ardore={[ardore]} />
      </>}
      {difesaPossente && <AbilitaList aura={[difesaPossente]} />}
      <p className={`ap-effect${eliminato ? " ap-effect-kill" : ""}`} style={isCura ? { color: "#60d080" } : undefined}>
        {isCura
          ? `${target.nome}: ${target.hp} HP → ${hpDopo} HP  (+${curato})`
          : eliminato
            ? `${target.nome} verrà eliminato!`
            : `${target.nome}: ${target.hp} HP → ${hpDopo} HP  (-${dannoEffettivo})`}
      </p>
      {!isAi && <p className="ap-bonus-label">⚡ Azione Bonus — potrai ancora muoverti dopo</p>}
    </ConfirmModal>
  );
}
