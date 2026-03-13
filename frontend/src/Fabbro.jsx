import { useState, useEffect } from "react";
import SilhouettePiece from "./SilhouettePiece.jsx";
import "./Fabbro.css";

const API_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const SAVE_KEY = "qb_game_stats";

// Natura per i pezzi classici già esistenti senza campo materiali
const NATURA_DA_NOME = {
  "Guerriero":   "Guerriero",
  "Arciere":     "Arciere",
  "Scudiero":    "Baluardo",
  "Esploratore": "Ombra",
  "Mago":        "Arcano",
  "Campione":    "Sentinella",
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
    id: "guerriero",   nome: "Guerriero",   icona: "⚔",  natura: "Guerriero",
    hp: 14, hpMax: 14, atk: 4, def: 3, mov: 2,
    desc: "Il soldato di base. Equilibrato, affidabile, il pilastro di ogni formazione.",
  },
  {
    id: "arciere",     nome: "Arciere",     icona: "🏹", natura: "Arciere",
    hp: 8,  hpMax: 8,  atk: 6, def: 1, mov: 3,
    desc: "Attacco a distanza letale. Fragile ma colpisce forte da lontano.",
  },
  {
    id: "scudiero",    nome: "Scudiero",    icona: "🛡", natura: "Baluardo",
    hp: 18, hpMax: 18, atk: 2, def: 5, mov: 1,
    desc: "La roccia della difesa. Quasi impossibile da abbattere ma lentissimo.",
  },
  {
    id: "esploratore", nome: "Esploratore", icona: "🔭", natura: "Ombra",
    hp: 9,  hpMax: 9,  atk: 3, def: 2, mov: 4,
    desc: "Rogue del campo di battaglia. Si muove nell'ombra e aggira il nemico.",
  },
  {
    id: "mago",        nome: "Mago",        icona: "✨", natura: "Arcano",
    hp: 7,  hpMax: 7,  atk: 7, def: 1, mov: 2,
    desc: "Potere arcano devastante. Va protetto a ogni costo.",
  },
  {
    id: "campione",    nome: "Campione",    icona: "🏆", natura: "Sentinella",
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
  // materiali contiene la natura per i pezzi forgiati dal Fabbro
  if (pezzo.materiali) return pezzo.materiali;
  // per i classici seedati prima dell'introduzione della natura
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

export default function Fabbro({ token, onBack, onBackToMenu }) {
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
          nome: scelta.nome, icona: scelta.icona,
          hp: scelta.hp, hpMax: scelta.hpMax,
          atk: scelta.atk, def: scelta.def, mov: scelta.mov,
          materiali: scelta.natura,
        }),
      });
      if (!res.ok) throw new Error();
      const pezzo = await res.json();
      setInventario(prev => [...prev, pezzo]);
      setMsg({ testo: `${scelta.nome} (${scelta.natura}) forgiato! Ora è nella tua collezione.`, tipo: "ok" });
    } catch {
      setMsg({ testo: "Errore durante la forgiatura. Riprova.", tipo: "err" });
    } finally {
      setForgiando(false);
    }
  };

  return (
    <div className="fab-root">

      <nav className="fab-nav">
        <button className="fab-nav-btn" onClick={onBack}>← Città</button>
        <div className="fab-gemme">💎 {gemme} gemme</div>
        <button className="fab-nav-btn" onClick={onBackToMenu}>⌂ Menu</button>
      </nav>

      <header className="fab-header">
        <div className="fab-header-icon">⚒️</div>
        <div>
          <h1 className="fab-title">L'Incudine Rossa</h1>
          <p className="fab-subtitle">Brom il Fabbro — «Dimmi che guerriero vuoi e lo forgio.»</p>
        </div>
      </header>

      <div className="fab-body">

        {/* ── Ricette ────────────────────────────────────────────────────── */}
        <div className="fab-ricette">
          <div className="fab-section-title">🔥 RICETTE</div>
          {RICETTE.map(r => {
            const isSelected = scelta?.id === r.id;
            const natColore  = NATURA_COLORE[r.natura] ?? "#888";
            return (
              <button
                key={r.id}
                className={`fab-ricetta${isSelected ? " fab-ricetta-sel" : ""}`}
                onClick={() => { setScelta(r); setMsg(null); }}
              >
                <SilhouettePiece natura={r.natura} size={36} />
                <div className="fab-ricetta-info">
                  <span className="fab-ricetta-nome">{r.nome}</span>
                  <span className="fab-ricetta-natura" style={{ color: natColore }}>{r.natura}</span>
                </div>
                <span className="fab-ricetta-costo fab-ricetta-costo-gratis">GRATIS</span>
              </button>
            );
          })}
        </div>

        {/* ── Dettaglio + forgia ─────────────────────────────────────────── */}
        <div className="fab-dettaglio">
          {!scelta ? (
            <div className="fab-vuoto">
              <div className="fab-vuoto-icon">⚒️</div>
              <p>Seleziona una ricetta<br />per vedere i dettagli</p>
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

              <div className="fab-costo-box">
                <span>Costo forgiatura:</span>
                <span className="fab-costo-val fab-ricetta-costo-gratis">GRATIS</span>
              </div>

              {msg && (
                <div className={`fab-msg fab-msg-${msg.tipo}`}>{msg.testo}</div>
              )}

              <button
                className="fab-btn-forgia"
                onClick={handleForgia}
                disabled={forgiando}
              >
                {forgiando ? "⚒ Forgiatura in corso..." : `⚒ Forgia ${scelta.nome}`}
              </button>
            </>
          )}
        </div>

        {/* ── Collezione attuale ─────────────────────────────────────────── */}
        <div className="fab-inventario">
          <div className="fab-section-title">🎒 COLLEZIONE ({inventario.length})</div>
          <div className="fab-inv-list">
            {inventario.map(p => {
              const natura   = getNatura(p);
              const natColor = NATURA_COLORE[natura] ?? "#888";
              return (
                <div key={p.id} className="fab-inv-item">
                  <SilhouettePiece natura={getNatura(p)} size={32} />
                  <div className="fab-inv-info">
                    <span className="fab-inv-nome">{p.nome}</span>
                    <span className="fab-inv-stats">HP{p.hp} ATK{p.atk} DEF{p.def} MOV{p.mov}</span>
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
