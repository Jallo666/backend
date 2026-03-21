export default function LoginForm({
  email, password, ricordate, errore, loading,
  onEmail, onPassword, onRicordate,
  onSubmit, onVaiRegistrazione,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <input
          type="email"
          placeholder="✉ Email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="🔑 Password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          required
        />
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={ricordate}
          onChange={(e) => onRicordate(e.target.checked)}
        />
        <span>Rimani connesso</span>
      </label>

      <button type="submit" className="login-btn login-btn-enter" disabled={loading}>
        ▶ ENTRA
      </button>
      <button type="button" className="login-btn login-btn-register" onClick={onVaiRegistrazione} disabled={loading}>
        Crea nuovo personaggio
      </button>

      {errore && <p className="error">{errore}</p>}
    </form>
  );
}
