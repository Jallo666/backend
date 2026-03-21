export default function LoginLoadingOverlay({ loading, dots }) {
  if (!loading) return null;
  return (
    <div className="loading-overlay">
      <span className="loading-sword">⚔</span>
      <p className="loading-label">AUTENTICAZIONE{dots}</p>
      <div className="loading-bar-wrap">
        <div className="loading-bar-fill" />
      </div>
      <p className="loading-sub">Verifica le credenziali{dots}</p>
    </div>
  );
}
