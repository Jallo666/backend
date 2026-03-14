import { canMoveInRotation, BOARD_SIZE } from "../game/questboard/qb_rules.js";
import BoardPiece from "./BoardPiece.jsx";
import "./QuestBoardGame.css";

export default function GameBoard({
  game, cellSize, moveAnim, animCell,
  combatFlash, gestaMode, gestaHitAnim,
  onCellClick,
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

                const isFrom = moveAnim && moveAnim.fromRow === r && moveAnim.fromCol === c;
                const isTo   = moveAnim && moveAnim.toRow   === r && moveAnim.toCol   === c;
                const moveDx = (isTo && p) ? (moveAnim.fromCol - c) * cellSize : 0;
                const moveDy = (isTo && p) ? (moveAnim.fromRow - r) * cellSize : 0;
                const isMoving = isTo && p && (moveDx !== 0 || moveDy !== 0);

                const isAtkCell     = combatFlash && p?.uid === combatFlash.atkUid;
                const isDefCell     = combatFlash && p?.uid === combatFlash.defUid;
                const isGestaTarget = gestaMode && p != null;
                const isGestaHit    = gestaHitAnim?.row === r && gestaHitAnim?.col === c;
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
                      isGestaTarget    ? "qbg-cell-gesta-target": "",
                      isGestaHit       ? "qbg-cell-gesta-hit"   : "",
                    ].join(" ")}
                    onClick={() => onCellClick(r, c)}
                  >
                    {valid && !attack && !p && <div className="qbg-dot" />}

                    {p && (
                      <BoardPiece
                        p={p} cellSize={cellSize}
                        isSelected={isSelected}
                        inRot={inRot && game.turn === "player"}
                        hasMoved={hasMoved} isMoving={isMoving}
                        isAtkCell={isAtkCell} isDefCell={isDefCell}
                        moveDx={moveDx} moveDy={moveDy}
                      />
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
