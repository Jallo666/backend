import './DiarioPanel.css';
import PieceCard from './PieceCard.jsx';

export default function DiarioPanel({ showLog, setShowLog, activeTab, setActiveTab, displayLog, pieceCard, setPieceCard, onGestaClick }) {
  return (
    <div className={`qbg-log-panel ${showLog ? "" : "qbg-log-hidden"}`}>

      {/* Contenuto */}
      <div className="qbg-log-inner">
        <div className="qbg-log-tabs">
          <button
            className={`qbg-log-tab-btn ${activeTab === 'diario' ? 'active' : ''}`}
            onClick={() => setActiveTab('diario')}
          >
            📜 DIARIO
          </button>
          {pieceCard && (
            <button
              className={`qbg-log-tab-btn ${activeTab === 'pezzo' ? 'active' : ''}`}
              onClick={() => setActiveTab('pezzo')}
            >
              {pieceCard.nome}
              <span className="qbg-tab-close" onClick={(e) => { e.stopPropagation(); setPieceCard(null); setActiveTab('diario'); }}>✕</span>
            </button>
          )}
        </div>

        {activeTab === 'diario' && (
          <>
            <div className="qbg-log-header">📜 DIARIO DI BATTAGLIA</div>
            <div className="qbg-log-content">
              {[...displayLog].reverse().map((l, i) => (
                <div key={i} className="qbg-log-line" style={{ opacity: Math.max(0.3, 1 - i * 0.05) }}>{l}</div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'pezzo' && pieceCard && (
          <div className="qbg-log-piece-content">
            <PieceCard
              piece={pieceCard}
              onClose={() => { setPieceCard(null); setActiveTab('diario'); }}
              onGestaClick={onGestaClick}
            />
          </div>
        )}
      </div>

      {/* Toggle bordo destro */}
      <button className="qbg-log-tab" onClick={() => setShowLog(v => !v)}>
        {showLog ? "‹" : "›"}
      </button>

    </div>
  );
}
