-- MicroDrama Studio initial schema
-- Apply in Supabase SQL Editor. RLS is enabled on every user-facing table.

create extension if not exists pgcrypto;

create type public.production_status as enum (
  'development','script','storyboard','generating','review','approved','published','archived'
);
create type public.approval_decision as enum ('approved','rejected','changes_requested');
create type public.asset_kind as enum ('image','video','audio','document','thumbnail');
create type public.job_status as enum ('queued','running','succeeded','failed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'owner' check (role in ('owner','producer','reviewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  logline text,
  synopsis text,
  genre text[] not null default '{}',
  language text not null default 'es',
  visual_style text not null default 'mixed' check (visual_style in ('mixed','live_action','animation')),
  status public.production_status not null default 'development',
  cover_asset_id uuid,
  target_episode_count integer check (target_episode_count is null or target_episode_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index series_owner_updated_idx on public.series(owner_id, updated_at desc);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  season_number integer not null check (season_number > 0),
  title text not null default 'Temporada 1',
  created_at timestamptz not null default now(),
  unique(series_id, season_number)
);

create table public.story_bibles (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  version integer not null default 1,
  premise text,
  world_rules jsonb not null default '{}',
  tone_and_style jsonb not null default '{}',
  narrative_arc jsonb not null default '{}',
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique(series_id, version)
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  name text not null,
  description text,
  personality jsonb not null default '{}',
  visual_profile jsonb not null default '{}',
  continuity_notes text,
  created_at timestamptz not null default now()
);

create table public.character_references (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  asset_url text not null,
  reference_type text not null default 'portrait',
  prompt text,
  created_at timestamptz not null default now()
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  episode_number integer not null check (episode_number > 0),
  title text not null,
  synopsis text,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  status public.production_status not null default 'development',
  is_premium boolean not null default false,
  coin_price integer not null default 0 check (coin_price >= 0),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(series_id, episode_number)
);

create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  version integer not null default 1,
  content text not null default '',
  format text not null default 'screenplay',
  change_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(episode_id, version)
);

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  scene_number integer not null check (scene_number > 0),
  heading text,
  action text,
  dialogue jsonb not null default '[]',
  visual_direction jsonb not null default '{}',
  estimated_duration_seconds integer,
  created_at timestamptz not null default now(),
  unique(episode_id, scene_number)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete cascade,
  kind public.asset_kind not null,
  storage_path text,
  public_url text,
  provider text,
  model text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  check (storage_path is not null or public_url is not null)
);

alter table public.series add constraint series_cover_asset_fk foreign key (cover_asset_id) references public.media_assets(id) on delete set null;

create table public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete cascade,
  task_type text not null,
  provider text,
  model text,
  status public.job_status not null default 'queued',
  input jsonb not null default '{}',
  output jsonb not null default '{}',
  error_message text,
  estimated_cost numeric(12,4) not null default 0 check (estimated_cost >= 0),
  actual_cost numeric(12,4) not null default 0 check (actual_cost >= 0),
  idempotency_key text unique,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  decision public.approval_decision not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Wallets use an immutable ledger. Never update balances directly from the client.
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance_coins bigint not null default 0 check (balance_coins >= 0),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount_coins bigint not null check (amount_coins <> 0),
  transaction_type text not null,
  reference_id uuid,
  idempotency_key text unique,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.episode_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  transaction_id uuid references public.wallet_transactions(id),
  unlocked_at timestamptz not null default now(),
  unique(user_id, episode_id)
);

create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  progress_seconds integer not null default 0 check (progress_seconds >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, episode_id)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  series_id uuid references public.series(id) on delete set null,
  episode_id uuid references public.episodes(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);
create index analytics_events_time_idx on public.analytics_events(occurred_at desc);

-- Create a profile and wallet when an auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'name',''));
  insert into public.wallets(user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: studio content is owner-scoped. Viewer-facing published reads are added by a later release.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','series','seasons','story_bibles','characters','character_references',
    'episodes','scripts','scenes','media_assets','production_jobs','approvals',
    'wallets','wallet_transactions','episode_unlocks','watch_history','analytics_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "series_owner_all" on public.series for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "seasons_owner_all" on public.seasons for all using (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid())) with check (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()));
create policy "bibles_owner_all" on public.story_bibles for all using (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid())) with check (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()));
create policy "characters_owner_all" on public.characters for all using (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid())) with check (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()));
create policy "character_refs_owner_all" on public.character_references for all using (exists(select 1 from public.characters c join public.series s on s.id=c.series_id where c.id=character_id and s.owner_id=auth.uid())) with check (exists(select 1 from public.characters c join public.series s on s.id=c.series_id where c.id=character_id and s.owner_id=auth.uid()));
create policy "episodes_owner_all" on public.episodes for all using (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid())) with check (exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()));
create policy "scripts_owner_all" on public.scripts for all using (exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid())) with check (exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid()));
create policy "scenes_owner_all" on public.scenes for all using (exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid())) with check (exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid()));
create policy "assets_owner_all" on public.media_assets for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "jobs_owner_all" on public.production_jobs for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "approvals_owner_all" on public.approvals for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "wallet_select_own" on public.wallets for select using (user_id=auth.uid());
create policy "wallet_transactions_select_own" on public.wallet_transactions for select using (exists(select 1 from public.wallets w where w.id=wallet_id and w.user_id=auth.uid()));
create policy "unlock_select_own" on public.episode_unlocks for select using (user_id=auth.uid());
create policy "unlock_insert_own" on public.episode_unlocks for insert with check (user_id=auth.uid());
create policy "watch_history_owner_all" on public.watch_history for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "analytics_insert" on public.analytics_events for insert with check (user_id is null or user_id=auth.uid());
create policy "analytics_select_own" on public.analytics_events for select using (user_id=auth.uid());

-- Storage buckets should be created as private buckets in Supabase:
-- studio-private (owner assets, references, drafts) and published-media (delivery assets).
-- Keep service-role keys exclusively in server-side environment variables.
