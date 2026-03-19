import { useState } from "react";
import GameModal from "./GameModal";

export default function GameOptionsModal({ onClose, onRestart, onRetire }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <GameModal
        title="⚠ SEI SICURO DI RITIRARTI?"
        buttons={[
          { label: "Sì, ritirati", onClick: onRetire },
          { label: "No, continua", onClick: () => setConfirm(false), variant: "dark" },
        ]}
      />
    );
  }

  return (
    <GameModal
      title="⚙ Opzioni"
      onClose={onClose}
      buttons={[
        { label: "↺ Ricomincia", onClick: onRestart },
        { label: "⚑ Ritirati",   onClick: () => setConfirm(true), variant: "dark" },
      ]}
    />
  );
}
