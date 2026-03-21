import "./FormMsg.css";

export default function FormMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="form-msg-overlay">
      <p className="form-msg-testo">{msg}</p>
    </div>
  );
}
