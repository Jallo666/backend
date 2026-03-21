import SilhouettePiece from "../SilhouettePiece.jsx";
import { abilitaPerPezzo } from "../game/questboard/qb_pieces.js";
import { TagNatura, TagRazza, TagMateriale } from "../components/PieceTag.jsx";
import AbilitaList from "../components/AbilitaList.jsx";
import PieceStats from "../components/PieceStats.jsx";

export default function RicettaCard({ ricetta, selected, giaForgiato, onClick }) {
  const { ardore, gesta, aura } = abilitaPerPezzo(ricetta.id, ricetta.natura);
  const hasAb     = ardore.length > 0 || gesta.length > 0 || aura.length > 0;

  return (
    <button
      className={`fab-ricetta-card${selected ? " fab-ricetta-card-sel" : ""}`}
      onClick={onClick}
    >
      {/* sempre visibile: silhouette + nome/natura */}
      <div className="fab-rc-always">
        <div className="fab-rc-silhouette">
          <SilhouettePiece natura={ricetta.natura} materiale={ricetta.materiale} pieceId={ricetta.id} size={200} />
        </div>
        <div className="fab-rc-header">
          <span className="fab-rc-nome">{ricetta.nome}</span>
          <div className="fab-rc-tags">
            <TagNatura natura={ricetta.natura} />
            <TagRazza razza={ricetta.razza} />
            <TagMateriale materiale={ricetta.materiale} />
          </div>
        </div>
      </div>

      {/* collassabile: stats + abilità */}
      <div className="fab-rc-collapsible">
        <div className="fab-rc-collapsible-inner">
          <PieceStats piece={ricetta} />

          {hasAb && (
            <div className="fab-rc-abilita">
              <AbilitaList ardore={ardore} gesta={gesta} aura={aura} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
