import { canMoveInRotation, canUseArdore, BOARD_SIZE } from "../game/questboard/qb_rules.js";
import BoardPiece from "./BoardPiece.jsx";
import attackIcon from "../assets/icon/attacca.svg";
import ardoreIcon from "../assets/icon/ardore.svg";
import gestaIcon from "../assets/icon/gesta.svg";
import "./QuestBoardGame.css";

export default function GameBoard({
  game, cellSize, moveAnim, animCell,
  combatFlash, gestaMode, gestaHitAnim,
  ardoreMode, ardoreHitAnim, ardoreImpegnato,
  onCellClick,
  scagliareTargetUids, scagliareDests,
  gestaAdjacentTargetUids,
  placementCells,
}) {
  const allPieces    = [...game.playerPieces, ...game.aiPieces];
  const pieceAt      = (r, c) => allPieces.find(p => p.row === r && p.col === c);
  const isValidMove  = (r, c) => game.validMoves.some(m => m.row === r && m.col === c);
  const isAttackMove = (r, c) => game.validMoves.find(m => m.row === r && m.col === c)?.isAttack;

  return (
    <div className="qbg-scene">
      <div className="qbg-board-wrap">
        <div className="qbg-board">
          <div className="qbg-col-labels">
            {["A","B","C","D","E","F"].map(l => <div key={l} className="qbg-col-label">{l}</div>)}
          </div>

          {Array.from({ length: BOARD_SIZE }, (_, r) => (
            <div key={r} className="qbg-row">
              <div className="qbg-row-label">{BOARD_SIZE - r}</div>
              {Array.from({ length: BOARD_SIZE }, (_, c) => {
                const p          = pieceAt(r, c);
                const valid      = isValidMove(r, c);
                const attack     = isAttackMove(r, c);
                const isSelected = p && game.selected === p.uid;
                const isAnim     = animCell?.row === r && animCell?.col === c;
                const checker    = (r + c) % 2 === 0;

                const hasMoved = p && (
                  p.side === "player"
                    ? !canMoveInRotation(p.uid, game.playerRotation)
                    : !canMoveInRotation(p.uid, game.aiRotation)
                );
                const inRot = p?.side === "player" && canMoveInRotation(p.uid, game.playerRotation);

                const ardoreTracker = p?.side === "player" ? game.playerArdoreTracker : game.aiArdoreTracker;
                const hasArdore  = (p?.ardore?.length ?? 0) > 0;
                const hasGesta   = (p?.gesta?.length ?? 0) > 0;
                const ardoreAvail = hasArdore && canUseArdore(p.uid, ardoreTracker ?? { used: new Set() }) && p.canAct !== false;
                const gestaAvail  = hasGesta  && p.canAct !== false;

                const isFrom = moveAnim && moveAnim.fromRow === r && moveAnim.fromCol === c;
                const isTo   = moveAnim && moveAnim.toRow   === r && moveAnim.toCol   === c;
                const moveDx = (isTo && p) ? (moveAnim.fromCol - c) * cellSize : 0;
                const moveDy = (isTo && p) ? (moveAnim.fromRow - r) * cellSize : 0;
                const isMoving = isTo && p && (moveDx !== 0 || moveDy !== 0);

                const isAtkCell     = combatFlash && p?.uid === combatFlash.atkUid;
                const isDefCell     = combatFlash && p?.uid === combatFlash.defUid;
                const isScagliareTgt = scagliareTargetUids && p != null && scagliareTargetUids.includes(p.uid);
                const scagliareDest  = scagliareDests?.find(d => d.row === r && d.col === c);
                const isGestaTarget  = !scagliareTargetUids && !scagliareDests && gestaMode && p != null
                  && (gestaAdjacentTargetUids == null || gestaAdjacentTargetUids.includes(p.uid));
                const isGestaHit     = gestaHitAnim?.row === r && gestaHitAnim?.col === c;
                const caricaCaster   = ardoreMode?.tipo === "movimento"
                  ? game.playerPieces.find(p2 => p2.uid === ardoreMode.casterUid)
                  : null;
                const isArdoreTarget = ardoreMode && ardoreMode.tipo !== "movimento" && p != null;
                const isCaricaCell   = caricaCaster && p == null
                  && Math.abs(r - caricaCaster.row) <= 1
                  && Math.abs(c - caricaCaster.col) <= 1
                  && (r !== caricaCaster.row || c !== caricaCaster.col);
                const isArdoreHit    = ardoreHitAnim?.row === r && ardoreHitAnim?.col === c;
                const isArdoreImpeg  = ardoreImpegnato && p?.uid === ardoreImpegnato.pieceUid;
                const isAttackTarget = attack && p?.side === "ai" && game.selected != null;
                const isPlacementCell = placementCells?.some(pc => pc.row === r && pc.col === c);
                const pieceSideClass = p
                  ? (p.side === "player" ? "qbg-cell-player-piece" : "qbg-cell-ai-piece")
                  : "";

                return (
                  <div
                    key={c}
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
                      isArdoreTarget   ? "qbg-cell-ardore-target" : "",
                      isCaricaCell     ? "qbg-cell-carica-target" : "",
                      isArdoreHit      ? "qbg-cell-ardore-hit"    : "",
                      isArdoreImpeg    ? "qbg-cell-ardore-impeg"  : "",
                      isPlacementCell  ? "qbg-cell-placement"    : "",
                    ].join(" ")}
                    onClick={() => onCellClick(r, c)}
                  >
                    {valid && !attack && !p && <div className="qbg-dot" />}
                    {isPlacementCell && <div className="qbg-placement-dot" />}

                    {p && (
                      <BoardPiece
                        p={p} cellSize={cellSize}
                        isSelected={isSelected}
                        inRot={inRot && game.turn === "player"}
                        hasMoved={hasMoved} isMoving={isMoving}
                        isAtkCell={isAtkCell} isDefCell={isDefCell}
                        moveDx={moveDx} moveDy={moveDy}
                        hasArdore={hasArdore} hasGesta={hasGesta}
                        ardoreAvail={ardoreAvail} gestaAvail={gestaAvail}
                      />
                    )}
                    {isAttackTarget && (
                      <button
                        className="qbg-confirm-attack-btn"
                        onClick={e => { e.stopPropagation(); onCellClick(r, c); }}
                      ><img src={attackIcon} alt="attacca" /></button>
                    )}
                    {isArdoreTarget && !isPendingTarget && (
                      <button
                        className="qbg-confirm-ardore-btn"
                        onClick={e => { e.stopPropagation(); onCellClick(r, c); }}
                      ><img src={ardoreIcon} alt="ardore" /></button>
                    )}
                    {isGestaTarget && !isPendingTarget && !isArdoreTarget && (
                      <button
                        className="qbg-confirm-gesta-btn"
                        onClick={e => { e.stopPropagation(); onCellClick(r, c); }}
                      ><img src={gestaIcon} alt="gesta" /></button>
                    )}
                    {isScagliareTgt && !isPendingTarget && !isArdoreTarget && (
                      <button
                        className="qbg-confirm-gesta-btn qbg-confirm-scagliare-tgt"
                        onClick={e => { e.stopPropagation(); onCellClick(r, c); }}
                      ><img src={gestaIcon} alt="scagliare" /></button>
                    )}
                    {scagliareDest && (
                      <button
                        className="qbg-confirm-scagliare-dest-btn"
                        onClick={e => { e.stopPropagation(); onCellClick(r, c); }}
                      >💨 {scagliareDest.danno}</button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
