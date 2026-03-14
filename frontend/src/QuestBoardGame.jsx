import { useState, useEffect, useRef, useCallback } from "react";
import {
  createGame, resolveCoinFlip, selectPiece,
  applyPlayerMove, applyAiTurn, skipBlockedPiece,
  peekAiMove, applyAiChoice, applyGesta,
} from "./game/questboard/qb_state.js";
import { isBlocked, canMoveInRotation, BOARD_SIZE } from "./game/questboard/qb_rules.js";
import BoardPiece from "./BoardPiece.jsx";
import CombatPreview from "./CombatPreview.jsx";
import GestPreview from "./GestPreview.jsx";
import DiarioPanel from "./DiarioPanel.jsx";
import RotazioneTracker from "./RotazioneTracker.jsx";
import "./QuestBoardGame.css";

const AI_DELAY_MS = 1200;

function calcCellSize() {
  const maxByW = (window.innerWidth  - 80) / BOARD_SIZE;
  const maxByH = (window.innerHeight - 190) / BOARD_SIZE;
  return Math.max(46, Math.min(maxByW, maxByH, 115));
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
  const [gestaMode,     setGestaMode]     = useState(null); // null | { gestaId, casterUid }
  const [gestaPreview,  setGestaPreview]  = useState(null); // null | { caster, target, gesta }
  const [pieceCard,     setPieceCard]     = useState(null);
  const [cellSize,      setCellSize]      = useState(calcCellSize);
  const [showLog,       setShowLog]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('diario'); // 'diario' | 'pezzo'
  const [displayLog,    setDisplayLog]    = useState(() => game.log);

  const aiTimerRef      = useRef(null);
  const moveAnimTimer   = useRef(null);
  const combatTimer     = useRef(null);
  const logTimer        = useRef(null);
  const prevAiPiecesRef = useRef(game.aiPieces);
  const aiMovingRef     = useRef(false);

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
    moveAnimTimer.current = setTimeout(() => setMoveAnim(null), 1000);
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
          aiMovingRef.current = true;
          triggerMoveAnim(oldP.row, oldP.col, currP.row, currP.col);
          break;
        }
      }
      prevAiPiecesRef.current = curr;
    }
  }, [game.aiPieces, triggerMoveAnim]);

  // ── Log ritardato: il messaggio AI appare dopo l'animazione ───────────────
  useEffect(() => {
    clearTimeout(logTimer.current);
    if (aiMovingRef.current) {
      logTimer.current = setTimeout(() => {
        setDisplayLog(game.log);
        aiMovingRef.current = false;
      }, 900);
    } else {
      setDisplayLog(game.log);
    }
    return () => clearTimeout(logTimer.current);
  }, [game.log]);

  // ── Apri tab scheda pezzo ─────────────────────────────────────────────────
  const openPieceTab = useCallback((p) => {
    setPieceCard(p);
    setActiveTab('pezzo');
    setShowLog(true);
  }, []);

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

  // ── Conferma attacco dopo preview (giocatore) ─────────────────────────────
  const confirmAttack = useCallback(() => {
    if (!combatPreview) return;
    const { move } = combatPreview;
    const moving = game.playerPieces.find(p => p.uid === game.selected);
    if (moving) triggerMoveAnim(moving.row, moving.col, move.row, move.col);
    setCombatPreview(null);
    setPieceCard(null); setActiveTab('diario');
    setGame(s => applyPlayerMove(s, move.row, move.col));
  }, [combatPreview, game, triggerMoveAnim]);

  // ── Conferma attacco AI dopo preview ──────────────────────────────────────
  const confirmAiAttack = useCallback(() => {
    if (!aiAttackPreview) return;
    const { piece, move } = aiAttackPreview;
    triggerMoveAnim(piece.row, piece.col, move.row, move.col);
    setAiAttackPreview(null);
    setPieceCard(null); setActiveTab('diario');
    setGame(s => applyAiChoice(s, piece.uid, move.row, move.col));
  }, [aiAttackPreview, triggerMoveAnim]);

  // ── Click cella ───────────────────────────────────────────────────────────
  const handleCellClick = useCallback((row, col) => {
    if (game.status !== "playing") return;

    const allPiecesNow = [...game.playerPieces, ...game.aiPieces];
    const clickedPiece = allPiecesNow.find(p => p.row === row && p.col === col);

    // Modalità gesta: clicca target → mostra conferma
    if (gestaMode && clickedPiece) {
      const caster = game.playerPieces.find(p => p.uid === gestaMode.casterUid);
      const gesta  = caster?.gesta?.find(g => g.id === gestaMode.gestaId);
      if (caster && gesta) {
        setGestaPreview({ caster, target: clickedPiece, gesta });
        setGestaMode(null);
      }
      return;
    }
    if (gestaMode) {
      // click su cella vuota → annulla gesta mode
      setGestaMode(null);
      return;
    }

    // Mostra scheda su qualsiasi pezzo (anche nemico)
    if (clickedPiece) openPieceTab(clickedPiece);

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
      setPieceCard(null); setActiveTab('diario');
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
      setPieceCard(null); setActiveTab('diario');
      setGame(s => ({ ...s, selected: null, validMoves: [] }));
    }
  }, [game, gestaMode, triggerMoveAnim, openPieceTab]);

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

      {/* ── Anteprima gesta giocatore ── */}
      {gestaPreview && (
        <GestPreview
          caster={gestaPreview.caster}
          target={gestaPreview.target}
          gesta={gestaPreview.gesta}
          onConfirm={() => {
            const { caster, target, gesta } = gestaPreview;
            setGestaPreview(null);
            setPieceCard(null); setActiveTab('diario');
            setGame(s => applyGesta(s, "player", caster.uid, gesta.id, target.uid));
          }}
          onCancel={() => setGestaPreview(null)}
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
                  const isDefCell    = combatFlash && p?.uid === combatFlash.defUid;
                  const isGestaTarget = gestaMode && p != null;
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
                        isGestaTarget    ? "qbg-cell-gesta-target": "",
                      ].join(" ")}
                      onClick={() => handleCellClick(r, c)}
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

      <DiarioPanel
        showLog={showLog} setShowLog={setShowLog}
        activeTab={activeTab} setActiveTab={setActiveTab}
        displayLog={displayLog}
        pieceCard={pieceCard} setPieceCard={setPieceCard}
      />

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
            {game.turn === "player" && p.gesta?.map(g => (
              <button
                key={g.id}
                className={`qbg-btn-gesta ${gestaMode?.gestaId === g.id ? "qbg-btn-gesta-active" : ""}`}
                onClick={() => setGestaMode(gestaMode?.gestaId === g.id ? null : { gestaId: g.id, casterUid: p.uid })}
              >
                {g.icona} {g.nome}
              </button>
            ))}
          </div>
        );
      })()}

      <RotazioneTracker game={game} openPieceTab={openPieceTab} />

    </div>
  );
}
