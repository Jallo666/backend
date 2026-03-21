import { useState, useRef, useEffect } from "react";
import "./PannelloLista.css";

export default function PannelloLista({ titolo, className = "", items, renderItem, filterFn, headerAction }) {
  const [aperto, setAperto] = useState(false);
  const [query,  setQuery]  = useState("");
  const inputRef = useRef(null);

  const conCerca = !!filterFn;
  const filtered = conCerca && query
    ? items.filter(item => filterFn(item, query))
    : items;

  useEffect(() => {
    if (aperto) inputRef.current?.focus();
    else setQuery("");
  }, [aperto]);

  return (
    <div className={`pnl-root ${className}`}>

      <div className="pnl-header">
        <span className="pnl-titolo">{titolo}</span>
        <div className="pnl-header-actions">
          {headerAction}
          {conCerca && (
            <button
              className={`pnl-cerca-btn${aperto ? " pnl-cerca-btn--active" : ""}`}
              onClick={() => setAperto(v => !v)}
              title={aperto ? "Chiudi ricerca" : "Cerca"}
            >🔍</button>
          )}
        </div>
      </div>

      {/* ── Barra di ricerca collassabile sotto l'header ── */}
      {conCerca && (
        <div className={`pnl-cerca-collapse${aperto ? " pnl-cerca-collapse--open" : ""}`}>
          <div className="pnl-cerca-collapse-inner">
            <input
              ref={inputRef}
              className="pnl-cerca-input"
              type="text"
              placeholder="Cerca..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="pnl-cerca-clear" onClick={() => setQuery("")}>✕</button>
            )}
          </div>
        </div>
      )}

      <div className="pnl-list">
        {filtered.map(renderItem)}
      </div>

    </div>
  );
}
