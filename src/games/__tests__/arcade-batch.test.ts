import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as snake from '../snake/logic';
import { BASE_WORDS, solutionsFor } from '../word-finder/words';

describe('snake', () => {
  it('eating food grows the snake and increments score', () => {
    const rng = makeRng(5);
    let s = snake.initState(rng);
    // place food directly ahead of the head (moving right)
    s = { ...s, food: { x: s.snake[0].x + 1, y: s.snake[0].y } };
    const len0 = s.snake.length;
    const ns = snake.step(s, 'R', rng);
    expect(ns.score).toBe(1);
    expect(ns.snake.length).toBe(len0 + 1);
    expect(ns.dead).toBe(false);
  });
  it('hitting a wall is fatal', () => {
    const rng = makeRng(1);
    let s = snake.initState(rng);
    s = { ...s, snake: [{ x: snake.N - 1, y: 5 }, { x: snake.N - 2, y: 5 }], dir: 'R' };
    expect(snake.step(s, 'R', rng).dead).toBe(true);
  });
  it('a reversing input is ignored (keeps direction)', () => {
    const rng = makeRng(2);
    const s = snake.initState(rng); // dir R
    expect(snake.step(s, 'L', rng).dir).toBe('R');
  });
  it('botDir returns a non-fatal move', () => {
    const rng = makeRng(9);
    const s = snake.initState(rng);
    const d = snake.botDir(s);
    expect(snake.step(s, d, rng).dead).toBe(false);
  });
});

describe('word-link (dictionary reuse)', () => {
  it('every base word yields its own letters as a solution and a non-empty set', () => {
    for (const base of BASE_WORDS) {
      const sols = solutionsFor(base);
      expect(sols.length).toBeGreaterThan(0);
      expect(sols).toContain(base);
    }
  });
});
