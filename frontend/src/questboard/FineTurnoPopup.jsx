import GameModal from './GameModal';

export default function FineTurnoPopup({ onConfirm, onAspetta }) {
  return (
    <GameModal
      buttons={[
        { label: "Fine Turno", onClick: onConfirm },
        { label: "Aspetta",    onClick: onAspetta, variant: "dark" },
      ]}
    >
      <p>Azioni esaurite per questo pezzo.</p>
    </GameModal>
  );
}
