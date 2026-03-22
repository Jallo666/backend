import ConfirmModal from '../components/ConfirmModal';

export default function FineTurnoPopup({ onConfirm, onAspetta }) {
  return (
    <ConfirmModal
      buttons={[
        { label: "Fine Turno", onClick: onConfirm },
        { label: "Aspetta",    onClick: onAspetta, variant: "dark" },
      ]}
    >
      <p>Azioni esaurite per questo pezzo.</p>
    </ConfirmModal>
  );
}
