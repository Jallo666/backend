import "./GameFooter.css";

export default function GameFooter({ floor, gold, gems, hp }) {
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