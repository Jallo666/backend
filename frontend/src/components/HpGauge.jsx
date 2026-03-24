import './HpGauge.css';

export default function HpGauge({ hp, hpMax }) {
  const pct = Math.round((hp / hpMax) * 100);
  return (
    <div className="hp-gauge">
      <span className="hp-gauge-label">Punti Vita</span>
      <div className="hp-gauge-track">
        <div
          className="hp-gauge-fill"
          style={{ width: `${pct}%`, '--hp-pct': pct }}
        />
        <span className="hp-gauge-text">{hp} / {hpMax}</span>
      </div>
    </div>
  );
}
