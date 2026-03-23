import legnaImg  from "../assets/materiali/legna.png";
import quarzoImg from "../assets/gemme/quarzo.png";
import resinaImg from "../assets/reagenti/resina.png";

export const COSTO_FORGIA = [
  { tipo: "legna",  label: "Legna",  img: legnaImg,  qty: 2 },
  { tipo: "quarzo", label: "Quarzo", img: quarzoImg, qty: 2 },
  { tipo: "resina", label: "Resina", img: resinaImg, qty: 2 },
];

export function puoForgiare(materiali, costo = COSTO_FORGIA) {
  return costo.every(c =>
    (materiali.find(m => m.tipo === c.tipo)?.quantita ?? 0) >= c.qty
  );
}

export default function RequisitiForgia({ pezzo, materiali, costo = COSTO_FORGIA }) {
  return (
    <div className="req-root">
      <p className="req-titolo">
        Per fabbricare <span className="req-nome">{pezzo.nome}</span> hai bisogno di:
      </p>
      <div className="req-lista">
        {costo.map(c => {
          const disponibile = materiali.find(m => m.tipo === c.tipo)?.quantita ?? 0;
          const ok = disponibile >= c.qty;
          return (
            <div key={c.tipo} className={`req-item${ok ? " req-ok" : " req-no"}`}>
              <img src={c.img} alt={c.label} className="req-icon" />
              <span className="req-label">{c.label}</span>
              <span className="req-qty">×{c.qty}</span>
              <span className="req-hai">hai {disponibile}</span>
              <span className="req-check">{ok ? "✓" : "✗"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
