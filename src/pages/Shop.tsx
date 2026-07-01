import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/store';
import { THEMES, AVATARS, type Theme, type Avatar } from '../lib/cosmetics';
import { sound } from '../lib/sound';

/**
 * Cosmetics shop: spend coins (earned from wins and quests) on accent themes
 * and profile avatars. Owned items can be equipped; the rest show their price.
 */
export function Shop() {
  const nav = useNavigate();
  const { coins, ownedCosmetics, theme, avatar, buyCosmetic, equip } = useApp();

  return (
    <div className="p-5 md:p-10 max-w-[1000px] mx-auto w-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => nav('/profile')}
            aria-label="Back"
            className="w-9 h-9 rounded-full grid place-items-center text-ink-soft hover:bg-line-soft transition-colors mb-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-[28px] font-bold tracking-tight">Customize</h1>
          <p className="text-ink-soft">Spend coins from wins & quests on a new look.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDEBD3] text-[#B8770E] font-bold">
          🪙 {coins.toLocaleString()}
        </div>
      </div>

      <h3 className="text-lg font-bold mb-3">Accent themes</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-9">
        {THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            t={t}
            owned={ownedCosmetics.includes(t.id)}
            equipped={theme === t.id}
            coins={coins}
            onBuy={() => buyCosmetic(t.id, t.cost) && sound.coin()}
            onEquip={() => { equip('theme', t.id); sound.select(); }}
          />
        ))}
      </div>

      <h3 className="text-lg font-bold mb-3">Avatars</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {AVATARS.map((a) => (
          <AvatarCard
            key={a.id}
            a={a}
            owned={ownedCosmetics.includes(a.id)}
            equipped={avatar === a.id}
            coins={coins}
            onBuy={() => buyCosmetic(a.id, a.cost) && sound.coin()}
            onEquip={() => { equip('avatar', a.id); sound.select(); }}
          />
        ))}
      </div>
    </div>
  );
}

function PriceButton({ owned, equipped, cost, coins, onBuy, onEquip }: {
  owned: boolean; equipped: boolean; cost: number; coins: number; onBuy: () => void; onEquip: () => void;
}) {
  if (equipped) return <span className="text-xs font-bold text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-base">check_circle</span>Equipped</span>;
  if (owned) return <button onClick={onEquip} className="btn-soft text-xs py-1.5 px-4">Equip</button>;
  const afford = coins >= cost;
  return (
    <button
      onClick={onBuy}
      disabled={!afford}
      className={`text-xs py-1.5 px-4 rounded-full font-bold ${afford ? 'btn-coral' : 'bg-line-soft text-ink-faint cursor-not-allowed'}`}
    >
      🪙 {cost}
    </button>
  );
}

function ThemeCard({ t, owned, equipped, coins, onBuy, onEquip }: {
  t: Theme; owned: boolean; equipped: boolean; coins: number; onBuy: () => void; onEquip: () => void;
}) {
  return (
    <div className={`card p-4 ${equipped ? 'ring-2 ring-coral' : ''}`}>
      <div className="h-14 rounded-xl mb-3" style={{ background: `linear-gradient(135deg, ${t.coral}, ${t.coral2})` }} />
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">{t.name}</span>
        <PriceButton owned={owned} equipped={equipped} cost={t.cost} coins={coins} onBuy={onBuy} onEquip={onEquip} />
      </div>
    </div>
  );
}

function AvatarCard({ a, owned, equipped, coins, onBuy, onEquip }: {
  a: Avatar; owned: boolean; equipped: boolean; coins: number; onBuy: () => void; onEquip: () => void;
}) {
  return (
    <div className={`card p-4 text-center ${equipped ? 'ring-2 ring-coral' : ''}`}>
      <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center text-3xl mb-2" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>
        {a.emoji || 'AB'}
      </div>
      <div className="font-bold text-sm mb-2">{a.name}</div>
      <div className="flex justify-center">
        <PriceButton owned={owned} equipped={equipped} cost={a.cost} coins={coins} onBuy={onBuy} onEquip={onEquip} />
      </div>
    </div>
  );
}
