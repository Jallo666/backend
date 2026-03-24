import settingsIcon from "../assets/icon/settings.svg";
import "./BackButton.css";

/**
 * Bottone circolare "impostazioni" — stessa forma e stile del BackButton.
 * Props:
 *   onClick   — callback al click
 *   absolute  — se true, posizionato in assoluto top-left (come BackButton in Locanda)
 */
export default function SettingsButton({ onClick, absolute = false }) {
  return (
    <button
      className={`back-btn${absolute ? " back-btn--absolute" : ""}`}
      onClick={onClick}
      title="Opzioni"
    >
      <img src={settingsIcon} alt="Opzioni" className="back-btn-icon" />
    </button>
  );
}
