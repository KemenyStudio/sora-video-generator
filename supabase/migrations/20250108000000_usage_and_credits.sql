-- Create profiles table to mirror auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Create usage_events table for tracking video generation history
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null,
  model text not null,
  resolution text not null,
  seconds int not null,
  cost_usd numeric(12,4) not null,
  prompt text,
  created_at timestamp with time zone default now()
);

-- Create credit_ledger table for future payment system
create table if not exists public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_usd numeric(12,4) not null,
  reason text,
  ref_id text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.usage_events enable row level security;
alter table public.credit_ledger enable row level security;

-- RLS Policies for profiles
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- RLS Policies for usage_events
drop policy if exists "Users can read their own usage events" on public.usage_events;
create policy "Users can read their own usage events"
  on public.usage_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own usage events" on public.usage_events;
create policy "Users can insert their own usage events"
  on public.usage_events for insert
  with check (auth.uid() = user_id);

-- RLS Policies for credit_ledger
drop policy if exists "Users can read their own credit ledger" on public.credit_ledger;
create policy "Users can read their own credit ledger"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists usage_events_user_id_idx on public.usage_events(user_id);
create index if not exists usage_events_created_at_idx on public.usage_events(created_at desc);
create index if not exists credit_ledger_user_id_idx on public.credit_ledger(user_id);
create index if not exists credit_ledger_created_at_idx on public.credit_ledger(created_at desc);

-- Optional: Function to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = ''
language plpgsql
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Optional: Trigger to call the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

