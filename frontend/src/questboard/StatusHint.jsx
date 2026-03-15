import './StatusHint.css';

export default function StatusHint({ hint }) {
  if (!hint) return null;
  return (
    <div className="qbg-status-hint">
      <span className="qbg-status-hint-text">{hint}</span>
    </div>
  );
}
