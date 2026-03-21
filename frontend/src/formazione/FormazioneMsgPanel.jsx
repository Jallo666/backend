import AbilitaList from "../components/AbilitaList.jsx";
import FormMsg from "./FormMsg.jsx";
import "./FormazioneMsgPanel.css";

export default function FormazioneMsgPanel({ msg, selectedCellPiece, isRe, onDesignaRe, onRemove, onAnnulla, nomeInput, onNomeChange, onSovrascrivi, onSalvaNuova, saving }) {
  return (
    <div className="form-msg-panel">
      <div className="form-msg-panel-left">
        {selectedCellPiece && (
          <div className="form-section form-cell-actions">
            <h3 className="form-section-title">
              {selectedCellPiece.nome}
              {isRe && " ♛"}
            </h3>
            <div className="form-stats-row">
              <span>❤ {selectedCellPiece.hp}</span>
              <span>⚔ {selectedCellPiece.atk}</span>
              <span>🛡 {selectedCellPiece.def}</span>
              <span>👟 {selectedCellPiece.mov}</span>
            </div>
            <AbilitaList ardore={selectedCellPiece.ardore} gesta={selectedCellPiece.gesta} aura={selectedCellPiece.aura} />
            <div className="form-cell-action-btns">
              <button className="form-btn form-btn-re"     onClick={() => onDesignaRe(selectedCellPiece.uid)}>♛ Designa Re</button>
              <button className="form-btn form-btn-remove" onClick={() => onRemove(selectedCellPiece.uid)}>✕ Rimuovi</button>
              <button className="form-btn form-btn-cancel" onClick={onAnnulla}>Annulla</button>
            </div>
          </div>
        )}
      </div>
      <div className="form-msg-panel-right">
        <div className="form-msg-panel-right-top">
          <div className="form-section form-section-nome">
            <input
              className="form-nome-input"
              value={nomeInput}
              onChange={onNomeChange}
              placeholder="Nome formazione..."
              maxLength={28}
            />
            <div className="form-salva-row">
              <button className="form-btn form-btn-save" onClick={onSovrascrivi} disabled={saving}>
                {saving ? "..." : "💾 Sovrascrivi"}
              </button>
              <button className="form-btn form-btn-nuova" onClick={onSalvaNuova} disabled={saving}>
                {saving ? "..." : "＋ Salva nuova"}
              </button>
            </div>
          </div>
        </div>
        <div className="form-msg-panel-right-bottom">
          <FormMsg msg={msg} />
        </div>
      </div>
    </div>
  );
}
