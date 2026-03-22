import { useEffect, useState } from "react";
import "./MobileGate.css";

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement
  );
}

function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  return Promise.resolve();
}

export default function MobileGate({ children }) {
  const [mobile]     = useState(isMobile);
  const [portrait,   setPortrait]   = useState(isPortrait);
  const [fullscreen, setFullscreen] = useState(isFullscreen);

  useEffect(() => {
    if (!mobile) return;

    const onResize = () => {
      setPortrait(isPortrait());
      setFullscreen(isFullscreen());
    };
    const onFsChange = () => setFullscreen(isFullscreen());

    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, [mobile]);

  if (!mobile) return children;

  // Portrait → chiedi di ruotare
  if (portrait) {
    return (
      <div className="mg-overlay">
        <div className="mg-icon">📱</div>
        <div className="mg-arrow">↻</div>
        <p className="mg-title">Ruota il telefono</p>
        <p className="mg-sub">Metti il telefono in orizzontale per giocare</p>
      </div>
    );
  }

  // Landscape ma non fullscreen → chiedi di entrare in fullscreen
  if (!fullscreen) {
    return (
      <div className="mg-overlay" onClick={() => requestFullscreen()}>
        <div className="mg-icon">⛶</div>
        <p className="mg-title">Tocca per schermo intero</p>
        <p className="mg-sub">Nasconde la barra del browser per un'esperienza migliore</p>
        <div className="mg-btn">TOCCA OVUNQUE</div>
      </div>
    );
  }

  return children;
}
