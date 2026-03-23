import {
  BOARD_SIZE,
  createInitialState,
  queueDirection,
  tick,
} from './snakeLogic.js';

const TICK_MS = 120;
const KEY_TO_DIRECTION = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};

const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const gridEl = document.getElementById('grid');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const controlBtns = document.querySelectorAll('[data-dir]');

let state = createInitialState(BOARD_SIZE);
let intervalId = null;

const cells = [];
for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i += 1) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cells.push(cell);
  gridEl.appendChild(cell);
}

function cellIndex(x, y) {
  return y * BOARD_SIZE + x;
}

function render() {
  for (const cell of cells) cell.className = 'cell';

  const { x: fx, y: fy } = state.food;
  if (fx >= 0 && fy >= 0) {
    cells[cellIndex(fx, fy)].classList.add('food');
  }

  for (const segment of state.snake) {
    cells[cellIndex(segment.x, segment.y)].classList.add('snake');
  }

  scoreEl.textContent = String(state.score);
  if (state.isGameOver) {
    statusEl.textContent = 'Game over';
  } else if (state.isRunning) {
    statusEl.textContent = 'Running';
  } else {
    statusEl.textContent = 'Paused';
  }
}

function runTick() {
  state = tick(state);
  render();
  if (state.isGameOver) stop();
}

function start() {
  if (state.isGameOver) return;
  if (state.isRunning) return;
  state = { ...state, isRunning: true };
  intervalId = setInterval(runTick, TICK_MS);
  render();
}

function stop() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  state = { ...state, isRunning: false };
  render();
}

function restart() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  state = createInitialState(BOARD_SIZE);
  render();
}

document.addEventListener('keydown', (event) => {
  const nextDirection = KEY_TO_DIRECTION[event.key];
  if (!nextDirection) return;
  event.preventDefault();
  state = queueDirection(state, nextDirection);
  if (!state.isGameOver && !state.isRunning) start();
});

startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', stop);
restartBtn.addEventListener('click', restart);

for (const btn of controlBtns) {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.dir;
    state = queueDirection(state, dir);
    if (!state.isGameOver && !state.isRunning) start();
  });
}

render();
