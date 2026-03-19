import { useState, useEffect } from "react";
import { fromApi } from "../game/questboard/qb_pieces.js";
import SilhouettePiece from "../SilhouettePiece.jsx";
import backIcon from "../assets/icon/back.svg";
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
  const [formazione,        setFormazione]        = useState([]);
  const [formazioneId,      setFormazioneId]      = useState(null);
  const [nomeInput,         setNomeInput]         = useState("Formazione 1");
  const [selectedInv,       setSelectedInv]       = useState(null);
  const [selectedCell,      setSelectedCell]      = useState(null);
  const [reUid,             setReUid]             = useState(null);
  const [saving,            setSaving]            = useState(false);
  const [resetting,         setResetting]         = useState(false);
  const [loading,           setLoading]           = useState(true);
  const [msg,               setMsg]               = useState("");
  const [confirmReset,      setConfirmReset]      = useState(false);

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

  // ── Ripristina pezzi classici (senza window.confirm) ──────────────────────
  const doReset = async () => {
    setResetting(true);
    try {
      const r = await fetch(`${API_URL}/api/inventario/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const nuovoInv = await r.json();
      setInventario(nuovoInv.map(fromApi));
      await persistFormazioni([]);
      setFormazioniSalvate([]);
      setFormazione([]); setReUid(null);
      setFormazioneId(null); setNomeInput("Formazione 1");
      setSelectedCell(null); setSelectedInv(null);
      setMsg("Inventario ripristinato ai pezzi classici!");
    } catch { setMsg("Errore nel ripristino."); }
    finally { setResetting(false); }
  };

  // ── Logica board ───────────────────────────────────────────────────────────
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
  const canAvvia = formazione.length === 6 && !!reUid;

  return (
    <div className="form-root">

      {/* ── Confirm overlay ripristina ── */}
      {confirmReset && (
        <div className="form-confirm-overlay">
          <div className="form-confirm-box">
            <h3 className="form-confirm-title">⚠ Ripristina pezzi?</h3>
            <p className="form-confirm-text">
              Tutti i tuoi pezzi e le formazioni salvate verranno sostituiti dai 6 classici.
            </p>
            <div className="form-confirm-btns">
              <button
                className="form-btn form-btn-danger"
                onClick={async () => { setConfirmReset(false); await doReset(); }}
                disabled={resetting}
              >
                {resetting ? "Ripristinando..." : "Ripristina"}
              </button>
              <button className="form-btn form-btn-cancel" onClick={() => setConfirmReset(false)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="form-header">
        <button className="form-back-btn" onClick={onBack}>
          <img src={backIcon} alt="" className="form-back-icon" />
          <span>Locanda</span>
        </button>
        <div className="form-header-center">
          <h1 className="form-title">Formazione</h1>
          <p className="form-subtitle">Piazza i pezzi nelle ultime 2 righe · Designa il Re</p>
        </div>
        <div className="form-header-status">
          <span className={formazione.length === 6 ? "form-status-ok" : "form-status-warn"}>
            {formazione.length}/6 pezzi
          </span>
          <span className={reUid ? "form-status-ok" : "form-status-warn"}>
            {reUid ? "♛ Re ✓" : "♛ Re ✗"}
          </span>
        </div>
      </header>

      <div className="form-body">

        {/* ── Board ── */}
        <div className="form-board-wrap">
          <div className="form-col-labels-row">
            <div className="form-row-labels-spacer" />
            <div className="form-col-labels">
              {["A","B","C","D","E","F"].map(l => (
                <div key={l} className="form-col-label">{l}</div>
              ))}
            </div>
          </div>
          <div className="form-board-row">
            <div className="form-row-labels">
              {[6,5,4,3,2,1].map(n => (
                <div key={n} className="form-row-label">{n}</div>
              ))}
            </div>
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
                        isPlayerZone   ? "form-cell-player"   : "form-cell-enemy",
                        isSelCell      ? "form-cell-selected" : "",
                        isSelInvTarget ? "form-cell-target"   : "",
                      ].join(" ")}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {p && (
                        <div
                          className={`form-piece ${slot?.isRe ? "form-piece-re" : ""}`}
                          style={{ "--piece-border": p.border, "--piece-glow": p.glow }}
                        >
                          <SilhouettePiece natura={p.natura} size={54} />
                          {slot?.isRe && <span className="form-piece-crown">♛</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {msg && <p className="form-msg">{msg}</p>}
        </div>

        {/* ── Pannello destra ── */}
        <div className="form-side">

          {/* Nome + salva — sempre in cima */}
          <div className="form-section form-section-nome">
            <div className="form-nome-row">
              <input
                className="form-nome-input"
                value={nomeInput}
                onChange={e => setNomeInput(e.target.value)}
                placeholder="Nome formazione..."
                maxLength={28}
              />
              <button className="form-btn form-btn-save" onClick={handleSalva} disabled={saving}>
                {saving ? "..." : "💾 Salva"}
              </button>
            </div>
          </div>

          {/* Formazioni salvate */}
          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">Formazioni</h3>
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

          {/* Azioni cella selezionata — appare sopra inventario */}
          {selectedCellPiece && (
            <div className="form-section form-cell-actions">
              <h3 className="form-section-title">
                {selectedCellPiece.nome}
                {slotAt(selectedCell.row, selectedCell.col)?.isRe && " ♛"}
              </h3>
              <div className="form-stats-row">
                <span>❤ {selectedCellPiece.hp}</span>
                <span>⚔ {selectedCellPiece.atk}</span>
                <span>🛡 {selectedCellPiece.def}</span>
                <span>👟 {selectedCellPiece.mov}</span>
              </div>

              {/* Abilità del pezzo selezionato */}
              {(selectedCellPiece.ardore?.length > 0 || selectedCellPiece.gesta?.length > 0 || selectedCellPiece.aura?.length > 0) && (
                <div className="form-abilita-list">
                  {selectedCellPiece.ardore?.map(a => (
                    <div key={a.id} className="form-abilita-card form-abilita-ardore">
                      <span className="form-abilita-icon">{a.icona}</span>
                      <div className="form-abilita-info">
                        <span className="form-abilita-nome">{a.nome} <span className="form-abilita-tag">Ardore</span></span>
                        <span className="form-abilita-desc">{a.desc}</span>
                      </div>
                    </div>
                  ))}
                  {selectedCellPiece.gesta?.map(g => (
                    <div key={g.id} className="form-abilita-card form-abilita-gesta">
                      <span className="form-abilita-icon">{g.icona}</span>
                      <div className="form-abilita-info">
                        <span className="form-abilita-nome">{g.nome} <span className="form-abilita-tag">Gesta</span></span>
                        <span className="form-abilita-desc">{g.desc}</span>
                      </div>
                    </div>
                  ))}
                  {selectedCellPiece.aura?.map(au => (
                    <div key={au.id} className="form-abilita-card form-abilita-aura">
                      <span className="form-abilita-icon">{au.icona}</span>
                      <div className="form-abilita-info">
                        <span className="form-abilita-nome">{au.nome} <span className="form-abilita-tag">Aura</span></span>
                        <span className="form-abilita-desc">{au.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-cell-action-btns">
                <button className="form-btn form-btn-re"     onClick={() => handleDesignaRe(selectedCellPiece.uid)}>♛ Designa Re</button>
                <button className="form-btn form-btn-remove" onClick={() => handleRemove(selectedCellPiece.uid)}>✕ Rimuovi</button>
                <button className="form-btn form-btn-cancel" onClick={() => setSelectedCell(null)}>Annulla</button>
              </div>
            </div>
          )}

          {/* Inventario — occupa lo spazio rimanente */}
          <div className="form-section form-section-inv">
            <h3 className="form-section-title">Inventario</h3>
            <div className="form-inv">
              {inventario.map(p => {
                const placed = placedUids.includes(p.uid);
                const isRePiece = reUid === p.uid;
                return (
                  <div
                    key={p.uid}
                    className={[
                      "form-inv-piece",
                      placed              ? "form-inv-placed"   : "",
                      selectedInv===p.uid ? "form-inv-selected" : "",
                    ].join(" ")}
                    style={{ "--piece-border": p.border, "--piece-glow": p.glow }}
                    onClick={() => !placed && handleInvClick(p.uid)}
                  >
                    <SilhouettePiece natura={p.natura} size={44} />
                    <div className="form-inv-info">
                      <span className="form-inv-nome">{p.nome}</span>
                      <span className="form-inv-stats">❤{p.hp} ⚔{p.atk} 🛡{p.def} 👟{p.mov}</span>
                      {(p.ardore?.length > 0 || p.gesta?.length > 0 || p.aura?.length > 0) && (
                        <span className="form-inv-abilita">
                          {p.ardore?.map(a => (
                            <span key={a.id} className="form-inv-abilita-chip form-inv-chip-ardore" title={`Ardore: ${a.nome} — ${a.desc}`}>
                              {a.icona} {a.nome}
                            </span>
                          ))}
                          {p.gesta?.map(g => (
                            <span key={g.id} className="form-inv-abilita-chip form-inv-chip-gesta" title={`Gesta: ${g.nome} — ${g.desc}`}>
                              {g.icona} {g.nome}
                            </span>
                          ))}
                          {p.aura?.map(au => (
                            <span key={au.id} className="form-inv-abilita-chip form-inv-chip-aura" title={`Aura: ${au.nome} — ${au.desc}`}>
                              {au.icona} {au.nome}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                    {placed && (
                      <span className="form-inv-badge">{isRePiece ? "♛" : "✓"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer sticky — Avvia + reset */}
          <div className="form-panel-footer">
            <div className="form-progress">
              {formazione.length}/6 pezzi{reUid ? " · Re ✓" : " · Nessun Re"}
            </div>
            <button
              className="form-btn form-btn-avvia"
              onClick={handleAvvia}
              disabled={!canAvvia}
              title={!canAvvia ? "Piazza tutti i pezzi e designa il Re" : ""}
            >
              ⚔ Avvia Partita
            </button>
            <button
              className="form-reset-link"
              onClick={() => setConfirmReset(true)}
              disabled={resetting}
            >
              ↺ Ripristina pezzi default
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
