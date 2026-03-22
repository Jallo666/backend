import './ReAuraNotification.css';
import ConfirmModal from '../components/ConfirmModal';
import ModalPieceCard from '../components/ModalPieceCard';

export default function ReAuraNotification({ event, onDismiss }) {
  const { re, newHp, newHpMax, deadPieceName } = event;
  const isPlayer = re.side === "player";
  const reConHpAggiornato = { ...re, hp: newHp, hpMax: newHpMax };

  return (
    <ConfirmModal
      title="Forza del Popolo"
      titleStyle={{ color: "var(--hs-gold)", textShadow: "0 0 16px rgba(240,192,64,0.5)" }}
      buttons={[{ label: "OK", onClick: onDismiss, variant: "gold" }]}
    >
      <ModalPieceCard pezzo={reConHpAggiornato} variant={isPlayer ? "caster" : "target"} showHpBar />
      <span className={`ran-badge ${isPlayer ? "ran-badge-player" : "ran-badge-ai"}`}>
        {isPlayer ? "TUO RE" : "RE NEMICO"}
      </span>

      <hr className="ran-separator" />

      <p className="ran-body"><strong>{deadPieceName}</strong> è caduto.</p>
      <p className="ran-effect">Il Re perde <strong style={{ color: "#ee4444" }}>2 HP massimi</strong></p>
    </ConfirmModal>
  );
}
