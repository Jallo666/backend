import ConfirmModal from "../components/ConfirmModal";
import moneteImg from "../assets/monete.png";

const TITLE_STYLE = {
  player: { color: "var(--hs-gold)", textShadow: "0 0 20px rgba(240,192,64,0.6)" },
  ai:     { color: "#ee4444" },
  draw:   {},
};

export default function GameOverModal({ winner, guadagno = 0, onBack }) {
  const title = winner === "player" ? "VITTORIA!" : winner === "ai" ? "SCONFITTA" : "PAREGGIO";
  return (
    <ConfirmModal
      title={title}
      titleStyle={TITLE_STYLE[winner] ?? {}}
      buttons={[{ label: "← Torna alla Locanda", onClick: onBack }]}
    >
      {winner === "player" && (
        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "1.2em" }}>
          +{guadagno} <img src={moneteImg} alt="monete" style={{ width: 22, verticalAlign: "middle" }} />
        </p>
      )}
    </ConfirmModal>
  );
}
