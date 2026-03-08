import { useEffect, useState } from "react";
import Login from "./Login";
import Registrazione from "./Registrazione";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function App() {
  const [utente, setUtente] = useState(null);
  const [token, setToken] = useState(null);
  const [utenti, setUtenti] = useState([]);
  const [pagina, setPagina] = useState("login");

  const handleAuth = (data) => {
    const { token, ...userData } = data;
    setToken(token);
    setUtente(userData);
  };

  const caricaUtenti = (tok) => {
    fetch(`${API_URL}/utenti`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then((res) => res.json())
      .then(setUtenti);
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

  if (!utente) {
    if (pagina === "registrazione") {
      return (
        <Registrazione
          onRegistrato={handleAuth}
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
    <div className="home-container">
      <div className="topbar">
        <div>
          <h1>Ciao, {utente.nome}!</h1>
          {isAdmin && <span className="badge-admin">Admin</span>}
        </div>
        <button className="btn btn-danger" onClick={() => { setUtente(null); setToken(null); }}>
          Logout
        </button>
      </div>

      <div className="utenti-list">
        {utenti.map((u) => (
          <div className="utente-item" key={u.id}>
            <div className={`avatar ${u.ruolo === "admin" ? "avatar-admin" : ""}`}>
              {u.nome[0]}{u.cognome[0] ?? ""}
            </div>
            <div className="utente-info">
              <strong>{u.nome} {u.cognome}</strong>
              <span>{u.email}</span>
            </div>
            {isAdmin && u.id !== utente.id && (
              <button
                className="btn-delete"
                onClick={() => handleDelete(u.id)}
                title="Elimina utente"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
