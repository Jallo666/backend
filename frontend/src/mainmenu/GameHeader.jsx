import { useEffect, useState } from "react";
import "./GameHeader.css";
export default function GameHeader({
  subtitle = "",
  username,
  onGilda,
  onLogout
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px), (max-height: 500px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (isMobile) {
    return (
      <div className="gh-mobile">
        <button
          className="gh-mobile-btn"
          onClick={() => setMenuOpen(open => !open)}
          aria-expanded={menuOpen}
          aria-label="Apri menu"
        >
          ☰
        </button>

        {menuOpen && (
          <div className="gh-mobile-menu">
            {username && <div className="gh-mobile-username">{username}</div>}
            {onGilda && (
              <button className="gh-mobile-item" onClick={() => { setMenuOpen(false); onGilda(); }}>
                [ GILDA ]
              </button>
            )}
            {onLogout && (
              <button className="gh-mobile-item" onClick={() => { setMenuOpen(false); onLogout(); }}>
                ESCI
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

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