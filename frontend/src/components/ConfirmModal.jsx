import './ConfirmModal.css';

export default function ConfirmModal({ title, titleStyle, children, buttons, onClose, boxClassName }) {
  return (
    <div className="cm-overlay">
      <div className={`cm-box${boxClassName ? ` ${boxClassName}` : ""}`}>
        {onClose && <button className="cm-close" onClick={onClose}>✕</button>}
        {title && <h2 className="cm-title" style={titleStyle}>{title}</h2>}
        <div className="cm-content">{children}</div>
        {buttons?.length > 0 && (
          <div className="cm-btns">
            {buttons.map((btn, i) => (
              <button
                key={i}
                className={`cm-btn cm-btn--${btn.variant ?? 'gold'}`}
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
