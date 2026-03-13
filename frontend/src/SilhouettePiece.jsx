import guerrieroImg  from "./assets/guerriero.png";
import arciereImg   from "./assets/arciere.png";
import arcanoImg    from "./assets/arcano.png";
import ombraImg     from "./assets/ombra.png";
import sentinellaImg from "./assets/sentinella.png";
import baluardoImg  from "./assets/baluardo.png";

const NATURA_IMG = {
  Guerriero:  guerrieroImg,
  Arciere:    arciereImg,
  Arcano:     arcanoImg,
  Ombra:      ombraImg,
  Sentinella: sentinellaImg,
  Baluardo:   baluardoImg,
};

/**
 * Mostra la silhouette di un pezzo in base alla sua natura.
 *
 * @param {string}  natura    - Una delle 6 nature
 * @param {number}  size      - Larghezza/altezza dell'immagine (px)
 * @param {string}  className - Classi CSS aggiuntive
 */
export default function SilhouettePiece({ natura, size = 48, className = "" }) {
  const src = NATURA_IMG[natura];
  if (!src) return null;
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={className || undefined}
      style={{ imageRendering: "pixelated", objectFit: "contain", flexShrink: 0, display: "block" }}
      alt={natura}
    />
  );
}
