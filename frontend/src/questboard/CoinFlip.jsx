import { useState } from "react";
import GameModal from "./GameModal";

export default function CoinFlip({ onChoice }) {
  const [result, setResult] = useState(null);

  const flip = () => setResult(Math.random() < 0.5 ? "heads" : "tails");

  if (!result) {
    return (
      <GameModal
        title="⚜ Tiro di Moneta"
        buttons={[{ label: "🪙 Lancia la moneta", onClick: flip }]}
      >
        <p>Chi va per primo?</p>
      </GameModal>
    );
  }

  return (
    <GameModal
      title="⚜ Tiro di Moneta"
      buttons={[
        { label: "Sì, primo",  onClick: () => onChoice(true) },
        { label: "No, secondo", onClick: () => onChoice(false), variant: "dark" },
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "3.5rem" }}>{result === "heads" ? "👑" : "🗡"}</span>
        <p>{result === "heads" ? "Testa — hai vinto!" : "Croce"}</p>
        <p style={{ color: "#c8a060" }}>Vuoi andare per primo?</p>
      </div>
    </GameModal>
  );
}
