import baldoImg        from './assets/personaggi/Baldo il Bettoliere .png';
import baldoAvatarImg   from './assets/personaggi/Baldo il Bettoliere avatar.png';
import raldoImg         from './assets/personaggi/Raldo il Veterano.png';
import raldoAvatarImg   from './assets/personaggi/Raldo il Veterano avatar.png';
import mirtaImg         from './assets/personaggi/mirta la fattucchiera.png';
import mirtaAvatarImg   from './assets/personaggi/mirta la fattucchiera avatar.png';

export const SFIDANTI = [
  {
    id:          'baldo',
    nome:        'Baldo il Bettoliere',
    tag:         'BALDO',
    titolo:      'Sfidante Senza Speranza',
    difficolta:  1,
    img:         baldoImg,
    avatarImg:   baldoAvatarImg,
    avatarPos:   'center',
    descrizione: 'Il locandiere appoggia lo straccio e ti sfida con un sogghigno. Non sembra molto minaccioso...',
    pezziPreview: [
      { id: "cavaliere", nome: "Cavaliere", icona: "♞", hp: 14, hpMax: 14, atk: 4, def: 3, mov: 2 },
      { id: "ranger",    nome: "Ranger",    icona: "♝", hp: 8,  hpMax: 8,  atk: 6, def: 1, mov: 3 },
      { id: "scudiero",  nome: "Scudiero",  icona: "♜", hp: 18, hpMax: 18, atk: 2, def: 5, mov: 1, isRe: true },
      { id: "assassino", nome: "Assassino", icona: "♟", hp: 9,  hpMax: 9,  atk: 3, def: 2, mov: 4 },
      { id: "mago",      nome: "Mago",      icona: "♛", hp: 7,  hpMax: 7,  atk: 7, def: 1, mov: 2 },
      { id: "campione",  nome: "Campione",  icona: "♚", hp: 15, hpMax: 15, atk: 5, def: 4, mov: 2 },
    ],
  },
  {
    id:          'raldo',
    nome:        'Raldo il Veterano',
    tag:         'RALDO',
    titolo:      "L'Ombra della Guerra",
    difficolta:  1,
    img:         raldoImg,
    avatarImg:   raldoAvatarImg,
    avatarPos:   'center',
    descrizione: "Seduto nell'angolo più buio della locanda, quasi nascosto. Gli occhi fissi sulla scacchiera, ma lo sguardo è altrove — come se vedesse ancora la battaglia. Sul tavolo, un vecchio elmetto ammaccato e arrugginito. Mormora sottovoce mentre muove i pezzi.",
    pezziPreview: [
      { id: "cavaliere", nome: "Cavaliere", icona: "♞", hp: 15, hpMax: 15, atk: 4, def: 3, mov: 2 },
      { id: "chierico",  nome: "Chierico",  icona: "✚", hp: 11, hpMax: 11, atk: 4, def: 3, mov: 2 },
      { id: "scudiero",  nome: "Scudiero",  icona: "♜", hp: 19, hpMax: 19, atk: 2, def: 5, mov: 1 },
      { id: "assassino", nome: "Assassino", icona: "♟", hp: 10, hpMax: 10, atk: 4, def: 2, mov: 4 },
      { id: "barbaro",   nome: "Barbaro",   icona: "⚔", hp: 13, hpMax: 13, atk: 6, def: 2, mov: 2 },
      { id: "campione",  nome: "Campione",  icona: "♚", hp: 16, hpMax: 16, atk: 5, def: 4, mov: 2, isRe: true },
    ],
  },
  {
    id:          'mirta',
    nome:        'Mirta la Fattucchiera',
    tag:         'MIRTA',
    titolo:      'Fanatica della Necromanzia',
    difficolta:  2,
    img:         mirtaImg,
    avatarImg:   mirtaAvatarImg,
    avatarPos:   'center',
    descrizione: "Occhi spalancati, capelli storti, un odore vagamente di zolfo. Sul tavolo ha sparso ogni sorta di reagente — farina d'ossa, cristalli viola, qualcosa che bolle da sola. Fissa la scacchiera come se avesse appena fatto una cosa di cui non è del tutto orgogliosa. «Non è come sembra» dice, anche se nessuno le ha chiesto niente.",
    pezziPreview: [
      { id: "lich",           nome: "Lich",             icona: "💀", hp: 9,  hpMax: 9,  atk: 5, def: 1, mov: 2, isRe: true },
      { id: "guerriero_ossa", nome: "Guerriero D'Ossa", icona: "🦴", hp: 12, hpMax: 12, atk: 3, def: 3, mov: 2 },
      { id: "mago",           nome: "Mago",             icona: "♛", hp: 7,  hpMax: 7,  atk: 7, def: 1, mov: 2 },
      { id: "assassino",      nome: "Assassino",        icona: "♟", hp: 9,  hpMax: 9,  atk: 3, def: 2, mov: 4 },
      { id: "ranger",         nome: "Ranger",           icona: "♝", hp: 8,  hpMax: 8,  atk: 6, def: 1, mov: 3 },
      { id: "campione",       nome: "Campione",         icona: "♚", hp: 15, hpMax: 15, atk: 5, def: 4, mov: 2 },
    ],
  },
];
