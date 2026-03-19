import { useState, useEffect } from "react";
import SilhouettePiece from "../SilhouettePiece.jsx";
import BackButton from "../components/BackButton.jsx";
import "./Fabbro.css";

const API_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const SAVE_KEY = "qb_game_stats";

const NATURA_DA_NOME = {
  "Cavaliere":   "Guerriero",
  "Ranger":      "Arciere",
  "Scudiero":    "Baluardo",
  "Assassino":   "Ombra",
  "Mago":        "Arcano",
  "Campione":    "Sentinella",
  "Guerriero":   "Guerriero",
  "Arciere":     "Arciere",
};

const NATURA_COLORE = {
  Guerriero: "#d04030",
  Arciere:   "#a0c040",
  Baluardo:  "#4080c0",
  Ombra:     "#9040c0",
  Arcano:    "#40b0d0",
  Sentinella:"#c0a030",
};

const RICETTE = [
  {
    id: "cavaliere",   nome: "Cavaliere",   natura: "Guerriero",
    hp: 14, hpMax: 14, atk: 4, def: 3, mov: 2,
    desc: "Il soldato di base. Equilibrato, affidabile, il pilastro di ogni formazione.",
  },
  {
    id: "ranger",      nome: "Ranger",      natura: "Arciere",
    hp: 8,  hpMax: 8,  atk: 6, def: 1, mov: 3,
    desc: "Attacco a distanza letale. Fragile ma colpisce forte da lontano.",
  },
  {
    id: "scudiero",    nome: "Scudiero",    natura: "Baluardo",
    hp: 18, hpMax: 18, atk: 2, def: 5, mov: 1,
    desc: "La roccia della difesa. Quasi impossibile da abbattere ma lentissimo.",
  },
  {
    id: "assassino",   nome: "Assassino",   natura: "Ombra",
    hp: 9,  hpMax: 9,  atk: 3, def: 2, mov: 4,
    desc: "L'ombra del campo di battaglia. Si muove veloce e colpisce dove fa più male.",
  },
  {
    id: "mago",        nome: "Mago",        natura: "Arcano",
    hp: 7,  hpMax: 7,  atk: 7, def: 1, mov: 2,
    desc: "Potere arcano devastante. Va protetto a ogni costo.",
  },
  {
    id: "campione",    nome: "Campione",    natura: "Sentinella",
    hp: 15, hpMax: 15, atk: 5, def: 4, mov: 2,
    desc: "Il guardiano della formazione. Statistiche equilibrate su tutti i fronti.",
  },
];

function leggiGemme() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw).gems ?? 0;
  } catch { /**/ }
  return 0;
}

function getNatura(pezzo) {
  if (pezzo.materiali) return pezzo.materiali;
  return NATURA_DA_NOME[pezzo.nome] ?? null;
}

function NaturaTag({ natura }) {
  if (!natura) return null;
  const colore = NATURA_COLORE[natura] ?? "#888";
  return (
    <span className="fab-natura-tag" style={{ "--natura-color": colore }}>
      {natura}
    </span>
  );
}

export default function Fabbro({ token, onBack }) {
  const [gemme]      = useState(leggiGemme);
  const [scelta,     setScelta]     = useState(null);
  const [forgiando,  setForgiando]  = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [inventario, setInventario] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/inventario`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setInventario(data))
      .catch(() => {});
  }, [token]);

  const handleForgia = async () => {
    if (!scelta || forgiando) return;
    setForgiando(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/inventario/crafta`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: scelta.nome,
          hp: scelta.hp, hpMax: scelta.hpMax,
          atk: scelta.atk, def: scelta.def, mov: scelta.mov,
          materiali: scelta.natura,
        }),
      });
      if (!res.ok) throw new Error();
      const pezzo = await res.json();
      setInventario(prev => [...prev, pezzo]);
      setMsg({ testo: `${scelta.nome} forgiato! Ora è nella tua collezione.`, tipo: "ok" });
    } catch {
      setMsg({ testo: "Errore durante la forgiatura. Riprova.", tipo: "err" });
    } finally {
      setForgiando(false);
    }
  };

  return (
    <div className="fab-root">

      {/* ── Header ── */}
      <header className="fab-header">
        <BackButton onClick={onBack} title="Torna al Menu" />
        <div className="fab-header-center">
          <h1 className="fab-title">L'Incudine Rossa</h1>
          <p className="fab-subtitle">Brom il Fabbro — «Dimmi che guerriero vuoi e lo forgio.»</p>
        </div>
        <div className="fab-header-right">
          <span className="fab-gemme">💎 {gemme}</span>
        </div>
      </header>

      <div className="fab-body">

        {/* ── Ricette ── */}
        <div className="fab-ricette">
          <div className="fab-section-title">Ricette</div>
          {RICETTE.map(r => {
            const isSelected   = scelta?.id === r.id;
            const natColore    = NATURA_COLORE[r.natura] ?? "#888";
            const giaForgiato  = inventario.some(p => p.nome === r.nome);
            return (
              <button
                key={r.id}
                className={`fab-ricetta${isSelected ? " fab-ricetta-sel" : ""}`}
                onClick={() => { setScelta(r); setMsg(null); }}
              >
                <SilhouettePiece natura={r.natura} size={48} />
                <div className="fab-ricetta-info">
                  <span className="fab-ricetta-nome">{r.nome}</span>
                  <span className="fab-ricetta-natura" style={{ color: natColore }}>{r.natura}</span>
                </div>
                {giaForgiato
                  ? <span className="fab-ricetta-badge-ok">✓</span>
                  : <span className="fab-ricetta-costo">Gratis</span>
                }
              </button>
            );
          })}
        </div>

        {/* ── Dettaglio + forgia ── */}
        <div className="fab-dettaglio">
          {!scelta ? (
            <div className="fab-vuoto">
              <div className="fab-vuoto-icon">⚒️</div>
              <p className="fab-vuoto-testo">Scegli una ricetta per vedere i dettagli</p>
            </div>
          ) : (
            <>
              <div className="fab-det-header">
                <SilhouettePiece natura={scelta.natura} size={80} />
                <div>
                  <div className="fab-det-nome">{scelta.nome}</div>
                  <NaturaTag natura={scelta.natura} />
                </div>
              </div>

              <p className="fab-det-desc">{scelta.desc}</p>

              <div className="fab-stats-grid">
                {[
                  { lbl: "HP",  val: scelta.hp,  icon: "❤" },
                  { lbl: "ATK", val: scelta.atk, icon: "⚔" },
                  { lbl: "DEF", val: scelta.def, icon: "🛡" },
                  { lbl: "MOV", val: scelta.mov, icon: "👟" },
                ].map(s => (
                  <div key={s.lbl} className="fab-stat">
                    <span className="fab-stat-icon">{s.icon}</span>
                    <span className="fab-stat-val">{s.val}</span>
                    <span className="fab-stat-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>

              {msg && (
                <div className={`fab-msg fab-msg-${msg.tipo}`}>{msg.testo}</div>
              )}

              <button
                className="fab-btn-forgia"
                onClick={handleForgia}
                disabled={forgiando}
              >
                {forgiando ? "⚒ Forgiatura..." : `⚒ Forgia ${scelta.nome}`}
              </button>
            </>
          )}
        </div>

        {/* ── Collezione ── */}
        <div className="fab-inventario">
          <div className="fab-section-title">Collezione ({inventario.length})</div>
          <div className="fab-inv-list">
            {inventario.map(p => {
              const natura   = getNatura(p);
              const natColor = NATURA_COLORE[natura] ?? "#888";
              return (
                <div key={p.id} className="fab-inv-item">
                  <SilhouettePiece natura={getNatura(p)} size={40} />
                  <div className="fab-inv-info">
                    <span className="fab-inv-nome">{p.nome}</span>
                    <span className="fab-inv-stats">❤{p.hp} ⚔{p.atk} 🛡{p.def} 👟{p.mov}</span>
                  </div>
                  {natura && (
                    <span className="fab-inv-natura" style={{ color: natColor }}>{natura}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
