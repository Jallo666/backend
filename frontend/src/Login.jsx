import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function Login({ onLogin, onVaiRegistrazione }) {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [ricordate, setRicordate] = useState(false);
  const [errore, setErrore]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [dots, setDots]           = useState("");

  // Anima i puntini "..." durante il loading
  useEffect(() => {
    if (!loading) { setDots(""); return; }
    const id = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 420);
    return () => clearInterval(id);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        onLogin(await res.json(), ricordate);
      } else {
        setErrore("► Credenziali non valide");
      }
    } catch {
      setErrore("► Impossibile contattare il server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="game-title">⚔ QUEST BOARD ⚔</div>
        <p className="game-subtitle">─── Accedi al tuo account ───</p>
        <div className="card">

          {/* ── Overlay di loading ── */}
          {loading && (
            <div className="loading-overlay">
              <span className="loading-sword">⚔</span>
              <p className="loading-label">AUTENTICAZIONE{dots}</p>
              <div className="loading-bar-wrap">
                <div className="loading-bar-fill" />
              </div>
              <p className="loading-sub">Verifica le credenziali{dots}</p>
            </div>
          )}

          <h1>ACCESSO</h1>
          <p className="subtitle">Inserisci le credenziali dell'eroe</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="✉ Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="🔑 Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={ricordate}
                onChange={(e) => setRicordate(e.target.checked)}
              />
              <span>Rimani connesso</span>
            </label>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              ▶ ENTRA
            </button>
            <button type="button" className="btn btn-secondary" onClick={onVaiRegistrazione} disabled={loading}>
              Crea nuovo personaggio
            </button>
            {errore && <p className="error">{errore}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
