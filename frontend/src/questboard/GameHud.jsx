import settingsIcon from "../assets/icon/settings.svg";
import "./QuestBoardGame.css";

export default function GameHud({ game, utente, onOptions, onFineTurno, pieceJustMoved }) {
  return (
    <div className="qbg-hud">
      <div className="qbg-hud-matchup">
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
        </div>

        {/* Centro VS */}
        <div className="qbg-hud-center">
          <span className="qbg-hud-vs">VS</span>
          <span className="qbg-hud-round">R{game.playerRound} / R{game.aiRound}</span>
        </div>

        {/* Lato AI */}
        <div className={`qbg-hud-fighter qbg-hud-ai-side ${game.turn === "ai" ? "qbg-hud-active" : ""}`}>
          <div className="qbg-hud-fighter-info qbg-hud-fighter-info-right">
            <span className="qbg-hud-fighter-name">{game.opponentTag ?? game.opponentNome ?? "AI"}</span>
            <span className="qbg-hud-fighter-pieces">♟ {game.aiPieces.length} pedine</span>
          </div>
          <div className="qbg-hud-avatar qbg-hud-avatar-ai">
            {game.opponentAvatarImg
              ? <img src={game.opponentAvatarImg} alt={game.opponentNome} className="qbg-hud-avatar-img"
                     style={{ objectPosition: game.opponentAvatarPos ?? 'center' }} />
              : <span className="qbg-hud-avatar-initials">🤖</span>
            }
          </div>
        </div>
      </div>

      {onFineTurno && (
        <button
          className={`qbg-hud-fine-turno ${pieceJustMoved ? "qbg-hud-fine-turno-ready" : "qbg-hud-fine-turno-skip"}`}
          onClick={onFineTurno}
        >
          {pieceJustMoved ? "Fine\nTurno" : "Fine\nTurno"}
        </button>
      )}

      <button className="qbg-back-btn" onClick={onOptions} title="Opzioni">
        <img src={settingsIcon} alt="opzioni" className="qbg-settings-icon" />
      </button>
    </div>
  );
}
