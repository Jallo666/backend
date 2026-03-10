import { useState, useEffect, useRef, useCallback } from "react";
import {
  createGame, resolveCoinFlip, selectPiece,
  applyPlayerMove, applyAiTurn, skipBlockedPiece,
  peekAiMove, applyAiChoice,
} from "./game/questboard/qb_state.js";
import { isBlocked, canMoveInRotation, BOARD_SIZE, resolveCombat } from "./game/questboard/qb_rules.js";
import { PieceSVG } from "./game/questboard/PieceSVG.jsx";
import "./QuestBoardGame.css";

const AI_DELAY_MS = 700;

function calcCellSize() {
  const maxByW = (window.innerWidth  - 80) / BOARD_SIZE;
  const maxByH = (window.innerHeight - 190) / BOARD_SIZE;
  return Math.max(46, Math.min(maxByW, maxByH, 115));
}

// ── Frasi medievali per il dialog di combattimento ────────────────────────────
const BATTLE_QUOTES = [
  "«Per l'onore della gilda, avanza!»",
  "«Che il destino sorridà al più ardito!»",
  "«Spada contro scudo — che il migliore trionfi!»",
  "«Il coraggio decide più della forza!»",
  "«Non vi è gloria senza rischio, valoroso!»",
  "«In nome del Re, colpisci!»",
];

// ── Anteprima combattimento ───────────────────────────────────────────────────
// mode: "player" (player attacks, can cancel) | "ai" (ai attacks, read-only)
function CombatPreview({ attacker, defender, onConfirm, onCancel, mode = "player" }) {
  const result  = resolveCombat(attacker, defender);
  const atkDies = result.attackerHp <= 0;
  const defDies = result.defenderHp <= 0;
  const quote   = BATTLE_QUOTES[Math.floor(Math.random() * BATTLE_QUOTES.length)];

  let esito, resultClass;
  if (mode === "ai") {
    // Prospettiva dal punto di vista del giocatore (difensore)
    if (!atkDies && defDies) {
      esito = `${defender.nome} verrà eliminato! Nessuna speranza di resistere.`;
      resultClass = "qbg-cp-result-lose";
    } else if (atkDies && !defDies) {
      esito = `${defender.nome} resiste! L'attaccante verrà eliminato.`;
      resultClass = "qbg-cp-result-win";
    } else if (atkDies && defDies) {
      esito = "Entrambi cadranno! Un sacrificio reciproco.";
      resultClass = "qbg-cp-result-draw";
    } else {
      esito = `${defender.nome} subisce danni (${result.defenderHp} HP rimasti).`;
      resultClass = "qbg-cp-result-draw";
    }
  } else {
    if (!atkDies && defDies) {
      esito = `Vittoria! ${attacker.nome} sopravvive con ${result.attackerHp} HP.`;
      resultClass = "qbg-cp-result-win";
    } else if (atkDies && !defDies) {
      esito = `Sconfitta... ${attacker.nome} verrà eliminato.`;
      resultClass = "qbg-cp-result-lose";
    } else if (atkDies && defDies) {
      esito = "Entrambi cadranno in battaglia!";
      resultClass = "qbg-cp-result-draw";
    } else {
      esito = `${attacker.nome} ferisce ${defender.nome} (${result.defenderHp} HP rimasti).`;
      resultClass = "qbg-cp-result-win";
    }
  }

  const atkDmgPerRound = Math.max(1, attacker.atk - defender.def);
  const defDmgPerRound = Math.max(1, defender.atk - attacker.def);

  const title = mode === "ai" ? "☠ L'AVVERSARIO ATTACCA! ☠" : "⚔ SFIDA AL DUELLO ⚔";

  return (
    <div className="qbg-combat-preview">
      <div className={`qbg-cp-box ${mode === "ai" ? "qbg-cp-box-ai" : ""}`}>
        <div className={`qbg-cp-title ${mode === "ai" ? "qbg-cp-title-ai" : ""}`}>{title}</div>

        <div className="qbg-cp-matchup">
          {/* Attaccante */}
          <div className="qbg-cp-piece qbg-cp-piece-atk">
            <span className="qbg-cp-piece-icon">{attacker.icona}</span>
            <span className="qbg-cp-piece-name">{attacker.nome}</span>
            <span className="qbg-cp-piece-stats">❤{attacker.hp} ⚔{attacker.atk} 🛡{attacker.def}</span>
            <div className="qbg-cp-hp-bar">
              <div className="qbg-cp-hp-fill" style={{ width: `${(attacker.hp / attacker.hpMax) * 100}%` }} />
            </div>
          </div>

          <span className="qbg-cp-vs">VS</span>

          {/* Difensore */}
          <div className="qbg-cp-piece qbg-cp-piece-def">
            <span className="qbg-cp-piece-icon">{defender.icona}</span>
            <span className="qbg-cp-piece-name">{defender.nome}</span>
            <span className="qbg-cp-piece-stats">❤{defender.hp} ⚔{defender.atk} 🛡{defender.def}</span>
            <div className="qbg-cp-hp-bar">
              <div className="qbg-cp-hp-fill" style={{ width: `${(defender.hp / defender.hpMax) * 100}%` }} />
            </div>
          </div>
        </div>

        <hr className="qbg-cp-separator" />

        <div className="qbg-cp-forecast">
          Danni inflitti: <strong style={{ color: "#f0c040" }}>{atkDmgPerRound}/round</strong>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          Danni subiti: <strong style={{ color: "#ee6060" }}>{defDmgPerRound}/round</strong>
        </div>

        <div className={`qbg-cp-result ${resultClass}`}>{esito}</div>

        <div className="qbg-cp-quote">{quote}</div>

        <div className="qbg-cp-btns">
          {mode === "ai" ? (
            <button className="qbg-btn qbg-btn-gold" onClick={onConfirm}>Continua!</button>
          ) : (
            <>
              <button className="qbg-btn qbg-btn-gold" onClick={onConfirm}>⚔ Attacca!</button>
              <button className="qbg-btn qbg-btn-dark" onClick={onCancel}>🏃 Ritirati</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Scheda info pezzo ─────────────────────────────────────────────────────────
function PieceCard({ piece, onClose }) {
  const isPlayer = piece.side === "player";
  const hpPct = Math.round((piece.hp / piece.hpMax) * 100);
  return (
    <div className="qbg-piece-card">
      <div className="qbg-card-header">
        <span className={`qbg-card-icon qbg-card-icon-${piece.side}`}>
          <PieceSVG id={piece.id} size={80} />
        </span>
        <span className="qbg-card-title">
          {piece.nome}
          {piece.isRe && <> &nbsp;<span style={{ color: "#f0c040" }}>♛ RE</span></>}
        </span>
        <span className={`qbg-card-team ${isPlayer ? "qbg-card-team-player" : "qbg-card-team-ai"}`}>
          {isPlayer ? "TUO" : "NEMICO"}
        </span>
        <button className="qbg-card-close" onClick={onClose}>✕</button>
      </div>
      <div className="qbg-card-stats">
        {[
          { icon: "❤", val: `${piece.hp}/${piece.hpMax}`, lbl: "HP" },
          { icon: "⚔", val: piece.atk, lbl: "ATK" },
          { icon: "🛡", val: piece.def, lbl: "DEF" },
          { icon: "👟", val: piece.mov, lbl: "MOV" },
        ].map(s => (
          <div key={s.lbl} className="qbg-card-stat">
            <span className="qbg-card-stat-icon">{s.icon}</span>
            <span className="qbg-card-stat-val">{s.val}</span>
            <span className="qbg-card-stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>
      <div className="qbg-card-hp-bar">
        <div className="qbg-card-hp-fill" style={{ width: `${hpPct}%` }} />
      </div>
      <div className="qbg-card-hp-text">{piece.hp} / {piece.hpMax} HP</div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function QuestBoardGame({ inventario, formazione, utente, onBack }) {
  const [game,          setGame]          = useState(() => createGame(inventario, formazione));
  const [coinResult,    setCoinResult]    = useState(null);
  const [animCell,      setAnimCell]      = useState(null);
  const [moveAnim,      setMoveAnim]      = useState(null);
  const [combatFlash,   setCombatFlash]   = useState(null);
  const [combatPreview,    setCombatPreview]    = useState(null); // { attacker, defender, move }
  const [aiAttackPreview,  setAiAttackPreview]  = useState(null); // { piece, move, defender }
  const [pieceCard,     setPieceCard]     = useState(null);
  const [cellSize,      setCellSize]      = useState(calcCellSize);
  const [showLog,       setShowLog]       = useState(true);

  const aiTimerRef      = useRef(null);
  const moveAnimTimer   = useRef(null);
  const combatTimer     = useRef(null);
  const cardTimer       = useRef(null);
  const prevAiPiecesRef = useRef(game.aiPieces);

  useEffect(() => {
    const onResize = () => setCellSize(calcCellSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleCoinFlip = () => setCoinResult(Math.random() < 0.5 ? "heads" : "tails");
  const handlePlayerChoice = (goFirst) => {
    setGame(s => resolveCoinFlip(s, goFirst));
    setCoinResult(null);
  };

  const triggerMoveAnim = useCallback((fromRow, fromCol, toRow, toCol) => {
    clearTimeout(moveAnimTimer.current);
    setMoveAnim({ fromRow, fromCol, toRow, toCol });
    moveAnimTimer.current = setTimeout(() => setMoveAnim(null), 540);
  }, []);

  // ── Turno AI ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (game.status !== "playing" || game.turn !== "ai") return;
    clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(() => {
      setGame(s => {
        if (s.turn !== "ai" || s.status !== "playing") return s;
        const choice = peekAiMove(s);
        if (choice?.move?.isAttack && choice.move.target) {
          // Mostra dialog prima di attaccare
          setAiAttackPreview({ piece: choice.piece, move: choice.move, defender: choice.move.target });
          return s; // non applicare ancora
        }
        return applyAiTurn(s); // mossa non-attacco: applica subito
      });
    }, AI_DELAY_MS);
    return () => clearTimeout(aiTimerRef.current);
  }, [game.status, game.turn, game.round]);

  // ── Detect mossa AI ────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevAiPiecesRef.current;
    const curr = game.aiPieces;
    if (prev !== curr) {
      for (const currP of curr) {
        const oldP = prev.find(p => p.uid === currP.uid);
        if (oldP && (oldP.row !== currP.row || oldP.col !== currP.col)) {
          triggerMoveAnim(oldP.row, oldP.col, currP.row, currP.col);
          break;
        }
      }
      prevAiPiecesRef.current = curr;
    }
  }, [game.aiPieces, triggerMoveAnim]);

  // ── Animazione combattimento ───────────────────────────────────────────────
  useEffect(() => {
    if (!game.combatAnim) return;
    clearTimeout(combatTimer.current);
    setCombatFlash({ atkUid: game.combatAnim.attackerUid, defUid: game.combatAnim.defenderUid });
    combatTimer.current = setTimeout(() => {
      setCombatFlash(null);
      setGame(s => s.combatAnim ? { ...s, combatAnim: null } : s);
    }, 750);
    return () => clearTimeout(combatTimer.current);
  }, [game.combatAnim]);

  // ── Auto-chiudi scheda pezzo ───────────────────────────────────────────────
  useEffect(() => {
    if (!pieceCard) return;
    clearTimeout(cardTimer.current);
    cardTimer.current = setTimeout(() => setPieceCard(null), 5000);
    return () => clearTimeout(cardTimer.current);
  }, [pieceCard]);

  // ── Conferma attacco dopo preview (giocatore) ─────────────────────────────
  const confirmAttack = useCallback(() => {
    if (!combatPreview) return;
    const { move } = combatPreview;
    const moving = game.playerPieces.find(p => p.uid === game.selected);
    if (moving) triggerMoveAnim(moving.row, moving.col, move.row, move.col);
    setCombatPreview(null);
    setPieceCard(null);
    setGame(s => applyPlayerMove(s, move.row, move.col));
  }, [combatPreview, game, triggerMoveAnim]);

  // ── Conferma attacco AI dopo preview ──────────────────────────────────────
  const confirmAiAttack = useCallback(() => {
    if (!aiAttackPreview) return;
    const { piece, move } = aiAttackPreview;
    triggerMoveAnim(piece.row, piece.col, move.row, move.col);
    setAiAttackPreview(null);
    setPieceCard(null);
    setGame(s => applyAiChoice(s, piece.uid, move.row, move.col));
  }, [aiAttackPreview, triggerMoveAnim]);

  // ── Click cella ───────────────────────────────────────────────────────────
  const handleCellClick = useCallback((row, col) => {
    if (game.status !== "playing") return;

    const allPiecesNow = [...game.playerPieces, ...game.aiPieces];
    const clickedPiece = allPiecesNow.find(p => p.row === row && p.col === col);

    // Mostra scheda su qualsiasi pezzo (anche nemico)
    if (clickedPiece) setPieceCard(clickedPiece);

    if (game.turn !== "player") return;

    const move = game.validMoves.find(m => m.row === row && m.col === col);
    if (move) {
      if (move.isAttack && move.target) {
        // Mostra anteprima combattimento prima di attaccare
        const attacker = game.playerPieces.find(p => p.uid === game.selected);
        if (attacker) {
          setCombatPreview({ attacker, defender: move.target, move });
          return;
        }
      }
      // Spostamento semplice — applica subito
      const moving = game.playerPieces.find(p => p.uid === game.selected);
      if (moving) triggerMoveAnim(moving.row, moving.col, row, col);
      setAnimCell({ row, col });
      setTimeout(() => setAnimCell(null), 300);
      setPieceCard(null);
      setGame(s => applyPlayerMove(s, row, col));
      return;
    }

    const playerPiece = game.playerPieces.find(p => p.row === row && p.col === col);
    if (playerPiece) {
      const allOthers = allPiecesNow.filter(p => p.uid !== playerPiece.uid);
      if (isBlocked(playerPiece, allOthers) && canMoveInRotation(playerPiece.uid, game.playerRotation)) {
        setGame(s => skipBlockedPiece(s, playerPiece.uid));
        return;
      }
      setGame(s => selectPiece(s, playerPiece.uid));
      return;
    }

    // Cella vuota: deseleziona (e chiudi scheda solo se nessun pezzo cliccato)
    if (!clickedPiece) {
      setPieceCard(null);
      setGame(s => ({ ...s, selected: null, validMoves: [] }));
    }
  }, [game, triggerMoveAnim]);

  // ── Rendering ─────────────────────────────────────────────────────────────
  const allPieces    = [...game.playerPieces, ...game.aiPieces];
  const pieceAt      = (r, c) => allPieces.find(p => p.row === r && p.col === c);
  const isValidMove  = (r, c) => game.validMoves.some(m => m.row === r && m.col === c);
  const isAttackMove = (r, c) => game.validMoves.find(m => m.row === r && m.col === c)?.isAttack;

  return (
    <div className="qbg-root" style={{ "--cell-size": `${cellSize}px` }}>

      {/* ── Overlay ruota schermo ── */}
      <div className="qbg-rotate-overlay">
        <div className="qbg-rotate-icon">📱</div>
        <p className="qbg-rotate-text">Ruota lo schermo<br />in orizzontale<br />per giocare</p>
      </div>

      {/* ── Coin Flip ── */}
      {game.status === "coinflip" && (
        <div className="qbg-overlay">
          <div className="qbg-dialog">
            <h2 className="qbg-dialog-title">⚜ Tiro di Moneta</h2>
            {!coinResult ? (
              <>
                <p className="qbg-dialog-sub">Chi va per primo?</p>
                <button className="qbg-btn qbg-btn-gold" onClick={handleCoinFlip}>🪙 Lancia la moneta</button>
              </>
            ) : (
              <>
                <div className="qbg-coin-result">
                  <span className={`qbg-coin ${coinResult}`}>{coinResult === "heads" ? "👑" : "🗡"}</span>
                  <p>{coinResult === "heads" ? "Testa — hai vinto!" : "Croce"}</p>
                </div>
                <p className="qbg-dialog-sub">Vuoi andare per primo?</p>
                <div className="qbg-dialog-row">
                  <button className="qbg-btn qbg-btn-gold" onClick={() => handlePlayerChoice(true)}>Sì, primo</button>
                  <button className="qbg-btn qbg-btn-dark" onClick={() => handlePlayerChoice(false)}>No, secondo</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Game Over ── */}
      {game.status === "over" && (
        <div className="qbg-overlay">
          <div className="qbg-dialog">
            <h2 className={`qbg-dialog-title ${game.winner === "player" ? "qbg-win" : "qbg-lose"}`}>
              {game.winner === "player" ? "⚜ VITTORIA!" : game.winner === "ai" ? "☠ SCONFITTA" : "⚖ PAREGGIO"}
            </h2>
            {game.winner === "player" && <p className="qbg-dialog-sub">+50 💎 gemme</p>}
            <button className="qbg-btn qbg-btn-gold" onClick={onBack}>← Torna alla Locanda</button>
          </div>
        </div>
      )}

      {/* ── Anteprima combattimento giocatore ── */}
      {combatPreview && (
        <CombatPreview
          attacker={combatPreview.attacker}
          defender={combatPreview.defender}
          onConfirm={confirmAttack}
          onCancel={() => setCombatPreview(null)}
          mode="player"
        />
      )}

      {/* ── Anteprima attacco AI ── */}
      {aiAttackPreview && (
        <CombatPreview
          attacker={aiAttackPreview.piece}
          defender={aiAttackPreview.defender}
          onConfirm={confirmAiAttack}
          onCancel={confirmAiAttack}
          mode="ai"
        />
      )}

      {/* ── HUD ── */}
      <div className="qbg-hud">
        {/* Lato giocatore */}
        <div className={`qbg-hud-fighter qbg-hud-player-side ${game.turn === "player" ? "qbg-hud-active" : ""}`}>
          <div className="qbg-hud-avatar qbg-hud-avatar-player">
            {utente?.avatar
              ? <img src={utente.avatar} alt="avatar" className="qbg-hud-avatar-img" />
              : <span className="qbg-hud-avatar-initials">
                  {(utente?.nome?.[0] ?? "?")}
                  {(utente?.cognome?.[0] ?? "")}
                </span>
            }
          </div>
          <div className="qbg-hud-fighter-info">
            <span className="qbg-hud-fighter-name">{utente?.nome ?? "Giocatore"}</span>
            <span className="qbg-hud-fighter-pieces">♟ {game.playerPieces.length} pedine</span>
          </div>
          {game.turn === "player" && <span className="qbg-hud-turn-badge qbg-turn-player">⚔ tuo turno</span>}
        </div>

        {/* Centro VS */}
        <div className="qbg-hud-center">
          <span className="qbg-hud-vs">VS</span>
          <span className="qbg-hud-round">Round {game.round}</span>
        </div>

        {/* Lato AI */}
        <div className={`qbg-hud-fighter qbg-hud-ai-side ${game.turn === "ai" ? "qbg-hud-active" : ""}`}>
          {game.turn === "ai" && <span className="qbg-hud-turn-badge qbg-turn-ai">⏳ in corso</span>}
          <div className="qbg-hud-fighter-info qbg-hud-fighter-info-right">
            <span className="qbg-hud-fighter-name">AI</span>
            <span className="qbg-hud-fighter-pieces">♟ {game.aiPieces.length} pedine</span>
          </div>
          <div className="qbg-hud-avatar qbg-hud-avatar-ai">
            <span className="qbg-hud-avatar-initials">🤖</span>
          </div>
        </div>

        <button className="qbg-back-btn" onClick={onBack}>✕</button>
      </div>

      {/* ── Board 3D ── */}
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

                  const isAtkCell = combatFlash && p?.uid === combatFlash.atkUid;
                  const isDefCell = combatFlash && p?.uid === combatFlash.defUid;
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
                        valid && !attack ? "qbg-cell-valid"      : "",
                        valid && attack  ? "qbg-cell-attack"     : "",
                        isAnim           ? "qbg-cell-anim"       : "",
                        isFrom           ? "qbg-cell-from"       : "",
                        isTo             ? "qbg-cell-to"         : "",
                        isAtkCell        ? "qbg-cell-combat-atk" : "",
                        isDefCell        ? "qbg-cell-combat-def" : "",
                      ].join(" ")}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {valid && !attack && !p && <div className="qbg-dot" />}

                      {p && (
                        <div
                          className={[
                            "qbg-piece",
                            `qbg-piece-${p.side}`,
                            isSelected ? "qbg-piece-selected"   : "",
                            p.isRe     ? "qbg-piece-re"         : "",
                            inRot && game.turn === "player" ? "qbg-piece-ready" : "",
                            isMoving   ? "qbg-piece-moving"     : "",
                            isAtkCell  ? "qbg-piece-combat-atk" : "",
                            isDefCell  ? "qbg-piece-combat-hit" : "",
                          ].join(" ")}
                          style={{
                            "--piece-border": p.border,
                            "--piece-glow":   p.glow,
                            "--move-dx":      `${moveDx}px`,
                            "--move-dy":      `${moveDy}px`,
                          }}
                        >
                          <div className="qbg-piece-base" />
                          <div className="qbg-piece-body">
                            <span className="qbg-piece-icon"><PieceSVG id={p.id} size={cellSize * 0.54} /></span>
                            {p.isRe && <span className="qbg-piece-crown">♛</span>}
                            {hasMoved && <span className="qbg-piece-zzz">Zzz</span>}
                          </div>
                          <div className={`qbg-piece-namebadge qbg-piece-namebadge-${p.side}`}>{p.nome}</div>
                          <div className="qbg-hp-bar">
                            <div className="qbg-hp-fill" style={{ width: `${(p.hp / p.hpMax) * 100}%` }} />
                          </div>
                          <div className="qbg-piece-hp">{p.hp}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Log — pannello centrale basso ── */}
      <div className={`qbg-log-panel ${showLog ? "" : "qbg-log-hidden"}`}>
        <button className="qbg-log-tab" onClick={() => setShowLog(v => !v)}>
          {showLog ? "▼ DIARIO" : "▲ DIARIO"}
        </button>
        <div className="qbg-log-header">📜 DIARIO DI BATTAGLIA</div>
        <div className="qbg-log-content">
          {[...game.log].reverse().map((l, i) => (
            <div key={i} className="qbg-log-line" style={{ opacity: Math.max(0.3, 1 - i * 0.05) }}>{l}</div>
          ))}
        </div>
      </div>

      {/* ── Info pezzo selezionato ── */}
      {game.selected && (() => {
        const p = game.playerPieces.find(x => x.uid === game.selected);
        if (!p) return null;
        return (
          <div className="qbg-selected-info">
            <span className="qbg-sel-icon">{p.icona}</span>
            <span className="qbg-sel-nome">{p.nome}</span>
            <span className="qbg-sel-stats">❤{p.hp} ⚔{p.atk} 🛡{p.def} 👟{p.mov}</span>
            {p.isRe && <span className="qbg-sel-re">♛</span>}
          </div>
        );
      })()}

      {/* ── Tracker rotazione ── */}
      <div className="qbg-rotation">
        {/* Pedine giocatore */}
        <div className="qbg-rot-section-label qbg-rot-section-player">⚔ TUE</div>
        {game.playerPieces.map(p => {
          const ready = canMoveInRotation(p.uid, game.playerRotation);
          const sleeping = !ready;
          return (
            <div
              key={p.uid}
              className={`qbg-rot-row ${ready ? "qbg-rot-ready" : "qbg-rot-done"}`}
              onClick={() => setPieceCard(p)}
            >
              <span className="qbg-rot-icon"><PieceSVG id={p.id} size={28} /></span>
              <div className="qbg-rot-info">
                <span className="qbg-rot-nome">
                  {p.isRe && <span className="qbg-rot-crown">♛</span>}
                  {p.nome}
                  {sleeping && <span className="qbg-rot-zzz-inline">💤</span>}
                </span>
                <span className="qbg-rot-stats">❤ {p.hp} &nbsp;⚔ {p.atk} &nbsp;🛡 {p.def}</span>
              </div>
            </div>
          );
        })}

        <div className="qbg-rot-divider" />

        {/* Pedine AI */}
        <div className="qbg-rot-section-label qbg-rot-section-ai">🤖 AI</div>
        {game.aiPieces.map(p => {
          const ready = canMoveInRotation(p.uid, game.aiRotation);
          const sleeping = !ready;
          return (
            <div
              key={p.uid}
              className={`qbg-rot-row qbg-rot-row-ai ${ready ? "qbg-rot-ready" : "qbg-rot-done"}`}
              onClick={() => setPieceCard(p)}
            >
              <span className="qbg-rot-icon"><PieceSVG id={p.id} size={28} /></span>
              <div className="qbg-rot-info">
                <span className="qbg-rot-nome">
                  {p.isRe && <span className="qbg-rot-crown">♛</span>}
                  {p.nome}
                  {sleeping && <span className="qbg-rot-zzz-inline">💤</span>}
                </span>
                <span className="qbg-rot-stats">❤ {p.hp} &nbsp;⚔ {p.atk} &nbsp;🛡 {p.def}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Scheda pezzo ── */}
      {pieceCard && !combatPreview && !aiAttackPreview && (
        <PieceCard piece={pieceCard} onClose={() => setPieceCard(null)} />
      )}
    </div>
  );
}
