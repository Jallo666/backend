import Fabbro from "./Fabbro";
import { SFIDANTI } from "./sfidanti.js";
import "./CittaPage.css";

const SUBPAGES = {
  locanda: {
    icon: "🍺",
    title: "Locanda — Il Drago Addormentato",
    desc: "Un fuoco crepitante illumina la sala. Il locandiere ti fa un cenno. Qui puoi riposare e sfidare avversari alla Quest Board.",
    color: "#c9a84c",
    bg:    "#0e1a0a",
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

function StarRating({ value, max = 5 }) {
  return (
    <div className="locanda-stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? "locanda-star-on" : "locanda-star-off"}>★</span>
      ))}
    </div>
  );
}

// ── Sub-pagina ────────────────────────────────────────────────────────────────
function SubPage({ pageKey, token, onBack, onBackToMenu, onApriFormazione }) {
  const p = SUBPAGES[pageKey];
  if (!p) return null;

  if (pageKey === "fabbro") {
    return <Fabbro token={token} onBack={onBack} onBackToMenu={onBackToMenu} />;
  }

  if (pageKey === "locanda") {
    return (
      <div className="citta-sub" style={{ "--accent": p.color, "--bg": p.bg }}>
        <nav className="citta-nav">
          <button className="citta-nav-btn" onClick={onBack}>← Città</button>
          <button className="citta-nav-btn citta-nav-menu" onClick={onBackToMenu}>⌂ Menu</button>
        </nav>
        <div className="locanda-content">
          <div className="locanda-header">
            <span className="locanda-header-icon">🍺</span>
            <h1 className="locanda-header-title">Il Drago Addormentato</h1>
            <p className="locanda-header-sub">{p.desc}</p>
          </div>
          <h2 className="locanda-sfidanti-title">⚔ Sfidanti</h2>
          <div className="locanda-sfidanti-list">
            {SFIDANTI.map(sf => (
              <div key={sf.id} className="locanda-sfidante-card">
                <div className="locanda-sfidante-portrait">
                  <img src={sf.img} alt={sf.nome} className="locanda-sfidante-img" />
                </div>
                <div className="locanda-sfidante-info">
                  <div className="locanda-sfidante-nome">{sf.nome}</div>
                  <div className="locanda-sfidante-titolo">{sf.titolo}</div>
                  <StarRating value={sf.difficolta} />
                  <p className="locanda-sfidante-desc">{sf.descrizione}</p>
                  <button
                    className="locanda-sfida-btn"
                    onClick={() => onApriFormazione(sf)}
                  >
                    ⚔ Sfida
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

        {p.soon?.length > 0 && (
          <>
            <div className="citta-soon-label">Prossimamente:</div>
            <ul className="citta-soon-list">
              {p.soon.map((item, i) => (
                <li key={i} className="citta-soon-item">{item}</li>
              ))}
            </ul>
          </>
        )}

        <div className="citta-wip-badge">🚧 In costruzione 🚧</div>
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
