export const BOARD_SIZE = 20;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function createInitialState(size = BOARD_SIZE, rng = Math.random) {
  const center = Math.floor(size / 2);
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ];

  return {
    size,
    snake,
    direction: 'right',
    queuedDirection: 'right',
    food: placeFood(snake, size, rng),
    score: 0,
    isRunning: false,
    isGameOver: false,
  };
}

export function canTurn(from, to) {
  const a = DIRECTIONS[from];
  const b = DIRECTIONS[to];
  return !(a.x + b.x === 0 && a.y + b.y === 0);
}

export function queueDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) return state;
  if (!canTurn(state.direction, nextDirection)) return state;
  return { ...state, queuedDirection: nextDirection };
}

export function tick(state, rng = Math.random) {
  if (!state.isRunning || state.isGameOver) return state;

  const direction = canTurn(state.direction, state.queuedDirection)
    ? state.queuedDirection
    : state.direction;

  const step = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + step.x, y: head.y + step.y };

  if (hitsWall(nextHead, state.size) || hitsSelf(nextHead, state.snake)) {
    return {
      ...state,
      direction,
      isRunning: false,
      isGameOver: true,
    };
  }

  const ateFood = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const grownSnake = [nextHead, ...state.snake];
  const snake = ateFood ? grownSnake : grownSnake.slice(0, -1);

  return {
    ...state,
    direction,
    snake,
    food: ateFood ? placeFood(snake, state.size, rng) : state.food,
    score: ateFood ? state.score + 1 : state.score,
  };
}

export function placeFood(snake, size, rng = Math.random) {
  const occupied = new Set(snake.map((seg) => `${seg.x},${seg.y}`));
  const freeCells = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) freeCells.push({ x, y });
    }
  }

  if (freeCells.length === 0) return { x: -1, y: -1 };
  const idx = Math.floor(rng() * freeCells.length);
  return freeCells[idx];
}

export function hitsWall(pos, size) {
  return pos.x < 0 || pos.y < 0 || pos.x >= size || pos.y >= size;
}

export function hitsSelf(head, snake) {
  return snake.some((seg) => seg.x === head.x && seg.y === head.y);
}
