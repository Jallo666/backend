import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import SilhouettePiece from '../SilhouettePiece.jsx';
import PieceStats from '../components/PieceStats.jsx';
import AbilitaList from '../components/AbilitaList.jsx';
import HpGauge from '../components/HpGauge.jsx';
import { TagRe } from '../components/PieceTag.jsx';
import { canMoveInRotation } from '../game/questboard/qb_rules.js';

const DEBUFF_INFO = {
  immobilize: { icon: '🔒', label: 'Immobilizzato' },
};

function StatusIcon({ icon, label }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const handleEnter = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.bottom + 8 });
  };
  return (
    <span
      ref={ref}
      className="qbg-rot-status-icon"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setPos(null)}
    >
      {icon}
      {pos && createPortal(
        <div className="ab-tooltip ab-tooltip-fixed" style={{ left: pos.x, top: pos.y }}>
          <div className="ab-tooltip-nome">{label}</div>
        </div>,
        document.body
      )}
    </span>
  );
}

export default function RotPieceRow({ p, rotation, isAi, collapsed, onClick, selected, debuffs = [] }) {
  const ready = canMoveInRotation(p.uid, rotation);
  const pieceDebuffs = debuffs.filter(d => d.targetUid === p.uid);
  const hasStatuses = !ready || pieceDebuffs.length > 0;

  return (
    <div
      className={`qbg-rot-row ${isAi ? "qbg-rot-row-ai" : ""} ${ready ? "qbg-rot-ready" : "qbg-rot-done"} ${selected ? "qbg-rot-selected" : ""}`}
      onClick={() => onClick(p)}
    >
      <span className="qbg-rot-icon">
        <SilhouettePiece natura={p.natura} pieceId={p.id} size={96} />
        {hasStatuses && (
          <div className="qbg-rot-statuses">
            {!ready && <StatusIcon icon="💤" label="Dormiente" />}
            {pieceDebuffs.map((d, i) => {
              const info = DEBUFF_INFO[d.effect] ?? { icon: '⚠', label: d.effect };
              return <StatusIcon key={i} icon={info.icon} label={info.label} />;
            })}
          </div>
        )}
      </span>
      {!collapsed && (
        <div className="qbg-rot-info">
          <span className="qbg-rot-nome">
            {p.isRe && <TagRe />}
            {p.nome}
          </span>
          <HpGauge hp={p.hp} hpMax={p.hpMax} compact />
          <PieceStats piece={p} compact />
          <AbilitaList ardore={p.ardore} gesta={p.gesta} aura={p.aura} collapsed />
        </div>
      )}
    </div>
  );
}
