-- Project Doctrine schema: rooms, progression, battles, doctrine, pvp.
-- Broadcast + Presence only; RLS read-own, writes via service role.

create extension if not exists "pgcrypto";

create table if not exists zones (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  max_instances int not null default 10,
  is_persistent boolean not null default true
);

create table if not exists players (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  level int not null default 1,
  xp int not null default 0,
  gold int not null default 0,
  hp int not null default 100,
  max_hp int not null default 100,
  mp int not null default 50,
  max_mp int not null default 50,
  class text not null default 'vanguard',
  current_room_id uuid,
  last_seen_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zones(id) on delete cascade,
  instance_number int not null default 1,
  capacity int not null default 8,
  current_players int not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  unique(zone_id, instance_number)
);

create table if not exists room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  x int not null default 100,
  y int not null default 500,
  last_heartbeat_at timestamptz not null default now(),
  last_move_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  rarity text not null default 'common',
  slot text not null default 'trinket',
  stats jsonb not null default '{}'
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  quantity int not null default 1,
  equipped boolean not null default false
);

create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete set null,
  kind text not null default 'pve',
  state text not null default 'active',
  participants jsonb not null default '[]',
  log jsonb not null default '[]',
  winner_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists doctrines (
  player_id uuid primary key references players(id) on delete cascade,
  zone_id uuid references zones(id) on delete set null,
  risk_level int not null default 1,
  retreat_hp_pct int not null default 30,
  skill_priority jsonb not null default '[]',
  last_resolved_at timestamptz not null default now()
);

create table if not exists offline_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  from_ts timestamptz not null,
  to_ts timestamptz not null default now(),
  gold_gained int not null default 0,
  xp_gained int not null default 0,
  items_gained jsonb not null default '[]',
  deaths int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pvp_matches (
  id uuid primary key default gen_random_uuid(),
  attacker_id uuid not null references players(id) on delete cascade,
  defender_id uuid not null references players(id) on delete cascade,
  winner_id uuid references players(id) on delete set null,
  battle_id uuid references battles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table zones enable row level security;
alter table players enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table items enable row level security;
alter table inventory enable row level security;
alter table battles enable row level security;
alter table doctrines enable row level security;
alter table offline_reports enable row level security;
alter table pvp_matches enable row level security;

-- Read-own / public-read minimal policies (writes via service role only).
drop policy if exists "public read zones" on zones;
create policy "public read zones" on zones for select using (true);
drop policy if exists "public read items" on items;
create policy "public read items" on items for select using (true);
drop policy if exists "public read rooms" on rooms;
create policy "public read rooms" on rooms for select using (true);
drop policy if exists "own player" on players;
create policy "own player" on players for select using (auth.uid() = id);
drop policy if exists "own members" on room_members;
create policy "own members" on room_members for select using (true);
drop policy if exists "own inventory" on inventory;
create policy "own inventory" on inventory for select using (auth.uid() = player_id);
drop policy if exists "own battles" on battles;
create policy "own battles" on battles for select using (true);
drop policy if exists "own doctrine" on doctrines;
create policy "own doctrine" on doctrines for select using (auth.uid() = player_id);
drop policy if exists "own reports" on offline_reports;
create policy "own reports" on offline_reports for select using (auth.uid() = player_id);
drop policy if exists "own pvp" on pvp_matches;
create policy "own pvp" on pvp_matches for select using (auth.uid() = attacker_id or auth.uid() = defender_id);

create index if not exists idx_rooms_zone on rooms(zone_id);
create index if not exists idx_members_player on room_members(player_id);
create index if not exists idx_members_heartbeat on room_members(last_heartbeat_at);
create index if not exists idx_reports_player on offline_reports(player_id);
create index if not exists idx_battles_room on battles(room_id);
