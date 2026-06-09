-- FitStore Pro - Schema completo
-- Ejecutar en Supabase SQL Editor

-- Configuración global de la tienda
create table if not exists store_settings (
  id int primary key default 1,
  trm numeric not null default 4100,
  ganancia numeric not null default 45000,
  whatsapp_phone text default '573001112233',
  julian_phone text default '573001112233',
  angie_phone text default '573011111111',
  updated_at timestamp with time zone default now(),
  constraint single_settings check (id = 1)
);

insert into store_settings (id, trm, ganancia, julian_phone, angie_phone)
values (1, 4100, 45000, '573001112233', '573011111111')
on conflict (id) do nothing;

-- Productos
create table if not exists products (
  id bigint generated always as identity primary key,
  nombre text not null,
  marca text,
  imagen text,
  imagenes text[],
  precio_usd numeric not null default 0,
  precio_cop numeric not null default 0,
  costo_real numeric not null default 0,
  precio_final numeric not null default 0,
  utilidad numeric not null default 0,
  -- `tiene_promocion` intentionally nullable: scraper leaves null for manual review
  tiene_promocion boolean default null,
  categoria text,
  tamano text,
  sabores text[],
  iherb_url text unique,
  created_at timestamp with time zone default now()
);

-- Migración desde schema anterior (si existe)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'tiene_descuento'
  ) then
    alter table products rename column tiene_descuento to tiene_promocion;
  end if;
exception when others then null;
end $$;

alter table products add column if not exists precio_cop numeric default 0;
alter table products add column if not exists costo_real numeric default 0;
alter table products add column if not exists utilidad numeric default 0;
-- stock is not used in this deployment; do not add stock column
-- Ensure `tiene_promocion` exists for existing databases (nullable for manual review)
alter table products add column if not exists tiene_promocion boolean default null;
alter table products add column if not exists categoria text;
alter table products add column if not exists tamano text;
alter table products add column if not exists sabores text[];
alter table products add column if not exists iherb_url text;
alter table products add column if not exists imagenes text[];

-- Pedidos
create table if not exists orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  customer_phone text not null,
  total numeric not null default 0,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid')),
  cliente_pago boolean default false,
  pagado_vendedor boolean default false,
  created_at timestamp with time zone default now()
);

-- Agregar columnas si no existen (para bases de datos existentes)
alter table orders add column if not exists cliente_pago boolean default false;
alter table orders add column if not exists pagado_vendedor boolean default false;

-- Items de pedido
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  quantity int not null default 1,
  precio_unitario numeric not null default 0,
  subtotal numeric not null default 0,
  product_name text,
  product_marca text
);

-- Índices
create index if not exists idx_products_categoria on products(categoria);
create index if not exists idx_products_marca on products(marca);
create index if not exists idx_orders_status on orders(payment_status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- Vista para métricas de ventas por producto
create or replace view product_sales_stats as
select
  p.id,
  p.nombre,
  p.marca,
  p.imagen,
  p.precio_usd,
  p.precio_cop,
  p.costo_real,
  p.precio_final,
  p.utilidad,
  p.tiene_promocion,
  p.categoria,
  p.created_at,
  coalesce(sum(oi.quantity), 0) as unidades_vendidas,
  coalesce(sum(oi.subtotal), 0) as total_ventas
from products p
left join order_items oi on oi.product_id = p.id
left join orders o on o.id = oi.order_id and o.payment_status = 'paid'
group by p.id;

-- Enable RLS on tables (if not already enabled)
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Permissive policies to allow all operations (for service_role and authenticated users)
-- Products table
drop policy if exists "Allow service_role full access to products" on products;
create policy "Allow service_role full access to products"
  on products
  using (true)
  with check (true);

drop policy if exists "Allow read access to products" on products;
create policy "Allow read access to products"
  on products
  for select
  using (true);

-- Orders table
drop policy if exists "Allow service_role full access to orders" on orders;
create policy "Allow service_role full access to orders"
  on orders
  using (true)
  with check (true);

drop policy if exists "Allow read access to orders" on orders;
create policy "Allow read access to orders"
  on orders
  for select
  using (true);

-- Order items table
drop policy if exists "Allow service_role full access to order_items" on order_items;
create policy "Allow service_role full access to order_items"
  on order_items
  using (true)
  with check (true);

drop policy if exists "Allow read access to order_items" on order_items;
create policy "Allow read access to order_items"
  on order_items
  for select
  using (true);

-- Store settings table (allow read access)
alter table store_settings enable row level security;
drop policy if exists "Allow read access to store_settings" on store_settings;
create policy "Allow read access to store_settings"
  on store_settings
  for select
  using (true);
