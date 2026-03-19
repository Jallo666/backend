import { useState } from "react";

export default function PannelloLista({ titolo, className = "", items, renderItem, filterFn }) {
  const [aperto, setAperto] = useState(false);
  const [query,  setQuery]  = useState("");

  const conCerca = !!filterFn;
  const filtered = conCerca && query
    ? items.filter(item => filterFn(item, query))
    : items;

  return (
    <div className={`pnl-root ${className}`}>

      <div className="pnl-header">
        <span className="fab-section-title">{titolo}</span>
        {conCerca && (
          <button
            className="fab-cerca-btn"
            onClick={() => { setAperto(v => !v); setQuery(""); }}
            title="Cerca"
          >🔍</button>
        )}
      </div>

      {aperto && (
        <div className="fab-cerca-wrap">
          <input
            className="fab-cerca-input"
            type="text"
            placeholder="Cerca..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="fab-cerca-clear" onClick={() => setQuery("")}>✕</button>
          )}
        </div>
      )}

      <div className="pnl-list">
        {filtered.map(renderItem)}
      </div>

    </div>
  );
}
