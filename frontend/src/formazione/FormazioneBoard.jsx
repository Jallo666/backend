import SilhouettePiece from "../SilhouettePiece.jsx";
import FormazioneMsgPanel from "./FormazioneMsgPanel.jsx";
import "./FormazioneBoard.css";

const ROWS = 6, COLS = 6;
const PLAYER_ROWS = [4, 5];
const AI_ROWS     = [0, 1];

export default function FormazioneBoard({ formazione, inventario, selectedCell, selectedInv, msg, onCellClick, selectedCellPiece, isRe, onDesignaRe, onRemove, onAnnulla, nomeInput, onNomeChange, onSovrascrivi, onSalvaNuova, saving }) {
  const pieceAt = (row, col) => {
    const slot = formazione.find(f => f.row === row && f.col === col);
    if (!slot) return null;
    return inventario.find(p => p.uid === slot.uid) ?? null;
  };
  const slotAt = (row, col) => formazione.find(f => f.row === row && f.col === col);

  return (
    <div className="form-board-wrap">
      <div className="form-board-outer">
        {/* [1,1] spacer */}
        <div />
        {/* [1,2] col labels */}
        <div className="form-col-labels">
          {["A","B","C","D","E","F"].map(l => (
            <div key={l} className="form-col-label">{l}</div>
          ))}
        </div>
        {/* [2,1] row labels */}
        <div className="form-row-labels">
          {[6,5,4,3,2,1].map(n => (
            <div key={n} className="form-row-label">{n}</div>
          ))}
        </div>
        {/* [2,2] board */}
        <div className="form-board">
          <FormazioneMsgPanel msg={msg} selectedCellPiece={selectedCellPiece} isRe={isRe} onDesignaRe={onDesignaRe} onRemove={onRemove} onAnnulla={onAnnulla} nomeInput={nomeInput} onNomeChange={onNomeChange} onSovrascrivi={onSovrascrivi} onSalvaNuova={onSalvaNuova} saving={saving} />
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const isPlayerZone   = PLAYER_ROWS.includes(r);
              const isAiZone       = AI_ROWS.includes(r);
              const p              = pieceAt(r, c);
              const slot           = slotAt(r, c);
              const isSelCell      = selectedCell?.row === r && selectedCell?.col === c;
              const isSelInvTarget = selectedInv && isPlayerZone && !p;
              return (
                <div
                  key={`${r}-${c}`}
                  className={[
                    "form-cell",
                    isPlayerZone   ? "form-cell-player"   : "form-cell-enemy",
                    isAiZone       ? "form-cell-ai-zone"  : "",
                    isSelCell      ? "form-cell-selected" : "",
                    isSelInvTarget ? "form-cell-target"   : "",
                  ].join(" ")}
                  onClick={() => onCellClick(r, c)}
                >
                  {r === 0 && (
                    <SilhouettePiece
                      natura="generica"
                      size={72}
                      className="form-cell-ai-sil"
                    />
                  )}
                  {p && (
                    <div
                      className={`form-piece ${slot?.isRe ? "form-piece-re" : ""}`}
                      style={{ "--piece-border": p.border, "--piece-glow": p.glow }}
                    >
                      <SilhouettePiece natura={p.natura} size={72} className="form-piece-sil" />
                      {slot?.isRe && <span className="form-piece-crown">♛</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
