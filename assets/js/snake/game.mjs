import {
  createGame,
  Directions,
  GameStatus,
  restart,
  setPendingDirection,
  step,
  togglePause,
} from "./logic.mjs";

const TICK_MS = 120;
const DEFAULT_BOARD = { width: 20, height: 20 };

function init() {
  const root = document.querySelector("[data-snake-game]");
  if (!root) return;

  const gridEl = root.querySelector("[data-snake-grid]");
  const scoreEl = root.querySelector("[data-snake-score]");
  const statusEl = root.querySelector("[data-snake-status]");
  const pauseBtn = root.querySelector("[data-action='pause']");
  const restartBtn = root.querySelector("[data-action='restart']");

  if (!gridEl || !scoreEl || !statusEl || !pauseBtn || !restartBtn) return;

  let state = createGame(DEFAULT_BOARD);
  let lastMarked = new Set();

  const cellEls = createGrid(gridEl, state.width, state.height);

  function render(nextState) {
    scoreEl.textContent = String(nextState.score);
    statusEl.textContent =
      nextState.status === GameStatus.GameOver
        ? nextState.result === "win"
          ? "You win"
          : "Game over"
        : nextState.status === GameStatus.Paused
          ? "Paused"
          : "Playing";

    pauseBtn.textContent = nextState.status === GameStatus.Paused ? "Resume" : "Pause";
    gridEl.setAttribute("aria-label", `Snake game grid. Score ${nextState.score}. ${statusEl.textContent}.`);

    for (const idx of lastMarked) {
      const el = cellEls[idx];
      if (!el) continue;
      el.classList.remove("snake-cell--snake", "snake-cell--head", "snake-cell--food");
    }
    lastMarked = new Set();

    for (let i = 0; i < nextState.snake.length; i++) {
      const p = nextState.snake[i];
      const idx = p.y * nextState.width + p.x;
      const el = cellEls[idx];
      if (!el) continue;
      el.classList.add("snake-cell--snake");
      if (i === 0) el.classList.add("snake-cell--head");
      lastMarked.add(idx);
    }

    if (nextState.food) {
      const idx = nextState.food.y * nextState.width + nextState.food.x;
      const el = cellEls[idx];
      if (el) {
        el.classList.add("snake-cell--food");
        lastMarked.add(idx);
      }
    }
  }

  function doRestart() {
    state = restart(state);
    render(state);
  }

  function doPauseToggle() {
    state = togglePause(state);
    render(state);
  }

  pauseBtn.addEventListener("click", () => {
    gridEl.focus();
    doPauseToggle();
  });
  restartBtn.addEventListener("click", () => {
    gridEl.focus();
    doRestart();
  });

  root.querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      gridEl.focus();
      const dir = btn.getAttribute("data-dir");
      state = setPendingDirection(state, dir);
      render(state);
    });
  });

  gridEl.addEventListener("click", () => gridEl.focus());
  gridEl.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    const dir =
      key === "arrowup" || key === "w"
        ? Directions.Up
        : key === "arrowdown" || key === "s"
          ? Directions.Down
          : key === "arrowleft" || key === "a"
            ? Directions.Left
            : key === "arrowright" || key === "d"
              ? Directions.Right
              : null;

    if (dir) {
      e.preventDefault();
      state = setPendingDirection(state, dir);
      render(state);
      return;
    }

    if (key === " " || key === "p") {
      e.preventDefault();
      doPauseToggle();
      return;
    }

    if (key === "r" || key === "enter") {
      if (state.status === GameStatus.GameOver || key === "r") {
        e.preventDefault();
        doRestart();
      }
    }
  });

  render(state);

  setInterval(() => {
    if (state.status !== GameStatus.Running) return;
    state = step(state);
    render(state);
  }, TICK_MS);
}

function createGrid(gridEl, width, height) {
  gridEl.style.setProperty("--snake-cols", String(width));
  gridEl.style.setProperty("--snake-rows", String(height));

  const fragment = document.createDocumentFragment();
  const cellEls = [];
  for (let i = 0; i < width * height; i++) {
    const cell = document.createElement("div");
    cell.className = "snake-cell";
    fragment.appendChild(cell);
    cellEls.push(cell);
  }
  gridEl.textContent = "";
  gridEl.appendChild(fragment);
  return cellEls;
}

init();

