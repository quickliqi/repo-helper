-- Create the user_contract_credits table
create table "public"."user_contract_credits" (
    "user_id" uuid not null references "auth"."users" ("id") on delete cascade,
    "monthly_free_credits" integer default 5,
    "purchased_credits" integer default 0,
    "last_reset_date" timestamp with time zone default now(),
    primary key ("user_id")
);

-- Enable Row Level Security
alter table "public"."user_contract_credits" enable row level security;

-- Create RLS policies
create policy "Users can view their own contract credits"
on "public"."user_contract_credits"
for select
to authenticated
using ( (select auth.uid()) = user_id );

-- Create a function to handle new user signups
create or replace function public.handle_new_user_contract_credits()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_contract_credits (user_id, monthly_free_credits, purchased_credits)
  values (new.id, 5, 0);
  return new;
end;
$$;

-- Create the trigger
create trigger on_auth_user_created_contract_credits
  after insert on auth.users
  for each row execute procedure public.handle_new_user_contract_credits();
