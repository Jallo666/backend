import { useEffect, useState } from "react";
import Login from "./Login";
import Registrazione from "./Registrazione";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function App() {
  const [utente, setUtente] = useState(null);
  const [utenti, setUtenti] = useState([]);
  const [pagina, setPagina] = useState("login");

  useEffect(() => {
    if (!utente) return;
    fetch(`${API_URL}/utenti`)
      .then((res) => res.json())
      .then(setUtenti);
  }, [utente]);

  if (!utente) {
    if (pagina === "registrazione") {
      return (
        <Registrazione
          onRegistrato={setUtente}
          onVaiLogin={() => setPagina("login")}
        />
      );
    }
    return (
      <Login
        onLogin={setUtente}
        onVaiRegistrazione={() => setPagina("registrazione")}
      />
    );
  }

  return (
    <div className="home-container">
      <div className="topbar">
        <h1>Ciao, {utente.nome}!</h1>
        <button className="btn btn-danger" onClick={() => setUtente(null)}>
          Logout
        </button>
      </div>

      <div className="utenti-list">
        {utenti.map((u) => (
          <div className="utente-item" key={u.id}>
            <div className="avatar">{u.nome[0]}{u.cognome[0]}</div>
            <div className="utente-info">
              <strong>{u.nome} {u.cognome}</strong>
              <span>{u.email}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
