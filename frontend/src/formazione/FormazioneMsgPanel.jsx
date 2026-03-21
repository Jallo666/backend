import { useState, useEffect } from "react";
import { TagRe } from "../components/PieceTag.jsx";
import FormMsg from "./FormMsg.jsx";
import FormazioneNome from "./FormazioneNome.jsx";
import FormazionePezzo from "./FormazionePezzo.jsx";
import "./FormazioneMsgPanel.css";

export default function FormazioneMsgPanel({ msg, selectedCellPiece, isRe, onDesignaRe, onRemove, onAnnulla, nomeInput, onNomeChange, onSovrascrivi, onSalvaNuova, saving, pezziCount, hasRe, onAvvia, canAvvia, selectedInvPiece, onAnnullaInv, formazioneId }) {
  const [renaming, setRenaming] = useState(false);

  useEffect(() => { setRenaming(false); }, [formazioneId]);

  return (
    <div className="form-msg-panel">
      <div className="form-msg-panel-left">
        {selectedCellPiece ? (
          <div className="form-cell-actions">
            <FormazionePezzo pezzo={{ ...selectedCellPiece, isRe }} attiva={true} hideSilhouette />
            <div className="form-cell-action-btns">
              <button className="form-btn form-btn-re form-btn-re-footer" onClick={() => onDesignaRe(selectedCellPiece.uid)}>Designa <TagRe /></button>
              <button className="form-btn form-btn-remove"                onClick={() => onRemove(selectedCellPiece.uid)}>✕ Rimuovi</button>
              <button className="form-btn form-btn-cancel"                onClick={onAnnulla}>Annulla</button>
            </div>
          </div>
        ) : selectedInvPiece ? (
          <div className="form-cell-actions">
            <FormazionePezzo pezzo={selectedInvPiece} attiva={true} hideSilhouette />
            <div className="form-cell-action-btns">
              <button className="form-btn form-btn-cancel" onClick={onAnnullaInv}>Annulla</button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="form-msg-panel-right">
        <div className="form-msg-panel-right-top">
          {renaming ? (
            <FormazioneNome
              nomeInput={nomeInput}
              onNomeChange={onNomeChange}
              onSovrascrivi={() => { onSovrascrivi(); setRenaming(false); }}
              onSalvaNuova={() => { onSalvaNuova(); setRenaming(false); }}
              onAnnulla={() => setRenaming(false)}
              saving={saving}
            />
          ) : (
            <div className="form-nome-display">
              <span className="form-nome-display-label">Formazione selezionata</span>
              <span className="form-nome-display-nome">{nomeInput}</span>
              <div className="form-header-status">
                <span className={pezziCount === 6 ? "form-status-ok" : "form-status-warn"}>{pezziCount}/6 pedine</span>
                <span className={hasRe ? "form-status-ok" : "form-status-warn"}><TagRe /> {hasRe ? "✓" : "✗"}</span>
              </div>
              <div className="form-nome-display-actions">
                <button
                  className="form-btn form-btn-avvia"
                  onClick={onAvvia}
                  disabled={!canAvvia}
                  title={!canAvvia ? "Piazza tutti i pezzi e designa il Re" : ""}
                >
                  ⚔ Avvia Partita
                </button>
                <button className="form-btn form-btn-cancel form-btn-rinomina" onClick={() => setRenaming(true)}>
                  ✏ Salva
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="form-msg-panel-right-bottom">
          <FormMsg msg={selectedInvPiece ? "Scegli la posizione di questa pedina" : msg} />
        </div>
      </div>
    </div>
  );
}
