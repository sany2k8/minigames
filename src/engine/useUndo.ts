import { useRef, useState } from 'react';

/**
 * A tiny snapshot/undo stack for single-player puzzle games.
 *
 * Each game calls `record(snapshot)` with the relevant state *before* applying a
 * move, then `undo()` pops the last snapshot so the game can restore it. `canUndo`
 * is reactive so an Undo button can disable itself when there's nothing to undo.
 * `clear()` resets the stack (e.g. on rematch / new seed remount — though the
 * `key={seed}` remount usually handles that for free).
 */
export function useUndo<T>() {
  const stack = useRef<T[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  return {
    canUndo,
    record(snapshot: T) {
      stack.current.push(snapshot);
      setCanUndo(true);
    },
    undo(): T | undefined {
      const prev = stack.current.pop();
      setCanUndo(stack.current.length > 0);
      return prev;
    },
    clear() {
      stack.current = [];
      setCanUndo(false);
    }
  };
}

export type UndoController<T> = ReturnType<typeof useUndo<T>>;
