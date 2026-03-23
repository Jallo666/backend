import guerrieroImg  from "./assets/guerriero.png";
import arciereImg   from "./assets/arciere.png";
import arcanoImg    from "./assets/arcano.png";
import ombraImg     from "./assets/ombra.png";
import sentinellaImg from "./assets/sentinella.png";
import baluardoImg  from "./assets/baluardo.png";
import chiericoImg  from "./assets/chierico.png";
import barbaroImg   from "./assets/barbaro.png";
import lupoImg      from "./assets/lupo.png";
import lichImg      from "./assets/lich.png";
import genericaImg  from "./assets/silhoutte_generica.png";

const NATURA_IMG = {
  Guerriero:  guerrieroImg,
  Arciere:    arciereImg,
  Arcano:     arcanoImg,
  Ombra:      ombraImg,
  Sentinella: sentinellaImg,
  Baluardo:   baluardoImg,
  Sacerdote:  chiericoImg,
  Selvaggio:  barbaroImg,
  generica:   genericaImg,
};

// Override per-id: quando più pezzi condividono la stessa natura ma hanno silhouette diverse
const PIECE_IMG_BY_ID = {
  barbaro:  barbaroImg,
  chierico: chiericoImg,
  lupo:     lupoImg,
  lich:     lichImg,
};

// CSS filter per materiale — aggiungere nuovi materiali qui
const MATERIALE_FILTER = {
  Legno: undefined,
};

export default function SilhouettePiece({ natura, materiale, pieceId, size = 48, className = "" }) {
  const src = (pieceId && PIECE_IMG_BY_ID[pieceId]) ?? NATURA_IMG[natura];
  if (!src) return null;
  const filter = materiale ? MATERIALE_FILTER[materiale] : undefined;
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={className || undefined}
      style={{ imageRendering: "pixelated", objectFit: "contain", flexShrink: 0, display: "block", filter }}
      alt={natura}
    />
  );
}
