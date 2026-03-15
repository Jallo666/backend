// Silhouette scacchistiche stile Staunton — effetto 3D avanzato
// Tecnica: currentColor come base + 4 layer gradient sovrapposti:
//   1. diffuse  – gradiente ambientale (chiaro in alto, scuro in basso)
//   2. specular – spot luminoso piccolo dove colpisce la luce diretta
//   3. side     – curvatura laterale (sinistra chiara, destra scura)
//   4. ao       – ambient occlusion ai giunti stretti

const DEFS = (
  <defs>
    {/* Diffuse: luce dall'alto-sinistra */}
    <linearGradient id="g-diff" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%"   stopColor="white" stopOpacity="0.45"/>
      <stop offset="35%"  stopColor="white" stopOpacity="0.1"/>
      <stop offset="100%" stopColor="black" stopOpacity="0.5"/>
    </linearGradient>

    {/* Specular: riflesso brillante in alto a sinistra */}
    <radialGradient id="g-spec" cx="32%" cy="22%" r="38%">
      <stop offset="0%"   stopColor="white" stopOpacity="0.85"/>
      <stop offset="40%"  stopColor="white" stopOpacity="0.25"/>
      <stop offset="100%" stopColor="white" stopOpacity="0"/>
    </radialGradient>

    {/* Side: simulazione superficie curva tornita */}
    <linearGradient id="g-side" x1="0" y1="0.5" x2="1" y2="0.5">
      <stop offset="0%"   stopColor="white" stopOpacity="0.28"/>
      <stop offset="25%"  stopColor="white" stopOpacity="0"/>
      <stop offset="75%"  stopColor="black" stopOpacity="0"/>
      <stop offset="100%" stopColor="black" stopOpacity="0.32"/>
    </linearGradient>

    {/* Ambient occlusion: ombra scura ai giunti */}
    <linearGradient id="g-ao" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor="black" stopOpacity="0.0"/>
      <stop offset="100%" stopColor="black" stopOpacity="0.65"/>
    </linearGradient>

    {/* Ombra sotto il piede */}
    <radialGradient id="g-floor" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="black" stopOpacity="0.55"/>
      <stop offset="100%" stopColor="black" stopOpacity="0"/>
    </radialGradient>
  </defs>
);

// Applica tutti i layer 3D sopra le forme
function Lit({ children, stroke = true }) {
  return (
    <>
      {/* 1. base colore */}
      <g fill="currentColor"
         stroke={stroke ? "currentColor" : "none"}
         strokeWidth="0.6" strokeOpacity="0.5"
         paintOrder="stroke">
        {children}
      </g>
      {/* 2. diffuse */}
      <g fill="url(#g-diff)" pointerEvents="none">{children}</g>
      {/* 3. side curvature */}
      <g fill="url(#g-side)" pointerEvents="none">{children}</g>
      {/* 4. specular */}
      <g fill="url(#g-spec)" pointerEvents="none">{children}</g>
      {/* 5. ao piede */}
      <g fill="url(#g-ao)" opacity="0.55" pointerEvents="none">{children}</g>
    </>
  );
}

// Piccola ellissi specular sopra la testa di pezzi con sfera
function HeadSpec({ cx, cy, r }) {
  return (
    <ellipse cx={cx - r * 0.2} cy={cy - r * 0.3} rx={r * 0.5} ry={r * 0.35}
      fill="white" opacity="0.55" pointerEvents="none"/>
  );
}

// ── PEDONE (Esploratore) ──────────────────────────────────────────────────────
function Pawn({ size }) {
  return (
    <svg viewBox="0 0 60 90" width={size} height={size} fill="none"
         style={{ display: "block", overflow: "visible" }}>
      {DEFS}
      <ellipse cx="30" cy="90" rx="20" ry="3.5" fill="url(#g-floor)" opacity="0.7"/>
      <Lit>
        {/* sfera testa */}
        <circle cx="30" cy="20" r="13"/>
        {/* collo — stretto, AO visibile */}
        <path d="M24.5,33 C23,38 22.5,44 23.5,49 L36.5,49 C37.5,44 37,38 35.5,33 Z"/>
        {/* corpo */}
        <path d="M21,49 C17,56 13.5,63 11,70 L49,70 C46.5,63 43,56 39,49 Z"/>
        {/* collare */}
        <rect x="9" y="70" width="42" height="7" rx="3"/>
        {/* piede */}
        <rect x="5" y="77" width="50" height="11" rx="4.5"/>
      </Lit>
      <HeadSpec cx={30} cy={20} r={13}/>
    </svg>
  );
}

// ── TORRE (Scudiero) ──────────────────────────────────────────────────────────
function Rook({ size }) {
  return (
    <svg viewBox="0 0 60 90" width={size} height={size} fill="none"
         style={{ display: "block", overflow: "visible" }}>
      {DEFS}
      <ellipse cx="30" cy="90" rx="24" ry="3.5" fill="url(#g-floor)" opacity="0.7"/>
      <Lit>
        {/* merlature sx / centro / dx */}
        <rect x="5"  y="7"  width="14" height="23" rx="2"/>
        <rect x="23" y="7"  width="14" height="23" rx="2"/>
        <rect x="41" y="7"  width="14" height="23" rx="2"/>
        {/* connettore merlature */}
        <rect x="5" y="23" width="50" height="8"/>
        {/* corpo */}
        <path d="M10,31 L8,69 L52,69 L50,31 Z"/>
        {/* collare */}
        <rect x="7" y="69" width="46" height="7" rx="2.5"/>
        {/* piede */}
        <rect x="3" y="76" width="54" height="12" rx="4.5"/>
      </Lit>
    </svg>
  );
}

// ── ALFIERE (Arciere) ─────────────────────────────────────────────────────────
function Bishop({ size }) {
  return (
    <svg viewBox="0 0 60 90" width={size} height={size} fill="none"
         style={{ display: "block", overflow: "visible" }}>
      {DEFS}
      <ellipse cx="30" cy="90" rx="22" ry="3.5" fill="url(#g-floor)" opacity="0.7"/>
      <Lit>
        {/* globetto apicale */}
        <circle cx="30" cy="9" r="7.5"/>
        {/* mitra — corpo principale */}
        <path d="M30,1.5 L13,55 L47,55 Z"/>
        {/* tacca della mitra (scanalatura) */}
        <path d="M21,46 C23,51 23,55 23,57 L37,57 C37,55 37,51 39,46 Z" fill="rgba(0,0,0,0.25)"/>
        {/* collare mitra */}
        <rect x="11" y="55" width="38" height="8.5" rx="2.5"/>
        {/* corpo */}
        <path d="M16,63.5 C12,70 9.5,75 8,81 L52,81 C50.5,75 48,70 44,63.5 Z"/>
        {/* collare basso */}
        <rect x="6" y="81" width="48" height="7" rx="2.5"/>
        {/* piede */}
        <rect x="3" y="88" width="54" height="0" rx="4"/>
      </Lit>
      <HeadSpec cx={30} cy={9} r={7.5}/>
    </svg>
  );
}

// ── CAVALLO (Guerriero) ───────────────────────────────────────────────────────
function Knight({ size }) {
  return (
    <svg viewBox="0 0 60 90" width={size} height={size} fill="none"
         style={{ display: "block", overflow: "visible" }}>
      {DEFS}
      <ellipse cx="30" cy="90" rx="24" ry="3.5" fill="url(#g-floor)" opacity="0.7"/>
      <Lit>
        {/* silhouette testa + collo cavallo */}
        <path d="
          M28,3
          C20,3 14,8 12,16
          C10,22 12,30 17,35
          L13,40 L18,42
          C15,47 14,53 15,58
          L45,58
          C46,53 45,47 42,42
          L47,40 L43,35
          C48,30 50,22 48,16
          C46,8 40,3 32,3 Z
        "/>
        {/* orecchio */}
        <path d="M27,4 L22,0 L16,7 L23,10 Z"/>
        {/* criniera sinistra */}
        <path d="M20,8 C16,10 13,15 14,20 C17,18 20,14 22,10 Z" opacity="0.6"/>
        {/* narice */}
        <ellipse cx="43" cy="23" rx="4" ry="2.8" fill="rgba(0,0,0,0.4)"/>
        {/* occhio */}
        <circle cx="37" cy="14" r="2.5" fill="rgba(0,0,0,0.5)"/>
        <circle cx="36.2" cy="13.2" r="0.8" fill="rgba(255,255,255,0.6)"/>
        {/* collare */}
        <rect x="11" y="58" width="38" height="7.5" rx="2.5"/>
        {/* base */}
        <rect x="7"  y="65" width="46" height="7"   rx="2.5"/>
        {/* piede */}
        <rect x="3"  y="72" width="54" height="12"  rx="4.5"/>
      </Lit>
    </svg>
  );
}

// ── REGINA (Mago) ─────────────────────────────────────────────────────────────
function Queen({ size }) {
  return (
    <svg viewBox="0 0 60 90" width={size} height={size} fill="none"
         style={{ display: "block", overflow: "visible" }}>
      {DEFS}
      <ellipse cx="30" cy="90" rx="26" ry="3.5" fill="url(#g-floor)" opacity="0.7"/>
      <Lit>
        {/* globetto centrale */}
        <circle cx="30" cy="7"  r="6.5"/>
        {/* globetti corona laterali */}
        <circle cx="9"  cy="15" r="5.5"/>
        <circle cx="51" cy="15" r="5.5"/>
        {/* corpo corona a V */}
        <path d="M4,19 L9,46 L51,46 L56,19 L51,19 L43,38 L30,12 L17,38 L9,19 Z"/>
        {/* corpo */}
        <path d="M7,46 C4,56 3,64 2,72 L58,72 C57,64 56,56 53,46 Z"/>
        {/* collare */}
        <rect x="3"  y="72" width="54" height="7"  rx="2.5"/>
        {/* piede */}
        <rect x="0"  y="79" width="60" height="11" rx="4.5"/>
      </Lit>
      <HeadSpec cx={30} cy={7} r={6.5}/>
      <HeadSpec cx={9}  cy={15} r={5.5}/>
      <HeadSpec cx={51} cy={15} r={5.5}/>
    </svg>
  );
}

// ── RE (Campione) ─────────────────────────────────────────────────────────────
function King({ size }) {
  return (
    <svg viewBox="0 0 60 90" width={size} height={size} fill="none"
         style={{ display: "block", overflow: "visible" }}>
      {DEFS}
      <ellipse cx="30" cy="90" rx="26" ry="3.5" fill="url(#g-floor)" opacity="0.7"/>
      <Lit>
        {/* croce verticale */}
        <rect x="27.5" y="2"  width="5"   height="20" rx="2"/>
        {/* croce orizzontale */}
        <rect x="19"   y="7"  width="22"  height="5.5" rx="2"/>
        {/* corona — denti a zig-zag */}
        <path d="M6,24 L11,48 L49,48 L54,24 L49,24 L41,40 L30,22 L19,40 L11,24 Z"/>
        {/* corpo */}
        <path d="M9,48 C6,58 4,66 3,74 L57,74 C56,66 54,58 51,48 Z"/>
        {/* collare */}
        <rect x="3"  y="74" width="54" height="7"  rx="2.5"/>
        {/* piede */}
        <rect x="0"  y="81" width="60" height="11" rx="4.5"/>
      </Lit>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const MAP = {
  assassino:   Pawn,
  cavaliere:   Knight,
  scudiero:    Rook,
  ranger:      Bishop,
  mago:        Queen,
  campione:    King,
};

export function PieceSVG({ id, size = 60 }) {
  const Comp = MAP[id] ?? Pawn;
  return <Comp size={size} />;
}
