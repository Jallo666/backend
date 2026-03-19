import SilhouettePiece from "../SilhouettePiece.jsx";
import { ardoreDiNatura, gesteDiNatura, auraDiNatura } from "../game/questboard/qb_pieces.js";
import ardoreIcon from "../assets/icon/ardore.svg";
import gestaIcon  from "../assets/icon/gesta.svg";
import auraIcon   from "../assets/icon/aura.svg";

const NATURA_COLORE = {
  Guerriero: "#d04030",
  Arciere:   "#a0c040",
  Baluardo:  "#4080c0",
  Ombra:     "#9040c0",
  Arcano:    "#40b0d0",
  Sentinella:"#c0a030",
};

const AB_META = {
  ardore: { icon: ardoreIcon, alt: "ardore" },
  gesta:  { icon: gestaIcon,  alt: "gesta"  },
  aura:   { icon: auraIcon,   alt: "aura"   },
};

function AbTag({ tipo, ab }) {
  const meta = AB_META[tipo];
  return (
    <div className="fab-rc-ab-row">
      <img src={meta.icon} alt={meta.alt} className="fab-rc-ab-icon" />
      <div className="fab-rc-ab-text">
        <span className="fab-rc-ab-nome">{ab.nome}</span>
        <span className="fab-rc-ab-desc">{ab.desc}</span>
      </div>
    </div>
  );
}

export default function RicettaCard({ ricetta, selected, giaForgiato, onClick }) {
  const natColore = NATURA_COLORE[ricetta.natura] ?? "#888";
  const ardore    = ardoreDiNatura(ricetta.natura);
  const gesta     = gesteDiNatura(ricetta.natura);
  const aura      = auraDiNatura(ricetta.natura);
  const hasAb     = ardore.length > 0 || gesta.length > 0 || aura.length > 0;

  return (
    <button
      className={`fab-ricetta-card${selected ? " fab-ricetta-card-sel" : ""}`}
      onClick={onClick}
    >
      {/* sempre visibile: silhouette + nome/natura */}
      <div className="fab-rc-always">
        <div className="fab-rc-silhouette">
          <SilhouettePiece natura={ricetta.natura} size={200} />
        </div>
        <div className="fab-rc-header">
          <span className="fab-rc-nome">{ricetta.nome}</span>
          <span className="fab-rc-natura" style={{ color: natColore }}>{ricetta.natura}</span>
          <div className="fab-rc-tags">
            <span className="fab-tag fab-tag-razza">👤 {ricetta.razza}</span>
            <span className="fab-tag fab-tag-materiale">🪵 {ricetta.materiale}</span>
          </div>
        </div>
      </div>

      {/* collassabile: stats + abilità */}
      <div className="fab-rc-collapsible">
        <div className="fab-rc-collapsible-inner">
          <div className="fab-rc-stats">
            {[
              { icon: "❤", val: ricetta.hp,  lbl: "HP"  },
              { icon: "⚔", val: ricetta.atk, lbl: "ATK" },
              { icon: "🛡", val: ricetta.def, lbl: "DEF" },
              { icon: "👟", val: ricetta.mov, lbl: "MOV" },
            ].map(s => (
              <div key={s.lbl} className="fab-rc-stat">
                <span className="fab-rc-stat-icon">{s.icon}</span>
                <span className="fab-rc-stat-val">{s.val}</span>
                <span className="fab-rc-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>

          {hasAb && (
            <div className="fab-rc-abilita">
              {ardore.map(a => <AbTag key={a.id} tipo="ardore" ab={a} />)}
              {gesta.map(g  => <AbTag key={g.id} tipo="gesta"  ab={g} />)}
              {aura.map(au  => <AbTag key={au.id} tipo="aura"  ab={au} />)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
