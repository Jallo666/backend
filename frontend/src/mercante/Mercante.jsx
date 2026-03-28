import { useState, useEffect } from "react";
import GameHeader from "../components/GameHeader.jsx";
import PannelloLista from "../components/PannelloLista.jsx";
import MercanteItemCard from "./MercanteItemCard.jsx";
import legnaImg       from "../assets/materiali/legna.png";
import quarzoImg      from "../assets/gemme/quarzo.png";
import oniceNeroImg   from "../assets/gemme/onice_nero.png";
import resinaImg      from "../assets/reagenti/resina.png";
import farinaOssaImg  from "../assets/reagenti/farina_ossa.png";
import moneteImg      from "../assets/monete.png";
import "./Mercante.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const META = {
  legna:       { label: "Legna",         img: legnaImg,      categoria: "materiale", prezzoAcquisto: 2, prezzoVendita: 1 },
  quarzo:      { label: "Quarzo",        img: quarzoImg,     categoria: "gemma",     prezzoAcquisto: 4, prezzoVendita: 2 },
  onice_nero:  { label: "Onice Nero",    img: oniceNeroImg,  categoria: "gemma",     prezzoAcquisto: 4, prezzoVendita: 2 },
  resina:      { label: "Resina",        img: resinaImg,     categoria: "reagente",  prezzoAcquisto: 4, prezzoVendita: 2 },
  farina_ossa: { label: "Farina d'Ossa", img: farinaOssaImg, categoria: "reagente",  prezzoAcquisto: 4, prezzoVendita: 2 },
};

const GRUPPI = [
  { titolo: "Materiali", categoria: "materiale" },
  { titolo: "Gemme",     categoria: "gemma"     },
  { titolo: "Reagenti",  categoria: "reagente"  },
];

export default function Mercante({ token, onBack }) {
  const [monete,    setMonete]    = useState(0);
  const [materiali, setMateriali] = useState([]);
  const [toast,     setToast]     = useState(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/api/me/preferenze`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/materiali`,     { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([pref, mat]) => {
      if (pref) setMonete(pref.monete);
      if (mat)  setMateriali(mat);
    });
  }, [token]);

  const handleVendi = async (tipo, quantita) => {
    const res = await fetch(`${API_URL}/api/materiali/vendi`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tipo, quantita }),
    });
    if (!res.ok) return;
    const { quantita: nuovaQty, monete: nuoveMonete } = await res.json();
    setMateriali(prev => prev.map(m => m.tipo === tipo ? { ...m, quantita: nuovaQty } : m));
    setMonete(nuoveMonete);
    const guadagno = (META[tipo]?.prezzoVendita ?? 0) * quantita;
    setToast(`+${guadagno} monete`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCompra = async (tipo, quantita) => {
    const res = await fetch(`${API_URL}/api/materiali/compra`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tipo, quantita }),
    });
    if (!res.ok) return;
    const { quantita: nuovaQty, monete: nuoveMonete } = await res.json();
    setMateriali(prev => prev.map(m => m.tipo === tipo ? { ...m, quantita: nuovaQty } : m));
    setMonete(nuoveMonete);
    const costo = (META[tipo]?.prezzoAcquisto ?? 0) * quantita;
    setToast(`−${costo} monete`);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="mer-root">
      {toast && <div className="mer-toast">{toast}</div>}

      <GameHeader
        title="Il Mercante Errante"
        subtitle="Gundrik il Commerciante"
        onBack={onBack}
      />

      <div className="mer-body">

        <section className="mer-sezione">
          <div className="mer-sezione-header">
            <h2 className="mer-sezione-titolo">Inventario</h2>
            <div className="mer-monete">
              <img src={moneteImg} alt="monete" className="mer-monete-img" />
              {monete}
            </div>
          </div>

          <div className="mer-colonne">
            {GRUPPI.map(({ titolo, categoria }) => {
              const items = materiali.filter(m => {
                const meta = META[m.tipo];
                return meta?.categoria === categoria;
              });
              return (
                <PannelloLista
                  key={categoria}
                  className="mer-pannello"
                  titolo={titolo}
                  items={items}
                  filterFn={(m, q) => (META[m.tipo]?.label ?? m.tipo).toLowerCase().includes(q.toLowerCase())}
                  renderItem={m => (
                    <MercanteItemCard
                      key={m.tipo}
                      risorsa={m}
                      meta={META[m.tipo] ?? {}}
                      prezzoVendita={META[m.tipo]?.prezzoVendita ?? 0}
                      prezzoAcquisto={META[m.tipo]?.prezzoAcquisto ?? 0}
                      monete={monete}
                      onVendi={handleVendi}
                      onCompra={handleCompra}
                    />
                  )}
                />
              );
            })}
          </div>
        </section>


      </div>
    </div>
  );
}
