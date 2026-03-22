import ConfirmModal from "../components/ConfirmModal";

const TITLE_STYLE = {
  player: { color: "var(--hs-gold)", textShadow: "0 0 20px rgba(240,192,64,0.6)" },
  ai:     { color: "#ee4444" },
  draw:   {},
};

export default function GameOverModal({ winner, onBack }) {
  const title = winner === "player" ? "VITTORIA!" : winner === "ai" ? "SCONFITTA" : "PAREGGIO";
  return (
    <ConfirmModal
      title={title}
      titleStyle={TITLE_STYLE[winner] ?? {}}
      buttons={[{ label: "← Torna alla Locanda", onClick: onBack }]}
    >
      {winner === "player" && <p>+50 💎 gemme</p>}
    </ConfirmModal>
  );
}
