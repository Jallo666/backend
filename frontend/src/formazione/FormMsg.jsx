import { useState, useEffect } from "react";
import "./FormMsg.css";

export default function FormMsg({ msg }) {
  const [visible, setVisible] = useState(false);
  const [hiding,  setHiding]  = useState(false);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    if (!msg) return;
    setCurrent(msg);
    setHiding(false);
    setVisible(true);

    const hideTimer = setTimeout(() => setHiding(true), 4000);
    const removeTimer = setTimeout(() => { setVisible(false); setHiding(false); }, 4600);

    return () => { clearTimeout(hideTimer); clearTimeout(removeTimer); };
  }, [msg]);

  if (!visible) return null;

  return (
    <div className="form-msg-overlay">
      <p className={`form-msg-testo${hiding ? " form-msg-testo--hiding" : ""}`}>{current}</p>
    </div>
  );
}
