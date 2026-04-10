const DEFAULT_WIDTH = 20;
const DEFAULT_HEIGHT = 20;

export const Directions = Object.freeze({
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
});

export const GameStatus = Object.freeze({
  Running: "running",
  Paused: "paused",
  GameOver: "gameover",
});

export function createGame(options = {}) {
  const width = clampInt(options.width ?? DEFAULT_WIDTH, 4, 100);
  const height = clampInt(options.height ?? DEFAULT_HEIGHT, 4, 100);
  const rng = typeof options.rng === "function" ? options.rng : Math.random;

  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);
  const snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ].filter((p) => p.x >= 0);

  const food = spawnFood({ width, height, snake, rng });

  return {
    width,
    height,
    snake,
    direction: Directions.Right,
    pendingDirection: Directions.Right,
    food,
    score: 0,
    status: GameStatus.Running,
    result: null, // "lose" | "win" | null
    tick: 0,
    rng,
  };
}

export function setPendingDirection(state, nextDirection) {
  if (!Object.values(Directions).includes(nextDirection)) return state;
  if (state.status !== GameStatus.Running && state.status !== GameStatus.Paused) return state;

  if (isOpposite(state.direction, nextDirection)) return state;
  if (state.pendingDirection === nextDirection) return state;

  return { ...state, pendingDirection: nextDirection };
}

export function togglePause(state) {
  if (state.status === GameStatus.GameOver) return state;
  return {
    ...state,
    status: state.status === GameStatus.Paused ? GameStatus.Running : GameStatus.Paused,
  };
}

export function step(state) {
  if (state.status !== GameStatus.Running) return state;

  const direction = isOpposite(state.direction, state.pendingDirection)
    ? state.direction
    : state.pendingDirection;

  const head = state.snake[0];
  const nextHead = move(head, direction);

  if (!inBounds(nextHead, state.width, state.height)) {
    return gameOver(state, "lose");
  }

  const ate = state.food && samePoint(nextHead, state.food);
  const tail = state.snake[state.snake.length - 1];
  const canMoveIntoTail = !ate && samePoint(nextHead, tail);

  for (let i = 0; i < state.snake.length; i++) {
    const segment = state.snake[i];
    if (samePoint(nextHead, segment)) {
      if (canMoveIntoTail && i === state.snake.length - 1) break;
      return gameOver(state, "lose");
    }
  }

  const nextSnake = [nextHead, ...state.snake];
  let score = state.score;
  let food = state.food;

  if (ate) {
    score += 1;
    food = spawnFood({ width: state.width, height: state.height, snake: nextSnake, rng: state.rng });
    if (!food) {
      return gameOver(
        {
          ...state,
          snake: nextSnake,
          direction,
          pendingDirection: direction,
          score,
          food: null,
          tick: state.tick + 1,
        },
        "win",
      );
    }
  } else {
    nextSnake.pop();
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    pendingDirection: direction,
    food,
    score,
    tick: state.tick + 1,
  };
}

export function restart(state, options = {}) {
  return createGame({
    width: options.width ?? state.width,
    height: options.height ?? state.height,
    rng: options.rng ?? state.rng,
  });
}

export function spawnFood({ width, height, snake, rng }) {
  const occupied = new Set(snake.map((p) => key(p)));
  const openCells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = `${x},${y}`;
      if (!occupied.has(k)) openCells.push({ x, y });
    }
  }

  if (openCells.length === 0) return null;
  const idx = Math.floor(rng() * openCells.length);
  return openCells[clampInt(idx, 0, openCells.length - 1)];
}

function gameOver(state, result) {
  return {
    ...state,
    status: GameStatus.GameOver,
    result,
  };
}

function move(point, direction) {
  switch (direction) {
    case Directions.Up:
      return { x: point.x, y: point.y - 1 };
    case Directions.Down:
      return { x: point.x, y: point.y + 1 };
    case Directions.Left:
      return { x: point.x - 1, y: point.y };
    case Directions.Right:
      return { x: point.x + 1, y: point.y };
    default:
      return point;
  }
}

function isOpposite(a, b) {
  return (
    (a === Directions.Up && b === Directions.Down) ||
    (a === Directions.Down && b === Directions.Up) ||
    (a === Directions.Left && b === Directions.Right) ||
    (a === Directions.Right && b === Directions.Left)
  );
}

function inBounds(p, width, height) {
  return p.x >= 0 && p.y >= 0 && p.x < width && p.y < height;
}

function samePoint(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function key(p) {
  return `${p.x},${p.y}`;
}

function clampInt(value, min, max) {
  const asInt = Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.min(max, Math.max(min, asInt));
}

