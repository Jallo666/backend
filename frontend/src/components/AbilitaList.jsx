import './AbilitaList.css';

export default function AbilitaList({ ardore = [], gesta = [], aura = [] }) {
  if (!ardore.length && !gesta.length && !aura.length) return null;

  return (
    <div className="ab-list">
      {ardore.map(a => (
        <div key={a.id} className="ab-card ab-ardore">
          <span className="ab-icon">{a.icona}</span>
          <div className="ab-info">
            <span className="ab-nome">{a.nome} <span className="ab-tipo">Ardore</span></span>
            <span className="ab-desc">{a.desc}</span>
          </div>
        </div>
      ))}
      {gesta.map(g => (
        <div key={g.id} className="ab-card ab-gesta">
          <span className="ab-icon">{g.icona}</span>
          <div className="ab-info">
            <span className="ab-nome">{g.nome} <span className="ab-tipo">Gesta</span></span>
            <span className="ab-desc">{g.desc}</span>
          </div>
        </div>
      ))}
      {aura.map(au => (
        <div key={au.id} className="ab-card ab-aura">
          <span className="ab-icon">{au.icona}</span>
          <div className="ab-info">
            <span className="ab-nome">{au.nome} <span className="ab-tipo">Aura</span></span>
            <span className="ab-desc">{au.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
