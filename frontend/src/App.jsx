import { useEffect, useState } from "react";
import Login from "./login/Login";
import Registrazione from "./Registrazione";
import Gioco from "./Gioco";
import MainMenu from "./mainmenu/MainMenu";
import LocandaPage from "./LocandaPage";
import Fabbro from "./fabbro/Fabbro";
import Formazione from "./formazione/Formazione";
import QuestBoardGame from "./questboard/QuestBoardGame";
import useMusic from "./music/useMusic";
import { unlockAudio } from "./music/unlockAudio";
import MobileGate from "./components/MobileGate";

const API_URL     = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const SESSION_KEY = "qb_session";

function jwtValid(token) {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// ── Pagine: login|registrazione|mainmenu|dungeon|gilda|citta|formazione|questboard

function App() {
  const [utente,   setUtente]   = useState(null);
  const [token,    setToken]    = useState(null);
  const [utenti,   setUtenti]   = useState([]);
  const [pagina,   setPagina]   = useState("login");
  useMusic(pagina);
  const [checking, setChecking] = useState(true);

  // Dungeon
  const [startFloor, setStartFloor] = useState(1);
  const [saveData,   setSaveData]   = useState(null);

  // Quest Board — dati passati da Formazione a QuestBoardGame
  const [qbInventario,  setQbInventario]  = useState([]);
  const [qbFormazione,  setQbFormazione]  = useState([]);
  const [qbSfidante,    setQbSfidante]    = useState(null);

  useEffect(() => {
    unlockAudio();
  }, []);

  useEffect(() => {
    const DESIGN_WIDTH = 2560;
    const update = () => {
      const scale       = window.innerWidth / DESIGN_WIDTH;
      const designHeight = Math.ceil(window.innerHeight / scale);
      const root  = document.getElementById('root');
      if (!root) return;
      root.style.transform       = `scale(${scale})`;
      root.style.transformOrigin = 'top left';
      root.style.width           = `${DESIGN_WIDTH}px`;
      root.style.height          = `${designHeight}px`;
      root.style.minHeight       = `${designHeight}px`;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Ripristina sessione ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const { token: savedToken, ...savedUser } = JSON.parse(raw);
        if (savedToken && jwtValid(savedToken)) {
          setToken(savedToken);
          setUtente(savedUser);
          setPagina("mainmenu");
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setChecking(false);
    }
  }, []);

  const handleAuth = (data, ricordate = false) => {
    const { token, ...userData } = data;
    setToken(token);
    setUtente(userData);
    setPagina("mainmenu");
    if (ricordate) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ token, ...userData }));
    }
  };

  const handleLogout = () => {
    setUtente(null);
    setToken(null);
    setPagina("login");
    localStorage.removeItem(SESSION_KEY);
  };

  const caricaUtenti = (tok) => {
    fetch(`${API_URL}/utenti`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(res => { if (res.status === 401) { handleLogout(); return null; } return res.json(); })
      .then(data => { if (data) setUtenti(data); });
  };

  useEffect(() => {
    if (!utente || !token) return;
    caricaUtenti(token);
  }, [utente, token]);

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/utenti/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUtenti(prev => prev.filter(u => u.id !== id));
  };

  // ── Navigazione ──
  const enterDungeon = (floor = 1, player = null) => {
    setStartFloor(floor); setSaveData(player); setPagina("dungeon");
  };
  const enterLocanda = () => setPagina("locanda");
  const enterFabbro  = () => setPagina("fabbro");
  const enterFormazione = (sfidante = null) => {
    setQbSfidante(sfidante);
    setPagina("formazione");
  };
  const avviaPartita = (inv, form) => {
    setQbInventario(inv);
    setQbFormazione(form);
    setPagina("questboard");
  };

  // ── Loading ──
  if (checking) {
    return (
      <MobileGate>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                      justifyContent:"center", minHeight:"100vh", gap:"1.5rem" }}>
          <span style={{ fontSize:"2.5rem", animation:"rpgSpin 1s steps(8,end) infinite" }}>⚔</span>
          <p style={{ fontFamily:'"Press Start 2P", monospace', fontSize:"0.55rem",
                      color:"#f0c040", letterSpacing:"0.08em" }}>CARICAMENTO...</p>
          <style>{`@keyframes rpgSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </MobileGate>
    );
  }

  // ── Non autenticato ──
  if (!utente) {
    if (pagina === "registrazione") {
      return <MobileGate><Registrazione onRegistrato={d => handleAuth(d, false)} onVaiLogin={() => setPagina("login")} /></MobileGate>;
    }
    return <MobileGate><Login onLogin={handleAuth} onVaiRegistrazione={() => setPagina("registrazione")} /></MobileGate>;
  }

  const isAdmin = utente.ruolo === "admin";

  if (pagina === "mainmenu") {
    return (
      <MobileGate>
        <MainMenu
          utente={utente}
          onEnterDungeon={enterDungeon}
          onEnterLocanda={enterLocanda}
          onEnterFabbro={enterFabbro}
          onGilda={() => setPagina("gilda")}
          onLogout={handleLogout}
        />
      </MobileGate>
    );
  }

  if (pagina === "dungeon") {
    return (
      <MobileGate>
        <div style={{ display:"flex", flexDirection:"column", minHeight:"100dvh", background:"#040410" }}>
          <div className="gioca-wrapper" style={{ flex:1 }}>
            <Gioco startFloor={startFloor} saveData={saveData} onBackToMenu={() => setPagina("mainmenu")} />
          </div>
        </div>
      </MobileGate>
    );
  }

  if (pagina === "fabbro") {
    return <MobileGate><Fabbro token={token} onBack={() => setPagina("mainmenu")} /></MobileGate>;
  }

  if (pagina === "locanda") {
    return (
      <MobileGate>
        <LocandaPage
          onBack={() => setPagina("mainmenu")}
          onApriFormazione={enterFormazione}
        />
      </MobileGate>
    );
  }

  if (pagina === "formazione") {
    return (
      <MobileGate>
        <Formazione
          token={token}
          sfidante={qbSfidante}
          onAvvia={avviaPartita}
          onBack={() => setPagina("locanda")}
        />
      </MobileGate>
    );
  }

  if (pagina === "questboard") {
    return (
      <MobileGate>
        <QuestBoardGame
          inventario={qbInventario}
          formazione={qbFormazione}
          sfidante={qbSfidante}
          utente={utente}
          onBack={() => setPagina("locanda")}
        />
      </MobileGate>
    );
  }

  if (pagina === "gilda") {
    return (
      <MobileGate><div className="home-wrapper">
        <header className="topbar">
          <span className="topbar-brand">⚔ QUEST BOARD</span>
          <nav className="topbar-nav">
            <button className="nav-btn active" onClick={() => setPagina("mainmenu")}>← MENU</button>
          </nav>
          <div className="topbar-right">
            <span className="topbar-user">
              {isAdmin && <span className="badge-admin">ADMIN</span>}
              {utente.nome}
            </span>
            <button className="btn btn-danger" onClick={handleLogout}>ESCI</button>
          </div>
        </header>
        <main className="home-content">
          <h2 className="section-title">▸ MEMBRI DELLA GILDA</h2>
          <div className="utenti-list">
            {utenti.map(u => (
              <div className="utente-item" key={u.id}>
                <div className={`avatar ${u.ruolo === "admin" ? "avatar-admin" : ""}`}>
                  {u.nome[0]}{u.cognome?.[0] ?? ""}
                </div>
                <div className="utente-info">
                  <strong>{u.nome} {u.cognome}</strong>
                  <span>{u.email}</span>
                  {u.ruolo === "admin" && <span className="badge-admin">ADMIN</span>}
                </div>
                {isAdmin && u.id !== utente.id && (
                  <button className="btn-delete" onClick={() => handleDelete(u.id)} title="Rimuovi dalla gilda">✕</button>
                )}
              </div>
            ))}
          </div>
        </main>
      </div></MobileGate>
    );
  }

  return null;
}

export default App;
