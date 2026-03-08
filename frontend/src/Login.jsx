import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore("");

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const utente = await res.json();
      onLogin(utente);
    } else {
      setErrore("Credenziali non valide");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Accedi</button>
        {errore && <p>{errore}</p>}
      </form>
    </div>
  );
}

export default Login;
