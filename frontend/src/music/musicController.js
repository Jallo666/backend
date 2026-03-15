import engine from "./musicEngine";
import { themes } from "./musicThemes";

export function playTheme(name) {

  const theme = themes[name];
  if (!theme) return;

  engine.playTheme(theme);

}

export function stopTheme() {
  engine.stop();
}