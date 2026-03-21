import saluteIcon   from "../assets/icon/salute.svg";
import attaccaIcon  from "../assets/icon/attacca.svg";
import difesaIcon   from "../assets/icon/difesa.svg";
import movimentoIcon from "../assets/icon/movimento.svg";
import "./PieceStats.css";

const STATS = [
  { icon: saluteIcon,    key: "hp",  lbl: "HP"  },
  { icon: attaccaIcon,   key: "atk", lbl: "ATK" },
  { icon: difesaIcon,    key: "def", lbl: "DEF" },
  { icon: movimentoIcon, key: "mov", lbl: "MOV" },
];

/**
 * @param {{ hp, atk, def, mov }} piece  - oggetto con le stat
 * @param {boolean} compact              - layout orizzontale compatto (default: false = griglia 2x2)
 */
export default function PieceStats({ piece, compact = false }) {
  return (
    <div className={`piece-stats${compact ? " piece-stats-compact" : ""}`}>
      {STATS.map(s => (
        <div key={s.lbl} className="piece-stat">
          <img src={s.icon} alt={s.lbl} className="piece-stat-icon" width={36} height={36} />
          <div className="piece-stat-info">
            <span className="piece-stat-lbl">{s.lbl}</span>
            <span className="piece-stat-val">{piece[s.key]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
