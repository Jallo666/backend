import "./GameHeader.css";
import logo from "../assets/questboard_logo.svg";
export default function GameHeader({
  title = "QUEST BOARD",
  subtitle = "",
  username,
  onGilda,
  onLogout
}) {
  return (
    <header className="gh-header">
      
      <div className="gh-left">
        {onGilda && (
          <button className="gh-gilda-btn" onClick={onGilda}>
            [ GILDA ]
          </button>
        )}
      </div>

      <div className="gh-title-area">
        <img
  src={logo}
  alt={title}
  className="gh-logo"
/>
        {subtitle && (
          <p className="gh-subtitle">{subtitle}</p>
        )}
      </div>

      <div className="gh-right">
        {username && (
          <span className="gh-username">{username}</span>
        )}

        {onLogout && (
          <button className="gh-logout-btn" onClick={onLogout}>
            ESCI
          </button>
        )}
      </div>

    </header>
  );
}