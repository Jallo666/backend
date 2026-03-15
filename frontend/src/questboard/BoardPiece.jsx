import SilhouettePiece from "../SilhouettePiece.jsx";
import coronaIcon  from "../assets/icon/corona.svg";
import ardoreIcon  from "../assets/icon/ardore.svg";
import gestaIcon   from "../assets/icon/gesta.svg";
import "./BoardPiece.css";

export default function BoardPiece({
  p, cellSize,
  isSelected, inRot, hasMoved,
  isMoving, isAtkCell, isDefCell,
  moveDx, moveDy,
  hasArdore, hasGesta, ardoreAvail, gestaAvail,
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
      {p.isRe && <div className="bp-re-badge"><img src={coronaIcon} alt="RE" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 3px #f0c040)" }} /></div>}

      {/* Abilità disponibili — bottom-right */}
      {(hasArdore || hasGesta) && (
        <div className="bp-abilities">
          {hasArdore && <span className={`bp-ab ${ardoreAvail ? 'bp-ab-on' : 'bp-ab-off'}`}><img src={ardoreIcon} alt="ardore" /></span>}
          {hasGesta  && <span className={`bp-ab ${gestaAvail  ? 'bp-ab-on' : 'bp-ab-off'}`}><img src={gestaIcon}  alt="gesta"  /></span>}
        </div>
      )}

      {/* Dormiente — overlay scuro + emoji */}
      {hasMoved && <div className="bp-sleep-overlay" />}
      {hasMoved && <div className="bp-sleep-badge">💤</div>}

      {/* Nome — barra in fondo, troncato se lungo */}
      <div className={`bp-name bp-name-${p.side}`}>{p.nome}</div>
    </div>
  );
}
