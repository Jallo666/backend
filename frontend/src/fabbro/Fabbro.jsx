import { useState, useEffect } from "react";
import GameHeader from "../components/GameHeader.jsx";
import { TagRazza, TagMateriale } from "../components/PieceTag.jsx";
import MaterialiPanel from "./MaterialiPanel.jsx";
import RicettaCard from "./RicettaCard.jsx";
import InventarioCard from "./InventarioCard.jsx";
import PannelloLista from "../components/PannelloLista.jsx";
import RequisitiForgia, { puoForgiare, COSTO_FORGIA } from "./RequisitiForgia.jsx";
import "./Fabbro.css";

const API_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const SAVE_KEY = "qb_game_stats";

const RICETTE = [
  {
    id: "cavaliere", nome: "Cavaliere", natura: "Guerriero",
    razza: "Umanoide", materiale: "Legno",
    hp: 14, hpMax: 14, atk: 4, def: 3, mov: 2,
    desc: "Il soldato di base. Equilibrato, affidabile, il pilastro di ogni formazione.",
  },
  {
    id: "ranger", nome: "Ranger", natura: "Arciere",
    razza: "Umanoide", materiale: "Legno",
    hp: 8,  hpMax: 8,  atk: 6, def: 1, mov: 3,
    desc: "Attacco a distanza letale. Fragile ma colpisce forte da lontano.",
  },
  {
    id: "scudiero", nome: "Scudiero", natura: "Baluardo",
    razza: "Umanoide", materiale: "Legno",
    hp: 18, hpMax: 18, atk: 2, def: 5, mov: 1,
    desc: "La roccia della difesa. Quasi impossibile da abbattere ma lentissimo.",
  },
  {
    id: "assassino", nome: "Assassino", natura: "Ombra",
    razza: "Umanoide", materiale: "Legno",
    hp: 9,  hpMax: 9,  atk: 3, def: 2, mov: 4,
    desc: "L'ombra del campo di battaglia. Si muove veloce e colpisce dove fa più male.",
  },
  {
    id: "mago", nome: "Mago", natura: "Arcano",
    razza: "Umanoide", materiale: "Legno",
    hp: 7,  hpMax: 7,  atk: 7, def: 1, mov: 2,
    desc: "Potere arcano devastante. Va protetto a ogni costo.",
  },
  {
    id: "campione", nome: "Campione", natura: "Sentinella",
    razza: "Umanoide", materiale: "Legno",
    hp: 15, hpMax: 15, atk: 5, def: 4, mov: 2,
    desc: "Il guardiano della formazione. Statistiche equilibrate su tutti i fronti.",
  },
  {
    id: "chierico", nome: "Chierico", natura: "Sacerdote",
    razza: "Umanoide", materiale: "Legno",
    hp: 12, hpMax: 12, atk: 2, def: 3, mov: 2,
    desc: "Un guaritore devoto. Non eccelle in combattimento, ma può rimettere in piedi chi stava per cadere.",
  },
  {
    id: "barbaro", nome: "Barbaro", natura: "Selvaggio",
    razza: "Umanoide", materiale: "Legno",
    hp: 14, hpMax: 14, atk: 5, def: 1, mov: 3,
    desc: "Un guerriero brutale che combatte in preda alla furia. I suoi colpi fanno il doppio del male.",
  },
  {
    id: "lupo", nome: "Lupo", natura: "Selvaggio",
    razza: "Bestiale", materiale: "Legno",
    hp: 11, hpMax: 11, atk: 4, def: 1, mov: 4,
    desc: "Una bestia da caccia. Veloce e letale, può bloccare la preda sul posto.",
  },
];

function leggiGemme() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw).gems ?? 0;
  } catch { /**/ }
  return 0;
}

export default function Fabbro({ token, onBack }) {
  const [gemme]      = useState(leggiGemme);
  const [scelta,     setScelta]     = useState(null);
  const [nomeCustom, setNomeCustom] = useState("");
  const [forgiando,  setForgiando]  = useState(false);
  const [animating,  setAnimating]  = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [inventario, setInventario] = useState([]);
  const [materiali,  setMateriali]  = useState([]);
  const [toast,      setToast]      = useState(null);
  const [invAperta,  setInvAperta]  = useState(null); // { testo, tipo: "ok"|"err" }

  useEffect(() => { setNomeCustom(""); }, [scelta]);

  useEffect(() => {
    fetch(`${API_URL}/api/inventario`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setInventario(data))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetch(`${API_URL}/api/materiali`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setMateriali(data))
      .catch(() => {});
  }, [token]);

  const mostraToast = (testo, tipo) => {
    setToast({ testo, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const handleElimina = async (id) => {
    const pezzo = inventario.find(p => p.id === id);
    try {
      const res = await fetch(`${API_URL}/api/inventario/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { rimborso } = await res.json();
        setInventario(prev => prev.filter(p => p.id !== id));
        if (rimborso?.length) {
          setMateriali(prev => prev.map(m => {
            const r = rimborso.find(r => r.tipo === m.tipo);
            return r ? { ...m, quantita: m.quantita + r.quantita } : m;
          }));
          const desc = rimborso.map(r => `+${r.quantita} ${r.tipo}`).join(", ");
          mostraToast(`Distrutto. Ricevuto: ${desc}`, "ok");
        } else {
          mostraToast(`Eliminato ${pezzo?.nome ?? "pezzo"}`, "ok");
        }
      } else {
        mostraToast("Errore durante l'eliminazione.", "err");
      }
    } catch {
      mostraToast("Errore durante l'eliminazione.", "err");
    }
  };

  const handleForgia = async () => {
    if (!scelta || forgiando) return;
    setForgiando(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1600);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/inventario/crafta`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome:       scelta.nome,
          icona:      "⚔",
          hp: scelta.hp, hpMax: scelta.hpMax,
          atk: scelta.atk, def: scelta.def, mov: scelta.mov,
          materiali:  scelta.natura,
          nomeCustom: nomeCustom.trim() || null,
          razza:      scelta.razza,
          materiale:  scelta.materiale,
          ricettaId:  scelta.id,
        }),
      });
      if (!res.ok) throw new Error();
      const pezzo = await res.json();
      setInventario(prev => [...prev, pezzo]);
      setMateriali(prev => prev.map(m => {
        const costo = COSTO_FORGIA.find(c => c.tipo === m.tipo);
        return costo ? { ...m, quantita: m.quantita - costo.qty } : m;
      }));
      setMsg({ testo: `${scelta.nome} forgiato! Ora è nella tua collezione.`, tipo: "ok" });
    } catch {
      setMsg({ testo: "Errore durante la forgiatura. Riprova.", tipo: "err" });
    } finally {
      setForgiando(false);
    }
  };

  return (
    <div className="fab-root">
      {toast && (
        <div className={`fab-toast fab-toast-${toast.tipo}`}>{toast.testo}</div>
      )}

      {/* ── Header ── */}
      <GameHeader
        title="L'Incudine Rossa"
        subtitle="Brom il Fabbro — «Dimmi che guerriero vuoi e lo forgio.»"
        onBack={onBack}
        rightSlot={<span className="fab-gemme">💎 {gemme}</span>}
      />

      <div className="fab-body">

        {/* ── Ricette ── */}
        <PannelloLista
          className="fab-ricette"
          titolo="Ricette"
          items={RICETTE}
          filterFn={(r, q) => r.nome.toLowerCase().includes(q.toLowerCase()) || r.natura.toLowerCase().includes(q.toLowerCase())}
          renderItem={r => (
            <RicettaCard
              key={r.id}
              ricetta={r}
              selected={scelta?.id === r.id}
              giaForgiato={inventario.some(p => p.nome === r.nome)}
              onClick={() => { setScelta(r); setMsg(null); }}
            />
          )}
        />

        {/* ── Centro: dettaglio + materiali ── */}
        <div className="fab-centro">
        <div className="fab-dettaglio">
          <div className="pnl-header">
            <span className="pnl-titolo">Dettaglio</span>
          </div>
          {!scelta ? (
            <div className="fab-vuoto">
              <p className="fab-vuoto-testo">Scegli una ricetta per vedere i dettagli</p>
            </div>
          ) : (
            <div className="pnl-list">
              <RequisitiForgia pezzo={scelta} materiali={materiali} />

              <div className="fab-forgia-sezione">
                <div className="fab-forgia-nome-wrap">
                  <label className="fab-forgia-nome-label">Nome della pedina</label>
                  <input
                    className="fab-forgia-nome-input"
                    type="text"
                    placeholder={`Es. "${scelta.nome}"`}
                    value={nomeCustom}
                    onChange={e => setNomeCustom(e.target.value)}
                    maxLength={30}
                  />
                  <div className="fab-forgia-tags">
                    <TagRazza razza={scelta.razza} />
                    <TagMateriale materiale={scelta.materiale} />
                  </div>
                </div>
                <button
                  className={`fab-btn-forgia${animating ? " fab-btn-forgia--animating" : ""}`}
                  onClick={handleForgia}
                  disabled={forgiando || !puoForgiare(materiali)}
                >
                  <span className="fab-btn-forgia-icon">⚒</span>
                  <span className="fab-btn-forgia-testo">
                    {forgiando ? "Forgiatura..." : `Forgia ${scelta.nome}`}
                  </span>
                </button>
              </div>

              <div className={`fab-msg${msg ? ` fab-msg-${msg.tipo}` : " fab-msg-vuoto"}`}>
                {msg?.testo ?? ""}
              </div>
            </div>
          )}
        </div>
          <MaterialiPanel materiali={materiali} />
        </div>

        {/* ── Armeria ── */}
        <PannelloLista
          className="fab-inventario"
          titolo={`Armeria (${inventario.length})`}
          items={inventario}
          filterFn={(p, q) => p.nome.toLowerCase().includes(q.toLowerCase())}
          renderItem={p => (
            <InventarioCard
              key={p.id}
              pezzo={p}
              aperto={invAperta === p.id}
              onToggle={() => setInvAperta(v => v === p.id ? null : p.id)}
              onElimina={handleElimina}
            />
          )}
        />

      </div>
    </div>
  );
}
