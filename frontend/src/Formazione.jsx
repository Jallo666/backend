import { useState, useEffect } from "react";
import { fromApi } from "./game/questboard/qb_pieces.js";
import "./Formazione.css";

const API_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const ROWS = 6, COLS = 6;
// Il giocatore posiziona i pezzi nelle ultime 2 righe (righe 4-5)
const PLAYER_ROWS = [4, 5];

export default function Formazione({ token, onAvvia, onBack }) {
  const [inventario, setInventario]   = useState([]);
  const [formazione, setFormazione]   = useState([]); // [{uid, row, col, isRe}]
  const [selectedInv, setSelectedInv] = useState(null); // uid pezzo nell'inventario
  const [selectedCell, setSelectedCell] = useState(null); // {row,col} cella selezionata
  const [reUid, setReUid]             = useState(null);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [msg, setMsg]                 = useState("");

  // Carica inventario e formazione salvata
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/inventario`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/formazione`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([inv, form]) => {
      const pezzi = inv.map(fromApi);
      setInventario(pezzi);
      const saved = JSON.parse(form.data ?? "[]");
      if (saved.length > 0) {
        setFormazione(saved);
        const re = saved.find(s => s.isRe);
        if (re) setReUid(re.uid);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  // Pezzo dell'inventario attualmente nel board
  const placedUids = formazione.map(f => f.uid);

  // Pezzo sulla cella
  const pieceAt = (row, col) => {
    const slot = formazione.find(f => f.row === row && f.col === col);
    if (!slot) return null;
    return inventario.find(p => p.uid === slot.uid) ?? null;
  };

  const slotAt = (row, col) => formazione.find(f => f.row === row && f.col === col);

  // Click su inventario
  const handleInvClick = (uid) => {
    if (selectedInv === uid) { setSelectedInv(null); return; }
    setSelectedInv(uid);
    setSelectedCell(null);
  };

  // Click su cella della board
  const handleCellClick = (row, col) => {
    const isPlayerRow = PLAYER_ROWS.includes(row);

    // Pezzo già sulla cella
    const existing = slotAt(row, col);

    if (selectedInv && isPlayerRow) {
      // Piazza pezzo dall'inventario
      if (placedUids.includes(selectedInv) && !existing) {
        setMsg("Questo pezzo è già piazzato in un'altra cella.");
        return;
      }
      setFormazione(prev => {
        const filtered = prev.filter(f => !(f.row === row && f.col === col));
        // Rimuovi il pezzo selezionato da dove era
        const filtered2 = filtered.filter(f => f.uid !== selectedInv);
        return [...filtered2, { uid: selectedInv, row, col, isRe: selectedInv === reUid }];
      });
      setSelectedInv(null);
      return;
    }

    if (existing) {
      // Seleziona pezzo già piazzato per spostarlo o designarlo Re
      setSelectedCell({ row, col });
      setSelectedInv(null);
      return;
    }

    if (selectedCell && isPlayerRow) {
      // Sposta pezzo selezionato nella cella
      const moving = slotAt(selectedCell.row, selectedCell.col);
      if (moving) {
        setFormazione(prev => [
          ...prev.filter(f => !(f.row === selectedCell.row && f.col === selectedCell.col)),
          { ...moving, row, col },
        ]);
      }
      setSelectedCell(null);
    }
  };

  // Rimuovi pezzo dal board
  const handleRemove = (uid) => {
    setFormazione(prev => prev.filter(f => f.uid !== uid));
    if (reUid === uid) setReUid(null);
    setSelectedCell(null);
  };

  // Designa Re
  const handleDesignaRe = (uid) => {
    setReUid(uid);
    setFormazione(prev => prev.map(f => ({ ...f, isRe: f.uid === uid })));
    setMsg(`${inventario.find(p => p.uid === uid)?.nome ?? "Pezzo"} designato Re!`);
    setSelectedCell(null);
  };

  // Salva formazione
  const handleSalva = async () => {
    if (formazione.length < 6) { setMsg("Devi piazzare tutti e 6 i pezzi!"); return; }
    if (!reUid)                 { setMsg("Devi designare un Re!"); return; }

    setSaving(true);
    try {
      await fetch(`${API_URL}/api/formazione`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: JSON.stringify(formazione) }),
      });
      setMsg("Formazione salvata!");
    } catch { setMsg("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  // Avvia partita
  const handleAvvia = () => {
    if (formazione.length < 6) { setMsg("Piazza tutti i pezzi prima!"); return; }
    if (!reUid)                 { setMsg("Designa un Re prima!"); return; }
    onAvvia(inventario, formazione);
  };

  if (loading) return (
    <div className="form-loading">
      <span className="form-spin">⚔</span>
      <p>Caricamento inventario...</p>
    </div>
  );

  const selectedCellPiece = selectedCell ? pieceAt(selectedCell.row, selectedCell.col) : null;

  return (
    <div className="form-root">
      <header className="form-header">
        <button className="form-back-btn" onClick={onBack}>← Locanda</button>
        <h1 className="form-title">⚔ Formazione</h1>
        <p className="form-subtitle">Piazza i tuoi pezzi nelle ultime 2 righe. Designa il Re.</p>
      </header>

      <div className="form-body">
        {/* ── Board ── */}
        <div className="form-board-wrap">
          <div className="form-board">
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const isPlayerZone = PLAYER_ROWS.includes(r);
                const p = pieceAt(r, c);
                const slot = slotAt(r, c);
                const isSelCell = selectedCell?.row === r && selectedCell?.col === c;
                const isSelInvTarget = selectedInv && isPlayerZone && !p;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={[
                      "form-cell",
                      isPlayerZone   ? "form-cell-player" : "form-cell-enemy",
                      isSelCell      ? "form-cell-selected" : "",
                      isSelInvTarget ? "form-cell-target"   : "",
                      p              ? "form-cell-occupied" : "",
                    ].join(" ")}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {/* Etichetta zona */}
                    {r === 0 && c === 0 && <span className="form-zone-label">AI</span>}
                    {r === 4 && c === 0 && <span className="form-zone-label">TU</span>}

                    {p && (
                      <div className={`form-piece ${slot?.isRe ? "form-piece-re" : ""}`}
                           style={{ "--piece-border": p.border, "--piece-glow": p.glow }}>
                        <span className="form-piece-icon">{p.icona}</span>
                        {slot?.isRe && <span className="form-piece-crown">♛</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {msg && <p className="form-msg">{msg}</p>}
        </div>

        {/* ── Pannello destra ── */}
        <div className="form-side">
          {/* Inventario */}
          <div className="form-section">
            <h3 className="form-section-title">📦 Inventario</h3>
            <div className="form-inv">
              {inventario.map(p => {
                const placed = placedUids.includes(p.uid);
                return (
                  <div
                    key={p.uid}
                    className={[
                      "form-inv-piece",
                      placed             ? "form-inv-placed"   : "",
                      selectedInv === p.uid ? "form-inv-selected" : "",
                    ].join(" ")}
                    style={{ "--piece-border": p.border, "--piece-glow": p.glow }}
                    onClick={() => !placed && handleInvClick(p.uid)}
                  >
                    <span className="form-inv-icon">{p.icona}</span>
                    <div className="form-inv-info">
                      <span className="form-inv-nome">{p.nome}</span>
                      <span className="form-inv-stats">
                        ❤{p.hp} ⚔{p.atk} 🛡{p.def} 👟{p.mov}
                      </span>
                    </div>
                    {placed && <span className="form-inv-badge">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Azioni sulla cella selezionata */}
          {selectedCellPiece && (
            <div className="form-section form-cell-actions">
              <h3 className="form-section-title">📌 {selectedCellPiece.nome}</h3>
              <div className="form-stats-row">
                <span>❤ {selectedCellPiece.hp}</span>
                <span>⚔ {selectedCellPiece.atk}</span>
                <span>🛡 {selectedCellPiece.def}</span>
                <span>👟 {selectedCellPiece.mov}</span>
              </div>
              <button className="form-btn form-btn-re"
                      onClick={() => handleDesignaRe(selectedCellPiece.uid)}>
                ♛ Designa Re
              </button>
              <button className="form-btn form-btn-remove"
                      onClick={() => handleRemove(selectedCellPiece.uid)}>
                ✕ Rimuovi
              </button>
              <button className="form-btn form-btn-cancel"
                      onClick={() => setSelectedCell(null)}>
                Annulla
              </button>
            </div>
          )}

          {/* Legenda + azioni globali */}
          <div className="form-section">
            <div className="form-legend">
              <span className="form-legend-player">■</span> Tua zona
              <span className="form-legend-enemy" style={{marginLeft:"0.8rem"}}>■</span> Zona AI
            </div>
            <div className="form-progress">
              {formazione.length}/6 pezzi piazzati
              {reUid ? " · Re designato ✓" : " · Nessun Re ✗"}
            </div>
          </div>

          <div className="form-actions">
            <button className="form-btn form-btn-save"
                    onClick={handleSalva} disabled={saving}>
              {saving ? "Salvando..." : "💾 Salva"}
            </button>
            <button className="form-btn form-btn-avvia" onClick={handleAvvia}>
              ⚔ Avvia Partita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
