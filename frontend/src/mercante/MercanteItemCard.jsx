import { useState } from "react";
import moneteImg from "../assets/monete.png";
import "./MercanteItemCard.css";

function QtyControl({ value, min, max, onChange, disabled }) {
  return (
    <div className="mric-qty-row">
      <button className="mric-qty-btn" disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <input
        className="mric-qty-input"
        type="number" min={min} max={max}
        value={value}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        disabled={disabled}
      />
      <button className="mric-qty-btn" disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

export default function MercanteItemCard({ risorsa, meta, prezzoVendita, prezzoAcquisto, monete, onVendi, onCompra }) {
  const [qtyVendi,  setQtyVendi]  = useState(1);
  const [qtyCompra, setQtyCompra] = useState(1);

  const qtyVendiVal  = Math.min(Math.max(1, qtyVendi),  risorsa.quantita || 1);
  const maxCompra    = monete > 0 ? Math.floor(monete / prezzoAcquisto) : 0;
  const qtyCompraVal = Math.min(Math.max(1, qtyCompra), Math.max(1, maxCompra));

  return (
    <div className="mric-card">

      {/* ── Sinistra: info risorsa ── */}
      <div className="mric-info">
        {meta.img
          ? <img src={meta.img} alt={meta.label ?? risorsa.tipo} className="mric-icon" />
          : <span className="mric-icon-fallback">📦</span>
        }
        <span className="mric-nome">{meta.label ?? risorsa.tipo}</span>
        <span className="mric-qty">{risorsa.quantita}</span>
      </div>

      {/* ── Destra: vendi + compra ── */}
      <div className="mric-azioni">
        <div className="mric-sezione">
          <span className="mric-sezione-label">Vendi</span>
          <div className="mric-qty-stack">
            <QtyControl
              value={qtyVendiVal} min={1} max={risorsa.quantita || 1}
              onChange={setQtyVendi} disabled={risorsa.quantita <= 0}
            />
            <span className="mric-prezzo">
              <img src={moneteImg} alt="monete" className="mric-monete-img" />
              {qtyVendiVal * prezzoVendita}
            </span>
          </div>
          <button className="mric-btn mric-btn-vendi"
            disabled={risorsa.quantita <= 0}
            onClick={() => { onVendi(risorsa.tipo, qtyVendiVal); setQtyVendi(1); }}>
            Vendi
          </button>
        </div>

        <div className="mric-sezione">
          <span className="mric-sezione-label">Compra</span>
          <div className="mric-qty-stack">
            <QtyControl
              value={qtyCompraVal} min={1} max={Math.max(1, maxCompra)}
              onChange={setQtyCompra} disabled={maxCompra <= 0}
            />
            <span className="mric-prezzo">
              <img src={moneteImg} alt="monete" className="mric-monete-img" />
              {qtyCompraVal * prezzoAcquisto}
            </span>
          </div>
          <button className="mric-btn mric-btn-compra"
            disabled={maxCompra <= 0}
            onClick={() => { onCompra(risorsa.tipo, qtyCompraVal); setQtyCompra(1); }}>
            Compra
          </button>
        </div>
      </div>

    </div>
  );
}
