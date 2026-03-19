import { useEffect, useRef } from "react";
import { SFIDANTI } from "./sfidanti.js";
import { CLASSIC_PIECES, NATURA_DA_NOME, ardoreDiNatura, gesteDiNatura, auraDiNatura } from "./game/questboard/qb_pieces.js";
import SilhouettePiece from "./SilhouettePiece.jsx";
import "./LocandaPage.css";
import BackButton from "./components/BackButton.jsx";
import dragoImg   from "./assets/luoghi/drago_addormentato.png";
import ardoreIcon from "./assets/icon/ardore.svg";
import gestaIcon  from "./assets/icon/gesta.svg";
import auraIcon   from "./assets/icon/aura.svg";

function StarRating({ value, max = 5 }) {
  return (
    <div className="loc-stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? "loc-star-on" : "loc-star-off"}>★</span>
      ))}
    </div>
  );
}

function AbIcon({ icon, alt, nome, desc }) {
  return (
    <div className="loc-ab-wrap">
      <img src={icon} alt={alt} className="loc-preview-ab-icon" />
      <div className="loc-ab-tooltip">
        <div className="loc-ab-tooltip-nome">{nome}</div>
        <div className="loc-ab-tooltip-desc">{desc}</div>
      </div>
    </div>
  );
}

function FormazionePreview({ pezzi }) {
  return (
    <div className="loc-preview-wrap">
      <div className="loc-preview-label">Formazione avversario</div>
      <div className="loc-preview-list">
        {pezzi.map(p => {
          const natura  = NATURA_DA_NOME[p.nome] ?? null;
          const ardore  = ardoreDiNatura(natura);
          const gesta   = gesteDiNatura(natura);
          const aura    = auraDiNatura(natura);
          const hasAb   = ardore.length > 0 || gesta.length > 0 || aura.length > 0;
          return (
            <div key={p.id} className="loc-preview-piece">
              <SilhouettePiece natura={natura} size={52} />
              <div className="loc-preview-nome">{p.nome}</div>
              <div className="loc-preview-stats">
                <span>❤{p.hp}</span>
                <span>⚔{p.atk}</span>
                <span>🛡{p.def}</span>
              </div>
              {hasAb && (
                <div className="loc-preview-abilities">
                  {ardore.map(a => <AbIcon key={a.id} icon={ardoreIcon} alt="ardore" nome={a.nome} desc={a.desc} />)}
                  {gesta.map(g  => <AbIcon key={g.id} icon={gestaIcon}  alt="gesta"  nome={g.nome} desc={g.desc} />)}
                  {aura.map(au  => <AbIcon key={au.id} icon={auraIcon}  alt="aura"   nome={au.nome} desc={au.desc} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LocandaPage({ onBack, onApriFormazione }) {
  const starsRef = useRef(null);

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("div");
      s.className = "loc-star-bg";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      const sz = 1 + Math.random() * 2;
      s.style.width = sz + "px";
      s.style.height = sz + "px";
      s.style.animationDelay = (Math.random() * 5) + "s";
      s.style.animationDuration = (2 + Math.random() * 4) + "s";
      container.appendChild(s);
    }
    return () => { if (container) container.innerHTML = ""; };
  }, []);

  return (
    <div className="loc-root">
      <div className="loc-stars-container" ref={starsRef} />

      <BackButton onClick={onBack} title="Torna al Menu" absolute />

      <div className="loc-content">
        <div className="loc-header">
          <div className="loc-header-banner">
            <img src={dragoImg} alt="Il Drago Addormentato" className="loc-banner-img" />
          </div>
          <div className="loc-header-text">
            <h1 className="loc-title">Il Drago Addormentato</h1>
            <p className="loc-sub">Un fuoco crepitante illumina la sala. Il locandiere ti fa un cenno. Qui puoi riposare e sfidare avversari alla Quest Board.</p>
          </div>
        </div>

        <h2 className="loc-sfidanti-title">⚔ Sfidanti</h2>

        <div className="loc-sfidanti-list">
          {SFIDANTI.map(sf => (
            <div key={sf.id} className="loc-sfidante-card">
              <div className="loc-sfidante-left">
                <div className="loc-sfidante-portrait">
                  <img src={sf.img} alt={sf.nome} className="loc-sfidante-img" />
                </div>
                <button className="loc-sfida-btn" onClick={() => onApriFormazione(sf)}>
                  ⚔ Sfida
                </button>
              </div>
              <div className="loc-sfidante-info">
                <div className="loc-sfidante-nome">{sf.nome}</div>
                <div className="loc-sfidante-titolo">{sf.titolo}</div>
                <StarRating value={sf.difficolta} />
                <p className="loc-sfidante-desc">{sf.descrizione}</p>
                <FormazionePreview pezzi={sf.pezziPreview ?? CLASSIC_PIECES} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
