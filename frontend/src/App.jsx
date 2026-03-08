import { useEffect, useState } from "react";
import Login from "./Login";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function App() {
  const [utente, setUtente] = useState(null);
  const [utenti, setUtenti] = useState([]);

  useEffect(() => {
    if (!utente) return;
    fetch(`${API_URL}/utenti`)
      .then((res) => res.json())
      .then((data) => setUtenti(data));
  }, [utente]);

  if (!utente) {
    return <Login onLogin={setUtente} />;
  }

  return (
    <div>
      <h1>Benvenuto, {utente.nome}!</h1>
      <ul>
        {utenti.map((u) => (
          <li key={u.id}>
            {u.nome} {u.cognome} — {u.email}
          </li>
        ))}
      </ul>
      <button onClick={() => setUtente(null)}>Logout</button>
    </div>
  );
}

export default App;
