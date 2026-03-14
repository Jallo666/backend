import SilhouettePiece from "../SilhouettePiece.jsx";
import "./BoardPiece.css";

export default function BoardPiece({
  p, cellSize,
  isSelected, inRot, hasMoved,
  isMoving, isAtkCell, isDefCell,
  moveDx, moveDy,
}) {
  return (
    <div
      className={[
        "bp",
        `bp-${p.side}`,
        isSelected ? "bp-selected" : "",
        p.isRe     ? "bp-re"       : "",
        inRot      ? "bp-ready"    : "",
        isMoving   ? "bp-moving"   : "",
        isAtkCell  ? "bp-atk"      : "",
        isDefCell  ? "bp-hit"      : "",
      ].join(" ")}
      style={{ "--move-dx": `${moveDx}px`, "--move-dy": `${moveDy}px` }}
    >
      {/* Sprite silhouette */}
      <div className="bp-sprite">
        <SilhouettePiece natura={p.natura} size={cellSize * 0.72} />
      </div>

      {/* HP — top-left */}
      <div className={`bp-hp bp-hp-${p.side}`}>
        {p.hp}<span className="bp-hp-label">HP</span>
      </div>

      {/* RE badge — top-right */}
      {p.isRe && <div className="bp-re-badge">♛</div>}

      {/* Dormiente — overlay scuro + emoji */}
      {hasMoved && <div className="bp-sleep-overlay" />}
      {hasMoved && <div className="bp-sleep-badge">💤</div>}

      {/* Nome — barra in fondo, troncato se lungo */}
      <div className={`bp-name bp-name-${p.side}`}>{p.nome}</div>
    </div>
  );
}
