import "./DungeonArch.css";

export default function DungeonArch() {
  return (
    <svg
      className="dungeon-arch"
      viewBox="0 0 260 180"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="archInner" cx="50%" cy="85%" r="55%">
          <stop offset="0%" stopColor="#3a0860" stopOpacity="0.8" />
          <stop offset="55%" stopColor="#180428" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050010" stopOpacity="1" />
        </radialGradient>

        <radialGradient id="archGlow" cx="50%" cy="90%" r="50%">
          <stop offset="0%" stopColor="#8830c0" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#050010" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Apertura dungeon */}
      <path
        d="M 62,180 L 62,92 Q 62,32 130,32 Q 198,32 198,92 L 198,180 Z"
        fill="url(#archInner)"
      />

      {/* Muri sinistra */}
      {[0,1,2,3,4,5,6,7].map(r => (
        <g key={`l${r}`}>
          <rect
            x={r % 2 === 0 ? 4 : 8}
            y={28 + r * 19}
            width={r % 2 === 0 ? 56 : 52}
            height={18}
            rx={1.5}
            fill={r % 2 === 0 ? "#26203a" : "#1f1a2e"}
            stroke="#0e0b1a"
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Muri destra */}
      {[0,1,2,3,4,5,6,7].map(r => (
        <g key={`r${r}`}>
          <rect
            x={r % 2 === 0 ? 200 : 204}
            y={28 + r * 19}
            width={r % 2 === 0 ? 56 : 52}
            height={18}
            rx={1.5}
            fill={r % 2 === 0 ? "#26203a" : "#1f1a2e"}
            stroke="#0e0b1a"
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Glow */}
      <path
        d="M 62,180 L 62,92 Q 62,32 130,32 Q 198,32 198,92 L 198,180 Z"
        fill="url(#archGlow)"
      />

      {/* Pavimento */}
      <rect
        x="62"
        y="163"
        width="136"
        height="17"
        rx={2}
        fill="#030008"
        opacity={0.65}
      />
    </svg>
  );
}