-- Core tables
create table if not exists public.links (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  short_code text unique not null,
  original_url text not null,
  clicks integer not null default 0,
  is_archived boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics (
  id bigserial primary key,
  link_id bigint references public.links on delete cascade,
  visitor_id uuid,
  user_agent text,
  referrer text,
  country text,
  clicked_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  email_notifications boolean not null default true,
  dark_mode boolean not null default false
);

-- RLS
alter table public.links enable row level security;
alter table public.analytics enable row level security;
alter table public.user_settings enable row level security;

-- Links policies
create policy "links owner read" on public.links
  for select using (auth.uid() = user_id);

create policy "links owner insert" on public.links
  for insert with check (auth.uid() = user_id);

create policy "links owner update" on public.links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "links owner delete" on public.links
  for delete using (auth.uid() = user_id);

-- Analytics policies: allow owner reads via link ownership
create policy "analytics owner read" on public.analytics
  for select using (
    exists (
      select 1 from public.links l
      where l.id = analytics.link_id
        and l.user_id = auth.uid()
    )
  );

-- Allow anyone to insert analytics rows (used by redirect function)
create policy "analytics insert" on public.analytics
  for insert with check (true);

-- User settings policies
create policy "settings owner read" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "settings owner upsert" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "settings owner update" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Increment + log click function (publicly callable)
create or replace function public.increment_link_click(
  p_short_code text,
  p_user_agent text,
  p_referrer text,
  p_country text,
  p_visitor_id uuid
)
returns public.links
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.links;
begin
  select * into l
  from public.links
  where short_code = p_short_code
    and is_archived = false
    and (expires_at is null or expires_at > now())
  limit 1;

  if not found then
    raise exception 'link not found';
  end if;

  update public.links
  set clicks = clicks + 1
  where id = l.id
  returning * into l;

  insert into public.analytics (link_id, visitor_id, user_agent, referrer, country)
  values (l.id, p_visitor_id, p_user_agent, p_referrer, p_country);

  return l;
end;
$$;

grant execute on function public.increment_link_click(text, text, text, text, uuid) to anon, authenticated;
