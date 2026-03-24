import { NATURA_COLORE } from '../game/questboard/qb_pieces.js';
import coronaIcon from '../assets/icon/corona.svg';
import ardoreIcon from '../assets/icon/ardore.svg';
import gestaIcon  from '../assets/icon/gesta.svg';
import auraIcon   from '../assets/icon/aura.svg';
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
  return <span className="piece-tag piece-tag-icon" style={{ '--tag-color': '#f0c040' }}><img src={coronaIcon} alt="" className="piece-tag-svg" />Re</span>;
}

export function TagArdore() {
  return <span className="piece-tag" style={{ '--tag-color': '#5080e0' }}><img src={ardoreIcon} alt="" className="piece-tag-svg" />Ardore</span>;
}

export function TagGesta() {
  return <span className="piece-tag" style={{ '--tag-color': '#e06030' }}><img src={gestaIcon} alt="" className="piece-tag-svg" />Gesta</span>;
}

export function TagAura() {
  return <span className="piece-tag" style={{ '--tag-color': '#50c050' }}><img src={auraIcon} alt="" className="piece-tag-svg" />Aura</span>;
}

export function TagLivello({ livello }) {
  const isAlto = livello >= 2;
  const color = isAlto ? "#e04040" : "#888888";
  return <span className="piece-tag" style={{ '--tag-color': color }}>⭐ Lv.{livello}</span>;
}

export function TagDebuff({ label }) {
  return <span className="piece-tag" style={{ '--tag-color': '#e04040' }}>🔒 {label}</span>;
}
