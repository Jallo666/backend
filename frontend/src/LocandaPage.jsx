import { useEffect, useRef, useState } from "react";
import { SFIDANTI } from "./sfidanti.js";
import SfidanteCard from "./components/SfidanteCard.jsx";
import "./LocandaPage.css";
import BackButton from "./components/BackButton.jsx";
import dragoImg from "./assets/luoghi/drago_addormentato.png";

export default function LocandaPage({ onBack, onApriFormazione, onMultiplayer }) {
  const starsRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState('right');

  const goTo = (newIdx, direction) => {
    setDir(direction);
    setIdx(newIdx);
  };

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

        {onMultiplayer && (
          <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0 0.5rem" }}>
            <button className="loc-carousel-arrow" style={{ padding: "0.5rem 2rem", fontSize: "0.7rem", letterSpacing: "0.08em" }} onClick={onMultiplayer}>
              ⚔ GIOCA ONLINE
            </button>
          </div>
        )}

        <h2 className="loc-sfidanti-title">⚔ Sfidanti</h2>

        <div className="loc-carousel">
          <button
            className="loc-carousel-arrow"
            onClick={() => goTo((idx - 1 + SFIDANTI.length) % SFIDANTI.length, 'left')}
            disabled={SFIDANTI.length <= 1}
          >‹</button>

          <div key={idx} className={`loc-carousel-slide loc-carousel-slide--${dir}`}>
            <SfidanteCard sfidante={SFIDANTI[idx]} onSfida={onApriFormazione} />
          </div>

          <button
            className="loc-carousel-arrow"
            onClick={() => goTo((idx + 1) % SFIDANTI.length, 'right')}
            disabled={SFIDANTI.length <= 1}
          >›</button>
        </div>

        <div className="loc-carousel-dots">
          {SFIDANTI.map((_, i) => (
            <button
              key={i}
              className={`loc-carousel-dot${i === idx ? " active" : ""}`}
              onClick={() => goTo(i, i > idx ? 'right' : 'left')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
