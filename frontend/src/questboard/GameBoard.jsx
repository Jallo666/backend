import { canMoveInRotation, canUseArdore, BOARD_SIZE } from "../game/questboard/qb_rules.js";
import BoardCell from "./BoardCell.jsx";
import "./QuestBoardGame.css";

const COL_LABELS = Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i));

function getCellState(r, c, { game, cellSize, moveAnim, animCell, combatFlash, gestaMode, gestaHitAnim, ardoreMode, ardoreHitAnim, ardoreImpegnato, scagliareTargetUids, scagliareDests, gestaAdjacentTargetUids, ardoreTargetUids, placementCells, debuffs, cardUid, pieceAt, isValidMove, isAttackMove }) {
  const p       = pieceAt(r, c);
  const valid   = isValidMove(r, c);
  const attack  = isAttackMove(r, c);
  const isSelected = p && game.selected === p.uid;
  const isAnim     = animCell?.row === r && animCell?.col === c;
  const checker    = (r + c) % 2 === 0;

  const hasMoved = p && (
    p.side === "player"
      ? !canMoveInRotation(p.uid, game.playerRotation)
      : !canMoveInRotation(p.uid, game.aiRotation)
  );
  const inRot = p?.side === "player" && canMoveInRotation(p.uid, game.playerRotation) && game.turn === "player";

  const ardoreTracker = p?.side === "player" ? game.playerArdoreTracker : game.aiArdoreTracker;
  const hasArdore   = (p?.ardore?.length ?? 0) > 0;
  const hasGesta    = (p?.gesta?.length ?? 0) > 0;
  const ardoreAvail = hasArdore && canUseArdore(p.uid, ardoreTracker ?? { used: new Set() }) && p.canAct !== false;
  const gestaAvail  = hasGesta  && p.canAct !== false;

  const isFrom   = moveAnim && moveAnim.fromRow === r && moveAnim.fromCol === c;
  const isTo     = moveAnim && moveAnim.toRow   === r && moveAnim.toCol   === c;
  const moveDx   = (isTo && p) ? (moveAnim.fromCol - c) * cellSize : 0;
  const moveDy   = (isTo && p) ? (moveAnim.fromRow - r) * cellSize : 0;
  const isMoving = isTo && p && (moveDx !== 0 || moveDy !== 0);

  const isAtkCell      = combatFlash && p?.uid === combatFlash.atkUid;
  const isDefCell      = combatFlash && p?.uid === combatFlash.defUid;
  const isScagliareTgt = scagliareTargetUids && p != null && scagliareTargetUids.includes(p.uid);
  const scagliareDest  = scagliareDests?.find(d => d.row === r && d.col === c);
  const isGestaTarget  = !scagliareTargetUids && !scagliareDests && gestaMode && p != null
    && (gestaAdjacentTargetUids == null || gestaAdjacentTargetUids.includes(p.uid));
  const isGestaHit     = gestaHitAnim?.row === r && gestaHitAnim?.col === c;
  const caricaCaster   = ardoreMode?.tipo === "movimento"
    ? game.playerPieces.find(p2 => p2.uid === ardoreMode.casterUid)
    : null;
  const isArdoreTarget = ardoreMode && ardoreMode.tipo !== "movimento" && p != null
    && (ardoreTargetUids == null || ardoreTargetUids.includes(p.uid));
  const isCaricaCell   = caricaCaster && p == null
    && Math.abs(r - caricaCaster.row) <= 1
    && Math.abs(c - caricaCaster.col) <= 1
    && (r !== caricaCaster.row || c !== caricaCaster.col);
  const isArdoreHit    = ardoreHitAnim?.row === r && ardoreHitAnim?.col === c;
  const isArdoreImpeg  = ardoreImpegnato && p?.uid === ardoreImpegnato.pieceUid;
  const isAttackTarget = attack && p?.side === "ai" && game.selected != null && !ardoreMode && !gestaMode;
  const isPendingTarget = isAttackTarget || isArdoreTarget || scagliareDest != null;
  const isPlacementCell = placementCells?.some(pc => pc.row === r && pc.col === c);
  const pieceSideClass  = p
    ? (p.side === "player" ? "qbg-cell-player-piece" : "qbg-cell-ai-piece")
    : "";
  const pieceDebuffs = p ? (debuffs ?? []).filter(d => d.targetUid === p.uid) : [];
  const isCardOpen   = p?.uid === cardUid;

  return {
    p, valid, attack, isSelected, isAnim, checker,
    hasMoved, inRot,
    hasArdore, hasGesta, ardoreAvail, gestaAvail,
    isFrom, isTo, moveDx, moveDy, isMoving,
    isAtkCell, isDefCell,
    isScagliareTgt, scagliareDest,
    isGestaTarget, isGestaHit,
    isArdoreTarget, isCaricaCell, isArdoreHit, isArdoreImpeg,
    isAttackTarget, isPendingTarget, isPlacementCell,
    pieceSideClass, pieceDebuffs, isCardOpen,
  };
}

export default function GameBoard({
  game, cellSize, moveAnim, animCell,
  combatFlash, gestaMode, gestaHitAnim,
  ardoreMode, ardoreHitAnim, ardoreImpegnato,
  onCellClick,
  scagliareTargetUids, scagliareDests,
  gestaAdjacentTargetUids,
  ardoreTargetUids,
  placementCells,
  debuffs = [],
  cardUid = null,
}) {
  const allPieces    = [...game.playerPieces, ...game.aiPieces];
  const pieceAt      = (r, c) => allPieces.find(p => p.row === r && p.col === c);
  const isValidMove  = (r, c) => game.validMoves.some(m => m.row === r && m.col === c);
  const isAttackMove = (r, c) => game.validMoves.find(m => m.row === r && m.col === c)?.isAttack;

  const ctx = { game, cellSize, moveAnim, animCell, combatFlash, gestaMode, gestaHitAnim, ardoreMode, ardoreHitAnim, ardoreImpegnato, scagliareTargetUids, scagliareDests, gestaAdjacentTargetUids, ardoreTargetUids, placementCells, debuffs, cardUid, pieceAt, isValidMove, isAttackMove };

  return (
    <div className="qbg-scene">
      <div className="qbg-board-wrap">
        <div className="qbg-board">
          <div className="qbg-col-labels">
            {COL_LABELS.map(l => <div key={l} className="qbg-col-label">{l}</div>)}
          </div>

          {Array.from({ length: BOARD_SIZE }, (_, r) => (
            <div key={r} className="qbg-row">
              <div className="qbg-row-label">{BOARD_SIZE - r}</div>
              {Array.from({ length: BOARD_SIZE }, (_, c) => {
                const state = getCellState(r, c, ctx);
                return (
                  <BoardCell
                    key={c}
                    r={r} c={c}
                    p={state.p}
                    cellSize={cellSize}
                    state={state}
                    onCellClick={onCellClick}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
