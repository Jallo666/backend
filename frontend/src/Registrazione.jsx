import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function Registrazione({ onRegistrato, onVaiLogin }) {
  const [form, setForm] = useState({ nome: "", cognome: "", email: "", password: "" });
  const [errore, setErrore] = useState("");

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore("");
    const res = await fetch(`${API_URL}/registrati`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onRegistrato(await res.json());
    } else {
      const msg = await res.text();
      setErrore(msg || "Errore durante la registrazione");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="card">
          <h1>Crea account</h1>
          <p className="subtitle">Registrati per iniziare</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input placeholder="Nome" value={form.nome} onChange={set("nome")} required />
              <input placeholder="Cognome" value={form.cognome} onChange={set("cognome")} required />
              <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
              <input type="password" placeholder="Password" value={form.password} onChange={set("password")} required />
            </div>
            <button type="submit" className="btn btn-primary">Registrati</button>
            <button type="button" className="btn btn-secondary" onClick={onVaiLogin}>
              Hai già un account? Accedi
            </button>
            {errore && <p className="error">{errore}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Registrazione;
