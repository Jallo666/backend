import { TILE, ROWS, W, H, HUD, FACE_H, T, SPELLS } from "./constants.js";

// ── Tiles ──────────────────────────────────────────────────────────────────
export function drawTile(ctx, x, y, type, map) {
  const px = x*TILE, py = y*TILE;

  if (type === T.WALL) {
    const southOpen = y < ROWS-1 && map[y+1]?.[x] !== T.WALL;
    const eastOpen  = map[y]?.[x+1] !== undefined && map[y]?.[x+1] !== T.WALL;
    const bw = TILE / 2;
    const row = y % 2;

    ctx.fillStyle = "#19193c"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = ((x+y)%3===0) ? "#1e1e44" : "#161640";
    ctx.fillRect(px+1,    py+1,  bw-2, 10);
    ctx.fillRect(px+bw+1, py+12, bw-2, 10);
    ctx.fillRect(px+1,    py+23, bw-2,  8);
    ctx.fillRect(px+bw+1, py+1,  bw-2, 10);
    ctx.fillRect(px+1,    py+12, bw-2, 10);
    ctx.fillRect(px+bw+1, py+23, bw-2,  8);
    ctx.fillStyle = "#0d0d28";
    ctx.fillRect(px, py+11, TILE, 1); ctx.fillRect(px, py+22, TILE, 1);
    ctx.fillRect(px+(row?0:bw), py,    1, 11);
    ctx.fillRect(px+(row?bw:0), py+11, 1, 11);
    ctx.fillRect(px+(row?0:bw), py+22, 1, 10);
    ctx.fillStyle = "rgba(130,150,240,0.12)";
    ctx.fillRect(px, py, TILE, 2); ctx.fillRect(px, py, 2, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(px+TILE-2, py, 2, TILE); ctx.fillRect(px, py+TILE-2, TILE, 2);

    if (southOpen) {
      const fy = py + TILE;
      ctx.fillStyle = "#0d0d28"; ctx.fillRect(px, fy, TILE, FACE_H);
      ctx.fillStyle = "#080820";
      ctx.fillRect(px, fy+5, TILE, 1); ctx.fillRect(px+(row?0:bw), fy, 1, FACE_H);
      ctx.fillStyle = "rgba(120,140,220,0.30)"; ctx.fillRect(px, fy, TILE, 2);
      ctx.fillStyle = "rgba(80,100,200,0.20)";  ctx.fillRect(px, fy, 2, FACE_H);
      ctx.fillStyle = "rgba(0,0,0,0.55)";       ctx.fillRect(px, fy+FACE_H-2, TILE, 2);
    }
    if (eastOpen) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(px+TILE-4, py, 4, TILE);
    }

  } else if (type === T.FLOOR) {
    const seed  = x * 7 + y * 13;
    const seed2 = x * 11 + y * 17;
    const bases = ["#1a1208","#1c1409","#1e1509","#191007","#1b1208","#1d1309","#1a1108","#1c1308"];
    ctx.fillStyle = bases[seed % 8]; ctx.fillRect(px, py, TILE, TILE);

    const v = seed % 23;
    if (v < 5)        { ctx.fillStyle="rgba(65,38,12,0.55)"; ctx.fillRect(px+3,       py+6,      6, 3); }
    if (v > 17)       { ctx.fillStyle="rgba(50,28,8,0.60)";  ctx.fillRect(px+TILE-9,  py+TILE-7, 5, 3); }
    if (v>9&&v<14)    { ctx.fillStyle="rgba(72,44,14,0.40)"; ctx.fillRect(px+9,       py+15,     7, 2); }

    const r2 = seed2 % 31;
    if (r2 < 6) {
      ctx.fillStyle="#2c2010"; ctx.fillRect(px+4+(r2*4)%20, py+7+(r2*6)%18, 3, 2);
      ctx.fillStyle="#221808"; ctx.fillRect(px+4+(r2*4)%20+1, py+7+(r2*6)%18+1, 1, 1);
    }
    if (r2 > 25) { ctx.fillStyle="#28180a"; ctx.fillRect(px+14+(r2%7), py+19+(r2%6), 2, 2); }
    const r3 = (seed2 * 3 + 7) % 41;
    if (r3 < 5) { ctx.fillStyle="#241a0c"; ctx.fillRect(px+18+(r3*5)%10, py+5+(r3*7)%22, 2, 2); }

    if ((seed2 % 19) === 0) {
      ctx.fillStyle="rgba(0,0,0,0.28)";
      ctx.fillRect(px+6, py+10, 10, 1); ctx.fillRect(px+14, py+10, 1, 5);
    }
    ctx.fillStyle="rgba(0,0,0,0.22)";
    ctx.fillRect(px, py, TILE, 1); ctx.fillRect(px, py, 1, TILE);

    if (map[y-1]?.[x] === T.WALL) {
      for (let i=0; i<FACE_H+4; i++) {
        const alpha = 0.55 * (1 - i/(FACE_H+4));
        ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(2)})`; ctx.fillRect(px, py+i, TILE, 1);
      }
    }
    if (map[y]?.[x-1] === T.WALL) {
      for (let i=0; i<8; i++) {
        const alpha = 0.28 * (1 - i/8);
        ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(2)})`; ctx.fillRect(px+i, py, 1, TILE);
      }
    }

  } else {
    // SCALE
    ctx.fillStyle = "#070712"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#705018";
    for (let s=0; s<4; s++) ctx.fillRect(px+2+s*3, py+5+s*6, TILE-4-s*5, 4);
    ctx.fillStyle = "#a07028"; ctx.fillRect(px+2, py+5, TILE-4, 1);
    ctx.fillStyle = "rgba(240,192,64,0.15)"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(240,192,64,0.08)"; ctx.fillRect(px-1, py-1, TILE+2, TILE+2);
  }
}

// ── Nemici ────────────────────────────────────────────────────────────────
function drawSlime(ctx, px, py, s) {
  ctx.fillStyle = "#2daa3d";
  ctx.fillRect(px+3,py+10,s-6,s-13); ctx.fillRect(px+5,py+8,s-10,4); ctx.fillRect(px+8,py+6,s-16,3);
  ctx.fillStyle = "rgba(100,255,120,0.3)"; ctx.fillRect(px+5,py+10,4,3);
  ctx.fillStyle = "#fff"; ctx.fillRect(px+7,py+10,4,4); ctx.fillRect(px+s-11,py+10,4,4);
  ctx.fillStyle = "#000"; ctx.fillRect(px+8,py+11,2,2); ctx.fillRect(px+s-10,py+11,2,2);
}
function drawSkeleton(ctx, px, py, s) {
  ctx.fillStyle = "#c0c0c8";
  ctx.fillRect(px+6,py+2,s-12,9); ctx.fillRect(px+8,py+1,s-16,3);
  ctx.fillStyle = "#000"; ctx.fillRect(px+7,py+4,4,4); ctx.fillRect(px+s-11,py+4,4,4);
  ctx.fillStyle = "#880000"; ctx.fillRect(px+8,py+5,2,2); ctx.fillRect(px+s-10,py+5,2,2);
  ctx.fillStyle = "#aaaaaa"; ctx.fillRect(px+8,py+11,s-16,s-16);
  ctx.fillStyle = "#666"; for (let r=0;r<3;r++) ctx.fillRect(px+8,py+12+r*3,s-16,1);
  ctx.fillStyle = "#c0c0c8"; ctx.fillRect(px+4,py+12,3,7); ctx.fillRect(px+s-7,py+12,3,7);
}
function drawOrc(ctx, px, py, s) {
  ctx.fillStyle = "#5a2a08";
  ctx.fillRect(px+2,py+6,s-4,s-9); ctx.fillRect(px+4,py+2,s-8,8);
  ctx.fillStyle = "#2a1004"; ctx.fillRect(px+5,py+3,5,2); ctx.fillRect(px+s-10,py+3,5,2);
  ctx.fillStyle = "#cc4400"; ctx.fillRect(px+6,py+5,3,3); ctx.fillRect(px+s-9,py+5,3,3);
  ctx.fillStyle = "#000";    ctx.fillRect(px+7,py+6,1,1); ctx.fillRect(px+s-8,py+6,1,1);
  ctx.fillStyle = "#eeeecc"; ctx.fillRect(px+7,py+9,2,4); ctx.fillRect(px+s-9,py+9,2,4);
  ctx.fillStyle = "#3a1800"; ctx.fillRect(px+2,py+s-8,s-4,3);
}
function drawDragonSprite(ctx, px, py, s) {
  ctx.fillStyle = "#881111";
  ctx.fillRect(px,py+6,4,10); ctx.fillRect(px+s-4,py+6,4,10);
  ctx.fillRect(px+1,py+4,3,4); ctx.fillRect(px+s-4,py+4,3,4);
  ctx.fillStyle = "#cc2222"; ctx.fillRect(px+4,py+5,s-8,s-8);
  ctx.fillStyle = "#dd3333"; ctx.fillRect(px+6,py+2,s-12,7);
  ctx.fillStyle = "#bb1111"; ctx.fillRect(px+9,py+7,s-18,4);
  ctx.fillStyle = "#ffff00"; ctx.fillRect(px+7,py+3,3,3); ctx.fillRect(px+s-10,py+3,3,3);
  ctx.fillStyle = "#000";    ctx.fillRect(px+8,py+4,2,2); ctx.fillRect(px+s-9,py+4,2,2);
  ctx.fillStyle = "#ff4444"; for (let i=0;i<3;i++) ctx.fillRect(px+8+i*5,py+1,2,3);
}
function drawGenericEnemy(ctx, px, py, s, e) {
  ctx.fillStyle = e.color; ctx.fillRect(px+4,py+5,s-8,s-6); ctx.fillRect(px+6,py+1,s-12,7);
  ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(px+8,py+3,2,2); ctx.fillRect(px+s-11,py+3,2,2);
}
export function drawEnemy(ctx, e) {
  const px=e.x*TILE, py=e.y*TILE, s=TILE;
  if (e.isBoss) { ctx.shadowColor=e.color; ctx.shadowBlur=18; }
  switch(e.name) {
    case "Slime":    drawSlime(ctx,px,py,s); break;
    case "Skeleton": drawSkeleton(ctx,px,py,s); break;
    case "Orc":      drawOrc(ctx,px,py,s); break;
    case "Dragon":   drawDragonSprite(ctx,px,py,s); break;
    default:         drawGenericEnemy(ctx,px,py,s,e); break;
  }
  ctx.shadowBlur = 0;
  if (e.isBoss) {
    ctx.fillStyle = "#f0c040";
    ctx.fillRect(px+3,py-8,3,6); ctx.fillRect(px+8,py-11,3,9); ctx.fillRect(px+13,py-8,3,6);
    ctx.fillRect(px+3,py-4,13,3);
    ctx.fillStyle="#ff4444"; ctx.fillRect(px+9,py-9,2,2);
  }
  if (e.stunned > 0) {
    ctx.fillStyle="rgba(100,200,255,0.22)"; ctx.fillRect(px+2,py+2,s-4,s-4);
    ctx.fillStyle="#aaddff"; ctx.font='7px "Press Start 2P"'; ctx.fillText("❄",px+4,py+s-5);
  }
  if (e.hp < e.maxHp) {
    ctx.fillStyle="#111"; ctx.fillRect(px+1,py-5,s-2,3);
    ctx.fillStyle=e.isBoss?"#bb44ff":"#cc3333";
    ctx.fillRect(px+1,py-5,Math.floor((s-2)*e.hp/e.maxHp),3);
  }
}

// ── Giocatore ─────────────────────────────────────────────────────────────
export function drawPlayer(ctx, p) {
  const ox = p.x * TILE + 3;
  const oy = p.y * TILE + 3;
  ctx.shadowColor = "#f0c040"; ctx.shadowBlur = 16;

  ctx.fillStyle = "#7a0a0a";
  ctx.fillRect(ox+6,  oy+9,  2, 14);
  ctx.fillRect(ox+18, oy+9,  2, 14);
  ctx.fillRect(ox+7,  oy+20, 12, 4);
  ctx.fillStyle = "#550808"; ctx.fillRect(ox+8, oy+22, 10, 2);

  ctx.fillStyle = "#445566";
  ctx.fillRect(ox+8,  oy+19, 4, 4); ctx.fillRect(ox+14, oy+19, 4, 4);
  ctx.fillStyle = "#261406";
  ctx.fillRect(ox+7,  oy+21, 6, 4); ctx.fillRect(ox+13, oy+21, 6, 4);
  ctx.fillStyle = "#382010";
  ctx.fillRect(ox+8,  oy+21, 2, 1); ctx.fillRect(ox+14, oy+21, 2, 1);

  ctx.fillStyle = "#1e1006"; ctx.fillRect(ox+7, oy+18, 12, 2);
  ctx.fillStyle = "#d4a820"; ctx.fillRect(ox+12, oy+18, 2, 2);

  ctx.fillStyle = "#4a6080";
  ctx.fillRect(ox+3, oy+9, 4, 8); ctx.fillRect(ox+19, oy+9, 4, 8);
  ctx.fillStyle = "#5a7090";
  ctx.fillRect(ox+3, oy+13, 4, 2); ctx.fillRect(ox+19, oy+13, 4, 2);
  ctx.fillStyle = "rgba(160,200,240,0.18)";
  ctx.fillRect(ox+3, oy+9, 4, 2); ctx.fillRect(ox+19, oy+9, 4, 2);

  ctx.fillStyle = "#162040"; ctx.fillRect(ox, oy+9, 3, 11);
  ctx.fillStyle = "#c8a020";
  ctx.fillRect(ox, oy+9, 1, 11); ctx.fillRect(ox, oy+9, 3, 1); ctx.fillRect(ox, oy+19, 3, 1);
  ctx.fillStyle = "#bb1818";
  ctx.fillRect(ox+1, oy+12, 2, 5); ctx.fillRect(ox, oy+14, 3, 2);
  ctx.fillStyle = "rgba(120,160,255,0.18)"; ctx.fillRect(ox+1, oy+10, 2, 3);

  ctx.fillStyle = "#4a6080"; ctx.fillRect(ox+7, oy+9, 12, 9);
  ctx.fillStyle = "#3a5070"; ctx.fillRect(ox+12, oy+9, 2, 9);
  ctx.fillStyle = "#607898"; ctx.fillRect(ox+8, oy+12, 10, 1);
  ctx.fillStyle = "rgba(180,210,250,0.22)"; ctx.fillRect(ox+8, oy+9, 4, 4);

  ctx.fillStyle = "#3a5070";
  ctx.fillRect(ox+4, oy+7, 5, 4); ctx.fillRect(ox+17, oy+7, 5, 4);
  ctx.fillStyle = "rgba(180,210,250,0.20)";
  ctx.fillRect(ox+4, oy+7, 5, 1); ctx.fillRect(ox+17, oy+7, 5, 1);

  ctx.fillStyle = "#d0e4f4"; ctx.fillRect(ox+23, oy+1, 2, 12);
  ctx.fillStyle = "#f0f8ff"; ctx.fillRect(ox+23, oy+1, 1, 12);
  ctx.fillStyle = "#8090a8"; ctx.fillRect(ox+24, oy+1, 1, 12);
  ctx.fillStyle = "#c8a020"; ctx.fillRect(ox+20, oy+10, 5, 2);
  ctx.fillStyle = "#e8c030"; ctx.fillRect(ox+21, oy+10, 3, 1);
  ctx.fillStyle = "#5a3010"; ctx.fillRect(ox+23, oy+12, 2, 4);
  ctx.fillStyle = "#c8a020"; ctx.fillRect(ox+23, oy+15, 2, 2);

  ctx.fillStyle = "#c09060"; ctx.fillRect(ox+11, oy+7, 4, 3);

  ctx.fillStyle = "#3a5070";
  ctx.fillRect(ox+10, oy+0, 6, 2); ctx.fillRect(ox+9, oy+1, 8, 1);
  ctx.fillStyle = "#4a6080"; ctx.fillRect(ox+7, oy+2, 12, 6);
  ctx.fillStyle = "#08081a"; ctx.fillRect(ox+9, oy+4, 8, 2);
  ctx.fillStyle = "rgba(80,170,255,0.65)";
  ctx.fillRect(ox+9, oy+4, 3, 1); ctx.fillRect(ox+14, oy+4, 3, 1);
  ctx.fillStyle = "#3a5070"; ctx.fillRect(ox+12, oy+3, 2, 4);
  ctx.fillStyle = "#2a3a50"; ctx.fillRect(ox+7, oy+7, 12, 1);
  ctx.fillStyle = "rgba(190,220,255,0.24)"; ctx.fillRect(ox+8, oy+2, 5, 2);
  ctx.fillStyle = "#cc1818"; ctx.fillRect(ox+11, oy+0, 4, 1);
  ctx.fillStyle = "#ee3030"; ctx.fillRect(ox+12, oy+0, 2, 1);

  ctx.shadowBlur = 0;
  const s = TILE - 6, r = p.hp / p.maxHp;
  ctx.fillStyle = "#0a0a0a"; ctx.fillRect(ox, oy-5, s, 3);
  ctx.fillStyle = r>0.5?"#44cc44":r>0.25?"#ccaa22":"#cc3333";
  ctx.fillRect(ox, oy-5, Math.floor(s*r), 3);
}

// ── Items ─────────────────────────────────────────────────────────────────
export function drawPotion(ctx, item) {
  const cols = { hp:["#cc2244","#ff4466","#ff88aa"], mana:["#2244cc","#4488ff","#88bbff"] };
  const c = cols[item.type];
  const px=item.x*TILE+9, py=item.y*TILE+7;
  ctx.shadowColor=c[1]; ctx.shadowBlur=10;
  ctx.fillStyle=c[0];
  ctx.fillRect(px+3,py+6,8,10); ctx.fillRect(px+4,py+4,6,3); ctx.fillRect(px+5,py+2,4,3);
  ctx.fillStyle=c[2]; ctx.fillRect(px+4,py+7,2,5);
  ctx.fillStyle="rgba(255,255,255,0.25)"; ctx.fillRect(px+5,py+3,1,1);
  ctx.shadowBlur=0;
}

export function drawArrowBundle(ctx, item) {
  const px=item.x*TILE, py=item.y*TILE;
  ctx.shadowColor="#c8a030"; ctx.shadowBlur=8;
  [px+8, px+13, px+18].forEach(sx => {
    ctx.fillStyle="#8b6020"; ctx.fillRect(sx,py+8,2,16);
    ctx.fillStyle="#c0c0c0"; ctx.fillRect(sx-1,py+5,4,4); ctx.fillRect(sx,py+4,2,2);
    ctx.fillStyle="#aa2200"; ctx.fillRect(sx-1,py+22,4,3); ctx.fillRect(sx,py+24,2,2);
  });
  ctx.fillStyle="#6b4010"; ctx.fillRect(px+6,py+14,16,2);
  ctx.shadowBlur=0;
  ctx.font='5px "Press Start 2P"'; ctx.fillStyle="#c8a030"; ctx.textBaseline="top";
  ctx.fillText("x5",px+8,py+26); ctx.textBaseline="middle";
}

export function drawGem(ctx, item) {
  const cx = item.x * TILE + TILE/2;
  const cy = item.y * TILE + TILE/2 - 2;
  const c  = item.color;
  ctx.shadowColor = c; ctx.shadowBlur = 10;
  ctx.fillStyle = c;
  ctx.fillRect(cx-2,cy-7,4,1); ctx.fillRect(cx-4,cy-6,8,2);
  ctx.fillRect(cx-5,cy-4,10,4); ctx.fillRect(cx-4,cy+0,8,2);
  ctx.fillRect(cx-3,cy+2,6,2); ctx.fillRect(cx-2,cy+4,4,2); ctx.fillRect(cx-1,cy+6,2,1);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(cx-4,cy-6,4,1); ctx.fillRect(cx-5,cy-4,4,2); ctx.fillRect(cx-4,cy+0,3,1);
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(cx+2,cy-4,3,4); ctx.fillRect(cx+1,cy+0,3,2);
  ctx.shadowBlur = 0;
  ctx.font='5px "Press Start 2P"'; ctx.fillStyle=c; ctx.textBaseline="top";
  ctx.fillText(`${item.value}`, item.x*TILE+TILE/2-3, item.y*TILE+TILE-7);
  ctx.textBaseline="middle";
}

// ── HUD & overlay ─────────────────────────────────────────────────────────
export function drawFloats(ctx, floats) {
  if (!floats.length) return;
  ctx.font='7px "Press Start 2P"'; ctx.textBaseline="top";
  floats.forEach(f => { ctx.fillStyle=f.color??"#ffffff"; ctx.fillText(f.text,f.x*TILE+4,f.y*TILE-4); });
  ctx.textBaseline="middle";
}

export function drawFlashEffect(ctx, type, enemies, player) {
  const sp = SPELLS.find(s=>s.id===type); if (!sp) return;
  ctx.fillStyle=sp.fc; ctx.fillRect(0,0,W,H);
  if (type==="lightning") {
    ctx.strokeStyle="#ffffff"; ctx.lineWidth=2;
    enemies.forEach(e=>{
      const cx=e.x*TILE+TILE/2, cy=e.y*TILE+TILE/2;
      ctx.beginPath(); ctx.moveTo(cx,0);
      ctx.lineTo(cx-6,cy-14); ctx.lineTo(cx+5,cy-14); ctx.lineTo(cx,cy+4); ctx.stroke();
      ctx.fillStyle="#ffff88"; ctx.fillRect(cx-3,cy-3,6,6);
    });
  } else if (type==="fire") {
    const e=enemies[0]; if (!e) return;
    ctx.fillStyle="#ff8800";
    [[-3,-5],[3,-7],[0,-4],[-4,-3],[4,-3]].forEach(([ox,oy])=>
      ctx.fillRect(e.x*TILE+TILE/2+ox*3-3, e.y*TILE+TILE/2+oy*3, 7, 7));
  } else if (type==="ice") {
    const e=enemies[0]; if (!e) return;
    ctx.strokeStyle="#aaddff"; ctx.lineWidth=1;
    const cx=e.x*TILE+TILE/2, cy=e.y*TILE+TILE/2;
    for (let a=0;a<6;a++) {
      const ang=(a/6)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(ang)*16,cy+Math.sin(ang)*16); ctx.stroke();
    }
  } else if (type==="heal") {
    ctx.fillStyle="#88ff88";
    const cx=player.x*TILE+TILE/2, cy=player.y*TILE+TILE/2;
    [[0,-13],[0,13],[-13,0],[13,0]].forEach(([ox,oy])=>ctx.fillRect(cx+ox-2,cy+oy-2,5,5));
    ctx.fillRect(cx-1,cy-9,2,18); ctx.fillRect(cx-9,cy-1,18,2);
  }
}

function drawBar(ctx, label, lx, y, val, max, barColor, labelColor, font, bw=105) {
  ctx.font=`8px ${font}`; ctx.fillStyle=labelColor; ctx.fillText(label,lx,y);
  ctx.fillStyle="#151528"; ctx.fillRect(lx+24,y-6,bw,10);
  ctx.fillStyle=barColor; ctx.fillRect(lx+24,y-6,Math.floor(bw*Math.min(val/max,1)),10);
  ctx.strokeStyle="#2e3a6e"; ctx.lineWidth=1; ctx.strokeRect(lx+24,y-6,bw,10);
  ctx.font=`6px ${font}`; ctx.fillStyle="#888"; ctx.fillText(`${val}/${max}`,lx+24+bw+4,y);
}

export function drawHUD(ctx, g) {
  const hy=H, p=g.player, font='"Press Start 2P"';
  ctx.fillStyle="#05050e"; ctx.fillRect(0,hy,W,HUD);
  ctx.fillStyle="#2e3a6e"; ctx.fillRect(0,hy,W,2);
  ctx.textBaseline="middle";

  const hpR=p.hp/p.maxHp;
  drawBar(ctx,"HP",6,hy+16,p.hp,  p.maxHp,  hpR>0.5?"#44cc44":hpR>0.25?"#ccaa22":"#cc3333","#7a8aaa",font,95);
  drawBar(ctx,"MP",6,hy+34,p.mana,p.maxMana,"#3a6ee8","#6677aa",font,95);
  drawBar(ctx,"XP",6,hy+52,p.xp,  p.xpNext, "#5560c8","#445",   font,95);

  ctx.font=`7px ${font}`;
  ctx.fillStyle="#f0c040";                       ctx.fillText(`LV.${p.level}`,  6,  hy+70);
  ctx.fillStyle="#ff8888";                       ctx.fillText(`ATK ${p.atk}`,   50, hy+70);
  const boss=g.floor%5===0;
  ctx.fillStyle=boss?"#ff4444":"#5b8dee";        ctx.fillText(`P.${g.floor}${boss?" ⚠":""}`, 96,  hy+70);
  ctx.fillStyle=p.arrows>0?"#c8a030":"#252525"; ctx.fillText(`🏹 ${p.arrows}`, 138, hy+70);
  ctx.fillStyle=p.gems>0?"#cc44ee":"#252525";   ctx.fillText(`💎 ${p.gems}`,   178, hy+70);

  const msgs=g.messages.slice(-2);
  ctx.font=`6px ${font}`;
  msgs.forEach((m,i)=>{
    ctx.fillStyle=i===msgs.length-1?"#c0d0e0":"#333a4a";
    ctx.fillText(m.slice(0,34),6,hy+88+i*18);
  });

  const slotX=240, slotW=106, gap=2, slotH=HUD-8;
  SPELLS.forEach((sp, i) => {
    const locked  = sp.unlockAt > p.level;
    const active  = i === p.spell;
    const canCast = !locked && p.mana >= sp.cost;
    const bx = slotX + i*(slotW+gap), by = hy+4, cx = bx+slotW/2;

    ctx.strokeStyle = active ? (canCast?"#5599ff":"#aa9900") : (locked?"#181828":"#222240");
    ctx.lineWidth=2; ctx.strokeRect(bx,by,slotW,slotH);
    ctx.fillStyle = active ? "#060622" : "#020212"; ctx.fillRect(bx+1,by+1,slotW-2,slotH-2);
    if (active) { ctx.fillStyle=canCast?"#f0c040":"#886600"; ctx.fillRect(bx+1,by+1,slotW-2,3); }

    ctx.textAlign="center";
    if (locked) {
      ctx.font=`18px ${font}`; ctx.fillStyle="#1c1c34"; ctx.fillText(sp.icon,cx,by+26);
      ctx.font=`7px ${font}`; ctx.fillStyle="#443322"; ctx.fillText(sp.name,cx,by+48);
      ctx.fillStyle="#cc5533"; ctx.fillText(`🔒 LV.${sp.unlockAt}`,cx,by+66);
      ctx.fillStyle="#332";    ctx.fillText(`[${i+1}]`,cx,by+84);
    } else {
      ctx.font=`20px ${font}`; ctx.fillStyle=active?(canCast?"#ffffff":"#ddcc44"):"#5566aa"; ctx.fillText(sp.icon,cx,by+26);
      ctx.font=`7px ${font}`; ctx.fillStyle=active?"#d0e8ff":"#4a5a7a"; ctx.fillText(sp.name,cx,by+48);
      ctx.font=`6px ${font}`; ctx.fillStyle=canCast?"#44aaff":"#553333"; ctx.fillText(`${sp.cost} MP`,cx,by+64);
      ctx.fillStyle=active?"#3a5090":"#222838"; ctx.fillText(`[${i+1}]`,cx,by+80);
      if (active) { ctx.fillStyle=canCast?"#2a5080":"#3a2200"; ctx.fillText("SPACE",cx,by+98); }
    }
    ctx.textAlign="left";
  });
}

export function drawOverlay(ctx, status) {
  if (status==="playing") return;
  ctx.fillStyle="rgba(0,0,0,0.84)"; ctx.fillRect(0,0,W,H);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#cc2222"; ctx.font='16px "Press Start 2P"'; ctx.fillText("GAME  OVER",W/2,H/2-28);
  ctx.fillStyle="#666";    ctx.font='7px "Press Start 2P"';  ctx.fillText("[ R ] Ricomincia dall'inizio",W/2,H/2+8);
  ctx.textAlign="left";
}
