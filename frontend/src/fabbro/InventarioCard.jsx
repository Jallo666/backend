import SilhouettePiece from "../SilhouettePiece.jsx";
import { TagNatura, TagRazza, TagMateriale } from "../components/PieceTag.jsx";
import { ardoreDiNatura, gesteDiNatura, auraDiNatura } from "../game/questboard/qb_pieces.js";
import AbilitaList from "../components/AbilitaList.jsx";
import PieceStats from "../components/PieceStats.jsx";

const NATURA_DA_NOME = {
  "Cavaliere": "Guerriero", "Ranger":    "Arciere",
  "Scudiero":  "Baluardo",  "Assassino": "Ombra",
  "Mago":      "Arcano",    "Campione":  "Sentinella",
  "Guerriero": "Guerriero", "Arciere":   "Arciere",
};

function getNatura(p) {
  if (p.materiali) return p.materiali;
  return NATURA_DA_NOME[p.nome] ?? null;
}

export default function InventarioCard({ pezzo, aperto, onToggle, onElimina }) {
  const natura  = getNatura(pezzo);
  const ardore  = natura ? ardoreDiNatura(natura) : [];
  const gesta   = natura ? gesteDiNatura(natura)  : [];
  const aura    = natura ? auraDiNatura(natura)    : [];

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
            <SilhouettePiece natura={natura} materiale={pezzo.materiale} size={200} />
          </div>
          <div className="fab-rc-header">
            <span className="fab-rc-nome">
              {pezzo.nomeCustom ?? pezzo.nome}
              {pezzo.nomeCustom && (
                <span className="inv-nome-base"> ({pezzo.nome})</span>
              )}
            </span>
            {(natura || pezzo.razza || pezzo.materiale) && (
              <div className="fab-rc-tags">
                {natura          && <TagNatura natura={natura} />}
                {pezzo.razza     && <TagRazza razza={pezzo.razza} />}
                {pezzo.materiale && <TagMateriale materiale={pezzo.materiale} />}
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
          <PieceStats piece={pezzo} />
          <AbilitaList ardore={ardore} gesta={gesta} aura={aura} />
          <button className="inv-btn-elimina" onClick={elimina}>
            🗑 ELIMINA
          </button>
        </div>
      </div>

    </div>
  );
}
