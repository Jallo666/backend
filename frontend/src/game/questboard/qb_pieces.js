// ── Catalogo AURA ────────────────────────────────────────────────────────────
export const AURA_CATALOG = {
  difesa_possente: {
    id:    "difesa_possente",
    nome:  "Difesa Possente",
    icona: "🛡",
    desc:  "I danni subiti sono sempre dimezzati, qualunque sia la fonte.",
  },
  attacco_furtivo: {
    id:    "attacco_furtivo",
    nome:  "Attacco Furtivo",
    icona: "🗡",
    desc:  "Gli attacchi fisici ignorano completamente la DEF del bersaglio.",
  },
  ira: {
    id:    "ira",
    nome:  "Ira",
    icona: "🔴",
    desc:  "I danni inflitti negli attacchi fisici sono sempre raddoppiati.",
  },
  forza_del_popolo: {
    id:    "forza_del_popolo",
    nome:  "Forza del Popolo",
    icona: "👑",
    desc:  "Gli HP massimi aumentano di 2 per ogni alleato in vita. Se un alleato cade, il Re perde 2 HP massimi.",
  },
  non_morto: {
    id:    "non_morto",
    nome:  "Non Morto",
    icona: "💀",
    desc:  "È non morto.",
  },
};

const AURA_PER_NATURA = {
  Baluardo:  ["difesa_possente"],
  Ombra:     ["attacco_furtivo"],
  Selvaggio: ["ira"],
};

export function auraDiNatura(natura) {
  const ids = AURA_PER_NATURA[natura] ?? [];
  return ids.map(id => AURA_CATALOG[id]).filter(Boolean);
}

// ── Catalogo ARDORE ───────────────────────────────────────────────────────────
export const ARDORE_CATALOG = {
  tiro_precisione: {
    id:      "tiro_precisione",
    nome:    "Tiro di Precisione",
    icona:   "🎯",
    danno:   3,
    isArdore: true,
    desc:    "Azione bonus: scegli un bersaglio e infliggi 3 danni diretti.",
  },
  carica: {
    id:      "carica",
    nome:    "Carica",
    icona:   "⚡",
    tipo:    "movimento",
    celle:   1,
    isArdore: true,
    desc:    "Azione bonus: scatta di 1 cella verso il nemico senza consumare il turno.",
  },
  preghiera_curativa: {
    id:      "preghiera_curativa",
    nome:    "Preghiera Curativa",
    icona:   "✨",
    tipo:    "cura",
    cura:    3,
    isArdore: true,
    desc:    "Azione bonus: cura 3 HP a qualsiasi pedina (alleata o nemica).",
  },
  ricomponimento: {
    id:       "ricomponimento",
    nome:     "Ricomponimento",
    icona:    "🦴",
    tipo:     "cura",
    cura:     3,
    selfOnly: true,
    isArdore: true,
    desc:     "Si ricompone, recuperando 3 HP.",
  },
};

const ARDORE_PER_NATURA = {
  Arciere:   ["tiro_precisione"],
  Guerriero: ["carica"],
  Sacerdote: ["preghiera_curativa"],
};

export function ardoreDiNatura(natura) {
  const ids = ARDORE_PER_NATURA[natura] ?? [];
  return ids.map(id => ARDORE_CATALOG[id]).filter(Boolean);
}

// ── Catalogo GESTA ────────────────────────────────────────────────────────────
export const GESTA_CATALOG = {
  dardo_fuoco: {
    id:    "dardo_fuoco",
    nome:  "Dardo di Fuoco",
    icona: "🔥",
    danno: 5,
    desc:  "Infligge 5 danni a un personaggio scelto nell'arena (amico o nemico).",
  },
  morso: {
    id:           "morso",
    nome:         "Morso",
    icona:        "🐺",
    danno:        0,          // dinamico: ATK del caster
    effect:       "immobilize",
    adjacentOnly: true,
    desc:         "Solo pedine adiacenti. Azzanna il bersaglio: infligge danno pari al proprio ATK e riduce il suo MOV a 0 finché non termina il prossimo turno.",
  },
  scagliare: {
    id:    "scagliare",
    nome:  "Scagliare",
    icona: "💨",
    danno: 0, // dinamico: floor(ATK/2) × distanza Chebyshev dal campione
    desc:  "Lancia una pedina adiacente in una cella libera entro 2 celle. Infligge ATK/2 × distanza ai nemici (gli alleati vengono solo riposizionati).",
  },
  drenaggio_vitale: {
    id:     "drenaggio_vitale",
    nome:   "Drenaggio Vitale",
    icona:  "🩸",
    danno:  0,          // dinamico: ATK del caster
    effect: "drain",
    desc:   "Infligge danni pari al proprio ATK e si cura degli stessi HP.",
  },
};

export const GESTA_PER_NATURA = {
  Arcano:    ["dardo_fuoco"],
  Sentinella: ["scagliare"],
  Selvaggio: ["morso"],
};

export function gesteDiNatura(natura) {
  const ids = GESTA_PER_NATURA[natura] ?? [];
  return ids.map(id => GESTA_CATALOG[id]).filter(Boolean);
}

// ── Override abilità per ricetta id ──────────────────────────────────────────
// Usato quando due pezzi con la stessa natura devono avere abilità diverse.
const ABILITY_OVERRIDES = {
  barbaro: { gesta: [],                   ardore: [], aura: ["ira"]       },
  lupo:    { gesta: ["morso"],            ardore: [], aura: []            },
  lich:           { gesta: ["drenaggio_vitale"], ardore: [],                aura: ["non_morto"] },
  guerriero_ossa: { gesta: [],                  ardore: ["ricomponimento"], aura: ["non_morto"] },
};

export function abilitaPerPezzo(id, natura) {
  const ov = ABILITY_OVERRIDES[id];
  if (ov) {
    return {
      gesta:  ov.gesta.map(x  => GESTA_CATALOG[x]).filter(Boolean),
      ardore: ov.ardore.map(x => ARDORE_CATALOG[x]).filter(Boolean),
      aura:   ov.aura.map(x   => AURA_CATALOG[x]).filter(Boolean),
    };
  }
  return {
    gesta:  gesteDiNatura(natura),
    ardore: ardoreDiNatura(natura),
    aura:   auraDiNatura(natura),
  };
}

// ── Pezzi classici (template di riferimento) ─────────────────────────────────
// Ogni utente ne riceve una copia al momento della registrazione (via backend).
// id corrisponde al campo Nome nel backend (lowercase).

// Simboli scacchistici per tipo pezzo (override dell'icona API)
export const CHESS_ICONS = {
  cavaliere:   "♞",   // cavallo  — combattente corpo a corpo
  ranger:      "♝",   // alfiere  — attacco a distanza diagonale
  scudiero:    "♜",   // torre    — difensore solido
  assassino:   "♟",   // pedone   — ombra letale
  mago:        "♛",   // regina   — potere magico devastante
  campione:    "♚",   // re-forma — campione dell'esercito
  chierico:    "✚",   // croce    — guaritore devoto
  barbaro:     "⚔",   // spade    — guerriero selvaggio
  lupo:        "🐺",  // bestia   — lupo da caccia
  lich:        "💀",  // teschio  — arcimago non morto
};

export const CLASSIC_PIECES = [
  { id: "cavaliere",   nome: "Cavaliere",   icona: CHESS_ICONS.cavaliere,   hp: 14, hpMax: 14, atk: 4, def: 3, mov: 2 },
  { id: "ranger",      nome: "Ranger",      icona: CHESS_ICONS.ranger,      hp: 8,  hpMax: 8,  atk: 6, def: 1, mov: 3 },
  { id: "scudiero",    nome: "Scudiero",    icona: CHESS_ICONS.scudiero,    hp: 18, hpMax: 18, atk: 2, def: 5, mov: 1 },
  { id: "assassino",   nome: "Assassino",   icona: CHESS_ICONS.assassino,   hp: 9,  hpMax: 9,  atk: 3, def: 2, mov: 4 },
  { id: "mago",        nome: "Mago",        icona: CHESS_ICONS.mago,        hp: 7,  hpMax: 7,  atk: 7, def: 1, mov: 2 },
  { id: "campione",    nome: "Campione",    icona: CHESS_ICONS.campione,    hp: 15, hpMax: 15, atk: 5, def: 4, mov: 2 },
];

// Colori per tipo pezzo (usati nell'UI)
export const PIECE_COLORS = {
  cavaliere:   { bg: "#2a1a0e", border: "#8b5020", glow: "#c87030" },
  ranger:      { bg: "#0e1a0e", border: "#206020", glow: "#40c040" },
  scudiero:    { bg: "#0a0a2a", border: "#203880", glow: "#4060d0" },
  assassino:   { bg: "#1a1a0a", border: "#706020", glow: "#d0b030" },
  mago:        { bg: "#1a0a2a", border: "#602080", glow: "#a040e0" },
  campione:    { bg: "#2a1a0a", border: "#906020", glow: "#e0a030" },
  lich:           { bg: "#1a0a2a", border: "#5a2080", glow: "#9030c0" },
  guerriero_ossa: { bg: "#1a1408", border: "#7a6020", glow: "#c0a030" },
};

// Natura per pezzi classici senza campo materiali (backward compat)
export const NATURA_DA_NOME = {
  "Cavaliere":   "Guerriero",
  "Ranger":      "Arciere",
  "Scudiero":    "Baluardo",
  "Assassino":   "Ombra",
  "Mago":        "Arcano",
  "Campione":    "Sentinella",
  // backward compat per dati DB pre-rename
  "Guerriero":   "Guerriero",
  "Arciere":     "Arciere",
  "Chierico":    "Sacerdote",
  "Barbaro":     "Selvaggio",
  "Lupo":        "Selvaggio",
  "Lich":           "Non Morto",
  "Guerriero D'Ossa": "Sentinella",
};

export const NATURA_COLORE = {
  Guerriero:   "#d04030",
  Arciere:     "#a0c040",
  Baluardo:    "#4080c0",
  Ombra:       "#9040c0",
  Arcano:      "#40b0d0",
  Sentinella:  "#c0a030",
  Sacerdote:   "#a0d0ff",
  Selvaggio:   "#e06020",
  "Non Morto": "#7030a0",
};

// ── Livelli ricetta ──────────────────────────────────────────────────────────
// Il livello è determinato dalla ricetta. Default 1 per tutti, 2+ per pezzi avanzati.
export const LIVELLO_PER_RICETTA = {
  lich:           2,
  guerriero_ossa: 2,
};

export function livelloPerRicetta(id) {
  return LIVELLO_PER_RICETTA[id] ?? 1;
}

// Converte un pezzo dal formato backend al formato di gioco interno
export function fromApi(apiPiece) {
  const id = apiPiece.ricettaId ?? apiPiece.nome.toLowerCase().replace(/\s+/g, "_");
  const colors = PIECE_COLORS[id] ?? PIECE_COLORS["guerriero"];
  const natura = apiPiece.materiali ?? NATURA_DA_NOME[apiPiece.nome] ?? null;
  return {
    uid:      apiPiece.id,
    id,
    nome:     apiPiece.nomeCustom ?? apiPiece.nome,   // display: custom se presente
    nomeBase: apiPiece.nome,                           // tipo originale (per colori, icone…)
    icona:    CHESS_ICONS[id] ?? apiPiece.icona,
    hp:    apiPiece.hp,
    hpMax: apiPiece.hpMax,
    atk:   apiPiece.atk,
    def:   apiPiece.def,
    mov:   apiPiece.mov,
    isClassico: apiPiece.isClassico,
    natura,
    razza:     apiPiece.razza     ?? "Umanoide",
    materiale: apiPiece.materiale ?? "Legno",
    ricettaId: apiPiece.ricettaId ?? null,
    ...abilitaPerPezzo(id, natura),
    canAct: true,
    ...colors,
  };
}
