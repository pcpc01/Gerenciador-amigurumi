-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Clients table
create table clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  whatsapp text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Products table (since Orders reference Products)
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  photo_url text,
  description text,
  weight text,
  height text,
  width text,
  length text,
  base_price numeric,
  pdf_link text,
  recipe_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Orders table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id),
  product_id uuid references products(id),
  client_name text, -- Snapshot or fallback
  whatsapp text,    -- Snapshot or fallback
  order_date date,
  delivery_date date,
  final_price numeric,
  status text check (status in ('pending', 'in_progress', 'done', 'delivered', 'cancelled')),
  progress_notes text,
  current_step integer,
  order_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- For now, we'll enable public access for simplicity, but in production you should configure policies.
alter table clients enable row level security;
alter table products enable row level security;
alter table orders enable row level security;

-- Create policies to allow public read/write (WARNING: For development only)
create policy "Public Access Clients" on clients for all using (true) with check (true);
create policy "Public Access Products" on products for all using (true) with check (true);
create policy "Public Access Orders" on orders for all using (true) with check (true);
