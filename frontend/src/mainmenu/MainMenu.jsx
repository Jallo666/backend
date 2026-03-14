import { useEffect, useRef, useState } from "react";
import "./MainMenu.css";
import GameHeader from "./GameHeader";
const SAVE_KEY = "qb_game_stats";

// ── SVG Arco del Dungeon ──────────────────────────────────────────────────────
function DungeonArch() {
  return (
    <svg className="mm-arch-svg" viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="archInner" cx="50%" cy="85%" r="55%">
          <stop offset="0%"   stopColor="#3a0860" stopOpacity="0.8"/>
          <stop offset="55%"  stopColor="#180428" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#050010" stopOpacity="1"/>
        </radialGradient>
        <radialGradient id="archGlow" cx="50%" cy="90%" r="50%">
          <stop offset="0%"   stopColor="#8830c0" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="#050010" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <path d="M 62,180 L 62,92 Q 62,32 130,32 Q 198,32 198,92 L 198,180 Z" fill="url(#archInner)"/>
      {[0,1,2,3,4,5,6,7].map(r => (
        <g key={`l${r}`}>
          <rect x={r%2===0?4:8}  y={28+r*19} width={r%2===0?56:52} height={18} rx={1.5}
                fill={r%2===0 ? "#26203a" : "#1f1a2e"} stroke="#0e0b1a" strokeWidth={1}/>
          <rect x={r%2===0?4:8}  y={28+r*19} width={r%2===0?56:52} height={4}  rx={1}
                fill="#3a3258" opacity={0.35}/>
        </g>
      ))}
      {[0,1,2,3,4,5,6,7].map(r => (
        <g key={`r${r}`}>
          <rect x={r%2===0?200:204} y={28+r*19} width={r%2===0?56:52} height={18} rx={1.5}
                fill={r%2===0 ? "#26203a" : "#1f1a2e"} stroke="#0e0b1a" strokeWidth={1}/>
          <rect x={r%2===0?200:204} y={28+r*19} width={r%2===0?56:52} height={4}  rx={1}
                fill="#3a3258" opacity={0.35}/>
        </g>
      ))}
      {[{x:62,y:8,w:42,h:28},{x:104,y:2,w:52,h:34},{x:156,y:8,w:42,h:28}].map((b,i) => (
        <g key={`k${i}`}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={2}
                fill={i===1?"#1f1a2e":"#26203a"} stroke="#0e0b1a" strokeWidth={1}/>
          <rect x={b.x} y={b.y} width={b.w} height={5} rx={1} fill="#3a3258" opacity={0.3}/>
        </g>
      ))}
      <path d="M 62,180 L 62,92 Q 62,32 130,32 Q 198,32 198,92 L 198,180 Z" fill="url(#archGlow)"/>
      <rect x="62" y="163" width="136" height="17" rx={2} fill="#030008" opacity={0.65}/>
      <text x="130" y="24" fontSize="10" textAnchor="middle" fill="#6a2a9a" fontFamily="serif" opacity="0.8">᛭</text>
    </svg>
  );
}

// ── Pannello decorativo ───────────────────────────────────────────────────────
const PANELS = [
  {
    id: "dungeon",
    icon: "⚔",
    label: "DUNGEON",
    desc: "Esplora le profondità oscure e sconfiggi i mostri",
    sub: "Piano 1 — Nuova avventura",
    btnText: "Entra nel Dungeon",
    btnClass: "mm-btn-dungeon",
    accent: "#6020a0",
  },
  {
    id: "questboard",
    icon: "♟",
    label: "QUEST BOARD",
    desc: "Schiera la tua formazione e affronta l'avversario",
    sub: "Tattica — Strategia — Duello",
    btnText: "Avvia Partita",
    btnClass: "mm-btn-questboard",
    accent: "#1a55cc",
  },
  {
    id: "mercante",
    icon: "💰",
    label: "MERCANTE",
    desc: "Compra e vendi equipaggiamento con le gemme",
    sub: "Negozio — Oggetti — Gemme",
    btnText: "Visita il Mercante",
    btnClass: "mm-btn-mercante",
    accent: "#c88020",
  },
  {
    id: "fabbro",
    icon: "⚒",
    label: "FABBRO",
    desc: "Forgia e potenzia le tue armi con il loot del dungeon",
    sub: "Crafting — Upgrade — Forge",
    btnText: "Visita il Fabbro",
    btnClass: "mm-btn-fabbro",
    accent: "#cc4420",
  },
];

// ── Componente principale ─────────────────────────────────────────────────────
export default function MainMenu({ utente, onEnterDungeon, onEnterCitta, onGilda, onLogout }) {
  const starsRef = useRef(null);
  const [saveData, setSaveData] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) setSaveData(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("div");
      s.className = "mm-star";
      s.style.left   = Math.random() * 100 + "%";
      s.style.top    = Math.random() * 100 + "%";
      const sz = 1 + Math.random() * 2;
      s.style.width  = sz + "px";
      s.style.height = sz + "px";
      s.style.animationDelay    = (Math.random() * 5) + "s";
      s.style.animationDuration = (2 + Math.random() * 4) + "s";
      container.appendChild(s);
    }
    return () => { if (container) container.innerHTML = ""; };
  }, []);

  const hasSave  = saveData && saveData.floor > 1;
  const statFloor = saveData?.floor   ?? 1;
  const statGems  = saveData?.gems    ?? 0;
  const statGold  = saveData?.gold    ?? 0;
  const statHp    = saveData ? `${saveData.hp}/${saveData.maxHp}` : "20/20";

  const handlePanel = (id) => {
    if (id === "dungeon")     onEnterDungeon(1, null);
    if (id === "questboard")  onEnterCitta("locanda");
    if (id === "mercante")    onEnterCitta("mercante");
    if (id === "fabbro")      onEnterCitta("fabbro");
  };

  return (
    <div className="mm-root">
      <div className="mm-stars" ref={starsRef} />

      {/* ── Header ── */}
<GameHeader
  title="QUEST BOARD"
  subtitle="Scegli il tuo destino, avventuriero"
  username={utente?.nome}
  onGilda={onGilda}
  onLogout={onLogout}
/>

      {/* ── 4 Panels Grid ── */}
      <main className="mm-panels">
        {PANELS.map(panel => (
          <section
            key={panel.id}
            className={`mm-panel mm-panel-${panel.id}`}
            onClick={() => handlePanel(panel.id)}
            style={{ "--panel-accent": panel.accent }}
          >
            {/* Scene visiva */}
            <div className="mm-panel-scene">
              {panel.id === "dungeon" ? (
                <>
                  <div className="mm-torch mm-torch-left">
                    <div className="mm-torch-glow" />
                    <div className="mm-torch-flame" />
                    <div className="mm-torch-stick" />
                  </div>
                  <DungeonArch />
                  <div className="mm-torch mm-torch-right">
                    <div className="mm-torch-glow" />
                    <div className="mm-torch-flame" />
                    <div className="mm-torch-stick" />
                  </div>
                </>
              ) : (
                <div className="mm-panel-big-icon" style={{ textShadow: `0 0 40px ${panel.accent}` }}>
                  {panel.icon}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mm-panel-info">
              <div className="mm-panel-label">{panel.label}</div>
              <div className="mm-panel-desc">{panel.desc}</div>
              <div className="mm-panel-sub">{panel.sub}</div>
              <button className={`mm-btn ${panel.btnClass}`} onClick={e => { e.stopPropagation(); handlePanel(panel.id); }}>
                {panel.btnText} ▶
              </button>
            </div>
          </section>
        ))}
      </main>

      {/* ── Footer stats ── */}
      <footer className="mm-footer">
        <div className="mm-footer-stat"><span className="mm-stat-label">🗺 Piano</span><span className="mm-stat-value">{statFloor}</span></div>
        <span className="mm-footer-sep">|</span>
        <div className="mm-footer-stat"><span className="mm-stat-label">🪙 Oro</span><span className="mm-stat-value">{statGold}</span></div>
        <span className="mm-footer-sep">|</span>
        <div className="mm-footer-stat"><span className="mm-stat-label">💎 Gemme</span><span className="mm-stat-value">{statGems}</span></div>
        <span className="mm-footer-sep">|</span>
        <div className="mm-footer-stat"><span className="mm-stat-label">❤ HP</span><span className="mm-stat-value">{statHp}</span></div>
      </footer>
    </div>
  );
}
