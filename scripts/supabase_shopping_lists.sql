create table if not exists public.shopping_lists (
  shopping_list_id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_list_items (
  item_id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists (shopping_list_id) on delete cascade,
  name text not null,
  category text not null default 'その他',
  quantity int,
  gram int,
  memo text,
  checked boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shopping_lists_user_id_updated_at_idx
  on public.shopping_lists (user_id, updated_at desc);

create index if not exists shopping_list_items_shopping_list_id_idx
  on public.shopping_list_items (shopping_list_id, sort_order asc);

-- Enable row level security
alter table if exists public.shopping_lists enable row level security;
alter table if exists public.shopping_list_items enable row level security;

-- Policies for shopping_lists
create policy if not exists "Users can manage their own shopping lists"
  on public.shopping_lists
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for shopping_list_items
create policy if not exists "Users can manage items in their own shopping lists"
  on public.shopping_list_items
  for all
  to authenticated
  using (
    shopping_list_id in (
      select shopping_list_id from public.shopping_lists where user_id = auth.uid()
    )
  )
  with check (
    shopping_list_id in (
      select shopping_list_id from public.shopping_lists where user_id = auth.uid()
    )
  );
