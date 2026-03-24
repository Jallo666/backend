import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TagArdore, TagGesta, TagAura } from './PieceTag.jsx';
import './AbilitaList.css';

const TIPO_TAG = {
  Ardore: <TagArdore />,
  Gesta:  <TagGesta />,
  Aura:   <TagAura />,
};

const TIPO_BADGE = {
  Aura:   { label: "Sempre Attiva",  cls: "ab-badge-aura"   },
  Ardore: { label: "Azione Bonus",   cls: "ab-badge-ardore" },
};

function AbCard({ item, tipo, className, collapsed, cardMode = false, onAction = null, actionUsed = false }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  const handleEnter = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.bottom + 8 });
  };
  const handleLeave = () => setPos(null);

  const badge = TIPO_BADGE[tipo];

  return (
    <div
      ref={ref}
      className={`ab-card ${className}${collapsed ? " ab-card-collapsed" : ""}${cardMode ? " ab-card-mode" : ""}`}
      onMouseEnter={collapsed ? handleEnter : undefined}
      onMouseLeave={collapsed ? handleLeave : undefined}
    >
      <span className="ab-icon">{item.icona}</span>
      <div className="ab-info">
        {cardMode ? (
          <>
            <div className="ab-nome-row">
              <span className="ab-nome">{item.nome} {TIPO_TAG[tipo]}</span>
              {badge && <span className={`ab-badge ${badge.cls}`}>{badge.label}</span>}
            </div>
            <span className="ab-desc">{item.desc}</span>
            {onAction && (
              <button className="ab-action-btn" disabled={actionUsed} onClick={onAction}>
                {actionUsed ? "Usato" : "Usa"}
              </button>
            )}
          </>
        ) : (
          <>
            <span className="ab-nome">{item.nome} {TIPO_TAG[tipo]}</span>
            {!collapsed && <span className="ab-desc">{item.desc}</span>}
          </>
        )}
      </div>
      {collapsed && pos && createPortal(
        <div className="ab-tooltip ab-tooltip-fixed" style={{ left: pos.x, top: pos.y }}>
          <div className="ab-tooltip-nome">{item.nome}</div>
          <div className="ab-tooltip-desc">{item.desc}</div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AbilitaList({ ardore = [], gesta = [], aura = [], collapsed = false, cardMode = false, onGestaClick, onArdoreClick, ardoreUsed = false }) {
  if (!ardore.length && !gesta.length && !aura.length) return null;

  return (
    <div className={`ab-list${collapsed ? " ab-list-collapsed" : ""}`}>
      {gesta.map(g =>   <AbCard key={g.id}  item={g}  tipo="Gesta"  className="ab-gesta"  collapsed={collapsed} cardMode={cardMode} onAction={onGestaClick  ? () => onGestaClick(g.id)  : null} actionUsed={false} />)}
      {aura.map(au =>   <AbCard key={au.id} item={au} tipo="Aura"   className="ab-aura"   collapsed={collapsed} cardMode={cardMode} />)}
      {ardore.map(a =>  <AbCard key={a.id}  item={a}  tipo="Ardore" className="ab-ardore" collapsed={collapsed} cardMode={cardMode} onAction={onArdoreClick ? () => onArdoreClick(a.id) : null} actionUsed={ardoreUsed} />)}
    </div>
  );
}
