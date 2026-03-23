import SilhouettePiece from "../SilhouettePiece.jsx";
import PieceStats from "./PieceStats.jsx";
import AbilitaList from "./AbilitaList.jsx";
import { TagRe, TagLivello } from "./PieceTag.jsx";
import { NATURA_DA_NOME, abilitaPerPezzo, livelloPerRicetta } from "../game/questboard/qb_pieces.js";
import "./PiecePreviewCard.css";

export default function PiecePreviewCard({ piece }) {
  const natura = NATURA_DA_NOME[piece.nome] ?? null;
  const { ardore, gesta, aura } = abilitaPerPezzo(piece.id, natura);

  return (
    <div className="ppc">
      <div className="ppc-header">
        {piece.nome}
        {piece.isRe && <TagRe />}
        <TagLivello livello={livelloPerRicetta(piece.id)} />
      </div>
      <div className="ppc-body">
        <SilhouettePiece natura={natura} pieceId={piece.id} size={52} />
        <PieceStats piece={piece} compact />
      </div>
      <AbilitaList ardore={ardore} gesta={gesta} aura={aura} collapsed />
    </div>
  );
}
