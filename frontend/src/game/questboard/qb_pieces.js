// ── Catalogo GESTA ────────────────────────────────────────────────────────────
export const GESTA_CATALOG = {
  dardo_fuoco: {
    id:    "dardo_fuoco",
    nome:  "Dardo di Fuoco",
    icona: "🔥",
    danno: 5,
    desc:  "Infligge 5 danni a un personaggio scelto nell'arena (amico o nemico).",
  },
};

export const GESTA_PER_NATURA = {
  Arcano: ["dardo_fuoco"],
};

export function gesteDiNatura(natura) {
  const ids = GESTA_PER_NATURA[natura] ?? [];
  return ids.map(id => GESTA_CATALOG[id]).filter(Boolean);
}

// ── Pezzi classici (template di riferimento) ─────────────────────────────────
// Ogni utente ne riceve una copia al momento della registrazione (via backend).
// id corrisponde al campo Nome nel backend (lowercase).

// Simboli scacchistici per tipo pezzo (override dell'icona API)
export const CHESS_ICONS = {
  guerriero:   "♞",   // cavallo  — combattente corpo a corpo
  arciere:     "♝",   // alfiere  — attacco a distanza diagonale
  scudiero:    "♜",   // torre    — difensore solido
  esploratore: "♟",   // pedone   — ricognitore veloce
  mago:        "♛",   // regina   — potere magico devastante
  campione:    "♚",   // re-forma — campione dell'esercito
};

export const CLASSIC_PIECES = [
  { id: "guerriero",   nome: "Guerriero",   icona: CHESS_ICONS.guerriero,   hp: 14, hpMax: 14, atk: 4, def: 3, mov: 2 },
  { id: "arciere",     nome: "Arciere",     icona: CHESS_ICONS.arciere,     hp: 8,  hpMax: 8,  atk: 6, def: 1, mov: 3 },
  { id: "scudiero",    nome: "Scudiero",    icona: CHESS_ICONS.scudiero,    hp: 18, hpMax: 18, atk: 2, def: 5, mov: 1 },
  { id: "esploratore", nome: "Esploratore", icona: CHESS_ICONS.esploratore, hp: 9,  hpMax: 9,  atk: 3, def: 2, mov: 4 },
  { id: "mago",        nome: "Mago",        icona: CHESS_ICONS.mago,        hp: 7,  hpMax: 7,  atk: 7, def: 1, mov: 2 },
  { id: "campione",    nome: "Campione",    icona: CHESS_ICONS.campione,    hp: 15, hpMax: 15, atk: 5, def: 4, mov: 2 },
];

// Colori per tipo pezzo (usati nell'UI)
export const PIECE_COLORS = {
  guerriero:   { bg: "#2a1a0e", border: "#8b5020", glow: "#c87030" },
  arciere:     { bg: "#0e1a0e", border: "#206020", glow: "#40c040" },
  scudiero:    { bg: "#0a0a2a", border: "#203880", glow: "#4060d0" },
  esploratore: { bg: "#1a1a0a", border: "#706020", glow: "#d0b030" },
  mago:        { bg: "#1a0a2a", border: "#602080", glow: "#a040e0" },
  campione:    { bg: "#2a1a0a", border: "#906020", glow: "#e0a030" },
};

// Natura per pezzi classici senza campo materiali (backward compat)
export const NATURA_DA_NOME = {
  "Guerriero":   "Guerriero",
  "Arciere":     "Arciere",
  "Scudiero":    "Baluardo",
  "Esploratore": "Ombra",
  "Mago":        "Arcano",
  "Campione":    "Sentinella",
};

export const NATURA_COLORE = {
  Guerriero: "#d04030",
  Arciere:   "#a0c040",
  Baluardo:  "#4080c0",
  Ombra:     "#9040c0",
  Arcano:    "#40b0d0",
  Sentinella:"#c0a030",
};

// Converte un pezzo dal formato backend al formato di gioco interno
export function fromApi(apiPiece) {
  const id = apiPiece.nome.toLowerCase().replace(/\s+/g, "_");
  const colors = PIECE_COLORS[id] ?? PIECE_COLORS["guerriero"];
  const natura = apiPiece.materiali ?? NATURA_DA_NOME[apiPiece.nome] ?? null;
  return {
    uid:   apiPiece.id,          // id univoco del pezzo dell'utente
    id,
    nome:  apiPiece.nome,
    icona: CHESS_ICONS[id] ?? apiPiece.icona,   // usa simbolo scacchistico se disponibile
    hp:    apiPiece.hp,
    hpMax: apiPiece.hpMax,
    atk:   apiPiece.atk,
    def:   apiPiece.def,
    mov:   apiPiece.mov,
    isClassico: apiPiece.isClassico,
    natura,
    gesta: gesteDiNatura(natura),
    ...colors,
  };
}
