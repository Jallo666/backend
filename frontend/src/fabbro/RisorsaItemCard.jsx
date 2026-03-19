export default function RisorsaItemCard({ risorsa, meta }) {
  return (
    <div className="risorsa-item-card">
      {meta.img
        ? <img src={meta.img} alt={meta.label ?? risorsa.tipo} className="risorsa-item-icon" />
        : <span className="risorsa-item-icon-fallback">📦</span>
      }
      <span className="risorsa-item-nome">{meta.label ?? risorsa.tipo}</span>
      <span className="risorsa-item-qty">{risorsa.quantita}</span>
    </div>
  );
}
