import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { type Board, botMove, finalize, initBoard, isOver, legalMoves, ownPit, sow } from './logic';
import '../games.css';

function MancalaTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const [board, setBoard] = useState<Board>(initBoard);
  const [turn, setTurn] = useState(0);
  const over = useRef(false);

  const cur = seats[turn];

  const finish = (b: Board) => {
    over.current = true;
    const fb = finalize(b);
    setBoard(fb);
    setTimeout(() => onGameOver(fb[6] === fb[13] ? -1 : seats[fb[6] > fb[13] ? 0 : 1].seat), 600);
  };

  const play = (pit: number) => {
    if (over.current || !ownPit(turn, pit) || board[pit] === 0) return;
    const res = sow(board, turn, pit);
    setBoard(res.board);
    if (isOver(res.board)) {
      finish(res.board);
      return;
    }
    if (!res.extraTurn) setTurn((t) => (t + 1) % 2);
  };
  const playRef = useRef(play);
  playRef.current = play;

  useEffect(() => {
    if (over.current || cur.kind !== 'bot') return;
    if (legalMoves(board, turn).length === 0) return;
    const t = setTimeout(() => {
      const m = botMove(board, turn, cur.difficulty);
      if (m >= 0) playRef.current(m);
    }, botTickMs[cur.difficulty] + 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn]);

  const Pit = ({ i }: { i: number }) => {
    const mine = ownPit(turn, i) && cur.kind === 'human';
    return (
      <button
        className={`mc-pit ${mine && board[i] > 0 ? 'playable' : ''}`}
        onClick={() => cur.kind === 'human' && play(i)}
        disabled={!mine || board[i] === 0}
      >
        <span className="mc-seeds">{board[i]}</span>
      </button>
    );
  };

  return (
    <div className="board">
      <div className="mm-scores">
        {seats.map((p, i) => (
          <div key={p.seat} className={`mm-score ${i === turn ? 'on' : ''}`} style={{ color: p.color }}>
            <span className="mm-name">{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
            <span className="mm-pts">{board[i === 0 ? 6 : 13]}</span>
          </div>
        ))}
      </div>
      <div className="mc-board">
        <div className="mc-store mc-store-l" style={{ color: seats[1].color }}>
          <span className="mc-seeds big">{board[13]}</span>
        </div>
        <div className="mc-mid">
          <div className="mc-row">
            {[12, 11, 10, 9, 8, 7].map((i) => (
              <Pit key={i} i={i} />
            ))}
          </div>
          <div className="mc-row">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Pit key={i} i={i} />
            ))}
          </div>
        </div>
        <div className="mc-store mc-store-r" style={{ color: seats[0].color }}>
          <span className="mc-seeds big">{board[6]}</span>
        </div>
      </div>
      <div className="hint">{cur.name}, pick a pit on your side to sow</div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: MancalaTable };
export default mod;
