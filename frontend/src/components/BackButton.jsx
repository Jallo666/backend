import backIcon from "../assets/icon/back.svg";
import "./BackButton.css";

/**
 * Bottone circolare "torna indietro" — usato in Locanda, Fabbro, ecc.
 * Props:
 *   onClick  — callback al click
 *   title    — tooltip (default "Torna indietro")
 *   absolute — se true, posizionato in assoluto top-left (come in Locanda)
 */
export default function BackButton({ onClick, title = "Torna indietro", absolute = false }) {
  return (
    <button
      className={`back-btn${absolute ? " back-btn--absolute" : ""}`}
      onClick={onClick}
      title={title}
    >
      <img src={backIcon} alt="Indietro" className="back-btn-icon" />
    </button>
  );
}
