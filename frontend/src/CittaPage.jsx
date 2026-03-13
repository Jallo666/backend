import Fabbro from "./Fabbro";
import "./CittaPage.css";

const SUBPAGES = {
  locanda: {
    icon: "🍺",
    title: "Locanda — Il Drago Addormentato",
    desc: "Un fuoco crepitante illumina la sala. Il locandiere ti fa un cenno. Qui puoi riposare, raccogliere le ultime voci del dungeon e sfidare avversari alla Quest Board.",
    color: "#c9a84c",
    bg:    "#0e1a0a",
    soon: ["🛌 Riposa (recupera HP)", "💬 Notizie dal dungeon"],
  },
  fabbro: {
    icon: "⚒️",
    title: "Fabbro — L'Incudine Rossa",
    desc: "Il calore della fucina ti investe. Brom il Fabbro batte il metallo senza sosta. Porta il tuo loot: può trasformarlo in armi e armature degne di un eroe.",
    color: "#e07030",
    bg:    "#1a0a00",
    soon: ["⚔ Forgia armi", "🛡 Rinforza armatura", "🔩 Combina materiali"],
  },
  mercante: {
    icon: "🛒",
    title: "Mercante — Silas il Curioso",
    desc: "Silas sorride mostrando i denti d'oro. Le sue casse traboccano di oggetti rari, pozioni e frecce. Vende a caro prezzo, ma compra quasi tutto.",
    color: "#50cc80",
    bg:    "#001a0e",
    soon: ["💊 Pozioni di cura", "🏹 Frecce e munizioni", "💎 Compra/vendi gemme"],
  },
};

// ── Sub-pagina ────────────────────────────────────────────────────────────────
function SubPage({ pageKey, token, onBack, onBackToMenu, onApriFormazione }) {
  const p = SUBPAGES[pageKey];
  if (!p) return null;

  // Fabbro ha il proprio componente completo
  if (pageKey === "fabbro") {
    return <Fabbro token={token} onBack={onBack} onBackToMenu={onBackToMenu} />;
  }

  const isLocanda = pageKey === "locanda";

  return (
    <div className="citta-sub" style={{ "--accent": p.color, "--bg": p.bg }}>
      <nav className="citta-nav">
        <button className="citta-nav-btn" onClick={onBack}>← Città</button>
        <button className="citta-nav-btn citta-nav-menu" onClick={onBackToMenu}>⌂ Menu</button>
      </nav>

      <div className="citta-sub-content">
        <div className="citta-sub-icon">{p.icon}</div>
        <h1 className="citta-sub-title">{p.title}</h1>
        <p className="citta-sub-desc">{p.desc}</p>

        {isLocanda && (
          <button className="citta-qb-btn" onClick={onApriFormazione}>
            ⚔ Sfida alla Quest Board
          </button>
        )}

        {p.soon.length > 0 && (
          <>
            <div className="citta-soon-label">Prossimamente:</div>
            <ul className="citta-soon-list">
              {p.soon.map((item, i) => (
                <li key={i} className="citta-soon-item">{item}</li>
              ))}
            </ul>
          </>
        )}

        {!isLocanda && <div className="citta-wip-badge">🚧 In costruzione 🚧</div>}
      </div>
    </div>
  );
}

// ── Hub Città ─────────────────────────────────────────────────────────────────
function CittaHub({ onNavigate, onBackToMenu }) {
  return (
    <div className="citta-hub">
      <nav className="citta-nav">
        <button className="citta-nav-btn citta-nav-menu" onClick={onBackToMenu}>← Menu Principale</button>
      </nav>

      <header className="citta-hub-header">
        <h1 className="citta-hub-title">🏙 La Città</h1>
        <p className="citta-hub-sub">Dove andresti, avventuriero?</p>
      </header>

      <div className="citta-hub-cards">
        {Object.entries(SUBPAGES).map(([key, p]) => (
          <button key={key} className="citta-card" onClick={() => onNavigate(key)}
                  style={{ "--accent": p.color, "--bg": p.bg }}>
            <span className="citta-card-icon">{p.icon}</span>
            <span className="citta-card-title">{p.title.split(" — ")[0]}</span>
            <span className="citta-card-sub">{p.desc.split(".")[0]}.</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function CittaPage({ subPage, token, onNavigate, onBackToMenu, onApriFormazione }) {
  if (subPage) {
    return (
      <SubPage
        pageKey={subPage}
        token={token}
        onBack={() => onNavigate(null)}
        onBackToMenu={onBackToMenu}
        onApriFormazione={onApriFormazione}
      />
    );
  }
  return <CittaHub onNavigate={onNavigate} onBackToMenu={onBackToMenu} />;
}
