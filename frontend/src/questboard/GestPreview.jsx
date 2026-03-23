import './GestPreview.css';
import ConfirmModal from '../components/ConfirmModal';
import ModalPieceCard from '../components/ModalPieceCard';
import AbilitaList from '../components/AbilitaList';
import gestaIcon from '../assets/icon/gesta.svg';
import { applyAuraEffects } from '../game/questboard/qb_rules.js';

export default function GestPreview({ caster, target, gesta, onConfirm, onCancel, mode, opponentNome = "AI" }) {
  const isImmobilize   = gesta.effect === "immobilize";
  const isDrain        = gesta.effect === "drain";
  // Morso e Drenaggio Vitale usano ATK del caster come danno dinamico
  const dannoBase = (isImmobilize || isDrain)
    ? caster.atk
    : gesta.danno;
  const dannoEffettivo = applyAuraEffects(target, dannoBase);
  const auraActive     = dannoEffettivo < dannoBase;
  const hpDopo         = Math.max(0, target.hp - dannoEffettivo);
  const eliminato      = hpDopo <= 0;
  const isAi           = mode === "ai";

  // Drain: cura il caster
  const healCaster  = isDrain ? dannoEffettivo : 0;
  const hpCasterDopo = isDrain ? Math.min(caster.hpMax, caster.hp + healCaster) : caster.hp;

  const difesaPossente = auraActive ? target.aura?.find(a => a.id === "difesa_possente") : null;

  const title = isAi ? `${opponentNome} usa una Gesta!` : gesta.nome;
  const titleStyle = isAi
    ? { color: "#ee5555", textShadow: "0 0 16px rgba(220,40,40,0.6)" }
    : { color: "#ff8040", textShadow: "0 0 16px rgba(255,100,0,0.5)" };

  const buttons = isAi
    ? [{ label: "⚡ OK", onClick: onConfirm, variant: "gold" }]
    : [
        { label: <><img src={gestaIcon} alt="" className="gp-gesta-icon" /> Lancia!</>, onClick: onConfirm, variant: "orange" },
        { label: "✕ Annulla", onClick: onCancel, variant: "dark" },
      ];

  return (
    <ConfirmModal title={title} titleStyle={titleStyle} buttons={buttons} boxClassName={isAi ? "gp-box-ai" : undefined}>
      <div className="gp-matchup">
        <ModalPieceCard pezzo={caster} variant="caster" showHpBar />
        <span className="gp-arrow"><img src={gestaIcon} alt="" className="gp-gesta-icon" /></span>
        <ModalPieceCard pezzo={target} variant="target" showHpBar />
      </div>

      <hr className="gp-separator" />

      {isAi && <>
        <p className="gp-ai-label">{caster.nome} usa su <strong>{target.nome}</strong>:</p>
        <AbilitaList gesta={[gesta]} />
      </>}
      {difesaPossente && <AbilitaList aura={[difesaPossente]} />}
      <p className={`gp-effect${eliminato ? " gp-effect-kill" : ""}`}>
        {eliminato
          ? `${target.nome} verrà eliminato!`
          : isImmobilize
            ? `${target.nome}: ${target.hp} HP → ${hpDopo} HP (-${dannoEffettivo}), immobilizzato!`
            : `${target.nome}: ${target.hp} HP → ${hpDopo} HP  (-${dannoEffettivo})`}
      </p>
      {isDrain && (
        <p className="gp-effect" style={{ color: "#60d080" }}>
          {caster.nome}: {caster.hp} HP → {hpCasterDopo} HP (+{healCaster})
        </p>
      )}
    </ConfirmModal>
  );
}
