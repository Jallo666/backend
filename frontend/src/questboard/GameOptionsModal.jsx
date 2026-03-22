import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

export default function GameOptionsModal({ onClose, onRestart, onRetire }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <ConfirmModal
        title="SEI SICURO DI RITIRARTI?"
        buttons={[
          { label: "Sì, ritirati",  onClick: onRetire },
          { label: "No, continua",  onClick: () => setConfirm(false), variant: "dark" },
        ]}
      />
    );
  }

  return (
    <ConfirmModal
      title="Opzioni"
      onClose={onClose}
      buttons={[
        { label: "↺ Ricomincia", onClick: onRestart },
        { label: "⚑ Ritirati",   onClick: () => setConfirm(true), variant: "dark" },
      ]}
    />
  );
}
