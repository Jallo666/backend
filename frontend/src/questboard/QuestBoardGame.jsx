import { useState, useEffect, useRef, useCallback } from "react";
import {
  createGame, resolveCoinFlip, selectPiece,
  applyPlayerMove, applyAiTurn, applyAiMoveOnly, applyAiMoveForPiece, skipBlockedPiece, skipPieceTurn,
  peekAiMove, applyAiChoice, applyGesta, applyArdore,
} from "../game/questboard/qb_state.js";
import { isBlocked, canMoveInRotation, canUseArdore, BOARD_SIZE } from "../game/questboard/qb_rules.js";
import { chooseBestMove } from "../game/questboard/qb_ai.js";
import GameBoard from "./GameBoard.jsx";
import CombatPreview from "./CombatPreview.jsx";
import GestPreview from "./GestPreview.jsx";
import ArdorePreview from "./ArdorePreview.jsx";
import DiarioPanel from "./DiarioPanel.jsx";
import RotazioneTracker from "./RotazioneTracker.jsx";
import GameHud from "./GameHud.jsx";
import GameOverModal from "./GameOverModal.jsx";
import GameOptionsModal from "./GameOptionsModal.jsx";
import CoinFlip from "./CoinFlip.jsx";
import "./QuestBoardGame.css";

const AI_DELAY_MS = 1200;

function calcCellSize() {
  const maxByW = (window.innerWidth  - 60) / BOARD_SIZE;
  const maxByH = (window.innerHeight - 200) / BOARD_SIZE;
  return Math.max(46, Math.min(maxByW, maxByH, 144));
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function QuestBoardGame({ inventario, formazione, utente, onBack }) {
  const [game,          setGame]          = useState(() => createGame(inventario, formazione));
  const [animCell,      setAnimCell]      = useState(null);
  const [moveAnim,      setMoveAnim]      = useState(null);
  const [combatFlash,   setCombatFlash]   = useState(null);
  const [combatPreview,    setCombatPreview]    = useState(null); // { attacker, defender, move }
  const [aiAttackPreview,  setAiAttackPreview]  = useState(null); // { piece, move, defender }
  const [gestaMode,     setGestaMode]     = useState(null); // null | { gestaId, casterUid }
  const [gestaPreview,  setGestaPreview]  = useState(null); // null | { caster, target, gesta }
  const [aiGestaPreview, setAiGestaPreview] = useState(null); // null | { caster, target, gesta }
  const [gestaHitAnim,  setGestaHitAnim]  = useState(null); // null | { row, col }
  const [ardoreMode,      setArdoreMode]      = useState(null); // null | { ardoreId, casterUid }
  const [ardorePreview,   setArdorePreview]   = useState(null); // null | { caster, target, ardore }
  const [aiArdorePreview, setAiArdorePreview] = useState(null); // null | { caster, target, ardore }
  const [ardoreHitAnim,   setArdoreHitAnim]   = useState(null); // null | { row, col }
  const [ardoreImpegnato, setArdoreImpegnato] = useState(null); // null | { pieceUid }
  const [pendingAiMove,   setPendingAiMove]   = useState(null); // null | casterUid string
  const [pieceCard,     setPieceCard]     = useState(null);
  const [cellSize,      setCellSize]      = useState(calcCellSize);
  const [showLog,       setShowLog]       = useState(true);
  const [showOptions,   setShowOptions]   = useState(false);
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

  const handlePlayerChoice = (goFirst) => setGame(s => resolveCoinFlip(s, goFirst));

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
        const peek = peekAiMove(s);

        // Fase 1: Ardore (azione bonus)
        if (peek?.ardore) {
          const { piece, ardoreId, targetUid } = peek.ardore;
          const caster = s.aiPieces.find(p => p.uid === piece.uid);
          const target = [...s.aiPieces, ...s.playerPieces].find(p => p.uid === targetUid);
          const ardore = caster?.ardore?.find(a => a.id === ardoreId);
          if (caster && target && ardore) {
            setAiArdorePreview({ caster, target, ardore });
            return s; // non applicare ancora
          }
        }

        // Fase 2: mossa/gesta regolare
        const choice = peek?.move;
        if (choice?.gestaId) {
          const caster = s.aiPieces.find(p => p.uid === choice.piece.uid);
          const target = [...s.aiPieces, ...s.playerPieces].find(p => p.uid === choice.targetUid);
          const gesta  = caster?.gesta?.find(g => g.id === choice.gestaId);
          if (caster && target && gesta) {
            setAiGestaPreview({ caster, target, gesta });
            return s;
          }
        }
        if (choice?.move?.isAttack && choice.move.target) {
          setAiAttackPreview({ piece: choice.piece, move: choice.move, defender: choice.move.target });
          return s;
        }
        return applyAiTurn(s);
      });
    }, AI_DELAY_MS);
    return () => clearTimeout(aiTimerRef.current);
  }, [game.status, game.turn, game.round]);

  // ── Mossa AI dopo ardore (pendingAiMove = uid del pezzo che deve muoversi) ─
  useEffect(() => {
    if (!pendingAiMove) return;
    const casterUid = pendingAiMove;
    const t = setTimeout(() => {
      setPendingAiMove(null);
      setGame(s => {
        if (s.turn !== "ai" || s.status !== "playing") return s;
        // Forza l'AI a muovere solo il pezzo che ha usato Ardore
        const piece = s.aiPieces.find(p => p.uid === casterUid);
        if (!piece) return applyAiMoveOnly(s); // fallback: pezzo eliminato dal suo stesso ardore
        const choice = chooseBestMove([piece], s.playerPieces, s.aiRotation);
        if (choice?.move?.isAttack && choice.move.target) {
          setAiAttackPreview({ piece: choice.piece, move: choice.move, defender: choice.move.target });
          return s;
        }
        return applyAiMoveForPiece(s, casterUid);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [pendingAiMove]);

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
    setArdoreImpegnato(null);
    setGame(s => applyPlayerMove(s, move.row, move.col));
  }, [combatPreview, game, triggerMoveAnim]);

  // ── Conferma gesta AI dopo preview ───────────────────────────────────────
  const confirmAiGesta = useCallback(() => {
    if (!aiGestaPreview) return;
    const { caster, target, gesta } = aiGestaPreview;
    setAiGestaPreview(null);
    setGestaHitAnim({ row: target.row, col: target.col });
    setTimeout(() => setGestaHitAnim(null), 1000);
    setGame(s => applyGesta(s, "ai", caster.uid, gesta.id, target.uid));
  }, [aiGestaPreview]);

  // ── Conferma ardore AI dopo preview ──────────────────────────────────────
  const confirmAiArdore = useCallback(() => {
    if (!aiArdorePreview) return;
    const { caster, target, ardore } = aiArdorePreview;
    setAiArdorePreview(null);
    setArdoreHitAnim({ row: target.row, col: target.col });
    setTimeout(() => setArdoreHitAnim(null), 1000);
    setGame(s => applyArdore(s, "ai", caster.uid, ardore.id, target.uid));
    setPendingAiMove(caster.uid); // dopo ardore l'AI deve muovere lo stesso pezzo
  }, [aiArdorePreview]);

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

    // Modalità ardore: clicca target → mostra conferma
    if (ardoreMode && clickedPiece) {
      const caster = game.playerPieces.find(p => p.uid === ardoreMode.casterUid);
      const ardore = caster?.ardore?.find(a => a.id === ardoreMode.ardoreId);
      if (caster && ardore) {
        setArdorePreview({ caster, target: clickedPiece, ardore });
        setArdoreMode(null);
      }
      return;
    }
    if (ardoreMode) {
      setArdoreMode(null);
      return;
    }

    // Se impegnato: blocca selezione di altri pezzi del player e deselection
    if (ardoreImpegnato) {
      const clickedPlayer = game.playerPieces.find(p => p.row === row && p.col === col);
      if (clickedPlayer && clickedPlayer.uid !== ardoreImpegnato.pieceUid) return;
      if (!clickedPiece && !game.validMoves.some(m => m.row === row && m.col === col)) return;
    }

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
      setArdoreImpegnato(null);
      setGame(s => applyPlayerMove(s, row, col));
      return;
    }

    const playerPiece = game.playerPieces.find(p => p.row === row && p.col === col);
    if (playerPiece) {
      const allOthers = allPiecesNow.filter(p => p.uid !== playerPiece.uid);
      if (isBlocked(playerPiece, allOthers) && canMoveInRotation(playerPiece.uid, game.playerRotation)) {
        setArdoreImpegnato(null);
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
  }, [game, gestaMode, ardoreMode, ardoreImpegnato, triggerMoveAnim, openPieceTab]);


  return (
    <div className="qbg-root" style={{ "--cell-size": `${cellSize}px` }}>

      {/* ── Overlay ruota schermo ── */}
      <div className="qbg-rotate-overlay">
        <div className="qbg-rotate-icon">📱</div>
        <p className="qbg-rotate-text">Ruota lo schermo<br />in orizzontale<br />per giocare</p>
      </div>

      {/* ── Coin Flip ── */}
      {game.status === "coinflip" && (
        <CoinFlip onChoice={handlePlayerChoice} />
      )}

      {/* ── Game Over ── */}
      {game.status === "over" && (
        <GameOverModal winner={game.winner} onBack={onBack} />
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

      {/* ── Ardore AI ── */}
      {aiArdorePreview && (
        <ArdorePreview
          caster={aiArdorePreview.caster}
          target={aiArdorePreview.target}
          ardore={aiArdorePreview.ardore}
          onConfirm={confirmAiArdore}
          onCancel={confirmAiArdore}
          mode="ai"
        />
      )}

      {/* ── Ardore giocatore ── */}
      {ardorePreview && (
        <ArdorePreview
          caster={ardorePreview.caster}
          target={ardorePreview.target}
          ardore={ardorePreview.ardore}
          onConfirm={() => {
            const { caster, target, ardore } = ardorePreview;
            setArdorePreview(null);
            setArdoreHitAnim({ row: target.row, col: target.col });
            setTimeout(() => setArdoreHitAnim(null), 1000);
            setGame(s => {
              const afterArdore = applyArdore(s, "player", caster.uid, ardore.id, target.uid);
              if (afterArdore.status === "over") return afterArdore;
              return selectPiece(afterArdore, caster.uid); // pre-seleziona il pezzo impegnato
            });
            setArdoreImpegnato({ pieceUid: caster.uid });
            // Rimani sulla tab pezzo così il player vede il bottone Ardore grayed
          }}
          onCancel={() => setArdorePreview(null)}
        />
      )}

      {/* ── Notifica gesta AI ── */}
      {aiGestaPreview && (
        <GestPreview
          caster={aiGestaPreview.caster}
          target={aiGestaPreview.target}
          gesta={aiGestaPreview.gesta}
          onConfirm={confirmAiGesta}
          onCancel={confirmAiGesta}
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
            setGestaHitAnim({ row: target.row, col: target.col });
            setTimeout(() => setGestaHitAnim(null), 1000);
            setGame(s => applyGesta(s, "player", caster.uid, gesta.id, target.uid));
          }}
          onCancel={() => setGestaPreview(null)}
        />
      )}

      {/* ── HUD ── */}
      <GameHud game={game} utente={utente} onOptions={() => setShowOptions(true)} />

      {showOptions && (
        <GameOptionsModal
          onClose={() => setShowOptions(false)}
          onRestart={() => {
            setShowOptions(false);
            setGame(() => createGame(inventario, formazione));
          }}
          onRetire={() => { setShowOptions(false); onBack(); }}
        />
      )}

      {/* ── Board 3D ── */}
      <GameBoard
        game={game} cellSize={cellSize}
        moveAnim={moveAnim} animCell={animCell}
        combatFlash={combatFlash} gestaMode={gestaMode} gestaHitAnim={gestaHitAnim}
        ardoreMode={ardoreMode} ardoreHitAnim={ardoreHitAnim} ardoreImpegnato={ardoreImpegnato}
        onCellClick={handleCellClick}
      />

      <DiarioPanel
        showLog={showLog} setShowLog={setShowLog}
        activeTab={activeTab} setActiveTab={setActiveTab}
        displayLog={displayLog}
        pieceCard={pieceCard} setPieceCard={setPieceCard}
        onGestaClick={
          game.turn === "player" && pieceCard?.side === "player"
            ? (gestaId) => {
                setGestaMode({ gestaId, casterUid: pieceCard.uid });
                setActiveTab('diario');
              }
            : null
        }
        onSkipAction={
          game.turn === "player" && pieceCard?.side === "player" &&
          canMoveInRotation(pieceCard?.uid, game.playerRotation) &&
          (
            (!ardoreImpegnato || ardoreImpegnato.pieceUid !== pieceCard?.uid) ||
            // Permetti skip se il pezzo impegnato non ha mosse valide (è bloccato)
            (ardoreImpegnato?.pieceUid === pieceCard?.uid && game.validMoves.length === 0)
          )
            ? () => {
                setPieceCard(null); setActiveTab('diario');
                setArdoreImpegnato(null);
                setGame(s => skipPieceTurn(s, pieceCard.uid));
              }
            : null
        }
        onArdoreClick={
          game.turn === "player" && pieceCard?.side === "player" &&
          canMoveInRotation(pieceCard?.uid, game.playerRotation) &&
          canUseArdore(pieceCard?.uid, game.playerArdoreTracker ?? { used: new Set() })
            ? (ardoreId) => {
                setArdoreMode({ ardoreId, casterUid: pieceCard.uid });
                setActiveTab('diario');
              }
            : null
        }
        ardoreUsed={
          pieceCard
            ? !canUseArdore(
                pieceCard.uid,
                pieceCard.side === "player"
                  ? (game.playerArdoreTracker ?? { used: new Set() })
                  : (game.aiArdoreTracker    ?? { used: new Set() })
              )
            : false
        }
      />

      {/* ── Info pezzo selezionato ── */}

      <RotazioneTracker game={game} openPieceTab={openPieceTab} />

    </div>
  );
}
