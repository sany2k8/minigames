-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Migrate the schema from Supabase-native auth → Auth0 Third-Party Auth.     ║
-- ╠══════════════════════════════════════════════════════════════════════════╣
-- ║  With Third-Party Auth the user identity is the Auth0 `sub` claim (a string ║
-- ║  like "auth0|abc123"), NOT a Supabase auth.users UUID. So:                   ║
-- ║    • profile/user ids become TEXT (the Auth0 sub)                           ║
-- ║    • no FK to auth.users, no on-signup trigger (Auth0 owns accounts)        ║
-- ║    • RLS + RPCs read the caller via auth.jwt() ->> 'sub'                     ║
-- ║                                                                            ║
-- ║  Safe to run on the empty tables from 0001 — it drops & recreates them.     ║
-- ║  Re-run seed.sql afterwards to repopulate the catalog.                      ║
-- ║                                                                            ║
-- ║  PREREQUISITE: register Auth0 as a Third-Party Auth provider in Supabase    ║
-- ║  and set an Auth0 API audience (see SETUP-AUTH0.md), otherwise the JWT      ║
-- ║  won't validate and writes will be rejected.                                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Tear down 0001's native-auth objects.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.submit_score(text, integer, text);
drop function if exists public.record_match(text, text, integer, text, integer);
drop function if exists public.sync_profile(text, integer, integer, text, integer, integer);
drop view if exists public.global_leaderboard;
drop view if exists public.game_leaderboard;
drop table if exists public.match_results cascade;
drop table if exists public.game_stats cascade;
drop table if exists public.scores cascade;
drop table if exists public.profiles cascade;
-- public.games is unchanged (no user FK) — keep it and its seed.

create extension if not exists "pgcrypto";

-- Helper: the caller's Auth0 subject from the verified JWT.
create or replace function public.current_sub()
returns text
language sql
stable
as $$ select auth.jwt() ->> 'sub' $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles  (keyed by the Auth0 sub)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id            text        primary key,            -- Auth0 sub, e.g. 'auth0|abc'
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

create table public.scores (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null references public.profiles (id) on delete cascade,
  game_id     text        not null references public.games (id)    on delete cascade,
  best_score  integer     not null default 0,
  difficulty  text,
  updated_at  timestamptz not null default now(),
  unique (user_id, game_id)
);
create index scores_game_best_idx on public.scores (game_id, best_score desc);

create table public.game_stats (
  id           uuid        primary key default gen_random_uuid(),
  user_id      text        not null references public.profiles (id) on delete cascade,
  game_id      text        not null references public.games (id)    on delete cascade,
  wins         integer     not null default 0,
  draws        integer     not null default 0,
  losses       integer     not null default 0,
  streak       integer     not null default 0,
  best_streak  integer     not null default 0,
  updated_at   timestamptz not null default now(),
  unique (user_id, game_id)
);

create table public.match_results (
  id              uuid        primary key default gen_random_uuid(),
  user_id         text        not null references public.profiles (id) on delete cascade,
  game_id         text        not null references public.games (id)    on delete cascade,
  outcome         text        not null check (outcome in ('win', 'loss', 'draw')),
  score           integer,
  difficulty      text,
  points_awarded  integer     not null default 0,
  played_at       timestamptz not null default now()
);
create index match_results_user_idx on public.match_results (user_id, played_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Leaderboard views
-- ─────────────────────────────────────────────────────────────────────────────
create view public.global_leaderboard with (security_invoker = on) as
select p.id as user_id, p.display_name, p.points, p.level, p.tier,
       p.games_won, p.games_played,
       rank() over (order by p.points desc) as rank
from public.profiles p;

create view public.game_leaderboard with (security_invoker = on) as
select s.game_id, g.title as game_title, s.user_id, p.display_name,
       s.best_score, s.difficulty,
       rank() over (partition by s.game_id order by s.best_score desc) as rank,
       s.updated_at
from public.scores s
  join public.profiles p on p.id = s.user_id
  join public.games    g on g.id = s.game_id
where s.best_score > 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPCs (security definer → caller writes only their own rows, keyed by sub)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.submit_score(p_game_id text, p_score integer, p_difficulty text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid text := auth.jwt() ->> 'sub';
begin
  if uid is null then raise exception 'authentication required'; end if;
  insert into public.scores (user_id, game_id, best_score, difficulty)
  values (uid, p_game_id, greatest(p_score, 0), p_difficulty)
  on conflict (user_id, game_id) do update
    set best_score = greatest(public.scores.best_score, excluded.best_score),
        difficulty = coalesce(excluded.difficulty, public.scores.difficulty),
        updated_at = now();
end; $$;

create or replace function public.record_match(
  p_game_id text, p_outcome text, p_score integer default null,
  p_difficulty text default null, p_points integer default 0
) returns void language plpgsql security definer set search_path = public as $$
declare uid text := auth.jwt() ->> 'sub'; won int := (p_outcome = 'win')::int;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if p_outcome not in ('win','loss','draw') then raise exception 'invalid outcome: %', p_outcome; end if;

  insert into public.match_results (user_id, game_id, outcome, score, difficulty, points_awarded)
  values (uid, p_game_id, p_outcome, p_score, p_difficulty, greatest(p_points, 0));

  insert into public.game_stats (user_id, game_id, wins, draws, losses, streak, best_streak)
  values (uid, p_game_id, won, (p_outcome = 'draw')::int, (p_outcome = 'loss')::int, won, won)
  on conflict (user_id, game_id) do update
    set wins        = public.game_stats.wins   + won,
        draws       = public.game_stats.draws  + (p_outcome = 'draw')::int,
        losses      = public.game_stats.losses + (p_outcome = 'loss')::int,
        streak      = case when p_outcome = 'win' then public.game_stats.streak + 1 else 0 end,
        best_streak = greatest(public.game_stats.best_streak,
                        case when p_outcome = 'win' then public.game_stats.streak + 1 else 0 end),
        updated_at  = now();
end; $$;

create or replace function public.sync_profile(
  p_display_name text default null, p_points integer default null,
  p_level integer default null, p_tier text default null,
  p_games_won integer default null, p_games_played integer default null
) returns void language plpgsql security definer set search_path = public as $$
declare uid text := auth.jwt() ->> 'sub';
begin
  if uid is null then raise exception 'authentication required'; end if;
  insert into public.profiles (id, display_name, points, level, tier, games_won, games_played)
  values (uid, coalesce(p_display_name,'Player'), coalesce(p_points,0), coalesce(p_level,1),
          coalesce(p_tier,'Bronze'), coalesce(p_games_won,0), coalesce(p_games_played,0))
  on conflict (id) do update
    set display_name = coalesce(p_display_name, public.profiles.display_name),
        points       = coalesce(p_points,       public.profiles.points),
        level        = coalesce(p_level,        public.profiles.level),
        tier         = coalesce(p_tier,         public.profiles.tier),
        games_won    = coalesce(p_games_won,    public.profiles.games_won),
        games_played = coalesce(p_games_played, public.profiles.games_played),
        updated_at   = now();
end; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (caller identified by Auth0 sub)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.scores        enable row level security;
alter table public.game_stats    enable row level security;
alter table public.match_results enable row level security;

create policy "profiles read"        on public.profiles for select using (true);
create policy "profiles write self"  on public.profiles for all
  using (public.current_sub() = id) with check (public.current_sub() = id);

create policy "scores read"          on public.scores for select using (true);
create policy "scores write self"    on public.scores for all
  using (public.current_sub() = user_id) with check (public.current_sub() = user_id);

create policy "game_stats read"      on public.game_stats for select using (true);
create policy "game_stats write self" on public.game_stats for all
  using (public.current_sub() = user_id) with check (public.current_sub() = user_id);

create policy "match_results own"    on public.match_results for all
  using (public.current_sub() = user_id) with check (public.current_sub() = user_id);

grant execute on function public.submit_score(text, integer, text)                            to anon, authenticated;
grant execute on function public.record_match(text, text, integer, text, integer)             to anon, authenticated;
grant execute on function public.sync_profile(text, integer, integer, text, integer, integer) to anon, authenticated;
grant execute on function public.current_sub()                                                to anon, authenticated;
