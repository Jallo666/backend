import { useState, useRef } from "react";
import GameModal from "./GameModal";

function CoinSvg({ side }) {
  const isTesta = side === "heads";
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ width: "80px", height: "80px" }}>
      <defs>
        <radialGradient id="coinGrad" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor={isTesta ? "#ffe080" : "#c0a030"} />
          <stop offset="60%" stopColor={isTesta ? "#f0c040" : "#a08020"} />
          <stop offset="100%" stopColor={isTesta ? "#8a6010" : "#604010"} />
        </radialGradient>
      </defs>
      {/* Bordo moneta */}
      <circle cx="40" cy="40" r="38" fill="#604010" />
      {/* Faccia moneta */}
      <circle cx="40" cy="40" r="34" fill="url(#coinGrad)" />
      {/* Anello decorativo */}
      <circle cx="40" cy="40" r="29" fill="none" stroke={isTesta ? "#c89020" : "#806010"} strokeWidth="1.5" />
      {isTesta ? (
        /* Testa: corona */
        <g fill={isTesta ? "#8a6010" : "#604010"}>
          <polygon points="22,50 22,38 28,44 32,34 40,46 48,34 52,44 58,38 58,50" fill="#8a6010" />
          <rect x="22" y="50" width="36" height="5" rx="1" fill="#8a6010" />
          <circle cx="22" cy="38" r="2.5" fill="#8a6010" />
          <circle cx="40" cy="34" r="2.5" fill="#8a6010" />
          <circle cx="58" cy="38" r="2.5" fill="#8a6010" />
        </g>
      ) : (
        /* Croce: spada */
        <g stroke="#604010" strokeWidth="2" strokeLinecap="round">
          <line x1="40" y1="20" x2="40" y2="58" />
          <line x1="28" y1="32" x2="52" y2="32" />
          <ellipse cx="40" cy="60" rx="5" ry="3" fill="#604010" stroke="none" />
        </g>
      )}
    </svg>
  );
}

// phase: 'pick' → utente sceglie testa/croce
//        'flipping' → animazione lancio
//        'result' → mostra risultato e se ha vinto
export default function CoinFlip({ onChoice }) {
  const [phase,  setPhase]  = useState("pick");
  const [pick,   setPick]   = useState(null);   // "heads" | "tails"
  const [result, setResult] = useState(null);   // "heads" | "tails"
  const timerRef = useRef(null);

  const handlePick = (chosen) => {
    setPick(chosen);
    setPhase("flipping");
    timerRef.current = setTimeout(() => {
      const res = Math.random() < 0.5 ? "heads" : "tails";
      setResult(res);
      setPhase("result");
    }, 600);
  };

  if (phase === "pick") {
    return (
      <GameModal
        title="⚜ Tiro di Moneta"
        buttons={[
          { label: "👑 Testa", onClick: () => handlePick("heads") },
          { label: "⚔ Croce", onClick: () => handlePick("tails"), variant: "dark" },
        ]}
      >
        <p style={{ color: "#c8a060", fontSize: "12px" }}>Scegli: se indovini vai per primo!</p>
      </GameModal>
    );
  }

  if (phase === "flipping") {
    return (
      <GameModal title="⚜ Tiro di Moneta" buttons={[]}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <div className="qbg-coin">
            <CoinSvg side="heads" />
          </div>
          <p style={{ color: "#c8a060", fontSize: "11px" }}>Lancio in corso...</p>
        </div>
      </GameModal>
    );
  }

  // phase === 'result'
  const won = pick === result;
  return (
    <GameModal
      title="⚜ Tiro di Moneta"
      buttons={[{ label: won ? "🎉 Vai per primo!" : "OK, vado per secondo", onClick: () => onChoice(won) }]}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <div>
          <CoinSvg side={result} />
        </div>
        <p style={{ fontSize: "14px", color: result === "heads" ? "#f0c040" : "#c8a060" }}>
          {result === "heads" ? "👑 Testa!" : "⚔ Croce!"}
        </p>
        <p style={{ fontSize: "13px", color: won ? "#f0c040" : "#a08050", fontWeight: "bold" }}>
          {won ? "Hai indovinato! Vai per primo 🎉" : "Non hai indovinato. Vai per secondo."}
        </p>
      </div>
    </GameModal>
  );
}
