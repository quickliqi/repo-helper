-- Create user_contract_credits table
create table if not exists public.user_contract_credits (
    user_id uuid references auth.users(id) on delete cascade primary key,
    monthly_free_credits integer not null default 5,
    purchased_credits integer not null default 0,
    last_reset_date timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS Policies
alter table public.user_contract_credits enable row level security;

-- Users can read their own credits
create policy "Users can read own contract credits"
    on public.user_contract_credits
    for select
    using (auth.uid() = user_id);

-- Only service_role (Edge Functions) can update credits
-- No update policy for authenticated users preventing them from modifying their own credits directly

-- Indexes
create index if not exists idx_user_contract_credits_user_id on public.user_contract_credits(user_id);

-- Trigger to create entry on user signup (optional, but good practice if we want immediate rows)
-- For now, the Edge Function will handle creation if the row doesn't exist (upsert).
-- But let's create a function to handle timestamp updates automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.user_contract_credits
    for each row
    execute function public.handle_updated_at();
