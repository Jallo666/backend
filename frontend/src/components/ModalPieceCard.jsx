import SilhouettePiece from '../SilhouettePiece.jsx';
import PieceStats from './PieceStats.jsx';
import AbilitaList from './AbilitaList.jsx';
import { TagRe, TagNatura, TagRazza, TagMateriale, TagLivello } from './PieceTag.jsx';
import { abilitaPerPezzo, livelloPerRicetta } from '../game/questboard/qb_pieces.js';
import './ModalPieceCard.css';

export default function ModalPieceCard({ pezzo, variant = 'target', showHpBar = false, size = 80 }) {
  const { ardore, gesta, aura } = abilitaPerPezzo(pezzo.id, pezzo.natura);
  const hpPct = Math.round((pezzo.hp / pezzo.hpMax) * 100);

  return (
    <div className={`mdc mdc--${variant}`}>
      <div className="mdc-header">
        <span className="mdc-nome">{pezzo.nomeCustom ?? pezzo.nome}</span>
        {pezzo.isRe && <TagRe />}
      </div>

      <div className="mdc-body">
        <SilhouettePiece natura={pezzo.natura} pieceId={pezzo.id} size={size} />
        <PieceStats piece={pezzo} />
      </div>

      <div className="mdc-tags">
        {pezzo.natura   && <TagNatura   natura={pezzo.natura} />}
        {pezzo.razza    && <TagRazza    razza={pezzo.razza} />}
        {pezzo.materiale && <TagMateriale materiale={pezzo.materiale} />}
        <TagLivello livello={livelloPerRicetta(pezzo.id)} />
      </div>

      <AbilitaList ardore={ardore} gesta={gesta} aura={aura} collapsed />

      {showHpBar && (
        <div className="mdc-hp-bar">
          <div className="mdc-hp-fill" style={{ width: `${hpPct}%` }} />
        </div>
      )}
    </div>
  );
}
