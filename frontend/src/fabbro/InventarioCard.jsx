import SilhouettePiece from "../SilhouettePiece.jsx";

const NATURA_DA_NOME = {
  "Cavaliere": "Guerriero", "Ranger":    "Arciere",
  "Scudiero":  "Baluardo",  "Assassino": "Ombra",
  "Mago":      "Arcano",    "Campione":  "Sentinella",
  "Guerriero": "Guerriero", "Arciere":   "Arciere",
};

const NATURA_COLORE = {
  Guerriero: "#d04030", Arciere:   "#a0c040",
  Baluardo:  "#4080c0", Ombra:     "#9040c0",
  Arcano:    "#40b0d0", Sentinella:"#c0a030",
};

function getNatura(p) {
  if (p.materiali) return p.materiali;
  return NATURA_DA_NOME[p.nome] ?? null;
}

export default function InventarioCard({ pezzo, aperto, onToggle, onElimina }) {
  const natura    = getNatura(pezzo);
  const natColore = NATURA_COLORE[natura] ?? "#888";

  const elimina = e => {
    e.stopPropagation();
    onElimina(pezzo.id);
  };

  return (
    <div className={`fab-ricetta-card inv-card${aperto ? " fab-ricetta-card-sel" : ""}`}>

      {/* header cliccabile + X collassata */}
      <div className="inv-card-top" onClick={onToggle}>
        <div className="fab-rc-always">
          <div className="fab-rc-silhouette">
            <SilhouettePiece natura={natura} size={200} />
          </div>
          <div className="fab-rc-header">
            <span className="fab-rc-nome">
              {pezzo.nomeCustom ?? pezzo.nome}
              {pezzo.nomeCustom && (
                <span className="inv-nome-base"> ({pezzo.nome})</span>
              )}
            </span>
            {natura && <span className="fab-rc-natura" style={{ color: natColore }}>{natura}</span>}
            {(pezzo.razza || pezzo.materiale) && (
              <div className="fab-rc-tags">
                {pezzo.razza     && <span className="fab-tag fab-tag-razza">👤 {pezzo.razza}</span>}
                {pezzo.materiale && <span className="fab-tag fab-tag-materiale">🪵 {pezzo.materiale}</span>}
              </div>
            )}
          </div>
        </div>
        {!aperto && (
          <button className="inv-btn-x" onClick={elimina} title="Elimina">✕</button>
        )}
      </div>

      {/* collassabile: stats + ELIMINA */}
      <div className="fab-rc-collapsible">
        <div className="fab-rc-collapsible-inner">
          <div className="fab-rc-stats">
            {[
              { icon: "❤", val: pezzo.hp,  lbl: "HP"  },
              { icon: "⚔", val: pezzo.atk, lbl: "ATK" },
              { icon: "🛡", val: pezzo.def, lbl: "DEF" },
              { icon: "👟", val: pezzo.mov, lbl: "MOV" },
            ].map(s => (
              <div key={s.lbl} className="fab-rc-stat">
                <span className="fab-rc-stat-icon">{s.icon}</span>
                <span className="fab-rc-stat-val">{s.val}</span>
                <span className="fab-rc-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
          <button className="inv-btn-elimina" onClick={elimina}>
            🗑 ELIMINA
          </button>
        </div>
      </div>

    </div>
  );
}
