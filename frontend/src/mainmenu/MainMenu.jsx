import { useEffect, useRef, useState } from "react";
import "./MainMenu.css";
import GameHeader from "./GameHeader";
import { PANELS, SAVE_KEY } from "./constants";
import DungeonArch from "./DungeonArch";
import GameFooter from "./GameFooter";

// ── Componente principale ─────────────────────────────────────────────────────
export default function MainMenu({ utente, onEnterDungeon, onEnterCitta, onGilda, onLogout }) {
  const starsRef = useRef(null);
  const [saveData, setSaveData] = useState(null);
  const [activeTab, setActiveTab] = useState(PANELS[0].id);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) setSaveData(JSON.parse(raw));
    } catch { }
  }, []);

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("div");
      s.className = "mm-star";
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

  const hasSave = saveData && saveData.floor > 1;
  const statFloor = saveData?.floor ?? 1;
  const statGems = saveData?.gems ?? 0;
  const statGold = saveData?.gold ?? 0;
  const statHp = saveData ? `${saveData.hp}/${saveData.maxHp}` : "20/20";

  const handlePanel = (id) => {
    if (id === "dungeon") onEnterDungeon(1, null);
    if (id === "questboard") onEnterCitta("locanda");
    if (id === "mercante") onEnterCitta("mercante");
    if (id === "fabbro") onEnterCitta("fabbro");
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



      {/* ── Main Layout ── */}
      <div className="mm-main-layout">
        {/* ── Sidebar Menu ── */}
        <aside className="mm-sidebar">
          {PANELS.map(panel => (
            <button
              key={panel.id}
              className={`mm-menu-item ${activeTab === panel.id ? 'active' : ''}`}
              onClick={() => setActiveTab(panel.id)}
            >
              <div className="mm-menu-icon">{panel.icon}</div>
              <div className="mm-menu-label">{panel.label}</div>
            </button>
          ))}
        </aside>

        {/* ── Content Area ── */}
        <main className="mm-content">
          {PANELS.filter(panel => panel.id === activeTab).map(panel => (
            <section
              key={panel.id}
              className={`mm-panel mm-panel-${panel.id}`}
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
                <button className={`mm-btn ${panel.btnClass}`} onClick={() => handlePanel(panel.id)}>
                  {panel.btnText} ▶
                </button>
              </div>
            </section>
          ))}
        </main>
      </div>
      {/* ── Footer stats ── */}
      <GameFooter
        floor={statFloor}
        gold={statGold}
        gems={statGems}
        hp={statHp}
      />
    </div>
  );
}
