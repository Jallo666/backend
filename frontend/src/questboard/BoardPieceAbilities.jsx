import { TagRe, TagArdore, TagGesta, TagAura } from "../components/PieceTag.jsx";
import "./BoardPieceAbilities.css";

export default function BoardPieceAbilities({ p, ardoreAvail, gestaAvail }) {
  const hasArdore = (p.ardore?.length ?? 0) > 0;
  const hasGesta  = (p.gesta?.length  ?? 0) > 0;
  const hasAura   = (p.aura?.length   ?? 0) > 0;

  return (
    <>
      {(hasArdore || hasGesta || hasAura) && (
        <div className="bpa-left">
          {hasArdore && <span className={ardoreAvail ? 'bpa-on' : 'bpa-off'}><TagArdore /></span>}
          {hasGesta  && <span className={gestaAvail  ? 'bpa-on' : 'bpa-off'}><TagGesta  /></span>}
          {hasAura   && <TagAura />}
        </div>
      )}
      {p.isRe && (
        <div className="bpa-right">
          <TagRe />
        </div>
      )}
    </>
  );
}
