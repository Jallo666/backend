import SilhouettePiece from "../SilhouettePiece.jsx";

const FORZA_DEL_POPOLO = {
  id:    "forza_del_popolo",
  nome:  "Forza del Popolo",
  icona: "👑",
  desc:  "Gli HP massimi aumentano di 2 per ogni alleato in vita. Se un alleato cade, il Re perde 2 HP massimi.",
};
import { TagRe, TagNatura, TagRazza, TagMateriale } from "../components/PieceTag.jsx";
import AbilitaList from "../components/AbilitaList.jsx";
import PieceStats from "../components/PieceStats.jsx";
import "./FormazionePezzo.css";

export default function FormazionePezzo({ pezzo, attiva, hideSilhouette, compactAbilita }) {
  return (
    <div
      className="form-saved-card-pezzo"
      style={{ '--piece-border': pezzo.border, '--piece-glow': pezzo.glow }}
    >
      {!hideSilhouette && <SilhouettePiece natura={pezzo.natura} materiale={pezzo.materiale} pieceId={pezzo.id} size={40} />}
      {attiva && (
        <div className="form-saved-card-pezzo-info">
          <span className="form-saved-card-pezzo-nome">{pezzo.nome}</span>
          <div className="form-saved-card-tags">
            {pezzo.isRe      && <TagRe />}
            {pezzo.natura    && <TagNatura natura={pezzo.natura} />}
            {pezzo.razza     && <TagRazza razza={pezzo.razza} />}
            {pezzo.materiale && <TagMateriale materiale={pezzo.materiale} />}
          </div>
          <PieceStats piece={pezzo} />
          <AbilitaList ardore={pezzo.ardore} gesta={pezzo.gesta} aura={pezzo.isRe ? [...(pezzo.aura ?? []), FORZA_DEL_POPOLO] : pezzo.aura} collapsed={compactAbilita} />
        </div>
      )}
    </div>
  );
}
