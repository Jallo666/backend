import SilhouettePiece from "../SilhouettePiece.jsx";
import HpGauge from "../components/HpGauge.jsx";
import BoardPieceAbilities from "./BoardPieceAbilities.jsx";
import BoardPieceStatus from "./BoardPieceStatus.jsx";
import "./BoardPiece.css";

export default function BoardPiece({
  p, cellSize,
  isSelected, inRot, hasMoved,
  isMoving, isAtkCell, isDefCell,
  moveDx, moveDy,
  ardoreAvail, gestaAvail,
  debuffs = [],
  isCardOpen = false,
}) {
  return (
    <div
      className={[
        "bp",
        `bp-${p.side}`,
        isSelected   ? "bp-selected"  : "",
        isCardOpen   ? "bp-card-open" : "",
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
        <SilhouettePiece natura={p.natura} pieceId={p.id} size={cellSize * 0.72} />
      </div>

      {/* Abilità — sinistra, Re — destra */}
      <BoardPieceAbilities p={p} ardoreAvail={ardoreAvail} gestaAvail={gestaAvail} />

      {/* Status overlay — dormiente, immobilizzato… */}
      <BoardPieceStatus hasMoved={hasMoved} debuffs={debuffs} />

      {/* Nome — barra in fondo */}
      <div className={`bp-name bp-name-${p.side}`}>
        {p.nome}
      </div>

      {/* HP — sotto al nome */}
      <div className="bp-hp-gauge">
        <HpGauge hp={p.hp} hpMax={p.hpMax} compact />
      </div>
    </div>
  );
}
