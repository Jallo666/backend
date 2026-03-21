import logo from "../assets/questboard_logo.svg";

export default function LoginLogo() {
  return (
    <div className="login-logo-wrap">
      <img src={logo} alt="Quest Board" className="login-logo" />
      <p className="login-subtitle">Accedi al tuo account</p>
    </div>
  );
}
