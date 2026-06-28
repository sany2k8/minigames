-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  No WiFi Games — Supabase schema (cloud sync + global leaderboard)          ║
-- ╠══════════════════════════════════════════════════════════════════════════╣
-- ║  The app is offline-first; this database is an OPTIONAL sync target. Each   ║
-- ║  device gets an anonymous auth user. Local zustand state is the source of   ║
-- ║  truth on-device and is pushed here when online.                            ║
-- ║                                                                            ║
-- ║  Tables:                                                                   ║
-- ║    profiles      — one row per player (mirrors the reward system)          ║
-- ║    games         — the catalog (mirrors src/games/registry.ts, see seed)   ║
-- ║    scores        — best score per (player, game)                           ║
-- ║    game_stats    — W/L/D + streaks per (player, game)                      ║
-- ║    match_results — append-only log of every finished game (history)        ║
-- ║  Views:                                                                    ║
-- ║    global_leaderboard — players ranked by points                           ║
-- ║    game_leaderboard   — best score per game, ranked, across all players     ║
-- ║                                                                            ║
-- ║  Apply with the Supabase CLI (`supabase db push`) or paste into the SQL    ║
-- ║  editor. Run seed.sql afterwards to populate the catalog.                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles  (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  username      text        unique,
  display_name  text        not null default 'Player',
  avatar        text,
  points        integer     not null default 0  check (points >= 0),
  level         integer     not null default 1  check (level >= 1),
  tier          text        not null default 'Bronze',
  games_won     integer     not null default 0  check (games_won >= 0),
  games_played  integer     not null default 0  check (games_played >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- games  (the catalog — keep in sync with src/games/registry.ts via seed.sql)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.games (
  id          text        primary key,                  -- registry id, e.g. 'water-sort'
  title       text        not null,
  category    text        not null,                      -- card | sort | puzzle | arcade | …
  contest     text        not null,                      -- race | score | table
  blurb       text,
  featured    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- scores  (best score a player has achieved in a game)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.scores (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  game_id     text        not null references public.games (id)    on delete cascade,
  best_score  integer     not null default 0,
  difficulty  text,
  updated_at  timestamptz not null default now(),
  unique (user_id, game_id)
);
create index if not exists scores_game_best_idx on public.scores (game_id, best_score desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- game_stats  (aggregate W/L/D + streak per player per game)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.game_stats (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  game_id      text        not null references public.games (id)    on delete cascade,
  wins         integer     not null default 0,
  draws        integer     not null default 0,
  losses       integer     not null default 0,
  streak       integer     not null default 0,
  best_streak  integer     not null default 0,
  updated_at   timestamptz not null default now(),
  unique (user_id, game_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- match_results  (append-only history of finished games)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.match_results (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles (id) on delete cascade,
  game_id         text        not null references public.games (id)    on delete cascade,
  outcome         text        not null check (outcome in ('win', 'loss', 'draw')),
  score           integer,
  difficulty      text,
  points_awarded  integer     not null default 0,
  played_at       timestamptz not null default now()
);
create index if not exists match_results_user_idx on public.match_results (user_id, played_at desc);

-- ═════════════════════════════════════════════════════════════════════════════
-- Leaderboard views (security_invoker so RLS on the base tables applies)
-- ═════════════════════════════════════════════════════════════════════════════
create or replace view public.global_leaderboard
  with (security_invoker = on) as
select
  p.id            as user_id,
  p.display_name,
  p.points,
  p.level,
  p.tier,
  p.games_won,
  p.games_played,
  rank() over (order by p.points desc) as rank
from public.profiles p;

create or replace view public.game_leaderboard
  with (security_invoker = on) as
select
  s.game_id,
  g.title         as game_title,
  s.user_id,
  p.display_name,
  s.best_score,
  s.difficulty,
  rank() over (partition by s.game_id order by s.best_score desc) as rank,
  s.updated_at
from public.scores s
  join public.profiles p on p.id = s.user_id
  join public.games    g on g.id = s.game_id
where s.best_score > 0;

-- ═════════════════════════════════════════════════════════════════════════════
-- New-user trigger: auto-create a profile row when an auth user is created
-- ═════════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Player'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═════════════════════════════════════════════════════════════════════════════
-- RPCs the client calls (security definer → write only the caller's own rows)
-- ═════════════════════════════════════════════════════════════════════════════

-- Record (or improve) the caller's best score for a game.
create or replace function public.submit_score(
  p_game_id    text,
  p_score      integer,
  p_difficulty text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  insert into public.scores (user_id, game_id, best_score, difficulty)
  values (uid, p_game_id, greatest(p_score, 0), p_difficulty)
  on conflict (user_id, game_id) do update
    set best_score = greatest(public.scores.best_score, excluded.best_score),
        difficulty = coalesce(excluded.difficulty, public.scores.difficulty),
        updated_at = now();
end;
$$;

-- Record one finished game: append to history + roll up game_stats.
-- (Profile points/games_won are pushed separately as a snapshot — see
--  public.sync_profile — so this stays idempotent w.r.t. the aggregate totals.)
create or replace function public.record_match(
  p_game_id    text,
  p_outcome    text,
  p_score      integer default null,
  p_difficulty text    default null,
  p_points     integer default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  won int  := (p_outcome = 'win')::int;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;
  if p_outcome not in ('win', 'loss', 'draw') then
    raise exception 'invalid outcome: %', p_outcome;
  end if;

  insert into public.match_results (user_id, game_id, outcome, score, difficulty, points_awarded)
  values (uid, p_game_id, p_outcome, p_score, p_difficulty, greatest(p_points, 0));

  insert into public.game_stats (user_id, game_id, wins, draws, losses, streak, best_streak)
  values (uid, p_game_id, won, (p_outcome = 'draw')::int, (p_outcome = 'loss')::int, won, won)
  on conflict (user_id, game_id) do update
    set wins        = public.game_stats.wins   + won,
        draws       = public.game_stats.draws  + (p_outcome = 'draw')::int,
        losses      = public.game_stats.losses + (p_outcome = 'loss')::int,
        streak      = case when p_outcome = 'win' then public.game_stats.streak + 1 else 0 end,
        best_streak = greatest(
                        public.game_stats.best_streak,
                        case when p_outcome = 'win' then public.game_stats.streak + 1 else 0 end),
        updated_at  = now();
end;
$$;

-- Push the caller's aggregate profile snapshot (points/level/tier/totals/name).
create or replace function public.sync_profile(
  p_display_name text    default null,
  p_points       integer default null,
  p_level        integer default null,
  p_tier         text    default null,
  p_games_won    integer default null,
  p_games_played integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  insert into public.profiles (id, display_name, points, level, tier, games_won, games_played)
  values (
    uid,
    coalesce(p_display_name, 'Player'),
    coalesce(p_points, 0),
    coalesce(p_level, 1),
    coalesce(p_tier, 'Bronze'),
    coalesce(p_games_won, 0),
    coalesce(p_games_played, 0)
  )
  on conflict (id) do update
    set display_name = coalesce(p_display_name, public.profiles.display_name),
        points       = coalesce(p_points,       public.profiles.points),
        level        = coalesce(p_level,        public.profiles.level),
        tier         = coalesce(p_tier,         public.profiles.tier),
        games_won    = coalesce(p_games_won,    public.profiles.games_won),
        games_played = coalesce(p_games_played, public.profiles.games_played),
        updated_at   = now();
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═════════════════════════════════════════════════════════════════════════════
alter table public.profiles      enable row level security;
alter table public.games         enable row level security;
alter table public.scores        enable row level security;
alter table public.game_stats    enable row level security;
alter table public.match_results enable row level security;

-- profiles: world-readable (leaderboard names); a user writes only their own row.
drop policy if exists "profiles read"        on public.profiles;
drop policy if exists "profiles insert self" on public.profiles;
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles read"        on public.profiles for select using (true);
create policy "profiles insert self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- games: world-readable catalog; writes happen via seed.sql / service role only.
drop policy if exists "games read" on public.games;
create policy "games read" on public.games for select using (true);

-- scores: world-readable (game leaderboard); a user writes only their own.
drop policy if exists "scores read"        on public.scores;
drop policy if exists "scores write self"  on public.scores;
create policy "scores read"       on public.scores for select using (true);
create policy "scores write self" on public.scores for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- game_stats: world-readable; a user writes only their own.
drop policy if exists "game_stats read"       on public.game_stats;
drop policy if exists "game_stats write self" on public.game_stats;
create policy "game_stats read"       on public.game_stats for select using (true);
create policy "game_stats write self" on public.game_stats for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- match_results: PRIVATE history — a user reads/writes only their own rows.
drop policy if exists "match_results own" on public.match_results;
create policy "match_results own" on public.match_results for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Let the anon/authenticated roles execute the RPCs.
grant execute on function public.submit_score(text, integer, text)                           to anon, authenticated;
grant execute on function public.record_match(text, text, integer, text, integer)            to anon, authenticated;
grant execute on function public.sync_profile(text, integer, integer, text, integer, integer) to anon, authenticated;
