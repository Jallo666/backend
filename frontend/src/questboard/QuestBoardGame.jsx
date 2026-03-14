import { useState, useEffect, useRef, useCallback } from "react";
import {
  createGame, resolveCoinFlip, selectPiece,
  applyPlayerMove, applyAiTurn, skipBlockedPiece,
  peekAiMove, applyAiChoice, applyGesta,
} from "../game/questboard/qb_state.js";
import { isBlocked, canMoveInRotation, BOARD_SIZE } from "../game/questboard/qb_rules.js";
import GameBoard from "./GameBoard.jsx";
import CombatPreview from "./CombatPreview.jsx";
import GestPreview from "./GestPreview.jsx";
import DiarioPanel from "./DiarioPanel.jsx";
import RotazioneTracker from "./RotazioneTracker.jsx";
import GameHud from "./GameHud.jsx";
import GameOverModal from "./GameOverModal.jsx";
import GameOptionsModal from "./GameOptionsModal.jsx";
import CoinFlip from "./CoinFlip.jsx";
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
  const [animCell,      setAnimCell]      = useState(null);
  const [moveAnim,      setMoveAnim]      = useState(null);
  const [combatFlash,   setCombatFlash]   = useState(null);
  const [combatPreview,    setCombatPreview]    = useState(null); // { attacker, defender, move }
  const [aiAttackPreview,  setAiAttackPreview]  = useState(null); // { piece, move, defender }
  const [gestaMode,     setGestaMode]     = useState(null); // null | { gestaId, casterUid }
  const [gestaPreview,  setGestaPreview]  = useState(null); // null | { caster, target, gesta }
  const [aiGestaPreview, setAiGestaPreview] = useState(null); // null | { caster, target, gesta }
  const [gestaHitAnim,  setGestaHitAnim]  = useState(null); // null | { row, col }
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
        const choice = peekAiMove(s);
        if (choice?.gestaId) {
          const caster = s.aiPieces.find(p => p.uid === choice.piece.uid);
          const target = [...s.aiPieces, ...s.playerPieces].find(p => p.uid === choice.targetUid);
          const gesta  = caster?.gesta?.find(g => g.id === choice.gestaId);
          if (caster && target && gesta) {
            setAiGestaPreview({ caster, target, gesta });
            return s; // non applicare ancora
          }
        }
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

  // ── Conferma gesta AI dopo preview ───────────────────────────────────────
  const confirmAiGesta = useCallback(() => {
    if (!aiGestaPreview) return;
    const { caster, target, gesta } = aiGestaPreview;
    setAiGestaPreview(null);
    setGestaHitAnim({ row: target.row, col: target.col });
    setTimeout(() => setGestaHitAnim(null), 1000);
    setGame(s => applyGesta(s, "ai", caster.uid, gesta.id, target.uid));
  }, [aiGestaPreview]);

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
      />

      {/* ── Info pezzo selezionato ── */}

      <RotazioneTracker game={game} openPieceTab={openPieceTab} />

    </div>
  );
}
