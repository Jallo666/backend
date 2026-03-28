import "./BoardPieceStatus.css";

const STATUS_INFO = {
  dormiente:  { icon: '💤', label: 'Dormiente'     },
  immobilize: { icon: '🔒', label: 'Immobilizzato' },
};

export default function BoardPieceStatus({ hasMoved, debuffs = [] }) {
  const statuses = [];

  if (hasMoved) statuses.push(STATUS_INFO.dormiente);

  for (const d of debuffs) {
    const key  = d.effect ?? d.type;
    const info = STATUS_INFO[key];
    if (info && !statuses.some(s => s.icon === info.icon)) {
      statuses.push(info);
    }
  }

  if (statuses.length === 0) return null;

  return (
    <>
      <div className="bps-overlay" />
      <div className="bps-badges">
        {statuses.map(s => (
          <span key={s.icon} className="bps-badge">{s.icon}</span>
        ))}
      </div>
    </>
  );
}
