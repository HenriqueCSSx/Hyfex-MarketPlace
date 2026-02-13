-- Create Support Tickets Table
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  subject text not null,
  description text,
  category text default 'general', -- account, technical, billing, abuse, general
  status text default 'open', -- open, in_progress, resolved, closed
  priority text default 'medium', -- low, medium, high, urgent
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Support Messages Table
create table if not exists support_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  message text not null,
  is_staff boolean default false, -- true if sender is admin/support staff
  created_at timestamptz default now()
);

-- Enable RLS
alter table support_tickets enable row level security;
alter table support_messages enable row level security;

-- Policies for Tickets
create policy "Users can view own tickets" 
  on support_tickets for select 
  using (auth.uid() = user_id);

create policy "Users can create tickets" 
  on support_tickets for insert 
  with check (auth.uid() = user_id);

-- Policies for Messages
create policy "Users can view messages of own tickets" 
  on support_messages for select 
  using (
    exists (
      select 1 from support_tickets 
      where id = ticket_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can reply to own tickets" 
  on support_messages for insert 
  with check (
    auth.uid() = sender_id 
    and exists (
      select 1 from support_tickets 
      where id = ticket_id 
      and user_id = auth.uid()
    )
  );
