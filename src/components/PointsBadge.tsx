import { levelInfo, useApp } from '../store/store';

export function PointsBadge() {
  const points = useApp((s) => s.points);
  const info = levelInfo(points);
  return (
    <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 border border-line rounded-xl bg-card">
      <div
        className="w-[30px] h-[30px] rounded-[9px] grid place-items-center text-white font-bold text-[13px]"
        style={{ background: 'linear-gradient(135deg,#F59E0B,#FB923C)' }}
      >
        {info.level}
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-bold">{info.title}</div>
        <div className="flex items-center gap-1.5">
          <span className="block w-[54px] h-[5px] rounded bg-line overflow-hidden">
            <span className="block h-full rounded" style={{ width: `${info.pct}%`, background: 'linear-gradient(90deg,#FF5A3C,#FB7E50)' }} />
          </span>
          <span className="text-[11px] text-ink-faint font-bold">{points.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
