import { TagArdore, TagGesta, TagAura } from './PieceTag.jsx';
import './AbilitaList.css';

const TIPO_TAG = {
  Ardore: <TagArdore />,
  Gesta:  <TagGesta />,
  Aura:   <TagAura />,
};

function AbCard({ item, tipo, className, collapsed }) {
  return (
    <div className={`ab-card ${className}${collapsed ? " ab-card-collapsed" : ""}`}>
      <span className="ab-icon">{item.icona}</span>
      <div className="ab-info">
        <span className="ab-nome">{item.nome} {TIPO_TAG[tipo]}</span>
        {!collapsed && <span className="ab-desc">{item.desc}</span>}
      </div>
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
