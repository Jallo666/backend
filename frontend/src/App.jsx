import { useEffect, useState } from "react";
import Login from "./Login";
import Registrazione from "./Registrazione";
import Gioco from "./Gioco";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const SESSION_KEY = "qb_session";

// Decodifica il payload del JWT e controlla se è ancora valido
function jwtValid(token) {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function App() {
  const [utente, setUtente]   = useState(null);
  const [token, setToken]     = useState(null);
  const [utenti, setUtenti]   = useState([]);
  const [pagina, setPagina]   = useState("login");
  const [tab, setTab]         = useState("utenti");
  const [checking, setChecking] = useState(true); // controlla localStorage al mount

  // Ripristina sessione salvata
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const { token: savedToken, ...savedUser } = JSON.parse(raw);
        if (savedToken && jwtValid(savedToken)) {
          setToken(savedToken);
          setUtente(savedUser);
        } else {
          localStorage.removeItem(SESSION_KEY); // token scaduto
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
    if (ricordate) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ token, ...userData }));
    }
  };

  const handleLogout = () => {
    setUtente(null);
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const caricaUtenti = (tok) => {
    fetch(`${API_URL}/utenti`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then((res) => {
        if (res.status === 401) { handleLogout(); return null; }
        return res.json();
      })
      .then((data) => { if (data) setUtenti(data); });
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
    setUtenti((prev) => prev.filter((u) => u.id !== id));
  };

  // Schermata di verifica sessione (brevissima)
  if (checking) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "100vh", gap: "1.5rem",
      }}>
        <span style={{ fontSize: "2.5rem", animation: "rpgSpin 1s steps(8,end) infinite" }}>⚔</span>
        <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.55rem",
                    color: "#f0c040", letterSpacing: "0.08em" }}>
          CARICAMENTO...
        </p>
        <style>{`@keyframes rpgSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!utente) {
    if (pagina === "registrazione") {
      return (
        <Registrazione
          onRegistrato={(data) => handleAuth(data, false)}
          onVaiLogin={() => setPagina("login")}
        />
      );
    }
    return (
      <Login
        onLogin={handleAuth}
        onVaiRegistrazione={() => setPagina("registrazione")}
      />
    );
  }

  const isAdmin = utente.ruolo === "admin";

  return (
    <div className="home-wrapper">
      <header className="topbar">
        <span className="topbar-brand">⚔ QUEST BOARD</span>

        <nav className="topbar-nav">
          <button
            className={`nav-btn ${tab === "utenti" ? "active" : ""}`}
            onClick={() => setTab("utenti")}
          >
            [ GILDA ]
          </button>
          <button
            className={`nav-btn ${tab === "gioca" ? "active" : ""}`}
            onClick={() => setTab("gioca")}
          >
            [ GIOCA ]
          </button>
        </nav>

        <div className="topbar-right">
          <span className="topbar-user">
            {isAdmin && <span className="badge-admin">ADMIN</span>}
            {utente.nome}
          </span>
          <button className="btn btn-danger" onClick={handleLogout}>
            ESCI
          </button>
        </div>
      </header>

      <main className="home-content">
        {tab === "utenti" && (
          <>
            <h2 className="section-title">▸ MEMBRI DELLA GILDA</h2>
            <div className="utenti-list">
              {utenti.map((u) => (
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
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(u.id)}
                      title="Rimuovi dalla gilda"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "gioca" && <Gioco />}
      </main>
    </div>
  );
}

export default App;
