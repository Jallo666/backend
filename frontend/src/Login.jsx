import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function Login({ onLogin, onVaiRegistrazione }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore("");
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        onLogin(await res.json());
      } else {
        setErrore("Email o password non validi");
      }
    } catch {
      setErrore("Impossibile contattare il server");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="card">
          <h1>Bentornato</h1>
          <p className="subtitle">Accedi al tuo account</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Accedi</button>
            <button type="button" className="btn btn-secondary" onClick={onVaiRegistrazione}>
              Crea un account
            </button>
            {errore && <p className="error">{errore}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
