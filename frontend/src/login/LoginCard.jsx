export default function LoginCard({ children }) {
  return (
    <div className="login-box">
      <div className="login-title">ACCESSO</div>
      <p className="login-card-sub">Inserisci le credenziali dell&apos;eroe</p>
      {children}
    </div>
  );
}
