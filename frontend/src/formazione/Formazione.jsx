import { useState, useEffect, useRef } from "react";
import { fromApi, livelloPerRicetta } from "../game/questboard/qb_pieces.js";
import { TagLivello } from "../components/PieceTag.jsx";
import SilhouettePiece from "../SilhouettePiece.jsx";
import GameHeader from "../components/GameHeader.jsx";
import PannelloLista from "../components/PannelloLista.jsx";
import PieceStats from "../components/PieceStats.jsx";
import AbilitaList from "../components/AbilitaList.jsx";
import FormazionePezzo from "./FormazionePezzo.jsx";
import FormazioneBoard from "./FormazioneBoard.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import "./Formazione.css";

const API_URL     = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
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

// ── FormazioneCard ───────────────────────────────────────────────────────────
function FormazioneCard({ formazione, inventario, attiva, onClick, onElimina }) {
  const pezzi = formazione.schieramento
    .map(slot => ({ ...inventario.find(p => p.uid === slot.uid), isRe: slot.isRe }))
    .filter(p => p.uid);

  const pezziOrdinati = [...pezzi].sort((a, b) => (b.isRe ? 1 : 0) - (a.isRe ? 1 : 0));

  return (
    <div className={`form-saved-card${attiva ? " form-saved-card-active" : ""}`} onClick={onClick}>
      <div className="form-saved-card-header">
        <span className="form-saved-card-nome">{formazione.nome}</span>
        {!attiva && (
          <button className="form-formazione-del" onClick={onElimina} title="Elimina">✕</button>
        )}
      </div>
      <div className="form-saved-card-pezzi">
        {pezziOrdinati.map((p, i) => (
          <FormazionePezzo key={i} pezzo={p} attiva={attiva} />
        ))}
      </div>
      {attiva && (
        <button className="form-card-btn-elimina" onClick={onElimina}>🗑 ELIMINA</button>
      )}
    </div>
  );
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
  const [confirmBack,       setConfirmBack]       = useState(false);
  const [confirmCarica,     setConfirmCarica]     = useState(null);
  const [confirmElimina,    setConfirmElimina]    = useState(null);
  const [confirmSostituisci, setConfirmSostituisci] = useState(null);
  const [isDirty,           setIsDirty]           = useState(false);
  const dirtySkip = useRef(true);

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

  // ── isDirty: si attiva quando board/nome cambiano dopo il caricamento ──────
  useEffect(() => {
    if (dirtySkip.current) { dirtySkip.current = false; return; }
    setIsDirty(true);
  }, [formazione, nomeInput]);

  // ── Carica una formazione nello stato ──────────────────────────────────────
  const caricaFormazione = (forma, showMsg = true) => {
    dirtySkip.current = true;
    setFormazione(forma.schieramento);
    setFormazioneId(forma.id);
    setNomeInput(forma.nome);
    const re = forma.schieramento.find(s => s.isRe);
    setReUid(re?.uid ?? null);
    setSelectedCell(null);
    setSelectedInv(null);
    setIsDirty(false);
    if (showMsg) setMsg(`"${forma.nome}" caricata.`);
  };

  // ── Click su card formazione (con check dirty) ────────────────────────────
  const handleClickFormazione = (f) => {
    if (f.id === formazioneId) return;
    if (isDirty) { setConfirmCarica(f); return; }
    caricaFormazione(f);
  };

  // ── Persist su server ──────────────────────────────────────────────────────
  const persistFormazioni = async (lista) => {
    await fetch(`${API_URL}/api/formazione`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: JSON.stringify(lista) }),
    });
  };

  // ── Sovrascrivi formazione attiva ─────────────────────────────────────────
  const handleSovrascrivi = async () => {
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
      setIsDirty(false);
      setMsg("Formazione salvata!");
    } catch { setMsg("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  // ── Salva come nuova formazione ────────────────────────────────────────────
  const handleSalvaNuova = async () => {
    if (formazione.length < 6) { setMsg("Piazza tutti e 6 i pezzi!"); return; }
    if (!reUid)                 { setMsg("Designa un Re!"); return; }
    const nome = nomeInput.trim() || "Formazione";
    setSaving(true);
    try {
      const nuovaId = Date.now().toString();
      const nuove = [...formazioniSalvate, { id: nuovaId, nome, schieramento: formazione }];
      await persistFormazioni(nuove);
      setFormazioniSalvate(nuove);
      setFormazioneId(nuovaId);
      setIsDirty(false);
      setMsg("Salvata come nuova formazione!");
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

    // ── Piazza da inventario ─────────────────────────────────────────────────
    if (selectedInv && isPlayerRow) {
      if (placedUids.includes(selectedInv) && !existing) {
        setMsg("Questo pezzo è già piazzato altrove.");
        return;
      }
      if (!placedUids.includes(selectedInv) && !existing && formazione.length >= 6) {
        setMsg("Massimo 6 pedine — rimuovi una pedina o sostituiscila cliccando su una cella occupata.");
        return;
      }
      if (existing && existing.uid !== selectedInv) {
        setConfirmSostituisci({
          uid: selectedInv,
          row, col,
          invPezzo:   inventario.find(p => p.uid === selectedInv),
          boardPezzo: inventario.find(p => p.uid === existing.uid),
        });
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

    // ── Sposta da cella selezionata ──────────────────────────────────────────
    if (selectedCell && isPlayerRow) {
      const isSelf = selectedCell.row === row && selectedCell.col === col;
      if (isSelf) { setSelectedCell(null); return; }
      const moving = slotAt(selectedCell.row, selectedCell.col);
      if (existing && existing.uid !== moving?.uid) {
        // Cella occupata → chiedi conferma (scambio)
        setConfirmSostituisci({
          uid: moving?.uid,
          row, col,
          isMove: true,
          fromRow: selectedCell.row,
          fromCol: selectedCell.col,
          invPezzo:   inventario.find(p => p.uid === moving?.uid),
          boardPezzo: inventario.find(p => p.uid === existing.uid),
        });
        return;
      }
      if (moving) {
        setFormazione(prev => [
          ...prev.filter(f => !(f.row === selectedCell.row && f.col === selectedCell.col)),
          { ...moving, row, col },
        ]);
      }
      setSelectedCell(null);
      return;
    }

    // ── Seleziona cella ──────────────────────────────────────────────────────
    if (existing) { setSelectedCell({ row, col }); setSelectedInv(null); return; }
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

      {/* ── Confirm overlay torna alla locanda ── */}
      {confirmBack && (
        <ConfirmModal
          title="↩ Torna alla locanda?"
          buttons={[
            { label: "Torna alla Locanda", onClick: onBack, variant: "danger" },
            { label: "Annulla", onClick: () => setConfirmBack(false), variant: "cancel" },
          ]}
        >
          <p>Vuoi abbandonare la formazione e tornare alla locanda?</p>
        </ConfirmModal>
      )}

      {/* ── Confirm overlay carica formazione ── */}
      {confirmCarica && (
        <ConfirmModal
          title="Modifiche non salvate"
          buttons={[
            { label: "Continua senza salvare", onClick: () => { caricaFormazione(confirmCarica); setConfirmCarica(null); }, variant: "danger" },
            { label: "Annulla", onClick: () => setConfirmCarica(null), variant: "cancel" },
          ]}
        >
          <p>La formazione corrente ha modifiche non salvate. Vuoi continuare senza salvare?</p>
        </ConfirmModal>
      )}

      {/* ── Confirm overlay elimina schema ── */}
      {confirmElimina && (
        <ConfirmModal
          title="Elimina schema?"
          buttons={[
            { label: "Elimina", onClick: async () => { await handleElimina(confirmElimina.id, { stopPropagation: () => {} }); setConfirmElimina(null); }, variant: "danger" },
            { label: "Annulla", onClick: () => setConfirmElimina(null), variant: "cancel" },
          ]}
        >
          <p>Vuoi eliminare «{confirmElimina.nome}»? L'operazione non è reversibile.</p>
        </ConfirmModal>
      )}

      {/* ── Confirm overlay sostituisci pedina ── */}
      {confirmSostituisci && (
        <ConfirmModal
          title="⇄ Sostituire pedina?"
          buttons={[
            { label: "Sostituisci", onClick: () => {
                const { uid, row, col, boardPezzo, isMove, fromRow, fromCol } = confirmSostituisci;
                if (isMove) {
                  setFormazione(prev => {
                    const movingSlot   = prev.find(f => f.row === fromRow && f.col === fromCol);
                    const existingSlot = prev.find(f => f.row === row    && f.col === col);
                    const rest = prev.filter(f =>
                      !(f.row === fromRow && f.col === fromCol) &&
                      !(f.row === row     && f.col === col)
                    );
                    return [
                      ...rest,
                      { ...movingSlot,   row, col },
                      { ...existingSlot, row: fromRow, col: fromCol },
                    ];
                  });
                  setSelectedCell(null);
                } else {
                  if (boardPezzo?.uid === reUid) setReUid(null);
                  setFormazione(prev => {
                    const f1 = prev.filter(f => !(f.row === row && f.col === col));
                    const f2 = f1.filter(f => f.uid !== uid);
                    return [...f2, { uid, row, col, isRe: uid === reUid }];
                  });
                  setSelectedInv(null);
                }
                setConfirmSostituisci(null);
              }, variant: "save" },
            { label: "Annulla", onClick: () => setConfirmSostituisci(null), variant: "cancel" },
          ]}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
            <div style={{ flex: 1 }}><FormazionePezzo pezzo={confirmSostituisci.invPezzo}   attiva={true} hideSilhouette /></div>
            <span style={{ fontSize: "40px", color: "var(--hs-gold)", alignSelf: "center" }}>⇄</span>
            <div style={{ flex: 1 }}><FormazionePezzo pezzo={confirmSostituisci.boardPezzo} attiva={true} hideSilhouette /></div>
          </div>
        </ConfirmModal>
      )}

      {/* ── Confirm overlay ripristina ── */}
      {confirmReset && (
        <ConfirmModal
          title="Ripristina pezzi?"
          buttons={[
            { label: resetting ? "Ripristinando..." : "Ripristina", onClick: async () => { setConfirmReset(false); await doReset(); }, variant: "danger", disabled: resetting },
            { label: "Annulla", onClick: () => setConfirmReset(false), variant: "cancel" },
          ]}
        >
          <p>Tutti i tuoi pezzi e le formazioni salvate verranno sostituiti dai 6 classici.</p>
        </ConfirmModal>
      )}

      {/* ── Header ── */}
      <GameHeader
        title="Formazione"
        subtitle="Piazza i pezzi nelle ultime 2 righe · Designa il Re"
        onBack={() => setConfirmBack(true)}
        backTitle="Torna alla locanda"
      />

      <div className="form-body">

        {/* ── Pannello schemi salvati (sinistra) ── */}
        <PannelloLista
          className="form-formazioni-panel"
          titolo="Formazioni"
          items={formazioniSalvate}
          filterFn={(f, q) => f.nome.toLowerCase().includes(q.toLowerCase())}
          headerAction={
            <button className="form-btn-icon" onClick={handleNuova} title="Nuova formazione">＋ Aggiungi Nuova</button>
          }
          renderItem={f => (
            <FormazioneCard
              key={f.id}
              formazione={f}
              inventario={inventario}
              attiva={f.id === formazioneId}
              onClick={() => handleClickFormazione(f)}
              onElimina={(e) => { e.stopPropagation(); setConfirmElimina(f); }}
            />
          )}
        />

        {/* ── Board ── */}
        <FormazioneBoard
          formazione={formazione}
          inventario={inventario}
          selectedCell={selectedCell}
          selectedInv={selectedInv}
          msg={msg}
          onCellClick={handleCellClick}
          selectedCellPiece={selectedCellPiece}
          isRe={selectedCell ? !!slotAt(selectedCell.row, selectedCell.col)?.isRe : false}
          onDesignaRe={handleDesignaRe}
          onRemove={handleRemove}
          onAnnulla={() => setSelectedCell(null)}
          nomeInput={nomeInput}
          onNomeChange={e => setNomeInput(e.target.value)}
          onSovrascrivi={handleSovrascrivi}
          onSalvaNuova={handleSalvaNuova}
          saving={saving}
          pezziCount={formazione.length}
          hasRe={!!reUid}
          onAvvia={handleAvvia}
          canAvvia={canAvvia}
          selectedInvPiece={inventario.find(p => p.uid === selectedInv) ?? null}
          onAnnullaInv={() => setSelectedInv(null)}
          formazioneId={formazioneId}
        />

        {/* ── Pannello destra ── */}
        <div className="form-side">

          {/* Inventario — occupa lo spazio rimanente */}
          <PannelloLista
            className="form-inv-panel"
            titolo="Inventario"
            items={inventario}
            filterFn={(p, q) => p.nome.toLowerCase().includes(q.toLowerCase())}
            renderItem={p => {
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
                  <SilhouettePiece natura={p.natura} materiale={p.materiale} pieceId={p.id} size={80} />
                  <div className="form-inv-info">
                    <span className="form-inv-nome">{p.nome} <TagLivello livello={livelloPerRicetta(p.id)} /></span>
                    <PieceStats piece={p} compact />
                    <AbilitaList ardore={p.ardore} gesta={p.gesta} aura={p.aura} collapsed />
                  </div>
                  {placed && (
                    <span className="form-inv-badge">{isRePiece ? "♛" : "✓"}</span>
                  )}
                </div>
              );
            }}
          />

          {/* Footer sticky — reset */}
          <div className="form-panel-footer">
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
