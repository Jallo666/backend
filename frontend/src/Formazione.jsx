import { useState, useEffect } from "react";
import { fromApi } from "./game/questboard/qb_pieces.js";
import SilhouettePiece from "./SilhouettePiece.jsx";
import "./Formazione.css";

const API_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const ROWS = 6, COLS = 6;
const PLAYER_ROWS = [4, 5];

// ── Helpers persistenza ─────────────────────────────────────────────────────
function parseFormazioni(raw) {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    // Migrazione formato vecchio (array piatto di slot) → nuovo (array di named formations)
    if (parsed[0]?.schieramento === undefined) {
      return [{ id: Date.now().toString(), nome: "Formazione 1", schieramento: parsed }];
    }
    return parsed;
  } catch { return []; }
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Formazione({ token, onAvvia, onBack }) {
  const [inventario,        setInventario]        = useState([]);
  const [formazioniSalvate, setFormazioniSalvate] = useState([]);
  const [formazione,        setFormazione]        = useState([]);    // schieramento attuale
  const [formazioneId,      setFormazioneId]      = useState(null);  // id formazione caricata
  const [nomeInput,         setNomeInput]         = useState("Formazione 1");
  const [selectedInv,       setSelectedInv]       = useState(null);
  const [selectedCell,      setSelectedCell]      = useState(null);
  const [reUid,             setReUid]             = useState(null);
  const [saving,            setSaving]            = useState(false);
  const [resetting,         setResetting]         = useState(false);
  const [loading,           setLoading]           = useState(true);
  const [msg,               setMsg]               = useState("");

  // Carica inventario + formazioni
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/inventario`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/formazione`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([inv, form]) => {
      const pezzi = inv.map(fromApi);
      setInventario(pezzi);
      const lista = parseFormazioni(form.data);
      setFormazioniSalvate(lista);
      if (lista.length > 0) {
        caricaFormazione(lista[0], false);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Carica una formazione nello stato ──────────────────────────────────────
  const caricaFormazione = (forma, showMsg = true) => {
    setFormazione(forma.schieramento);
    setFormazioneId(forma.id);
    setNomeInput(forma.nome);
    const re = forma.schieramento.find(s => s.isRe);
    setReUid(re?.uid ?? null);
    setSelectedCell(null);
    setSelectedInv(null);
    if (showMsg) setMsg(`"${forma.nome}" caricata.`);
  };

  // ── Persist su server ──────────────────────────────────────────────────────
  const persistFormazioni = async (lista) => {
    await fetch(`${API_URL}/api/formazione`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: JSON.stringify(lista) }),
    });
  };

  // ── Salva (aggiorna esistente o crea nuova) ────────────────────────────────
  const handleSalva = async () => {
    if (formazione.length < 6) { setMsg("Piazza tutti e 6 i pezzi!"); return; }
    if (!reUid)                 { setMsg("Designa un Re!"); return; }
    const nome = nomeInput.trim() || "Formazione";
    setSaving(true);
    try {
      let nuove;
      if (formazioneId && formazioniSalvate.some(f => f.id === formazioneId)) {
        nuove = formazioniSalvate.map(f =>
          f.id === formazioneId ? { ...f, nome, schieramento: formazione } : f
        );
      } else {
        const nuovaId = Date.now().toString();
        nuove = [...formazioniSalvate, { id: nuovaId, nome, schieramento: formazione }];
        setFormazioneId(nuovaId);
      }
      await persistFormazioni(nuove);
      setFormazioniSalvate(nuove);
      setMsg("Formazione salvata!");
    } catch { setMsg("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  // ── Nuova formazione (board vuoto) ─────────────────────────────────────────
  const handleNuova = () => {
    setFormazione([]);
    setReUid(null);
    setFormazioneId(null);
    setNomeInput(`Formazione ${formazioniSalvate.length + 1}`);
    setSelectedCell(null);
    setSelectedInv(null);
    setMsg("Nuova formazione. Piazza i pezzi.");
  };

  // ── Elimina formazione dalla lista ────────────────────────────────────────
  const handleElimina = async (id, e) => {
    e.stopPropagation();
    const nuove = formazioniSalvate.filter(f => f.id !== id);
    try {
      await persistFormazioni(nuove);
      setFormazioniSalvate(nuove);
      if (formazioneId === id) {
        if (nuove.length > 0) caricaFormazione(nuove[0]);
        else {
          setFormazione([]); setReUid(null);
          setFormazioneId(null); setNomeInput("Formazione 1");
        }
      }
      setMsg("Formazione eliminata.");
    } catch { setMsg("Errore nell'eliminazione."); }
  };

  // ── Ripristina pezzi classici ──────────────────────────────────────────────
  const handleRipristinaDefault = async () => {
    if (!window.confirm("Tutti i tuoi pezzi e le formazioni salvate verranno sostituiti dai 6 classici. Continuare?")) return;
    setResetting(true);
    try {
      const r = await fetch(`${API_URL}/api/inventario/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const nuovoInv = await r.json();
      setInventario(nuovoInv.map(fromApi));
      // Reset anche delle formazioni (uid invalidi dopo il reset)
      await persistFormazioni([]);
      setFormazioniSalvate([]);
      setFormazione([]); setReUid(null);
      setFormazioneId(null); setNomeInput("Formazione 1");
      setSelectedCell(null); setSelectedInv(null);
      setMsg("Inventario ripristinato ai pezzi classici!");
    } catch { setMsg("Errore nel ripristino."); }
    finally { setResetting(false); }
  };

  // ── Logica board (invariata) ───────────────────────────────────────────────
  const placedUids = formazione.map(f => f.uid);
  const pieceAt = (row, col) => {
    const slot = formazione.find(f => f.row === row && f.col === col);
    if (!slot) return null;
    return inventario.find(p => p.uid === slot.uid) ?? null;
  };
  const slotAt = (row, col) => formazione.find(f => f.row === row && f.col === col);

  const handleInvClick = (uid) => {
    if (selectedInv === uid) { setSelectedInv(null); return; }
    setSelectedInv(uid);
    setSelectedCell(null);
  };

  const handleCellClick = (row, col) => {
    const isPlayerRow = PLAYER_ROWS.includes(row);
    const existing = slotAt(row, col);

    if (selectedInv && isPlayerRow) {
      if (placedUids.includes(selectedInv) && !existing) {
        setMsg("Questo pezzo è già piazzato altrove.");
        return;
      }
      if (!placedUids.includes(selectedInv) && !existing && formazione.length >= 6) {
        setMsg("La formazione è piena. Massimo 6 pezzi.");
        return;
      }
      setFormazione(prev => {
        const f1 = prev.filter(f => !(f.row === row && f.col === col));
        const f2 = f1.filter(f => f.uid !== selectedInv);
        return [...f2, { uid: selectedInv, row, col, isRe: selectedInv === reUid }];
      });
      setSelectedInv(null);
      return;
    }
    if (existing) { setSelectedCell({ row, col }); setSelectedInv(null); return; }
    if (selectedCell && isPlayerRow) {
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

  const handleRemove = (uid) => {
    setFormazione(prev => prev.filter(f => f.uid !== uid));
    if (reUid === uid) setReUid(null);
    setSelectedCell(null);
  };

  const handleDesignaRe = (uid) => {
    setReUid(uid);
    setFormazione(prev => prev.map(f => ({ ...f, isRe: f.uid === uid })));
    setMsg(`${inventario.find(p => p.uid === uid)?.nome ?? "Pezzo"} designato Re!`);
    setSelectedCell(null);
  };

  const handleAvvia = () => {
    if (formazione.length < 6) { setMsg("Piazza tutti i pezzi prima!"); return; }
    if (!reUid)                 { setMsg("Designa un Re prima!"); return; }
    onAvvia(inventario, formazione);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
        <p className="form-subtitle">Piazza i pezzi nelle ultime 2 righe · Designa il Re</p>
      </header>

      <div className="form-body">
        {/* ── Board ── */}
        <div className="form-board-wrap">
          <div className="form-board">
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const isPlayerZone = PLAYER_ROWS.includes(r);
                const p    = pieceAt(r, c);
                const slot = slotAt(r, c);
                const isSelCell      = selectedCell?.row === r && selectedCell?.col === c;
                const isSelInvTarget = selectedInv && isPlayerZone && !p;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={[
                      "form-cell",
                      isPlayerZone    ? "form-cell-player"   : "form-cell-enemy",
                      isSelCell       ? "form-cell-selected" : "",
                      isSelInvTarget  ? "form-cell-target"   : "",
                    ].join(" ")}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {r === 0 && c === 0 && <span className="form-zone-label">AI</span>}
                    {r === 4 && c === 0 && <span className="form-zone-label">TU</span>}
                    {p && (
                      <div className={`form-piece ${slot?.isRe ? "form-piece-re" : ""}`}
                           style={{ "--piece-border": p.border, "--piece-glow": p.glow }}>
                        <SilhouettePiece natura={p.natura} size={54} />
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

          {/* Formazioni salvate */}
          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">📋 Formazioni</h3>
              <button className="form-btn-icon" onClick={handleNuova} title="Nuova formazione">＋</button>
            </div>
            <div className="form-formazioni-lista">
              {formazioniSalvate.length === 0 && (
                <p className="form-empty-hint">Nessuna formazione salvata.</p>
              )}
              {formazioniSalvate.map(f => (
                <div
                  key={f.id}
                  className={`form-formazione-item ${f.id === formazioneId ? "form-formazione-item-active" : ""}`}
                  onClick={() => caricaFormazione(f)}
                >
                  <span className="form-formazione-nome">{f.nome}</span>
                  <span className="form-formazione-slots">{f.schieramento.length}/6</span>
                  <button
                    className="form-formazione-del"
                    onClick={(e) => handleElimina(f.id, e)}
                    title="Elimina"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Nome + salva */}
          <div className="form-section">
            <input
              className="form-nome-input"
              value={nomeInput}
              onChange={e => setNomeInput(e.target.value)}
              placeholder="Nome formazione..."
              maxLength={28}
            />
            <button className="form-btn form-btn-save" onClick={handleSalva} disabled={saving}>
              {saving ? "Salvando..." : "💾 Salva formazione"}
            </button>
          </div>

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
                      selectedInv===p.uid? "form-inv-selected" : "",
                    ].join(" ")}
                    style={{ "--piece-border": p.border, "--piece-glow": p.glow }}
                    onClick={() => !placed && handleInvClick(p.uid)}
                  >
                    <SilhouettePiece natura={p.natura} size={44} />
                    <div className="form-inv-info">
                      <span className="form-inv-nome">{p.nome}</span>
                      <span className="form-inv-stats">❤{p.hp} ⚔{p.atk} 🛡{p.def} 👟{p.mov}</span>
                    </div>
                    {placed && <span className="form-inv-badge">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Azioni cella selezionata */}
          {selectedCellPiece && (
            <div className="form-section form-cell-actions">
              <h3 className="form-section-title">📌 {selectedCellPiece.nome}</h3>
              <div className="form-stats-row">
                <span>❤ {selectedCellPiece.hp}</span>
                <span>⚔ {selectedCellPiece.atk}</span>
                <span>🛡 {selectedCellPiece.def}</span>
                <span>👟 {selectedCellPiece.mov}</span>
              </div>
              <button className="form-btn form-btn-re"     onClick={() => handleDesignaRe(selectedCellPiece.uid)}>♛ Designa Re</button>
              <button className="form-btn form-btn-remove" onClick={() => handleRemove(selectedCellPiece.uid)}>✕ Rimuovi</button>
              <button className="form-btn form-btn-cancel" onClick={() => setSelectedCell(null)}>Annulla</button>
            </div>
          )}

          {/* Progresso */}
          <div className="form-section">
            <div className="form-legend">
              <span className="form-legend-player">■</span> Tua zona
              <span className="form-legend-enemy" style={{ marginLeft: "0.8rem" }}>■</span> Zona AI
            </div>
            <div className="form-progress">
              {formazione.length}/6 pezzi piazzati
              {reUid ? " · Re designato ✓" : " · Nessun Re ✗"}
            </div>
          </div>

          {/* Azioni principali */}
          <div className="form-actions">
            <button className="form-btn form-btn-avvia" onClick={handleAvvia}>
              ⚔ Avvia Partita
            </button>
          </div>

          {/* Ripristina default */}
          <div className="form-reset-section">
            <button
              className="form-btn form-btn-reset"
              onClick={handleRipristinaDefault}
              disabled={resetting}
            >
              {resetting ? "Ripristinando..." : "↺ Ripristina Pezzi Default"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
