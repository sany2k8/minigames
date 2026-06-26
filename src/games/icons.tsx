/**
 * Decorative SVG tile art for each game. Pure presentational, no deps.
 * Each fills a 100x100 viewBox and is rendered inside a rounded gradient tile.
 */
import type { ComponentType } from 'react';

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
    {children}
  </svg>
);

export const ColorCardsIcon = () => (
  <Wrap>
    <rect x="20" y="28" width="34" height="48" rx="6" fill="#fff" transform="rotate(-12 37 52)" />
    <rect x="33" y="26" width="34" height="48" rx="6" fill="#ffd166" transform="rotate(-2 50 50)" />
    <rect x="46" y="24" width="34" height="48" rx="6" fill="#ff5d73" transform="rotate(10 63 48)" />
    <text x="63" y="54" fontSize="22" fontWeight="900" fill="#fff" textAnchor="middle" transform="rotate(10 63 48)">+4</text>
  </Wrap>
);

export const WaterSortIcon = () => (
  <Wrap>
    {[18, 42, 66].map((x, i) => (
      <g key={x}>
        <rect x={x} y="20" width="16" height="60" rx="8" fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth="2" />
        <rect x={x} y={40 + i * 6} width="16" height={40 - i * 6} fill={['#41d3bd', '#ffd166', '#ff5d73'][i]} />
        <rect x={x} y={56} width="16" height={24} fill={['#6c5cff', '#41a0ff', '#51e08a'][i]} />
      </g>
    ))}
  </Wrap>
);

export const ColorBlocksIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="22" height="22" rx="4" fill="#ff8c42" />
    <rect x="40" y="16" width="22" height="22" rx="4" fill="#41d3bd" />
    <rect x="64" y="16" width="22" height="22" rx="4" fill="#8367ff" />
    <rect x="16" y="40" width="22" height="22" rx="4" fill="#ffd166" />
    <rect x="64" y="40" width="22" height="22" rx="4" fill="#ff5d73" />
    <rect x="40" y="64" width="22" height="22" rx="4" fill="#41a0ff" />
    <rect x="64" y="64" width="22" height="22" rx="4" fill="#51e08a" />
  </Wrap>
);

export const NutsAndBoltsIcon = () => (
  <Wrap>
    {[26, 50, 74].map((x, i) => (
      <g key={x}>
        <rect x={x - 3} y="18" width="6" height="64" rx="3" fill="#9aa3c7" />
        {[0, 1, 2].map((j) => (
          <polygon
            key={j}
            points={hex(x, 64 - j * 16, 11)}
            fill={['#ff5d73', '#41d3bd', '#ffd166', '#8367ff'][(i + j) % 4]}
            stroke="#0b1026"
            strokeWidth="1.5"
          />
        ))}
      </g>
    ))}
  </Wrap>
);

export const MazePaintIcon = () => (
  <Wrap>
    <rect x="14" y="14" width="72" height="72" rx="8" fill="rgba(255,255,255,0.06)" />
    <path d="M22 22 H54 V38 H38 V54 H62 V38 H78 V70 H30 V54 H46" fill="none" stroke="#41d3bd" strokeWidth="9" strokeLinecap="square" />
    <circle cx="46" cy="54" r="7" fill="#fff" />
  </Wrap>
);

export const WordFinderIcon = () => (
  <Wrap>
    <circle cx="50" cy="58" r="30" fill="#ffd166" />
    {[
      ['R', 30, 58],
      ['E', 50, 42],
      ['E', 50, 74],
      ['P', 70, 58],
      ['U', 50, 58]
    ].map(([c, x, y]) => (
      <text key={`${x}-${y}`} x={x as number} y={(y as number) + 6} fontSize="16" fontWeight="900" fill="#7a3e00" textAnchor="middle">
        {c}
      </text>
    ))}
    <line x1="30" y1="58" x2="50" y2="58" stroke="#ff5d73" strokeWidth="4" />
    <line x1="50" y1="58" x2="50" y2="42" stroke="#ff5d73" strokeWidth="4" />
  </Wrap>
);

function hex(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export const Merge2048Icon = () => (
  <Wrap>
    <rect x="14" y="14" width="34" height="34" rx="6" fill="#46559e" />
    <rect x="52" y="14" width="34" height="34" rx="6" fill="#5a6cff" />
    <rect x="14" y="52" width="34" height="34" rx="6" fill="#9b4ddb" />
    <rect x="52" y="52" width="34" height="34" rx="6" fill="#ffd166" />
    <text x="31" y="38" fontSize="15" fontWeight="900" fill="#fff" textAnchor="middle">2</text>
    <text x="69" y="38" fontSize="15" fontWeight="900" fill="#fff" textAnchor="middle">4</text>
    <text x="31" y="76" fontSize="15" fontWeight="900" fill="#fff" textAnchor="middle">8</text>
    <text x="69" y="76" fontSize="13" fontWeight="900" fill="#5a3200" textAnchor="middle">16</text>
  </Wrap>
);

export const BlockBlastIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="20" height="20" rx="4" fill="#ff8c42" />
    <rect x="40" y="16" width="20" height="20" rx="4" fill="#ff5d73" />
    <rect x="64" y="16" width="20" height="20" rx="4" fill="#ffd166" />
    <rect x="16" y="40" width="20" height="20" rx="4" fill="#41d3bd" />
    <rect x="64" y="40" width="20" height="20" rx="4" fill="#8367ff" />
    <rect x="16" y="64" width="20" height="20" rx="4" fill="#41a0ff" />
    <rect x="40" y="64" width="20" height="20" rx="4" fill="#51e08a" />
    <circle cx="50" cy="50" r="9" fill="#fff" opacity="0.9" />
  </Wrap>
);

export const TrafficJamIcon = () => (
  <Wrap>
    <rect x="12" y="12" width="76" height="76" rx="10" fill="rgba(255,255,255,0.06)" />
    <rect x="20" y="44" width="40" height="14" rx="5" fill="#ff4d4d" />
    <rect x="66" y="20" width="14" height="40" rx="5" fill="#41d3bd" />
    <rect x="24" y="66" width="40" height="14" rx="5" fill="#ffd166" />
    <rect x="20" y="20" width="14" height="18" rx="5" fill="#8367ff" />
    <text x="80" y="56" fontSize="14" fontWeight="900" fill="#51e08a" textAnchor="middle">›</text>
  </Wrap>
);

export const MemoryMatchIcon = () => (
  <Wrap>
    <rect x="16" y="18" width="30" height="40" rx="6" fill="#2b3676" stroke="#fff" strokeWidth="2" transform="rotate(-6 31 38)" />
    <rect x="54" y="22" width="30" height="40" rx="6" fill="#2f9e4f" stroke="#fff" strokeWidth="2" transform="rotate(6 69 42)" />
    <text x="69" y="48" fontSize="20" textAnchor="middle">★</text>
    <text x="31" y="44" fontSize="18" fill="#fff" textAnchor="middle" transform="rotate(-6 31 38)">?</text>
    <text x="50" y="84" fontSize="16" textAnchor="middle">★</text>
  </Wrap>
);

export const TicTacToeIcon = () => (
  <Wrap>
    <line x1="38" y1="16" x2="38" y2="84" stroke="#6f79b0" strokeWidth="4" strokeLinecap="round" />
    <line x1="62" y1="16" x2="62" y2="84" stroke="#6f79b0" strokeWidth="4" strokeLinecap="round" />
    <line x1="16" y1="38" x2="84" y2="38" stroke="#6f79b0" strokeWidth="4" strokeLinecap="round" />
    <line x1="16" y1="62" x2="84" y2="62" stroke="#6f79b0" strokeWidth="4" strokeLinecap="round" />
    <text x="27" y="34" fontSize="22" fontWeight="900" fill="#41a0ff" textAnchor="middle">✕</text>
    <text x="73" y="78" fontSize="22" fontWeight="900" fill="#ff6b9d" textAnchor="middle">◯</text>
    <text x="50" y="56" fontSize="20" fontWeight="900" fill="#41a0ff" textAnchor="middle">✕</text>
  </Wrap>
);

export const DotsBoxesIcon = () => {
  const dots = [22, 50, 78];
  return (
    <Wrap>
      {dots.map((y) => dots.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#aab2e0" />))}
      <line x1="22" y1="22" x2="50" y2="22" stroke="#41d3bd" strokeWidth="4" strokeLinecap="round" />
      <line x1="22" y1="22" x2="22" y2="50" stroke="#41d3bd" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="22" x2="50" y2="50" stroke="#41d3bd" strokeWidth="4" strokeLinecap="round" />
      <line x1="22" y1="50" x2="50" y2="50" stroke="#41d3bd" strokeWidth="4" strokeLinecap="round" />
      <rect x="26" y="26" width="20" height="20" rx="3" fill="#41a0ff" opacity="0.8" />
      <text x="36" y="42" fontSize="14" fontWeight="900" fill="#fff" textAnchor="middle">✕</text>
    </Wrap>
  );
};

export const WordleIcon = () => (
  <Wrap>
    <rect x="16" y="20" width="20" height="20" rx="4" fill="#2f9e4f" />
    <rect x="40" y="20" width="20" height="20" rx="4" fill="#6f79b0" />
    <rect x="64" y="20" width="20" height="20" rx="4" fill="#d99e00" />
    <rect x="16" y="44" width="20" height="20" rx="4" fill="#6f79b0" />
    <rect x="40" y="44" width="20" height="20" rx="4" fill="#2f9e4f" />
    <rect x="64" y="44" width="20" height="20" rx="4" fill="#6f79b0" />
    <text x="26" y="35" fontSize="13" fontWeight="900" fill="#fff" textAnchor="middle">W</text>
    <text x="50" y="59" fontSize="13" fontWeight="900" fill="#fff" textAnchor="middle">O</text>
    <text x="74" y="35" fontSize="13" fontWeight="900" fill="#fff" textAnchor="middle">D</text>
  </Wrap>
);

export const PipeManiaIcon = () => (
  <Wrap>
    <rect x="14" y="14" width="72" height="72" rx="10" fill="rgba(255,255,255,0.06)" />
    <path d="M20 36 H50 V64 H80" fill="none" stroke="#41d3bd" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="36" r="7" fill="#41a0ff" />
    <circle cx="80" cy="64" r="8" fill="#ff6b9d" />
    <path d="M34 64 H40" stroke="#7a85b8" strokeWidth="9" strokeLinecap="round" />
  </Wrap>
);

export const FlowFreeIcon = () => (
  <Wrap>
    <rect x="14" y="14" width="72" height="72" rx="10" fill="#0a0d1e" />
    <path d="M28 28 H72 V50 H40 V72" fill="none" stroke="#ff5d73" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 50 V72 H30" fill="none" stroke="#41a0ff" strokeWidth="10" strokeLinecap="round" />
    <circle cx="28" cy="28" r="8" fill="#ff5d73" />
    <circle cx="40" cy="72" r="8" fill="#ff5d73" />
    <circle cx="28" cy="50" r="7" fill="#41a0ff" />
  </Wrap>
);

export const MancalaIcon = () => (
  <Wrap>
    <rect x="10" y="34" width="80" height="32" rx="16" fill="#6b4423" />
    {[28, 44, 60, 76].map((x) => (
      <circle key={x} cx={x} cy="50" r="6" fill="#2a1a0e" />
    ))}
    <circle cx="20" cy="50" r="3" fill="#ffd166" />
    <circle cx="50" cy="46" r="3" fill="#ffd166" />
    <circle cx="68" cy="54" r="3" fill="#ffd166" />
  </Wrap>
);

export const ReversiIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="8" fill="#1f7a47" />
    <circle cx="36" cy="36" r="13" fill="#0b0e1a" />
    <circle cx="64" cy="36" r="13" fill="#fff" />
    <circle cx="36" cy="64" r="13" fill="#fff" />
    <circle cx="64" cy="64" r="13" fill="#0b0e1a" />
  </Wrap>
);

export const GolfSolitaireIcon = () => (
  <Wrap>
    <rect x="18" y="24" width="30" height="42" rx="5" fill="#fff" transform="rotate(-10 33 45)" />
    <rect x="36" y="22" width="30" height="42" rx="5" fill="#fff" transform="rotate(4 51 43)" />
    <text x="51" y="50" fontSize="18" fontWeight="900" fill="#d83a3a" textAnchor="middle" transform="rotate(4 51 43)">7</text>
    <text x="33" y="52" fontSize="16" fontWeight="900" fill="#1b2240" textAnchor="middle" transform="rotate(-10 33 45)">6</text>
    <circle cx="68" cy="74" r="10" fill="#51e08a" />
  </Wrap>
);

export const SudokuMiniIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="8" fill="rgba(255,255,255,0.06)" stroke="#6f79b0" strokeWidth="2" />
    <line x1="39" y1="16" x2="39" y2="84" stroke="#6f79b0" strokeWidth="2" />
    <line x1="62" y1="16" x2="62" y2="84" stroke="#6f79b0" strokeWidth="2" />
    <line x1="16" y1="50" x2="84" y2="50" stroke="#6f79b0" strokeWidth="2" />
    {[['5', 28, 38], ['3', 73, 38], ['1', 50, 74], ['6', 28, 74]].map(([n, x, y]) => (
      <text key={`${x}-${y}`} x={x as number} y={y as number} fontSize="16" fontWeight="900" fill="#41d3bd" textAnchor="middle">{n}</text>
    ))}
  </Wrap>
);

export const KnifeHitIcon = () => (
  <Wrap>
    <circle cx="50" cy="40" r="24" fill="#6b4423" stroke="#4a2f18" strokeWidth="4" />
    <circle cx="50" cy="40" r="9" fill="#8a5a2b" />
    <rect x="47" y="60" width="6" height="26" rx="2" fill="#c4cad8" />
    <polygon points="44,60 56,60 50,52" fill="#e6ebff" />
    <rect x="47" y="14" width="6" height="14" rx="2" fill="#9aa3c7" />
  </Wrap>
);

export const FloodItIcon = () => {
  const cols = ['#ff5d73', '#41a0ff', '#ffd166', '#51e08a'];
  return (
    <Wrap>
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={14 + c * 18} y={14 + r * 18} width="17" height="17" rx="3" fill={cols[(r + c) % 4]} />
        ))
      )}
    </Wrap>
  );
};

export const NonogramIcon = () => (
  <Wrap>
    <rect x="22" y="22" width="56" height="56" rx="6" fill="rgba(255,255,255,0.06)" />
    {[
      [1, 0, 0, 1, 0],
      [0, 1, 1, 0, 0],
      [1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1]
    ].map((row, r) =>
      row.map((v, c) =>
        v ? <rect key={`${r}-${c}`} x={24 + c * 10.6} y={24 + r * 10.6} width="9.6" height="9.6" rx="2" fill="#41d3bd" /> : null
      )
    )}
  </Wrap>
);

export const PegSolitaireIcon = () => {
  const pegs: [number, number][] = [
    [50, 24], [38, 38], [62, 38], [26, 50], [74, 50], [38, 62], [62, 62], [50, 76]
  ];
  return (
    <Wrap>
      <rect x="20" y="20" width="60" height="60" rx="14" fill="rgba(255,255,255,0.06)" />
      {pegs.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill="#c4843f" />
      ))}
      <circle cx="50" cy="50" r="7" fill="#1a1f3a" stroke="#41d3bd" strokeWidth="2" />
    </Wrap>
  );
};

export const BattleshipIcon = () => (
  <Wrap>
    <rect x="14" y="14" width="72" height="72" rx="10" fill="#14306b" />
    {[26, 50, 74].map((y) => [26, 50, 74].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#2a4a9b" />))}
    <rect x="20" y="44" width="40" height="12" rx="6" fill="#6f79b0" />
    <circle cx="70" cy="30" r="9" fill="#ff5d73" />
    <text x="70" y="35" fontSize="11" fill="#fff" textAnchor="middle">🔥</text>
    <circle cx="30" cy="72" r="6" fill="#2a3878" />
  </Wrap>
);

export const SimonSaysIcon = () => (
  <Wrap>
    <path d="M50 12 A38 38 0 0 1 88 50 L50 50 Z" fill="#ff5d73" />
    <path d="M88 50 A38 38 0 0 1 50 88 L50 50 Z" fill="#41a0ff" />
    <path d="M50 88 A38 38 0 0 1 12 50 L50 50 Z" fill="#51e08a" />
    <path d="M12 50 A38 38 0 0 1 50 12 L50 50 Z" fill="#ffd166" />
    <circle cx="50" cy="50" r="14" fill="#0e1430" />
  </Wrap>
);

export const WhackAMoleIcon = () => (
  <Wrap>
    <rect x="16" y="56" width="68" height="30" rx="10" fill="#3a2412" />
    <ellipse cx="34" cy="60" rx="13" ry="7" fill="#1a0f08" />
    <ellipse cx="66" cy="60" rx="13" ry="7" fill="#1a0f08" />
    <circle cx="34" cy="50" r="13" fill="#a87b4a" />
    <circle cx="30" cy="48" r="2.5" fill="#1a0f08" />
    <circle cx="38" cy="48" r="2.5" fill="#1a0f08" />
    <text x="66" y="56" fontSize="20" textAnchor="middle">💣</text>
  </Wrap>
);

export const BlockuDokuIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="6" fill="rgba(255,255,255,0.06)" stroke="#6f79b0" strokeWidth="2" />
    <line x1="39" y1="16" x2="39" y2="84" stroke="#6f79b0" strokeWidth="2" />
    <line x1="61" y1="16" x2="61" y2="84" stroke="#6f79b0" strokeWidth="2" />
    <line x1="16" y1="39" x2="84" y2="39" stroke="#6f79b0" strokeWidth="2" />
    <line x1="16" y1="61" x2="84" y2="61" stroke="#6f79b0" strokeWidth="2" />
    <rect x="18" y="18" width="19" height="19" rx="3" fill="#ff8c42" />
    <rect x="41" y="41" width="19" height="19" rx="3" fill="#41d3bd" />
    <rect x="63" y="63" width="19" height="19" rx="3" fill="#8367ff" />
    <rect x="63" y="18" width="19" height="19" rx="3" fill="#ffd166" />
  </Wrap>
);

export const MinesweeperIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="8" fill="#2a3878" />
    {[28, 50, 72].map((x) => [28, 50, 72].map((y) => <rect key={`${x}-${y}`} x={x - 9} y={y - 9} width="18" height="18" rx="3" fill="rgba(255,255,255,0.08)" />))}
    <circle cx="50" cy="50" r="9" fill="#1a1f3a" />
    <text x="50" y="55" fontSize="13" textAnchor="middle">💣</text>
    <text x="28" y="33" fontSize="13" fontWeight="900" fill="#41a0ff" textAnchor="middle">1</text>
    <text x="72" y="77" fontSize="13" fontWeight="900" fill="#ff5d73" textAnchor="middle">3</text>
  </Wrap>
);

export const MahjongIcon = () => (
  <Wrap>
    <rect x="20" y="26" width="26" height="36" rx="5" fill="#eef1ff" transform="rotate(-4 33 44)" />
    <rect x="38" y="22" width="26" height="36" rx="5" fill="#fff" />
    <rect x="54" y="28" width="26" height="36" rx="5" fill="#dfe5ff" transform="rotate(5 67 46)" />
    <text x="51" y="46" fontSize="20" textAnchor="middle">🀄</text>
  </Wrap>
);

export const GoodsMatchIcon = () => (
  <Wrap>
    <rect x="14" y="20" width="72" height="44" rx="8" fill="rgba(255,255,255,0.06)" />
    <text x="32" y="46" fontSize="20" textAnchor="middle">🍎</text>
    <text x="52" y="42" fontSize="20" textAnchor="middle">🥛</text>
    <text x="70" y="48" fontSize="20" textAnchor="middle">🍞</text>
    <rect x="26" y="70" width="48" height="16" rx="6" fill="#41d3bd" />
  </Wrap>
);

export const HexaSortIcon = () => {
  const hex = (cx: number, cy: number, r: number) => {
    const p = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return p.join(' ');
  };
  return (
    <Wrap>
      <polygon points={hex(38, 38, 16)} fill="#ff5d73" />
      <polygon points={hex(64, 40, 16)} fill="#41a0ff" />
      <polygon points={hex(50, 64, 16)} fill="#ff5d73" />
      <polygon points={hex(74, 66, 14)} fill="#ffd166" />
    </Wrap>
  );
};

export const ScrewJamIcon = () => (
  <Wrap>
    <rect x="18" y="30" width="64" height="16" rx="6" fill="#ff8c42" transform="rotate(-8 50 38)" />
    <rect x="20" y="54" width="60" height="16" rx="6" fill="#41a0ff" transform="rotate(6 50 62)" />
    {[32, 50, 68].map((x, i) => (
      <g key={x}>
        <circle cx={x} cy={i === 1 ? 62 : 38} r="8" fill="#e6ebff" />
        <text x={x} y={(i === 1 ? 62 : 38) + 4} fontSize="11" fontWeight="900" textAnchor="middle" fill="#1b2240">✛</text>
      </g>
    ))}
  </Wrap>
);

export const HelixIcon = () => (
  <Wrap>
    {[26, 44, 62, 80].map((y, i) => (
      <rect key={y} x={i % 2 ? 18 : 40} y={y} width="42" height="9" rx="4" fill={i % 2 ? '#8367ff' : '#41d3bd'} />
    ))}
    <circle cx="50" cy="20" r="9" fill="#ffd166" />
  </Wrap>
);

export const EatGrowIcon = () => (
  <Wrap>
    <circle cx="36" cy="40" r="10" fill="#ff5d73" />
    <circle cx="68" cy="34" r="6" fill="#ffd166" />
    <circle cx="70" cy="62" r="8" fill="#41a0ff" />
    <circle cx="48" cy="62" r="20" fill="#0b1026" stroke="#6c5cff" strokeWidth="3" />
  </Wrap>
);

export const BrickBreakerIcon = () => (
  <Wrap>
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={18 + c * 22} y={18 + r * 14} width="20" height="12" rx="2" fill={['#51e08a', '#41d3bd', '#ffd166'][r]} />)
    )}
    <circle cx="50" cy="78" r="6" fill="#fff" />
  </Wrap>
);

export const TowerWarIcon = () => (
  <Wrap>
    <line x1="30" y1="30" x2="68" y2="70" stroke="#6f79b0" strokeWidth="3" />
    <circle cx="30" cy="30" r="13" fill="#41a0ff" />
    <circle cx="72" cy="32" r="11" fill="#6f79b0" />
    <circle cx="68" cy="70" r="14" fill="#ff5d73" />
    <text x="30" y="34" fontSize="11" fontWeight="900" fill="#fff" textAnchor="middle">9</text>
    <text x="68" y="74" fontSize="11" fontWeight="900" fill="#fff" textAnchor="middle">7</text>
  </Wrap>
);

export const UnblockMeIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="10" fill="rgba(255,255,255,0.06)" />
    <rect x="22" y="44" width="38" height="13" rx="4" fill="#e24b4b" />
    <rect x="66" y="22" width="13" height="40" rx="4" fill="#c4843f" />
    <rect x="24" y="66" width="38" height="13" rx="4" fill="#9a6b34" />
    <text x="82" y="56" fontSize="14" fontWeight="900" fill="#51e08a" textAnchor="middle">›</text>
  </Wrap>
);

export const LiquidLabIcon = () => (
  <Wrap>
    {[26, 50, 74].map((x, i) => (
      <g key={x}>
        <rect x={x - 9} y="18" width="18" height="64" rx="9" fill="rgba(255,255,255,0.1)" stroke="#fff" strokeWidth="2" />
        <rect x={x - 9} y={46} width="18" height="36" fill={['#41d3bd', '#ff5d73', '#ffd166'][i]} />
        <rect x={x - 9} y={58} width="18" height="24" fill={['#8367ff', '#41a0ff', '#51e08a'][i]} />
        <circle cx={x - 2} cy={40} r="2.5" fill="#fff" opacity="0.8" />
      </g>
    ))}
  </Wrap>
);

export const TileMatchIcon = () => (
  <Wrap>
    <rect x="20" y="30" width="26" height="26" rx="5" fill="#41a0ff" transform="rotate(-8 33 43)" />
    <rect x="40" y="26" width="26" height="26" rx="5" fill="#ff5d73" transform="rotate(4 53 39)" />
    <rect x="34" y="50" width="26" height="26" rx="5" fill="#ffd166" transform="rotate(-3 47 63)" />
    <text x="33" y="48" fontSize="14" textAnchor="middle" transform="rotate(-8 33 43)">🍎</text>
  </Wrap>
);

export const WordWipeIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="8" fill="rgba(255,255,255,0.05)" />
    {[['W', 30, 38], ['O', 52, 38], ['R', 74, 38], ['D', 30, 64]].map(([t, x, y]) => (
      <text key={`${x}-${y}`} x={x as number} y={y as number} fontSize="18" fontWeight="900" fill="#41a0ff" textAnchor="middle">{t}</text>
    ))}
    <path d="M30 34 L52 34 L74 34" stroke="#ff007f" strokeWidth="3" fill="none" opacity="0.7" />
  </Wrap>
);

export const CheckersIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="6" fill="#1f7a47" />
    {[0,1,2,3].map(r=>[0,1,2,3].map(c=> (r+c)%2 ? <rect key={`${r}-${c}`} x={16+c*17} y={16+r*17} width="17" height="17" fill="rgba(0,0,0,0.3)"/> : null))}
    <circle cx="33" cy="33" r="11" fill="#e24b4b" />
    <circle cx="67" cy="67" r="11" fill="#1a1f2e" />
    <circle cx="33" cy="33" r="6" fill="#b53636" />
  </Wrap>
);

export const HexaPuzzleIcon = () => {
  const hex = (cx: number, cy: number, r: number) => {
    const p = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return p.join(' ');
  };
  return (
    <Wrap>
      <polygon points={hex(50, 30, 15)} fill="#ff5d73" />
      <polygon points={hex(34, 58, 15)} fill="#41a0ff" />
      <polygon points={hex(66, 58, 15)} fill="#ffd166" />
      <polygon points={hex(50, 30, 15)} fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
    </Wrap>
  );
};

export const MergeDefenseIcon = () => (
  <Wrap>
    <rect x="16" y="70" width="68" height="14" rx="4" fill="#41a0ff" />
    <rect x="26" y="24" width="20" height="20" rx="4" fill="#ff5d73" />
    <text x="36" y="39" fontSize="12" fontWeight="900" fill="#fff" textAnchor="middle">8</text>
    <rect x="54" y="40" width="20" height="20" rx="4" fill="#ffd166" />
    <text x="64" y="55" fontSize="12" fontWeight="900" fill="#5a3200" textAnchor="middle">4</text>
    <path d="M50 84 L50 56" stroke="#00f3ff" strokeWidth="3" />
  </Wrap>
);

export const NeonTunnelIcon = () => (
  <Wrap>
    <rect x="20" y="14" width="8" height="72" rx="4" fill="#bc13fe" opacity="0.6" />
    <rect x="72" y="14" width="8" height="72" rx="4" fill="#bc13fe" opacity="0.6" />
    <rect x="36" y="30" width="22" height="9" rx="4" fill="#ff007f" />
    <rect x="50" y="54" width="22" height="9" rx="4" fill="#00f3ff" />
    <polygon points="50,70 40,86 60,86" fill="#00f3ff" />
  </Wrap>
);

export const StackJumpIcon = () => (
  <Wrap>
    <rect x="30" y="68" width="44" height="14" rx="2" fill="#ff5d73" />
    <rect x="34" y="54" width="38" height="14" rx="2" fill="#ffd166" />
    <rect x="38" y="40" width="32" height="14" rx="2" fill="#41d3bd" />
    <rect x="20" y="24" width="30" height="14" rx="2" fill="#00f3ff" />
  </Wrap>
);

export const ArrowEscapeIcon = () => (
  <Wrap>
    <rect x="16" y="16" width="68" height="68" rx="14" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth="3" />
    <g fill="#00f3ff">
      <path d="M50 22 L58 34 L52 34 L52 46 L48 46 L48 34 L42 34 Z" />
    </g>
    <g fill="#ffd166">
      <path d="M78 50 L66 58 L66 52 L54 52 L54 48 L66 48 L66 42 Z" />
    </g>
    <g fill="#ff5d73">
      <path d="M50 78 L42 66 L48 66 L48 54 L52 54 L52 66 L58 66 Z" />
    </g>
    <g fill="#51e08a">
      <path d="M22 50 L34 42 L34 48 L46 48 L46 52 L34 52 L34 58 Z" />
    </g>
  </Wrap>
);

export const BlackHoleSolitaireIcon = () => (
  <Wrap>
    <defs>
      <radialGradient id="bhHole" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000" />
        <stop offset="60%" stopColor="#2a1247" />
        <stop offset="100%" stopColor="#6c3fb0" />
      </radialGradient>
    </defs>
    <rect x="14" y="22" width="26" height="38" rx="4" fill="#fff" transform="rotate(-16 27 41)" />
    <rect x="26" y="20" width="26" height="38" rx="4" fill="#ffd166" transform="rotate(-4 39 39)" />
    <circle cx="62" cy="58" r="26" fill="url(#bhHole)" stroke="#b8413f" strokeWidth="2" />
    <circle cx="62" cy="58" r="11" fill="#000" />
  </Wrap>
);

export const DungeonSweeperIcon = () => (
  <Wrap>
    <rect x="14" y="14" width="72" height="72" rx="12" fill="rgba(255,255,255,0.06)" stroke="#fff" strokeWidth="3" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r}-${c}`} x={22 + c * 20} y={22 + r * 20} width="16" height="16" rx="3" fill="rgba(255,255,255,0.1)" />
      ))
    )}
    <text x="30" y="36" fontSize="14" fontWeight="900" fill="#7fc7ff">1</text>
    <text x="50" y="56" fontSize="14" fontWeight="900" fill="#51e08a">2</text>
    <circle cx="72" cy="32" r="7" fill="#ff5d73" />
    <circle cx="34" cy="74" r="6" fill="#ffd166" />
  </Wrap>
);

export const MagneticPullIcon = () => (
  <Wrap>
    <path d="M30 20 a26 26 0 0 1 40 0 l-14 0 a12 12 0 0 0 -12 0 z" fill="#ff5d73" transform="rotate(180 50 33)" />
    <rect x="24" y="20" width="14" height="24" rx="3" fill="#ff5d73" />
    <rect x="62" y="20" width="14" height="24" rx="3" fill="#41a0ff" />
    <rect x="24" y="40" width="14" height="10" fill="#d1d6e0" />
    <rect x="62" y="40" width="14" height="10" fill="#d1d6e0" />
    <circle cx="50" cy="68" r="14" fill="#cfd6e6" stroke="#7b8499" strokeWidth="2" />
    <circle cx="45" cy="63" r="4" fill="#fff" />
  </Wrap>
);

export const PerfectSliceIcon = () => (
  <Wrap>
    <polygon points="50,16 84,40 71,82 29,82 16,40" fill="#6c5cff" />
    <polygon points="50,16 50,82 29,82 16,40" fill="#41d3bd" opacity="0.85" />
    <line x1="50" y1="8" x2="50" y2="92" stroke="#fff" strokeWidth="3" strokeDasharray="6 4" />
  </Wrap>
);

export const WordLadderIcon = () => (
  <Wrap>
    <rect x="22" y="10" width="6" height="80" rx="3" fill="#fff" />
    <rect x="72" y="10" width="6" height="80" rx="3" fill="#fff" />
    {[22, 40, 58, 76].map((y, i) => (
      <rect key={y} x="22" y={y} width="56" height="10" rx="3" fill={['#ff5d73', '#ffd166', '#41d3bd', '#00f3ff'][i]} />
    ))}
  </Wrap>
);

export const ChessIcon = () => (
  <Wrap>
    {[0, 1, 2, 3].map((r) =>
      [0, 1, 2, 3].map((c) => (
        <rect key={`${r}-${c}`} x={18 + c * 16} y={18 + r * 16} width="16" height="16" fill={(r + c) % 2 ? '#3a4257' : '#d8d2c4'} />
      ))
    )}
    <path d="M50 24 l5 9 -3 0 0 10 4 0 0 5 -12 0 0 -5 4 0 0 -10 -3 0 z" fill="#fff" stroke="#11151f" strokeWidth="1.5" />
    <circle cx="50" cy="24" r="4" fill="#fff" stroke="#11151f" strokeWidth="1.5" />
  </Wrap>
);

export const FlappyBirdIcon = () => (
  <Wrap>
    <rect x="14" y="10" width="18" height="34" rx="3" fill="#51e08a" />
    <rect x="14" y="60" width="18" height="30" rx="3" fill="#51e08a" />
    <rect x="68" y="10" width="18" height="46" rx="3" fill="#51e08a" />
    <rect x="68" y="72" width="18" height="18" rx="3" fill="#51e08a" />
    <circle cx="50" cy="52" r="15" fill="#ffd166" />
    <circle cx="56" cy="47" r="5" fill="#fff" />
    <circle cx="58" cy="47" r="2.4" fill="#222" />
    <polygon points="63,52 74,55 63,59" fill="#ff8c42" />
  </Wrap>
);

export const HangmanIcon = () => (
  <Wrap>
    <line x1="16" y1="88" x2="58" y2="88" stroke="#c4843f" strokeWidth="6" strokeLinecap="round" />
    <line x1="28" y1="88" x2="28" y2="14" stroke="#c4843f" strokeWidth="6" strokeLinecap="round" />
    <line x1="28" y1="14" x2="64" y2="14" stroke="#c4843f" strokeWidth="6" strokeLinecap="round" />
    <line x1="64" y1="14" x2="64" y2="28" stroke="#fff" strokeWidth="4" />
    <circle cx="64" cy="38" r="9" fill="none" stroke="#fff" strokeWidth="4" />
    <line x1="64" y1="47" x2="64" y2="70" stroke="#fff" strokeWidth="4" />
    <line x1="64" y1="54" x2="54" y2="64" stroke="#fff" strokeWidth="4" />
    <line x1="64" y1="54" x2="74" y2="64" stroke="#fff" strokeWidth="4" />
  </Wrap>
);

export const KlondikeIcon = () => (
  <Wrap>
    <rect x="16" y="26" width="30" height="42" rx="5" fill="#fff" transform="rotate(-10 31 47)" />
    <rect x="34" y="22" width="30" height="42" rx="5" fill="#fff" />
    <text x="49" y="40" fontSize="15" fontWeight="900" fill="#11151f" textAnchor="middle">A</text>
    <text x="49" y="56" fontSize="16" fontWeight="900" fill="#e24b4b" textAnchor="middle">♠</text>
    <rect x="60" y="30" width="26" height="38" rx="5" fill="#e24b4b" transform="rotate(10 73 49)" />
    <text x="73" y="54" fontSize="14" fontWeight="900" fill="#fff" textAnchor="middle" transform="rotate(10 73 49)">♥</text>
  </Wrap>
);

export const ICONS: Record<string, ComponentType> = {
  'color-cards': ColorCardsIcon,
  'water-sort': WaterSortIcon,
  'color-blocks': ColorBlocksIcon,
  'nuts-and-bolts': NutsAndBoltsIcon,
  'maze-paint': MazePaintIcon,
  'word-finder': WordFinderIcon,
  'merge-2048': Merge2048Icon,
  'block-blast': BlockBlastIcon,
  'traffic-jam': TrafficJamIcon,
  'memory-match': MemoryMatchIcon,
  'tic-tac-toe': TicTacToeIcon,
  'dots-boxes': DotsBoxesIcon,
  'wordle': WordleIcon,
  'pipe-mania': PipeManiaIcon,
  'flow-free': FlowFreeIcon,
  'mancala': MancalaIcon,
  'reversi': ReversiIcon,
  'golf-solitaire': GolfSolitaireIcon,
  'sudoku-mini': SudokuMiniIcon,
  'knife-hit': KnifeHitIcon,
  'flood-it': FloodItIcon,
  'nonogram': NonogramIcon,
  'peg-solitaire': PegSolitaireIcon,
  'battleship': BattleshipIcon,
  'simon-says': SimonSaysIcon,
  'whack-a-mole': WhackAMoleIcon,
  'blockudoku': BlockuDokuIcon,
  'minesweeper': MinesweeperIcon,
  'mahjong-mini': MahjongIcon,
  'goods-match': GoodsMatchIcon,
  'hexa-sort': HexaSortIcon,
  'screw-jam': ScrewJamIcon,
  'helix-jump': HelixIcon,
  'eat-grow': EatGrowIcon,
  'brick-breaker': BrickBreakerIcon,
  'tower-war': TowerWarIcon,
  'unblock-me': UnblockMeIcon,
  'liquid-lab': LiquidLabIcon,
  'tile-match': TileMatchIcon,
  'word-wipe': WordWipeIcon,
  'checkers': CheckersIcon,
  'hexa-puzzle': HexaPuzzleIcon,
  'merge-defense': MergeDefenseIcon,
  'neon-tunnel': NeonTunnelIcon,
  'stack-jump': StackJumpIcon,
  'arrow-escape': ArrowEscapeIcon,
  'black-hole-solitaire': BlackHoleSolitaireIcon,
  'dungeon-sweeper': DungeonSweeperIcon,
  'magnetic-pull': MagneticPullIcon,
  'perfect-slice': PerfectSliceIcon,
  'word-ladder': WordLadderIcon,
  'chess': ChessIcon,
  'flappy-bird': FlappyBirdIcon,
  'hangman': HangmanIcon,
  'klondike': KlondikeIcon
};
