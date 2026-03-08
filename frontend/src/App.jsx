import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function App() {
  const [utenti, setUtenti] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/utenti`)
      .then((res) => res.json())
      .then((data) => setUtenti(data));
  }, []);

  return (
    <div>
      <h1>Utenti</h1>
      <ul>
        {utenti.map((u) => (
          <li key={u.id}>
            {u.nome} {u.cognome} — {u.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
