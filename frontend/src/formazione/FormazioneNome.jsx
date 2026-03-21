export default function FormazioneNome({ nomeInput, onNomeChange, onSovrascrivi, onSalvaNuova, onAnnulla, saving }) {
  return (
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
        <button className="form-btn form-btn-cancel" onClick={onAnnulla} disabled={saving}>
          ✕ Annulla
        </button>
      </div>
    </div>
  );
}
