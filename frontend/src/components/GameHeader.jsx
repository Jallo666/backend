import BackButton from './BackButton';
import './GameHeader.css';

export default function GameHeader({ title, subtitle, onBack, backTitle = "Torna al Menu", rightSlot }) {
  return (
    <header className="gh-header">
      <BackButton onClick={onBack} title={backTitle} />
      <div className="gh-center">
        <h1 className="gh-title">{title}</h1>
        {subtitle && <p className="gh-subtitle">{subtitle}</p>}
      </div>
      <div className="gh-right">{rightSlot}</div>
    </header>
  );
}
