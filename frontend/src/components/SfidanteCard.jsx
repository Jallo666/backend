import { CLASSIC_PIECES } from "../game/questboard/qb_pieces.js";
import PiecePreviewCard from "./PiecePreviewCard.jsx";
import "./SfidanteCard.css";

function StarRating({ value, max = 5 }) {
  return (
    <div className="sc-stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? "sc-star-on" : "sc-star-off"}>★</span>
      ))}
    </div>
  );
}

export default function SfidanteCard({ sfidante, onSfida }) {
  const sf = sfidante;
  const pezzi = sf.pezziPreview ?? CLASSIC_PIECES;
  return (
    <div className="sc-card">
      <div className="sc-left">
        <div className="sc-portrait">
          <img
            src={sf.img}
            alt={sf.nome}
            className="sc-img"
            style={{ objectPosition: sf.avatarPos ?? "center" }}
          />
        </div>
        <button className="sc-sfida-btn" onClick={() => onSfida(sf)}>
          ⚔ Sfida
        </button>
      </div>
      <div className="sc-info">
        <div className="sc-nome">{sf.nome}</div>
        <div className="sc-titolo">{sf.titolo}</div>
        <StarRating value={sf.difficolta} />
        <p className="sc-desc">{sf.descrizione}</p>
        <div className="sc-preview-wrap">
          <div className="sc-preview-list">
            {pezzi.map(p => <PiecePreviewCard key={p.id} piece={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
