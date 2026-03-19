import './GameModal.css';

export default function GameModal({ title, children, buttons, onClose }) {
  return (
    <div className="gm-overlay">
      <div className="gm-box">
        {onClose && (
          <button className="gm-close" onClick={onClose}>✕</button>
        )}
        {title && <h2 className="gm-title">{title}</h2>}
        <div className="gm-content">{children}</div>
        {buttons?.length > 0 && (
          <div className="gm-btns">
            {buttons.map((btn, i) => (
              <button
                key={i}
                className={`qbg-btn qbg-btn-${btn.variant ?? 'gold'}`}
                onClick={btn.onClick}
                disabled={btn.disabled}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
