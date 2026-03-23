import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTurn,
  createInitialState,
  queueDirection,
  tick,
  placeFood,
} from '../src/snakeLogic.js';

function rngFromSequence(values) {
  let idx = 0;
  return () => {
    const value = values[idx] ?? values[values.length - 1] ?? 0;
    idx += 1;
    return value;
  };
}

test('snake moves forward one cell on tick', () => {
  const state = createInitialState(10, () => 0);
  const running = { ...state, isRunning: true };
  const next = tick(running, () => 0);

  assert.equal(next.snake[0].x, state.snake[0].x + 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
  assert.equal(next.snake.length, state.snake.length);
});

test('snake grows and score increments after eating food', () => {
  const state = createInitialState(10, () => 0);
  const head = state.snake[0];
  const running = {
    ...state,
    isRunning: true,
    food: { x: head.x + 1, y: head.y },
  };

  const next = tick(running, rngFromSequence([0]));

  assert.equal(next.score, 1);
  assert.equal(next.snake.length, state.snake.length + 1);
});

test('opposite direction turn is blocked', () => {
  const state = createInitialState(10, () => 0);
  assert.equal(canTurn('right', 'left'), false);
  const next = queueDirection(state, 'left');
  assert.equal(next.queuedDirection, 'right');
});

test('wall collision ends game', () => {
  const state = {
    size: 5,
    snake: [{ x: 4, y: 2 }],
    direction: 'right',
    queuedDirection: 'right',
    food: { x: 0, y: 0 },
    score: 0,
    isRunning: true,
    isGameOver: false,
  };

  const next = tick(state, () => 0);
  assert.equal(next.isGameOver, true);
  assert.equal(next.isRunning, false);
});

test('food placement avoids snake cells', () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  const food = placeFood(snake, 3, () => 0);
  const occupied = snake.some((s) => s.x === food.x && s.y === food.y);
  assert.equal(occupied, false);
});
