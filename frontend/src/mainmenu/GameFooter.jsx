import { useEffect, useState } from "react";
import "./GameFooter.css";

export default function GameFooter({ floor, gold, gems, hp }) {
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
      <div className="gf-mobile">
        <button
          className="gf-mobile-btn"
          onClick={() => setMenuOpen(open => !open)}
          aria-expanded={menuOpen}
          aria-label="Mostra stato"
        >
          📟
        </button>

        {menuOpen && (
          <div className="gf-mobile-menu">
            <div className="gf-mobile-stat">
              <span className="gf-mobile-label">🗺 Piano</span>
              <span className="gf-mobile-value">{floor}</span>
            </div>
            <div className="gf-mobile-stat">
              <span className="gf-mobile-label">🪙 Oro</span>
              <span className="gf-mobile-value">{gold}</span>
            </div>
            <div className="gf-mobile-stat">
              <span className="gf-mobile-label">💎 Gemme</span>
              <span className="gf-mobile-value">{gems}</span>
            </div>
            <div className="gf-mobile-stat">
              <span className="gf-mobile-label">❤ HP</span>
              <span className="gf-mobile-value">{hp}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <footer className="gf-footer">
      <div className="gf-stat">
        <span className="gf-label">🗺 Piano</span>
        <span className="gf-value">{floor}</span>
      </div>

      <span className="gf-sep">|</span>

      <div className="gf-stat">
        <span className="gf-label">🪙 Oro</span>
        <span className="gf-value">{gold}</span>
      </div>

      <span className="gf-sep">|</span>

      <div className="gf-stat">
        <span className="gf-label">💎 Gemme</span>
        <span className="gf-value">{gems}</span>
      </div>

      <span className="gf-sep">|</span>

      <div className="gf-stat">
        <span className="gf-label">❤ HP</span>
        <span className="gf-value">{hp}</span>
      </div>
    </footer>
  );
}