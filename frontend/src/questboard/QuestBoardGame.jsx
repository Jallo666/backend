import { useState, useEffect, useRef, useCallback } from "react";
import {
  createGame, resolveCoinFlip, selectPiece,
  applyPlayerMove, applyAiTurn, applyAiMoveOnly, applyAiMoveForPiece, skipBlockedPiece, skipPieceTurn,
  peekAiMove, applyAiChoice, applyGesta, applyArdore,
  endPlayerPieceTurn, applyArdoreCarica, applyArdoreCaricaAttack, applyScagliare,
  applyAttackerRelocation,
} from "../game/questboard/qb_state.js";
import { isBlocked, canMoveInRotation, canUseArdore, BOARD_SIZE, getScagliareTargets, getScagliareDest, calcScagliareDanno } from "../game/questboard/qb_rules.js";
import { chooseBestMove } from "../game/questboard/qb_ai.js";
import GameBoard from "./GameBoard.jsx";
import GameOverlays from "./GameOverlays.jsx";
import DiarioPanel from "./DiarioPanel.jsx";
import RotazioneTracker from "./RotazioneTracker.jsx";
import GameHud from "./GameHud.jsx";
import GameOptionsModal from "./GameOptionsModal.jsx";
import FineTurnoPopup from "./FineTurnoPopup.jsx";
import SettingsButton from "../components/SettingsButton.jsx";
import "./QuestBoardGame.css";

const AI_DELAY_MS = 1200;

function calcStatusHint(game, gestaMode, ardoreMode, pieceCard) {
  if (ardoreMode) {
    if (ardoreMode.tipo === "movimento") return "Scegli una cella adiacente (Carica)";
    const caster = game.playerPieces.find(p => p.uid === ardoreMode.casterUid);
    const ardore = caster?.ardore?.find(a => a.id === ardoreMode.ardoreId);
    return `Su chi vuoi usare ${ardore?.nome ?? 'Ardore'}?`;
  }
  if (gestaMode) {
    const caster = game.playerPieces.find(p => p.uid === gestaMode.casterUid);
    const gesta  = caster?.gesta?.find(g => g.id === gestaMode.gestaId);
    if (gestaMode.gestaId === "scagliare" && gestaMode.phase === "selectDest") {
      return "Scegli dove lanciare la pedina";
    }
    if (gestaMode.gestaId === "scagliare") {
      return "Scegli una pedina adiacente da lanciare";
    }
    return `Su chi vuoi usare ${gesta?.nome ?? 'Gesta'}?`;
  }
  if (pieceCard?.side === 'player' && !canMoveInRotation(pieceCard.uid, game.playerRotation)) {
    return 'Ha già effettuato il suo turno';
  }
  if (game.selected) {
    if (game.validMoves.length === 0) return 'Nessun movimento disponibile';
    const hasAttacks = game.validMoves.some(m => m.isAttack);
    if (hasAttacks) return '⚔ Clicca su un nemico per attaccare, o scegli una cella';
    return 'Scegli la cella in cui spostarlo';
  }
  return null;
}

function calcCellSize() {
  const mobileLandscape = window.innerHeight < 500 && window.matchMedia('(orientation: landscape)').matches;
  if (!mobileLandscape) return 168;
  const maxByW = (window.innerWidth  - 20) / BOARD_SIZE;
  // rotateX(30deg) compresses visual height ~0.7x, so we can afford bigger cells
  const maxByH = (window.innerHeight - 10) / BOARD_SIZE / 0.7;
  return Math.max(60, Math.min(maxByW, maxByH, 144));
}
// ── Componente principale ─────────────────────────────────────────────────────
export default function QuestBoardGame({ inventario, formazione, sfidante, utente, onBack }) {
  const [game,          setGame]          = useState(() => createGame(inventario, formazione, sfidante));
  const [animCell,      setAnimCell]      = useState(null);
  const [moveAnim,      setMoveAnim]      = useState(null);
  const [combatFlash,   setCombatFlash]   = useState(null);
  const [combatPreview,    setCombatPreview]    = useState(null); // { attacker, defender, move }
  const [aiAttackPreview,  setAiAttackPreview]  = useState(null); // { piece, move, defender }
  const [gestaMode,     setGestaMode]     = useState(null); // null | { gestaId, casterUid, phase?, targetUid? }
  const [gestaPreview,  setGestaPreview]  = useState(null); // null | { caster, target, gesta }
  const [aiGestaPreview, setAiGestaPreview] = useState(null); // null | { caster, target, gesta }
  const [aiScagliarePreview, setAiScagliarePreview] = useState(null); // null | { caster, target, destRow, destCol, danno }
  const [gestaHitAnim,  setGestaHitAnim]  = useState(null); // null | { row, col }
  const [ardoreMode,      setArdoreMode]      = useState(null); // null | { ardoreId, casterUid }
  const [ardorePreview,   setArdorePreview]   = useState(null); // null | { caster, target, ardore }
  const [aiArdorePreview, setAiArdorePreview] = useState(null); // null | { caster, target, ardore }
  const [ardoreHitAnim,   setArdoreHitAnim]   = useState(null); // null | { row, col }
  const [ardoreImpegnato, setArdoreImpegnato] = useState(null); // null | { pieceUid }
  const [caricaAttackPreview, setCaricaAttackPreview] = useState(null); // null | { caster, target }
  const [pendingAiMove,   setPendingAiMove]   = useState(null); // null | casterUid string
  const [gameMsg,        setGameMsg]         = useState(null); // null | string — toast breve
  const gameMsgTimer = useRef(null);
  const [pendingPlacement, setPendingPlacement] = useState(null); // null | { uid, defRow, defCol, validCells? }
  const [pendingAttack,   setPendingAttack]   = useState(null); // null | { attacker, defender, move }
  const [pieceCard,     setPieceCard]     = useState(null);
  const [cellSize,      setCellSize]      = useState(calcCellSize);
  const [showLog,       setShowLog]       = useState(true);
  const [showOptions,   setShowOptions]   = useState(false);
  const [activeTab,     setActiveTab]     = useState('diario'); // 'diario' | 'pezzo'
  const [displayLog,    setDisplayLog]    = useState(() => game.log);
  const [reAuraNotif,       setReAuraNotif]       = useState(null);
  const [roundEndNotif,     setRoundEndNotif]     = useState(null);
  const [pendingFineTurnoUid, setPendingFineTurnoUid] = useState(null);
  const [showEndTurnPopup,   setShowEndTurnPopup]   = useState(false);
  const [turnPopup,          setTurnPopup]          = useState(null); // null | { msg, requiresAck }
  const [ardoreUsedUid,     setArdoreUsedUid]     = useState(null); // uid del pezzo che ha usato ardore in questo turno

  const aiTimerRef      = useRef(null);
  const turnPopupTimer  = useRef(null);
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
    if (turnPopup || roundEndNotif || reAuraNotif) return; // aspetta OK o chiusura notifica
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
        if (choice?.gestaId === "scagliare") {
          const caster = s.aiPieces.find(p => p.uid === choice.piece.uid);
          const target = [...s.aiPieces, ...s.playerPieces].find(p => p.uid === choice.targetUid);
          if (caster && target) {
            const danno = [...s.playerPieces].some(p => p.uid === target.uid)
              ? calcScagliareDanno(caster, choice.destRow, choice.destCol)
              : 0;
            setAiScagliarePreview({ caster, target, destRow: choice.destRow, destCol: choice.destCol, danno });
            return s;
          }
        }
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
  }, [game.status, game.turn, game.playerRound, game.aiRound, turnPopup, roundEndNotif]);

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

  // ── Mostra messaggio temporaneo (2s) ─────────────────────────────────────
  const showGameMsg = useCallback((msg) => {
    clearTimeout(gameMsgTimer.current);
    setGameMsg(msg);
    gameMsgTimer.current = setTimeout(() => setGameMsg(null), 2500);
  }, []);

  // ── Apri tab scheda pezzo ─────────────────────────────────────────────────
  const openPieceTab = useCallback((p) => {
    setPieceCard(p);
    setActiveTab('pezzo');
    setShowLog(true);
  }, []);

  // ── Dopo attacco/ardore: mantieni la card sul pezzo attaccante ───────────────
  useEffect(() => {
    if (!ardoreImpegnato?.pieceUid) return;
    const piece = game.playerPieces.find(p => p.uid === ardoreImpegnato.pieceUid);
    if (piece) { setPieceCard(piece); setActiveTab('pezzo'); }
  }, [ardoreImpegnato, game.playerPieces]);

  // ── Forza del Popolo — popup notifica ────────────────────────────────────────
  useEffect(() => {
    if (game.reAuraEvent) setReAuraNotif(game.reAuraEvent);
  }, [game.reAuraEvent]);

  // ── Fine ciclo — popup notifica ───────────────────────────────────────────────
  useEffect(() => {
    if (game.cycleEndEvent) setRoundEndNotif(game.cycleEndEvent);
  }, [game.cycleEndEvent]);

  // ── Reset Fine Turno quando il turno torna al giocatore (dopo AI) ────────────
  useEffect(() => {
    if (game.turn === "player") {
      setPendingFineTurnoUid(null);
      setArdoreImpegnato(null);
      setArdoreUsedUid(null);
      setShowEndTurnPopup(false);
    }
  }, [game.turn]);

  // ── Popup Fine Turno — appare quando il pezzo attivo ha esaurito le azioni ──
  useEffect(() => {
    if (game.turn !== "player" || game.status !== "playing") return;
    const activeUid = pendingFineTurnoUid ?? ardoreImpegnato?.pieceUid ?? null;
    if (!activeUid) return;
    const piece = game.playerPieces.find(p => p.uid === activeUid);
    const gestaUsed      = piece?.canAct === false;
    const selectedNoMoves = game.selected === activeUid && game.validMoves.length === 0;
    const ardoreAndMoved  = ardoreUsedUid === activeUid && pendingFineTurnoUid === activeUid;
    const ardoreTracker   = game.playerArdoreTracker ?? { used: new Set() };
    const hasArdore       = (piece?.ardore?.length ?? 0) > 0;
    const ardoreAvail     = hasArdore && canUseArdore(piece?.uid, ardoreTracker);
    const hasGesta        = (piece?.gesta?.length ?? 0) > 0;
    const allPiecesForGesta = [...game.playerPieces, ...game.aiPieces];
    const gestaHasTargets = !hasGesta || (
      piece?.gesta?.some(g => g.id === "scagliare")
        ? getScagliareTargets(piece, allPiecesForGesta).filter(p => p.side === "ai").length > 0
        : true
    );
    const gestaAvail      = hasGesta && piece?.canAct !== false && gestaHasTargets;
    const movedPiece = pendingFineTurnoUid === activeUid && !ardoreAvail;
    if (!pendingPlacement && (gestaUsed || selectedNoMoves || ardoreAndMoved || movedPiece)) setShowEndTurnPopup(true);
  }, [pendingFineTurnoUid, ardoreImpegnato, ardoreUsedUid, game]);

  // ── Popup annuncio turno ───────────────────────────────────────────────────
  useEffect(() => {
    if (game.status !== "playing") return;
    clearTimeout(turnPopupTimer.current);
    if (game.turn === "player") {
      const nome = utente?.nome ?? "Eroe";
      setTurnPopup({ msg: `È il tuo turno, ${nome}!\nMuovi le pedine, usa gesta o ardore.`, requiresAck: false });
      turnPopupTimer.current = setTimeout(() => setTurnPopup(null), 2500);
    } else {
      setTurnPopup({ msg: "Turno dell'avversario", requiresAck: true });
      turnPopupTimer.current = setTimeout(() => setTurnPopup(null), 5000);
    }
    return () => clearTimeout(turnPopupTimer.current);
  }, [game.turn, game.status]);

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
    const movingUid = game.selected;
    if (moving) triggerMoveAnim(moving.row, moving.col, move.row, move.col);
    setCombatPreview(null);
    setArdoreImpegnato({ pieceUid: movingUid });
    setPendingFineTurnoUid(movingUid);
    setGame(s => applyPlayerMove(s, move.row, move.col));
    // Avvia valutazione celle di riposizionamento (se difensore sopravvive)
    setPendingPlacement({ uid: movingUid, defRow: move.row, defCol: move.col });
  }, [combatPreview, game, triggerMoveAnim]);

  // ── Calcola celle di riposizionamento dopo attacco ──────────────────────────
  useEffect(() => {
    if (!pendingPlacement || pendingPlacement.validCells) return;
    const { uid, defRow, defCol } = pendingPlacement;
    const attacker = game.playerPieces.find(p => p.uid === uid);
    if (!attacker) { setPendingPlacement(null); return; }
    // Difensore ancora vivo? Controlla se la sua cella è occupata
    const defenderAlive = game.aiPieces.some(p => p.row === defRow && p.col === defCol);
    if (!defenderAlive) { setPendingPlacement(null); return; } // difensore morto, nessuna scelta
    const allPieces = [...game.playerPieces, ...game.aiPieces];
    const occupied = new Set(allPieces.map(p => `${p.row},${p.col}`));
    const adjacentFree = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = defRow + dr, c = defCol + dc;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
        // Intersezione: deve essere raggiungibile dall'attaccante (distanza Chebyshev ≤ mov)
        const distFromAttacker = Math.max(Math.abs(r - attacker.row), Math.abs(c - attacker.col));
        if (distFromAttacker > attacker.mov) continue;
        // Includi la cella corrente dell'attaccante + celle libere
        if (!occupied.has(`${r},${c}`) || (r === attacker.row && c === attacker.col)) {
          adjacentFree.push({ row: r, col: c });
        }
      }
    }
    if (adjacentFree.length <= 1) { setPendingPlacement(null); return; }
    setPendingPlacement(prev => ({ ...prev, validCells: adjacentFree }));
  }, [pendingPlacement, game.playerPieces, game.aiPieces]);

  // ── Conferma Carica attacco dopo preview (giocatore) ─────────────────────
  const confirmCaricaAttack = useCallback(() => {
    if (!caricaAttackPreview) return;
    const { caster, target } = caricaAttackPreview;
    setCaricaAttackPreview(null);
    setArdoreHitAnim({ row: target.row, col: target.col });
    setTimeout(() => setArdoreHitAnim(null), 1000);
    setGame(s => {
      const afterAttack = applyArdoreCaricaAttack(s, "player", caster.uid, target.uid);
      if (afterAttack.status === "over") return afterAttack;
      return selectPiece(afterAttack, caster.uid);
    });
    setArdoreImpegnato({ pieceUid: caster.uid });
    setArdoreUsedUid(caster.uid);
    // NON settiamo pendingFineTurnoUid: carica non consuma la rotazione,
    // la pedina deve ancora fare il movimento regolare.
  }, [caricaAttackPreview]);

  // ── Conferma scagliare AI dopo preview ───────────────────────────────────
  const confirmAiScagliare = useCallback(() => {
    if (!aiScagliarePreview) return;
    const { caster, target, destRow, destCol } = aiScagliarePreview;
    setAiScagliarePreview(null);
    setGestaHitAnim({ row: destRow, col: destCol });
    setTimeout(() => setGestaHitAnim(null), 1000);
    setGame(s => applyScagliare(s, "ai", caster.uid, target.uid, destRow, destCol));
  }, [aiScagliarePreview]);

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

  // ── Conferma ardore giocatore dopo preview ───────────────────────────────
  const confirmArdorePlayer = useCallback(() => {
    if (!ardorePreview) return;
    const { caster, target, ardore } = ardorePreview;
    setArdorePreview(null);
    setArdoreHitAnim({ row: target.row, col: target.col });
    setTimeout(() => setArdoreHitAnim(null), 1000);
    setGame(s => {
      const afterArdore = applyArdore(s, "player", caster.uid, ardore.id, target.uid);
      if (afterArdore.status === "over") return afterArdore;
      return selectPiece(afterArdore, caster.uid);
    });
    setArdoreImpegnato({ pieceUid: caster.uid });
    setArdoreUsedUid(caster.uid);
  }, [ardorePreview]);

  // ── Conferma gesta giocatore dopo preview ────────────────────────────────
  const confirmGestaPlayer = useCallback(() => {
    if (!gestaPreview) return;
    const { caster, target, gesta } = gestaPreview;
    setGestaPreview(null);
    setPieceCard(null); setActiveTab('diario');
    setGestaHitAnim({ row: target.row, col: target.col });
    setTimeout(() => setGestaHitAnim(null), 1000);
    setPendingFineTurnoUid(caster.uid);
    setGame(s => applyGesta(s, "player", caster.uid, gesta.id, target.uid));
  }, [gestaPreview]);

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

    // ── Riposizionamento attaccante dopo attacco ───────────────────────────
    if (pendingPlacement?.validCells) {
      if (game.turn !== "player") return;
      const isValid = pendingPlacement.validCells.some(c => c.row === row && c.col === col);
      if (isValid) {
        setGame(s => applyAttackerRelocation(s, pendingPlacement.uid, row, col));
        setPendingPlacement(null);
      }
      return;
    }

    const allPiecesNow = [...game.playerPieces, ...game.aiPieces];
    const clickedPiece = allPiecesNow.find(p => p.row === row && p.col === col);

    // Modalità ardore
    if (ardoreMode) {
      const caster = game.playerPieces.find(p => p.uid === ardoreMode.casterUid);
      const ardore = caster?.ardore?.find(a => a.id === ardoreMode.ardoreId);

      if (ardore?.tipo === "movimento" && caster) {
        const dr = Math.abs(row - caster.row);
        const dc = Math.abs(col - caster.col);
        const isAdjacent = dr <= 1 && dc <= 1 && (dr + dc > 0);

        // Carica: click su cella vuota adiacente → spostamento
        if (!clickedPiece && isAdjacent) {
          setArdoreMode(null);
          setGame(s => {
            const afterCarica = applyArdoreCarica(s, "player", caster.uid, row, col);
            if (afterCarica.status === "over") return afterCarica;
            return selectPiece(afterCarica, caster.uid);
          });
          setArdoreImpegnato({ pieceUid: caster.uid });
          setArdoreUsedUid(caster.uid);
          return;
        }

        // Carica: click su nemico adiacente → attacco
        if (clickedPiece?.side === "ai" && isAdjacent) {
          setArdoreMode(null);
          setCaricaAttackPreview({ caster, target: clickedPiece });
          return;
        }

        setArdoreMode(null);
        return;
      }

      // Ardore danno: clicca target → mostra conferma
      if (clickedPiece && caster && ardore) {
        // Tiro di Precisione: vietato su pedine adiacenti (distanza Chebyshev ≤ 1)
        if (ardore.id === "tiro_precisione") {
          const dist = Math.max(Math.abs(clickedPiece.row - caster.row), Math.abs(clickedPiece.col - caster.col));
          if (dist <= 1) {
            showGameMsg("Tiro di Precisione non può colpire pedine adiacenti!");
            setArdoreMode(null);
            return;
          }
        }
        setArdorePreview({ caster, target: clickedPiece, ardore });
        setArdoreMode(null);
      } else {
        setArdoreMode(null);
      }
      return;
    }

    // Mostra scheda su qualsiasi pezzo (anche nemico) — sempre, indipendentemente dallo stato
    if (clickedPiece) openPieceTab(clickedPiece);

    // Se impegnato con un pezzo: blocca selezione di altri pezzi del player e deselection
    const activePieceUid = pendingFineTurnoUid ?? ardoreImpegnato?.pieceUid ?? null;
    if (activePieceUid && !gestaMode && !ardoreMode) {
      const clickedPlayer = game.playerPieces.find(p => p.row === row && p.col === col);
      if (clickedPlayer && clickedPlayer.uid !== activePieceUid) return;
      if (!clickedPiece && !game.validMoves.some(m => m.row === row && m.col === col)) return;
    }

    // Modalità gesta
    if (gestaMode) {
      const caster = game.playerPieces.find(p => p.uid === gestaMode.casterUid);

      // ── Scagliare fase 2: scegli destinazione ──────────────────────────────
      if (gestaMode.gestaId === "scagliare" && gestaMode.phase === "selectDest") {
        const allPiecesNow2 = [...game.playerPieces, ...game.aiPieces];
        const dests = getScagliareDest(caster, gestaMode.targetUid, allPiecesNow2);
        if (dests.some(d => d.row === row && d.col === col)) {
          const scagliareCasterUid = caster.uid;
          setGestaMode(null);
          setPendingFineTurnoUid(scagliareCasterUid); // mantieni activePieceUid per il popup
          setGame(s => applyScagliare(s, "player", scagliareCasterUid, gestaMode.targetUid, row, col));
        } else {
          setGestaMode(null);
        }
        return;
      }

      // ── Scagliare fase 1: scegli pedina adiacente da lanciare ──────────────
      if (gestaMode.gestaId === "scagliare" && clickedPiece) {
        const allPiecesNow2 = [...game.playerPieces, ...game.aiPieces];
        const validTargets = getScagliareTargets(caster, allPiecesNow2);
        if (validTargets.some(t => t.uid === clickedPiece.uid)) {
          setGestaMode({ ...gestaMode, phase: "selectDest", targetUid: clickedPiece.uid });
        } else {
          setGestaMode(null);
        }
        return;
      }
      if (gestaMode.gestaId === "scagliare") {
        setGestaMode(null);
        return;
      }

      // ── Gesta normale: clicca target → mostra conferma ────────────────────
      if (clickedPiece) {
        const gesta = caster?.gesta?.find(g => g.id === gestaMode.gestaId);
        if (caster && gesta) {
          if (gesta.adjacentOnly) {
            const dist = Math.max(
              Math.abs(clickedPiece.row - caster.row),
              Math.abs(clickedPiece.col - caster.col)
            );
            if (dist > 1) {
              setGestaMode(null);
              return;
            }
          }
          setGestaPreview({ caster, target: clickedPiece, gesta });
          setGestaMode(null);
        }
        return;
      }
      // click su cella vuota → annulla gesta mode
      setGestaMode(null);
      return;
    }

    if (game.turn !== "player") return;

    const move = game.validMoves.find(m => m.row === row && m.col === col);
    if (move) {
      if (move.isAttack && move.target) {
        const attacker = game.playerPieces.find(p => p.uid === game.selected);
        if (attacker) {
          // Click diretto su nemico → apre subito CombatPreview (senza doppio-click)
          setCombatPreview({ attacker, defender: move.target, move });
          setPendingAttack(null);
          return;
        }
      }
      // Spostamento semplice — applica subito
      const moving = game.playerPieces.find(p => p.uid === game.selected);
      const movingUid = game.selected;
      if (moving) triggerMoveAnim(moving.row, moving.col, row, col);
      setAnimCell({ row, col });
      setTimeout(() => setAnimCell(null), 300);
      setArdoreImpegnato({ pieceUid: movingUid });
      setPendingAttack(null);
      setPendingFineTurnoUid(movingUid);
      setGame(s => applyPlayerMove(s, row, col));
      return;
    }

    // Nemico fuori portata con pezzo selezionato → deseleziona
    if (game.selected && clickedPiece?.side === 'ai') {
      setPendingAttack(null);
      setGame(s => ({ ...s, selected: null, validMoves: [] }));
      return;
    }

    const playerPiece = game.playerPieces.find(p => p.row === row && p.col === col);
    if (playerPiece) {
      setPendingAttack(null);
      const allOthers = allPiecesNow.filter(p => p.uid !== playerPiece.uid);
      if (isBlocked(playerPiece, allOthers) && canMoveInRotation(playerPiece.uid, game.playerRotation)) {
        setArdoreImpegnato(null);
        setGame(s => skipBlockedPiece(s, playerPiece.uid));
        return;
      }
      setGame(s => selectPiece(s, playerPiece.uid));
      return;
    }

    // Cella vuota: deseleziona
    if (!clickedPiece) {
      setPendingAttack(null);
      setPieceCard(null); setActiveTab('diario');
      setGame(s => ({ ...s, selected: null, validMoves: [] }));
    }
  }, [game, gestaMode, ardoreMode, ardoreImpegnato, pendingFineTurnoUid, pendingAttack, pendingPlacement, triggerMoveAnim, openPieceTab]);


  // ── Dati per UI Scagliare ──────────────────────────────────────────────────
  let scagliareTargetUids = null; // fase 1: uid delle pedine lanciabili
  let scagliareDests = null;      // fase 2: celle di atterraggio con danno
  if (gestaMode?.gestaId === "scagliare") {
    const scagliareCaster = game.playerPieces.find(p => p.uid === gestaMode.casterUid);
    if (scagliareCaster) {
      const allPiecesForScagliare = [...game.playerPieces, ...game.aiPieces];
      if (gestaMode.phase === "selectTarget") {
        scagliareTargetUids = getScagliareTargets(scagliareCaster, allPiecesForScagliare).map(p => p.uid);
      } else if (gestaMode.phase === "selectDest") {
        scagliareDests = getScagliareDest(scagliareCaster, gestaMode.targetUid, allPiecesForScagliare)
          .map(d => ({ ...d, danno: calcScagliareDanno(scagliareCaster, d.row, d.col) }));
      }
    }
  }

  // ── Target validi per gesta adjacentOnly (es. Morso) ──────────────────────
  let gestaAdjacentTargetUids = null;
  if (gestaMode && gestaMode.gestaId !== "scagliare") {
    const gestaCaster = game.playerPieces.find(p => p.uid === gestaMode.casterUid);
    const gestaObj = gestaCaster?.gesta?.find(g => g.id === gestaMode.gestaId);
    if (gestaObj?.adjacentOnly && gestaCaster) {
      const allPiecesNowG = [...game.playerPieces, ...game.aiPieces];
      gestaAdjacentTargetUids = allPiecesNowG
        .filter(p => p.uid !== gestaCaster.uid &&
          Math.max(Math.abs(p.row - gestaCaster.row), Math.abs(p.col - gestaCaster.col)) <= 1)
        .map(p => p.uid);
    }
  }

  const activePieceUid = pendingFineTurnoUid ?? ardoreImpegnato?.pieceUid ?? null;
  const hudFineTurnoUid = activePieceUid;
  const hudPieceJustMoved = pendingFineTurnoUid !== null;
  const onFineTurnoHud = game.turn === "player" && hudFineTurnoUid
    ? () => {
        const moved = pendingFineTurnoUid !== null;
        const uidToEnd = hudFineTurnoUid;
        setPendingFineTurnoUid(null);
        setArdoreImpegnato(null);
        setPendingPlacement(null);
        if (moved) { setGame(s => endPlayerPieceTurn(s, uidToEnd)); }
        else { setGame(s => skipPieceTurn(s, uidToEnd)); }
      }
    : null;

  // ── Reset e riavvio partita ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    setShowOptions(false);
    clearTimeout(aiTimerRef.current);
    clearTimeout(moveAnimTimer.current);
    clearTimeout(combatTimer.current);
    clearTimeout(logTimer.current);
    setArdoreImpegnato(null);
    setPendingFineTurnoUid(null);
    setShowEndTurnPopup(false);
    setTurnPopup(null);
    setArdoreUsedUid(null);
    clearTimeout(turnPopupTimer.current);
    setArdoreMode(null);
    setGestaMode(null);
    setPendingAttack(null);
    setPendingPlacement(null);
    setCombatPreview(null);
    setGestaPreview(null);
    setArdorePreview(null);
    setAiAttackPreview(null);
    setAiArdorePreview(null);
    setAiGestaPreview(null);
    setAiScagliarePreview(null);
    setCaricaAttackPreview(null);
    setPendingAiMove(null);
    setPieceCard(null);
    setActiveTab('diario');
    setReAuraNotif(null);
    setRoundEndNotif(null);
    setCombatFlash(null);
    setMoveAnim(null);
    setAnimCell(null);
    setGestaHitAnim(null);
    setArdoreHitAnim(null);
    setGame(() => createGame(inventario, formazione, sfidante));
  }, [inventario, formazione, sfidante]);

  // ── Callback DiarioPanel ─────────────────────────────────────────────────
  const gestaEnabled =
    game.turn === "player" && pieceCard?.side === "player" &&
    pieceCard?.canAct &&
    !pendingFineTurnoUid &&
    (!activePieceUid || activePieceUid === pieceCard?.uid) &&
    (!gestaMode || gestaMode.casterUid === pieceCard?.uid) &&
    (!ardoreMode || ardoreMode.casterUid === pieceCard?.uid);

  const handleGestaClick = gestaEnabled
    ? (gestaId) => {
        if (gestaId === "scagliare") {
          const allPieces = [...game.playerPieces, ...game.aiPieces];
          const targets = getScagliareTargets(game.playerPieces.find(p => p.uid === pieceCard.uid), allPieces);
          if (targets.length === 0) {
            showGameMsg(`${pieceCard.nome} non ha nemici adiacenti da scagliare!`);
            return;
          }
        }
        const phase = gestaId === "scagliare" ? "selectTarget" : undefined;
        setGestaMode({ gestaId, casterUid: pieceCard.uid, phase });
        setActiveTab('diario');
      }
    : null;

  const ardoreEnabled =
    game.turn === "player" && pieceCard?.side === "player" &&
    pieceCard?.canAct &&
    (!activePieceUid || activePieceUid === pieceCard?.uid) &&
    (!gestaMode || gestaMode.casterUid === pieceCard?.uid) &&
    (!ardoreMode || ardoreMode.casterUid === pieceCard?.uid) &&
    canUseArdore(pieceCard?.uid, game.playerArdoreTracker ?? { used: new Set() });

  const handleArdoreClick = ardoreEnabled
    ? (ardoreId) => {
        const ardoreObj = pieceCard.ardore?.find(a => a.id === ardoreId);
        if (ardoreObj?.selfOnly) {
          setArdorePreview({ caster: pieceCard, target: pieceCard, ardore: ardoreObj });
        } else {
          setArdoreMode({ ardoreId, casterUid: pieceCard.uid, tipo: ardoreObj?.tipo });
          setActiveTab('diario');
        }
      }
    : null;

  const ardoreUsed = pieceCard
    ? !canUseArdore(
        pieceCard.uid,
        pieceCard.side === "player"
          ? (game.playerArdoreTracker ?? { used: new Set() })
          : (game.aiArdoreTracker    ?? { used: new Set() })
      )
    : false;

  return (
    <div className="qbg-root" style={{ "--cell-size": `${cellSize}px` }}>

      {/* ── Overlay ruota schermo ── */}
      <div className="qbg-rotate-overlay">
        <div className="qbg-rotate-icon">📱</div>
        <p className="qbg-rotate-text">Ruota lo schermo<br />in orizzontale<br />per giocare</p>
      </div>

      {/* ── Modali e preview ── */}
      <GameOverlays
        game={game}
        onBack={onBack}
        handlePlayerChoice={handlePlayerChoice}
        reAuraNotif={reAuraNotif}
        onDismissReAura={() => { setReAuraNotif(null); setGame(g => ({ ...g, reAuraEvent: null })); }}
        roundEndNotif={roundEndNotif}
        onDismissRoundEnd={() => { setRoundEndNotif(null); setGame(g => ({ ...g, cycleEndEvent: null })); }}
        combatPreview={combatPreview}
        confirmAttack={confirmAttack}
        onCancelCombat={() => setCombatPreview(null)}
        aiAttackPreview={aiAttackPreview}
        confirmAiAttack={confirmAiAttack}
        aiArdorePreview={aiArdorePreview}
        confirmAiArdore={confirmAiArdore}
        ardorePreview={ardorePreview}
        confirmArdorePlayer={confirmArdorePlayer}
        onCancelArdore={() => setArdorePreview(null)}
        caricaAttackPreview={caricaAttackPreview}
        confirmCaricaAttack={confirmCaricaAttack}
        onCancelCaricaAttack={() => setCaricaAttackPreview(null)}
        aiScagliarePreview={aiScagliarePreview}
        confirmAiScagliare={confirmAiScagliare}
        aiGestaPreview={aiGestaPreview}
        confirmAiGesta={confirmAiGesta}
        gestaPreview={gestaPreview}
        confirmGestaPlayer={confirmGestaPlayer}
        onCancelGesta={() => setGestaPreview(null)}
      />

      {/* ── Opzioni partita ── */}
      {showOptions && (
        <GameOptionsModal
          onClose={() => setShowOptions(false)}
          onRestart={handleRestart}
          onRetire={() => { setShowOptions(false); onBack(); }}
        />
      )}

      {/* ── Settings (top-left, identico alla Locanda) ── */}
      <SettingsButton onClick={() => setShowOptions(true)} absolute />

      {/* ── HUD ── */}
      <GameHud
        game={game} utente={utente} onFineTurno={onFineTurnoHud} pieceJustMoved={hudPieceJustMoved}
        hint={
          pendingPlacement?.validCells
            ? "↖ Scegli dove posizionare la tua pedina dopo l'attacco"
            : calcStatusHint(game, gestaMode, ardoreMode, pieceCard)
        }
      />

      {/* ── Board 3D ── */}
      <GameBoard
        game={game} cellSize={cellSize}
        moveAnim={moveAnim} animCell={animCell}
        combatFlash={combatFlash} gestaMode={gestaMode} gestaHitAnim={gestaHitAnim}
        ardoreMode={ardoreMode} ardoreHitAnim={ardoreHitAnim} ardoreImpegnato={ardoreImpegnato}
        onCellClick={handleCellClick}
        placementCells={pendingPlacement?.validCells ?? null}
        scagliareTargetUids={scagliareTargetUids}
        scagliareDests={scagliareDests}
        gestaAdjacentTargetUids={gestaAdjacentTargetUids}
      />

      <DiarioPanel
        showLog={showLog} setShowLog={setShowLog}
        activeTab={activeTab} setActiveTab={setActiveTab}
        displayLog={displayLog}
        opponentNome={game.opponentNome ?? "AI"}
        pieceCard={[...game.playerPieces, ...game.aiPieces].find(p => p.uid === pieceCard?.uid) ?? pieceCard}
        setPieceCard={setPieceCard}
        selectedUid={pieceCard?.side === 'player' ? pieceCard?.uid : null}
        onGestaClick={handleGestaClick}
        pieceJustMoved={pendingFineTurnoUid === pieceCard?.uid}
        onArdoreClick={handleArdoreClick}
        ardoreUsed={ardoreUsed}
        debuffs={game.debuffs ?? []}
      />

      {/* ── Info pezzo selezionato ── */}

      <RotazioneTracker game={game} openPieceTab={openPieceTab} selectedUid={pieceCard?.uid ?? null} opponentNome={game.opponentNome} />

      {/* ── Toast annuncio turno ── */}
      {turnPopup && (
        <div
          className="qbg-turn-toast"
          onClick={() => { if (!turnPopup.requiresAck) { clearTimeout(turnPopupTimer.current); setTurnPopup(null); } }}
        >
          {turnPopup.msg.split('\n').map((line, i) => <span key={i}>{line}</span>)}
          {turnPopup.requiresAck && (
            <div className="qbg-turn-countdown" />
          )}
        </div>
      )}

      {/* ── Toast messaggio info ── */}
      {gameMsg && (
        <div className="qbg-game-msg-toast" onClick={() => setGameMsg(null)}>
          {gameMsg}
        </div>
      )}

      {/* ── Popup Fine Turno ── */}
      {showEndTurnPopup && !reAuraNotif && (
        <FineTurnoPopup
          onConfirm={() => { setShowEndTurnPopup(false); onFineTurnoHud?.(); }}
          onAspetta={() => setShowEndTurnPopup(false)}
        />
      )}

    </div>
  );
}
