import { useState, useEffect } from "react";
import "./Login.css";
import LoginBackground from "./LoginBackground";
import LoginLogo from "./LoginLogo";
import LoginCard from "./LoginCard";
import LoginForm from "./LoginForm";
import LoginLoadingOverlay from "./LoginLoadingOverlay";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function Login({ onLogin, onVaiRegistrazione }) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [ricordate, setRicordate] = useState(false);
  const [errore,    setErrore]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [dots,      setDots]      = useState("");

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
    <LoginBackground>
      <div className="login-content">
        <LoginLogo />
        <LoginCard>
          <LoginLoadingOverlay loading={loading} dots={dots} />
          <LoginForm
            email={email}
            password={password}
            ricordate={ricordate}
            errore={errore}
            loading={loading}
            onEmail={setEmail}
            onPassword={setPassword}
            onRicordate={setRicordate}
            onSubmit={handleSubmit}
            onVaiRegistrazione={onVaiRegistrazione}
          />
        </LoginCard>
      </div>
    </LoginBackground>
  );
}
