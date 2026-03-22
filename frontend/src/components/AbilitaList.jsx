import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TagArdore, TagGesta, TagAura } from './PieceTag.jsx';
import './AbilitaList.css';

const TIPO_TAG = {
  Ardore: <TagArdore />,
  Gesta:  <TagGesta />,
  Aura:   <TagAura />,
};

function AbCard({ item, tipo, className, collapsed }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  const handleEnter = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.bottom + 8 });
  };
  const handleLeave = () => setPos(null);

  return (
    <div
      ref={ref}
      className={`ab-card ${className}${collapsed ? " ab-card-collapsed" : ""}`}
      onMouseEnter={collapsed ? handleEnter : undefined}
      onMouseLeave={collapsed ? handleLeave : undefined}
    >
      <span className="ab-icon">{item.icona}</span>
      <div className="ab-info">
        <span className="ab-nome">{item.nome} {TIPO_TAG[tipo]}</span>
        {!collapsed && <span className="ab-desc">{item.desc}</span>}
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

export default function AbilitaList({ ardore = [], gesta = [], aura = [], collapsed = false }) {
  if (!ardore.length && !gesta.length && !aura.length) return null;

  return (
    <div className={`ab-list${collapsed ? " ab-list-collapsed" : ""}`}>
      {ardore.map(a => <AbCard key={a.id} item={a} tipo="Ardore" className="ab-ardore" collapsed={collapsed} />)}
      {gesta.map(g =>  <AbCard key={g.id} item={g} tipo="Gesta"  className="ab-gesta"  collapsed={collapsed} />)}
      {aura.map(au =>  <AbCard key={au.id} item={au} tipo="Aura" className="ab-aura"   collapsed={collapsed} />)}
    </div>
  );
}
