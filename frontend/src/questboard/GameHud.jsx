import { useState, useEffect } from "react";
import "./QuestBoardGame.css";

export default function GameHud({ game, utente, onFineTurno, pieceJustMoved, hint }) {
  const [hintCollapsed, setHintCollapsed] = useState(false);

  useEffect(() => {
    if (hint) setHintCollapsed(false);
  }, [hint]);

  return (
    <div className="qbg-hud">

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
          <div className="qbg-hud-fighter-row">
            <span className="qbg-hud-round">Round {game.playerRound}</span>
            <span className="qbg-hud-fighter-pieces">♟ {game.playerPieces.length}</span>
          </div>
        </div>
      </div>


      <div className={`qbg-hud-fighter qbg-hud-ai-side ${game.turn === "ai" ? "qbg-hud-active" : ""}`}>
        <div className="qbg-hud-fighter-info qbg-hud-fighter-info-right">
          <span className="qbg-hud-fighter-name">{game.opponentTag ?? game.opponentNome ?? "AI"}</span>
          <div className="qbg-hud-fighter-row qbg-hud-fighter-row-right">
            <span className="qbg-hud-fighter-pieces">{game.aiPieces.length} ♟</span>
            <span className="qbg-hud-round">{game.aiRound} Round</span>
          </div>
        </div>
        <div className="qbg-hud-avatar qbg-hud-avatar-ai">
          {game.opponentAvatarImg
            ? <img src={game.opponentAvatarImg} alt={game.opponentNome} className="qbg-hud-avatar-img"
                   style={{ objectPosition: game.opponentAvatarPos ?? 'center' }} />
            : <span className="qbg-hud-avatar-initials">🤖</span>
          }
        </div>
      </div>

      {onFineTurno && (
        <button
          className={`qbg-hud-fine-turno ${pieceJustMoved ? "qbg-hud-fine-turno-ready" : "qbg-hud-fine-turno-skip"}`}
          onClick={onFineTurno}
        >
          Fine<br/>Turno
        </button>
      )}

      {hint && !onFineTurno && (
        <div className={`qbg-hud-hint${hintCollapsed ? ' qbg-hud-hint--collapsed' : ''}`}>
          <span className="qbg-hud-hint-text">{hint}</span>
          <button
            className={`qbg-hud-hint-toggle${hintCollapsed ? ' qbg-hud-hint-toggle--up' : ''}`}
            onClick={() => setHintCollapsed(v => !v)}
          />
        </div>
      )}

    </div>
  );
}
