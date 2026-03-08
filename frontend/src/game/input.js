const DIRS = {
  ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
  w: [0,-1], s: [0,1], a: [-1,0], d: [1,0],
  W: [0,-1], S: [0,1], A: [-1,0], D: [1,0],
};

export const DPAD_DIRS = [[1,"↑",0,-1],[3,"←",-1,0],[5,"→",1,0],[7,"↓",0,1]];

export function createKeyHandler({ move, shoot, castSpell, reset, selectSpell, getStatus }) {
  return function onKey(e) {
    if ((e.key === "r" || e.key === "R") && getStatus() === "dead") { reset(); return; }
    if (e.key === " ") { e.preventDefault(); castSpell(); return; }
    if (e.key === "f" || e.key === "F") { shoot(); return; }
    if (["1","2","3","4"].includes(e.key)) { selectSpell(+e.key - 1); return; }
    const dir = DIRS[e.key];
    if (dir) { e.preventDefault(); move(...dir); }
  };
}
