import { NATURA_COLORE } from '../game/questboard/qb_pieces.js';
import './PieceTag.css';

const RAZZA_COLORE = {
  Umanoide:    "#c8a060",
  Bestia:      "#80c040",
  "Non-Morto": "#9060c0",
  Elementale:  "#40b0d0",
  Draconico:   "#e06030",
  Fata:        "#e060a0",
};

const MATERIALE_COLORE = {
  Legno:     "#a06020",
  Pietra:    "#8090a0",
  Metallo:   "#7090b0",
  Osso:      "#c0b090",
  Cristallo: "#60c0e0",
  Ombra:     "#8060b0",
};

export function TagNatura({ natura }) {
  const color = NATURA_COLORE[natura] ?? "#c8a060";
  return <span className="piece-tag" style={{ '--tag-color': color }}>{natura}</span>;
}

export function TagRazza({ razza }) {
  const color = RAZZA_COLORE[razza] ?? "#c8a060";
  return <span className="piece-tag" style={{ '--tag-color': color }}>👤 {razza}</span>;
}

export function TagMateriale({ materiale }) {
  const color = MATERIALE_COLORE[materiale] ?? "#c8a060";
  return <span className="piece-tag" style={{ '--tag-color': color }}>🪵 {materiale}</span>;
}

export function TagRe() {
  return <span className="piece-tag" style={{ '--tag-color': '#f0c040' }}>♛ Re</span>;
}
