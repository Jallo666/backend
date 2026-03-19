# Regole Quest Board — Invarianti del Codice

Questo file documenta le regole di gioco che il codice **non deve mai violare**.
Ogni modifica a `qb_state.js`, `qb_rules.js` o `qb_pieces.js` deve rispettare queste invarianti.

---

## Obiettivo

Uccidere il Re nemico.

---

## Setup

- Griglia **6×6**
- Ogni giocatore ha **6 pezzi** (1 Re + 5 pezzi)
- Inizio partita: **tiro di moneta** → chi vince sceglie se andare primo o secondo

---

## Struttura del turno

Ogni pezzo per turno può fare:

- **Movimento** (include attacco se arrivi su un nemico) **OPPURE Gesta**
- **Ardore** (opzionale, non consuma il movimento)

> **Invariante**: Ardore NON chiama `registerMove`. Le funzioni `applyArdore*` non modificano mai `playerRotation` né `aiRotation`.

---

## Rotazione obbligatoria

Non puoi muovere lo stesso pezzo due volte finché non hanno mosso tutti almeno una volta.

> **Invariante**: `registerMove` resetta il ciclo solo quando `aliveUids.every(id => newMoved.has(id))`.

---

## Combattimento

Quando un pezzo si muove su una casella nemica:

- Solo il pezzo che si muove attacca (nessun contrattacco)
- **Danno = max(1, ATK_attaccante − DEF_difensore)**
- Il difensore perde HP
- Se arriva a 0 HP → muore → l'attaccante occupa la casella

---

## Abilità

| Tipo | Comportamento |
|------|--------------|
| **Aura** | Passiva, sempre attiva, automatica |
| **Gesta** | Sostituisce il Movimento — setta `canAct: false` e registra in rotazione |
| **Ardore** | Azione bonus — NON setta `canAct: false` e NON registra in rotazione |

---

## Round e Cura (indipendenti per giocatore)

Ogni giocatore ha il **suo round indipendente** (`playerRound` / `aiRound`).

- Finisci di muovere tutti i tuoi pezzi → **tuo** round finito → ricevi cura **solo tu**
- Formula cura: `max(-20, 10 - 2 × round)` per giocatore

| Round | Effetto |
|-------|---------|
| 1 | +8 HP |
| 2 | +6 HP |
| 3 | +4 HP |
| 4 | +2 HP |
| 5 | 0 HP |
| 6 | −2 HP |
| 7 | −4 HP |
| ... | ... |

> **Invariante**: `_applyCycleEnd(state, side)` cura SOLO i pezzi del `side` che ha completato il ciclo. Non tocca mai i pezzi dell'avversario.

- Ardore e Gesta si **ricaricano a fine round** solo per il lato che ha completato

---

## Potere del Popolo (Aura: `forza_del_popolo`)

- Ogni pezzo vivo dà **+2 HP** al Re (applicato all'inizio in `_initForzaDelPopolo`)
- Quando un pezzo muore → il Re perde **2 hpMax istantaneamente** (non recuperabili)

> **Invariante**: `_applyForzaDelPopolo` viene chiamata in `_applyMove`, `applyGesta`, `applyArdore` ogni volta che un pezzo muore.

---

## Fine partita

Muore il Re nemico → vittoria.

> **Invariante**: `checkWin` viene chiamata dopo ogni azione che può causare danni.
