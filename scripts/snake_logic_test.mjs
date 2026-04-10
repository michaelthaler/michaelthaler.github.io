import assert from "node:assert/strict";
import { createGame, Directions, setPendingDirection, spawnFood, step } from "../assets/js/snake/logic.mjs";

function makeRng(sequence) {
  let i = 0;
  return () => {
    const v = sequence[i] ?? 0;
    i += 1;
    return v;
  };
}

function testMoveAndScore() {
  let state = createGame({ width: 6, height: 6, rng: makeRng([0]) });
  const nextHead = { x: state.snake[0].x + 1, y: state.snake[0].y };
  state = { ...state, food: nextHead };
  state = step(state);
  assert.equal(state.score, 1);
  assert.equal(state.snake.length, 4);
}

function testNoReverse() {
  let state = createGame({ width: 6, height: 6, rng: makeRng([0]) });
  state = setPendingDirection(state, Directions.Left);
  state = step(state);
  assert.equal(state.direction, Directions.Right);
}

function testWallCollision() {
  let state = createGame({ width: 4, height: 4, rng: makeRng([0]) });
  state = { ...state, snake: [{ x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }] };
  state = step(state);
  assert.equal(state.status, "gameover");
}

function testFoodNotOnSnake() {
  const rng = makeRng([0]);
  const food = spawnFood({
    width: 4,
    height: 4,
    snake: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
    rng,
  });
  assert.ok(food);
  assert.notEqual(food.y, 0);
}

testMoveAndScore();
testNoReverse();
testWallCollision();
testFoodNotOnSnake();

console.log("snake logic tests: ok");

