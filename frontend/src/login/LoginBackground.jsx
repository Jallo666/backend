import { useEffect, useRef } from "react";

export default function LoginBackground({ children }) {
  const starsRef = useRef(null);

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    const count = window.innerWidth <= 700 || window.innerHeight <= 500 ? 40 : 60;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("div");
      s.className = "login-star";
      s.style.left = Math.random() * 100 + "%";
      s.style.top  = Math.random() * 100 + "%";
      const sz = 1 + Math.random() * 2;
      s.style.width  = sz + "px";
      s.style.height = sz + "px";
      s.style.animationDelay    = (Math.random() * 5) + "s";
      s.style.animationDuration = (2 + Math.random() * 4) + "s";
      container.appendChild(s);
    }
    return () => { if (container) container.innerHTML = ""; };
  }, []);

  return (
    <div className="login-root">
      <div className="login-stars" ref={starsRef} />
      {children}
    </div>
  );
}
