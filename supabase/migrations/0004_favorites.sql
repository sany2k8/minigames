-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Add the `favorites` table — one row per (user, favorited game).            ║
-- ║  Private to each user (read + write your own only). Keyed by auth.uid().    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create table if not exists public.favorites (
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  game_id     text        not null references public.games (id)    on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites own" on public.favorites;
create policy "favorites own" on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
