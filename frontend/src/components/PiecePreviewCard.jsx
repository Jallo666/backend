import SilhouettePiece from "../SilhouettePiece.jsx";
import PieceStats from "./PieceStats.jsx";
import AbilitaList from "./AbilitaList.jsx";
import { TagRe } from "./PieceTag.jsx";
import { NATURA_DA_NOME, abilitaPerPezzo } from "../game/questboard/qb_pieces.js";
import "./PiecePreviewCard.css";

export default function PiecePreviewCard({ piece }) {
  const natura = NATURA_DA_NOME[piece.nome] ?? null;
  const { ardore, gesta, aura } = abilitaPerPezzo(piece.id, natura);

  return (
    <div className="ppc">
      <div className="ppc-header">
        {piece.nome}
        {piece.isRe && <TagRe />}
      </div>
      <div className="ppc-body">
        <SilhouettePiece natura={natura} size={52} />
        <PieceStats piece={piece} compact />
      </div>
      <AbilitaList ardore={ardore} gesta={gesta} aura={aura} collapsed />
    </div>
  );
}
