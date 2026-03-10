import { useEffect, useRef, useCallback, useState } from "react";
import { W, H, HUD, T, SPELLS, ROWS, COLS } from "./game/constants.js";
import { getMuted, setMuted as setAudioMuted, sfx, startMusic, stopMusic } from "./game/audio.js";
import { newGame } from "./game/dungeon.js";
import { drawTile, drawEnemy, drawPlayer, drawPotion, drawArrowBundle, drawGem,
         drawFloats, drawFlashEffect, drawHUD, drawOverlay } from "./game/sprites.js";
import { actionMove, actionShoot, actionCastSpell } from "./game/actions.js";
import { DPAD_DIRS, createKeyHandler } from "./game/input.js";

const SAVE_KEY = "qb_game_stats";

function saveStats(g) {
  try {
    const p = g.player;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      floor:   g.floor,
      level:   p.level,
      hp:      p.hp,
      maxHp:   p.maxHp,
      mana:    p.mana,
      maxMana: p.maxMana,
      atk:     p.atk,
      xp:      p.xp,
      xpNext:  p.xpNext,
      arrows:  p.arrows,
      gems:    p.gems,
      gold:    p.gold ?? 0,
      spell:   p.spell,
    }));
  } catch {}
}

export default function Gioco({ startFloor = 1, saveData = null, onBackToMenu }) {
  const canvasRef    = useRef(null);
  const gameRef      = useRef(newGame(startFloor, saveData));
  const touchRef     = useRef(null);
  const audioReady   = useRef(false);
  const containerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const [muted, setMuted]               = useState(false);

  useEffect(() => {
    setIsMobile(navigator.maxTouchPoints > 0);
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      try { await screen.orientation.lock("landscape-primary"); } catch (_) {}
    } else {
      await document.exitFullscreen();
      try { screen.orientation.unlock(); } catch (_) {}
    }
  };

  const toggleMute = () => {
    const next = !getMuted();
    setAudioMuted(next);
    setMuted(next);
    if (next) stopMusic();
    else startMusic(gameRef.current.floor % 5 === 0);
  };

  function initAudio() {
    if (audioReady.current) return;
    audioReady.current = true;
    startMusic(gameRef.current.floor % 5 === 0);
  }

  const draw = useCallback((flashType = null) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;
    ctx.fillStyle = "#040410"; ctx.fillRect(0, 0, W, H + HUD);

    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (g.map[y][x] !== T.WALL) drawTile(ctx, x, y, g.map[y][x], g.map);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (g.map[y][x] === T.WALL) drawTile(ctx, x, y, g.map[y][x], g.map);

    g.items.forEach(it => {
      if (it.type === "arrows") drawArrowBundle(ctx, it);
      else if (it.type === "gem") drawGem(ctx, it);
      else drawPotion(ctx, it);
    });
    g.enemies.forEach(e => drawEnemy(ctx, e));
    drawPlayer(ctx, g.player);
    drawFloats(ctx, g.floats);

    if (flashType) {
      const nearest = g.enemies.reduce((b, e) => {
        const d = Math.abs(e.x - g.player.x) + Math.abs(e.y - g.player.y);
        return (!b || d < Math.abs(b.x - g.player.x) + Math.abs(b.y - g.player.y)) ? e : b;
      }, null);
      drawFlashEffect(ctx, flashType, nearest ? [nearest] : g.enemies, g.player);
    }

    drawHUD(ctx, g);
    drawOverlay(ctx, g.status);
    g.floats = [];

    // Salva stats in localStorage dopo ogni frame
    saveStats(g);
  }, []);

  const move = useCallback((dx, dy) => {
    initAudio();
    const g = gameRef.current;
    if (g.status !== "playing") return;
    const result = actionMove(g, dx, dy);
    if (result?.stairs) {
      const nf = result.nextFloor;
      gameRef.current = newGame(nf, result.player);
      if (nf % 5 === 0) sfx("boss");
      startMusic(nf % 5 === 0);
    }
    draw();
  }, [draw]);

  const shoot = useCallback(() => {
    initAudio();
    const g = gameRef.current;
    if (g.status !== "playing") return;
    actionShoot(g);
    draw();
  }, [draw]);

  const castSpell = useCallback(() => {
    initAudio();
    const g = gameRef.current;
    if (g.status !== "playing") return;
    const flashId = actionCastSpell(g);
    if (flashId) { draw(flashId); setTimeout(() => draw(null), 160); }
    else draw();
  }, [draw]);

  const selectSpell = useCallback((i) => {
    const g = gameRef.current;
    if (SPELLS[i].unlockAt <= g.player.level) { g.player.spell = i; draw(); }
    else { g.messages.push(`${SPELLS[i].name}: LV${SPELLS[i].unlockAt}`); draw(); }
  }, [draw]);

  const reset = useCallback(() => {
    gameRef.current = newGame(1); startMusic(false); draw();
  }, [draw]);

  useEffect(() => { document.fonts.ready.then(() => draw()); }, [draw]);

  useEffect(() => {
    const onKey = createKeyHandler({
      move, shoot, castSpell, reset, selectSpell,
      getStatus: () => gameRef.current.status,
    });
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); stopMusic(); };
  }, [move, shoot, castSpell, reset, selectSpell]);

  const onTouchStart = e => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = e => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    Math.abs(dx) > Math.abs(dy) ? move(dx > 0 ? 1 : -1, 0) : move(0, dy > 0 ? 1 : -1);
    touchRef.current = null;
  };

  const btnBase = { fontFamily: '"Press Start 2P"', cursor: "pointer", borderRadius: 4, border: "none" };
  const sz = 44;
  const panelStyle = {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 6, flexShrink: 0, padding: "0 4px",
  };
  const canvasH = isFullscreen ? "100dvh" : "calc(100dvh - 64px)";

  return (
    <div ref={containerRef}
      style={{
        display: "flex", flexDirection: "row",
        alignItems: "center", justifyContent: "center",
        width: "100%", flex: 1, gap: "0.35rem",
        ...(isFullscreen ? { background: "#040410", height: "100dvh" } : {}),
      }}>

      {/* ── Sinistra: D-pad ── */}
      <div style={panelStyle}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(3,${sz}px)`, gridTemplateRows: `repeat(3,${sz}px)`, gap: 3 }}>
          {Array.from({ length: 9 }, (_, i) => {
            const d = DPAD_DIRS.find(([gi]) => gi === i);
            return (
              <button key={i} onClick={() => d && move(d[2], d[3])}
                style={{ ...btnBase, background: d ? "#12122a" : "transparent",
                         border: d ? "2px solid #2e3a6e" : "none",
                         color: "#f0c040", fontSize: 18,
                         display: "flex", alignItems: "center", justifyContent: "center",
                         cursor: d ? "pointer" : "default" }}>
                {d ? d[1] : ""}
              </button>
            );
          })}
        </div>
        {onBackToMenu && (
          <button onClick={onBackToMenu}
            style={{ ...btnBase, background: "#0a0810", border: "2px solid #2a2060",
                     color: "#6060aa", padding: "0.3rem 0.5rem", fontSize: "0.35rem",
                     marginTop: 6, width: `${sz * 3 + 6}px` }}>
            ← MENU
          </button>
        )}
      </div>

      {/* ── Centro: canvas ── */}
      <canvas
        ref={canvasRef} width={W} height={H + HUD}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{
          imageRendering: "pixelated",
          border: "2px solid #2e3a6e",
          boxShadow: "0 0 32px rgba(60,80,200,0.25)",
          borderRadius: 4, touchAction: "none", cursor: "crosshair",
          maxHeight: canvasH, width: "auto", display: "block", flexShrink: 1,
        }}
      />

      {/* ── Destra: spell + azioni ── */}
      <div style={panelStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          {SPELLS.map((sp, i) => (
            <button key={sp.id} onClick={() => selectSpell(i)}
              style={{ ...btnBase, background: "#0a0a1e", border: "2px solid #2a3050",
                       color: "#aaa", padding: "0.3rem 0.35rem", fontSize: "0.38rem",
                       textAlign: "center", lineHeight: 1.6 }}>
              {sp.icon}<br/>{i+1}
            </button>
          ))}
        </div>
        <button onClick={shoot}
          style={{ ...btnBase, background: "#0a0800", border: "2px solid #8b6020",
                   color: "#c8a030", padding: "0.4rem 0.5rem", fontSize: "0.38rem", width: "100%" }}>
          🏹 ARCO
        </button>
        <button onClick={castSpell}
          style={{ ...btnBase, background: "#0a0a2a", border: "2px solid #3a6ee8",
                   color: "#88aaff", padding: "0.4rem 0.5rem", fontSize: "0.38rem", width: "100%" }}>
          SPELL
        </button>
        <button onClick={toggleMute}
          style={{ ...btnBase, background: "#080810", border: "2px solid #334",
                   color: muted ? "#cc4444" : "#446", padding: "0.3rem 0.5rem", fontSize: "0.7rem", width: "100%" }}>
          {muted ? "🔇" : "🔊"}
        </button>
        {isMobile && (
          <button onClick={toggleFullscreen}
            style={{ ...btnBase, background: "#08080e", border: "2px solid #2a3060",
                     color: "#334", padding: "0.3rem 0.5rem", fontSize: "0.7rem", width: "100%" }}>
            {isFullscreen ? "✕" : "⛶"}
          </button>
        )}
        <p style={{ fontFamily: '"Press Start 2P"', fontSize: "0.3rem", color: "#2a3050",
                    textAlign: "center", lineHeight: 2, margin: 0 }}>
          WASD/↑↓←→<br/>F=arco<br/>1-4 spell<br/>R reset
        </p>
      </div>
    </div>
  );
}
