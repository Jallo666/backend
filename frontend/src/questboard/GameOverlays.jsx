import CoinFlip from "./CoinFlip.jsx";
import GameOverModal from "./GameOverModal.jsx";
import ReAuraNotification from "./ReAuraNotification.jsx";
import RoundEndNotification from "./RoundEndNotification.jsx";
import CombatPreview from "./CombatPreview.jsx";
import ArdorePreview from "./ArdorePreview.jsx";
import GestPreview from "./GestPreview.jsx";

/**
 * Raggruppa tutti i modali e le preview di QuestBoardGame.
 * Non contiene logica di stato: riceve tutto via props dal parent.
 */
export default function GameOverlays({
  // Stato di gioco
  game,
  onBack,
  handlePlayerChoice,

  // Notifiche
  reAuraNotif,
  onDismissReAura,
  roundEndNotif,
  onDismissRoundEnd,

  // Combat preview (giocatore)
  combatPreview,
  confirmAttack,
  onCancelCombat,

  // Attack preview (AI)
  aiAttackPreview,
  confirmAiAttack,

  // Ardore preview (AI)
  aiArdorePreview,
  confirmAiArdore,

  // Ardore preview (giocatore)
  ardorePreview,
  confirmArdorePlayer,
  onCancelArdore,

  // Carica attacco (giocatore)
  caricaAttackPreview,
  confirmCaricaAttack,
  onCancelCaricaAttack,

  // Scagliare preview (AI)
  aiScagliarePreview,
  confirmAiScagliare,

  // Gesta preview (AI)
  aiGestaPreview,
  confirmAiGesta,

  // Gesta preview (giocatore)
  gestaPreview,
  confirmGestaPlayer,
  onCancelGesta,
}) {
  return (
    <>
      {/* ── Coin Flip ── */}
      {game.status === "coinflip" && (
        <CoinFlip onChoice={handlePlayerChoice} />
      )}

      {/* ── Game Over ── */}
      {game.status === "over" && (
        <GameOverModal winner={game.winner} onBack={onBack} />
      )}

      {/* ── Forza del Popolo ── */}
      {reAuraNotif && (
        <ReAuraNotification event={reAuraNotif} onDismiss={onDismissReAura} />
      )}

      {/* ── Fine Ciclo ── */}
      {roundEndNotif && !reAuraNotif && (
        <RoundEndNotification event={roundEndNotif} onDismiss={onDismissRoundEnd} />
      )}

      {/* ── Anteprima combattimento giocatore ── */}
      {combatPreview && (
        <CombatPreview
          attacker={combatPreview.attacker}
          defender={combatPreview.defender}
          onConfirm={confirmAttack}
          onCancel={onCancelCombat}
          mode="player"
        />
      )}

      {/* ── Anteprima attacco AI ── */}
      {aiAttackPreview && !reAuraNotif && (
        <CombatPreview
          attacker={aiAttackPreview.piece}
          defender={aiAttackPreview.defender}
          onConfirm={confirmAiAttack}
          onCancel={confirmAiAttack}
          mode="ai"
        />
      )}

      {/* ── Ardore AI ── */}
      {aiArdorePreview && !reAuraNotif && (
        <ArdorePreview
          caster={aiArdorePreview.caster}
          target={aiArdorePreview.target}
          ardore={aiArdorePreview.ardore}
          onConfirm={confirmAiArdore}
          onCancel={confirmAiArdore}
          mode="ai"
          opponentNome={game.opponentNome}
        />
      )}

      {/* ── Ardore giocatore ── */}
      {ardorePreview && (
        <ArdorePreview
          caster={ardorePreview.caster}
          target={ardorePreview.target}
          ardore={ardorePreview.ardore}
          onConfirm={confirmArdorePlayer}
          onCancel={onCancelArdore}
        />
      )}

      {/* ── Carica attacco giocatore ── */}
      {caricaAttackPreview && (
        <CombatPreview
          attacker={caricaAttackPreview.caster}
          defender={caricaAttackPreview.target}
          onConfirm={confirmCaricaAttack}
          onCancel={onCancelCaricaAttack}
          mode="player"
        />
      )}

      {/* ── Scagliare AI ── */}
      {aiScagliarePreview && !reAuraNotif && (
        <GestPreview
          caster={aiScagliarePreview.caster}
          target={aiScagliarePreview.target}
          gesta={{ id: "scagliare", nome: "Scagliare", icona: "💨", danno: aiScagliarePreview.danno }}
          onConfirm={confirmAiScagliare}
          onCancel={confirmAiScagliare}
          mode="ai"
          opponentNome={game.opponentNome}
        />
      )}

      {/* ── Notifica gesta AI ── */}
      {aiGestaPreview && !reAuraNotif && (
        <GestPreview
          caster={aiGestaPreview.caster}
          target={aiGestaPreview.target}
          gesta={aiGestaPreview.gesta}
          onConfirm={confirmAiGesta}
          onCancel={confirmAiGesta}
          mode="ai"
          opponentNome={game.opponentNome}
        />
      )}

      {/* ── Anteprima gesta giocatore ── */}
      {gestaPreview && (
        <GestPreview
          caster={gestaPreview.caster}
          target={gestaPreview.target}
          gesta={gestaPreview.gesta}
          onConfirm={confirmGestaPlayer}
          onCancel={onCancelGesta}
        />
      )}
    </>
  );
}
