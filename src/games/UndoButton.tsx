/**
 * Shared "Undo" control for single-player puzzle / sort / card games.
 * Uses the legacy in-game button styling (`.btn`) so it matches the dark boards.
 */
export function UndoButton({ onUndo, canUndo }: { onUndo: () => void; canUndo: boolean }) {
  return (
    <button className="btn btn-ghost" onClick={onUndo} disabled={!canUndo} aria-label="Undo last move">
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>undo</span>
      Undo
    </button>
  );
}
