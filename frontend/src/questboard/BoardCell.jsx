import BoardPiece from './BoardPiece.jsx';
import attackIcon from '../assets/icon/attacca.svg';
import ardoreIcon from '../assets/icon/ardore.svg';
import gestaIcon  from '../assets/icon/gesta.svg';

export default function BoardCell({ r, c, p, cellSize, state, onCellClick }) {
  const {
    valid, attack, isSelected, isAnim, checker,
    hasMoved, inRot,
    hasArdore, hasGesta, ardoreAvail, gestaAvail,
    isFrom, isTo, moveDx, moveDy, isMoving,
    isAtkCell, isDefCell,
    isScagliareTgt, scagliareDest,
    isGestaTarget, isGestaHit,
    isArdoreTarget, isCaricaCell, isArdoreHit, isArdoreImpeg,
    isAttackTarget, isPendingTarget, isPlacementCell,
    pieceSideClass, pieceDebuffs, isCardOpen,
  } = state;

  const handleClick = e => { e.stopPropagation(); onCellClick(r, c); };

  return (
    <div
      className={[
        "qbg-cell",
        checker ? "qbg-cell-light" : "qbg-cell-dark",
        pieceSideClass,
        valid && !attack ? "qbg-cell-valid"       : "",
        valid && attack  ? "qbg-cell-attack"      : "",
        isAnim           ? "qbg-cell-anim"        : "",
        isFrom           ? "qbg-cell-from"        : "",
        isTo             ? "qbg-cell-to"          : "",
        isAtkCell        ? "qbg-cell-combat-atk"  : "",
        isDefCell        ? "qbg-cell-combat-def"  : "",
        isGestaTarget    ? "qbg-cell-gesta-target"   : "",
        isScagliareTgt   ? "qbg-cell-scagliare-tgt"  : "",
        scagliareDest    ? "qbg-cell-scagliare-dest" : "",
        isGestaHit       ? "qbg-cell-gesta-hit"      : "",
        isArdoreTarget   ? "qbg-cell-ardore-target"  : "",
        isCaricaCell     ? "qbg-cell-carica-target"  : "",
        isArdoreHit      ? "qbg-cell-ardore-hit"     : "",
        isArdoreImpeg    ? "qbg-cell-ardore-impeg"   : "",
        isPlacementCell  ? "qbg-cell-placement"      : "",
      ].join(" ")}
      onClick={() => onCellClick(r, c)}
    >
      {valid && !attack && !p && <div className="qbg-dot" />}
      {isPlacementCell && <div className="qbg-placement-dot" />}

      {p && (
        <BoardPiece
          p={p} cellSize={cellSize}
          isSelected={isSelected}
          inRot={inRot}
          hasMoved={hasMoved} isMoving={isMoving}
          isAtkCell={isAtkCell} isDefCell={isDefCell}
          moveDx={moveDx} moveDy={moveDy}
          hasArdore={hasArdore} hasGesta={hasGesta}
          ardoreAvail={ardoreAvail} gestaAvail={gestaAvail}
          debuffs={pieceDebuffs}
          isCardOpen={isCardOpen}
        />
      )}
      {isAttackTarget && (
        <button className="qbg-confirm-attack-btn" onClick={handleClick}>
          <img src={attackIcon} alt="attacca" />
        </button>
      )}
      {isArdoreTarget && !isAttackTarget && scagliareDest == null && (
        <button className="qbg-confirm-ardore-btn" onClick={handleClick}>
          <img src={ardoreIcon} alt="ardore" />
        </button>
      )}
      {isGestaTarget && !isPendingTarget && (
        <button className="qbg-confirm-gesta-btn" onClick={handleClick}>
          <img src={gestaIcon} alt="gesta" />
        </button>
      )}
      {isScagliareTgt && !isPendingTarget && (
        <button className="qbg-confirm-gesta-btn qbg-confirm-scagliare-tgt" onClick={handleClick}>
          <img src={gestaIcon} alt="scagliare" />
        </button>
      )}
      {scagliareDest && (
        <button className="qbg-confirm-scagliare-dest-btn" onClick={handleClick}>
          💨 {scagliareDest.danno}
        </button>
      )}
    </div>
  );
}
