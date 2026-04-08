-- ============================================================
-- Rendimeta Mobile Demo Bootstrap (Supabase SQL)
-- ============================================================
-- Objetivo:
-- - Crear rol "vendedor" (tabla public.roles) si no existe
-- - Crear tablas de capacitación + reportes
-- - Inyectar datos demo de capacitación
-- - Habilitar permisos mínimos para la app móvil (anon/authenticated)
--
-- Nota:
-- Este script asume el esquema actual estilo Prisma (camelCase).
-- Es seguro ejecutarlo múltiples veces.

-- ----------------------------
-- 1) Rol "vendedor" (app role)
-- ----------------------------
insert into public.roles ("id","name","description","level","isActive","createdAt","updatedAt")
values ('role_vendedor','Vendedor','Despachador / vendedor de estación',0,true,now(),now())
on conflict ("name") do nothing;

-- ----------------------------
-- 2) Capacitación
-- ----------------------------
create table if not exists public.training_videos (
  "id" text primary key,
  "title" text not null,
  "subtitle" text,
  "duration" text not null default '5 min',
  "xpReward" int not null default 10,
  "accentColor" text,
  "videoUrl" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.employee_training (
  "id" text primary key,
  "employeeId" text not null references public.employees("id") on delete cascade,
  "videoId" text not null references public.training_videos("id") on delete cascade,
  "completed" boolean not null default false,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  unique ("employeeId","videoId")
);

-- Seed videos demo (URLs públicas)
insert into public.training_videos
("id","title","subtitle","duration","xpReward","accentColor","videoUrl","isActive","createdAt","updatedAt")
values
('tv_001','Venta consultiva en 30s','Cómo ofrecer sin presionar','4 min',15,'#FF2DE2E2','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',true,now(),now()),
('tv_002','Aceites: recomendación rápida','Cómo preguntar y recomendar','5 min',15,'#FFE6007A','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',true,now(),now()),
('tv_003','Presión de llantas: seguridad','Etiqueta de puerta y verificación','3 min',10,'#FFFFAA5E','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',true,now(),now()),
('tv_004','Manejo de quejas','Resolver y escalar con calma','6 min',20,'#FF7A28FF','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',true,now(),now()),
('tv_005','Checklist de turno','Inicio y cierre sin fallas','4 min',10,'#FF00AEEF','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',true,now(),now())
on conflict ("id") do nothing;

-- ----------------------------
-- 3) Reportes al gerente
-- ----------------------------
create table if not exists public.incident_reports (
  "id" text primary key,
  "stationId" text not null references public.stations("id") on delete cascade,
  "employeeId" text not null references public.employees("id") on delete cascade,
  "category" text,
  "message" text not null,
  "createdAt" timestamptz not null default now()
);

-- ----------------------------
-- 4) Permisos mínimos (demo)
-- ----------------------------
-- Importante:
-- - La app móvil ahora usa Supabase Auth (email/password) para iniciar sesión.
-- - Para que la autorización funcione, el email del usuario autenticado debe existir en public.users.
-- - Este script habilita RLS con políticas simples basadas en ese email (auth.jwt()->>'email').

revoke all on schema public from anon;
grant usage on schema public to authenticated;

-- Catálogos (lectura pública para autenticados)
grant select on public.roles to authenticated;
grant select on public.stations to authenticated;
grant select on public.products to authenticated;
grant select on public.product_categories to authenticated;
grant select on public.achievement_definitions to authenticated;
grant select on public.training_videos to authenticated;

-- Column-level grants: evita exponer passwordHash.
revoke all on public.users from anon, authenticated;
grant select ("id","email","firstName","lastName","roleId","employeeId","stationIds","isActive","lastLoginAt","createdAt","updatedAt")
  on public.users to authenticated;

-- Datos propios (lectura + escritura limitada)
grant select on public.employees to authenticated;
grant select, insert on public.sale_records to authenticated;
grant select, insert on public.employee_achievements to authenticated;
grant select, insert, update on public.gamification_scores to authenticated;
grant select, insert, update on public.employee_training to authenticated;
grant select on public.quota_assignments to authenticated;
grant insert on public.incident_reports to authenticated;

-- ----------------------------
-- 4.1) RLS (Row Level Security)
-- ----------------------------
create or replace function public.requesting_user_email()
returns text
language sql
stable
as $$
  select (auth.jwt() ->> 'email')::text;
$$;

create or replace function public.requesting_employee_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u."employeeId"
  from public.users u
  where u.email = public.requesting_user_email()
  limit 1;
$$;

create or replace function public.requesting_station_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select e."stationId"
  from public.employees e
  where e.id = public.requesting_employee_id()
  limit 1;
$$;

-- Habilitar RLS en tablas usadas por móvil
alter table public.users enable row level security;
alter table public.employees enable row level security;
alter table public.sale_records enable row level security;
alter table public.employee_achievements enable row level security;
alter table public.gamification_scores enable row level security;
alter table public.employee_training enable row level security;
alter table public.quota_assignments enable row level security;
alter table public.incident_reports enable row level security;
alter table public.roles enable row level security;
alter table public.stations enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.training_videos enable row level security;

-- Políticas idempotentes
do $$
begin
  -- users: solo tu propio perfil por email
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='mobile_users_select_own'
  ) then
    create policy "mobile_users_select_own" on public.users
      for select
      to authenticated
      using (email = public.requesting_user_email());
  end if;

  -- employees: solo tu propio empleado (por employeeId vinculado en users)
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='employees' and policyname='mobile_employees_select_own'
  ) then
    create policy "mobile_employees_select_own" on public.employees
      for select
      to authenticated
      using (id = public.requesting_employee_id());
  end if;

  -- HOTFIX (2026-04-08):
  -- Esta policy provoca recursion porque llama requesting_station_id(),
  -- y requesting_station_id() consulta public.employees (RLS), lo cual vuelve a evaluar esta policy.
  -- Síntoma en la app: Postgres error 54001 "stack depth limit exceeded".
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='employees' and policyname='mobile_employees_select_station'
  ) then
    drop policy "mobile_employees_select_station" on public.employees;
  end if;

  -- sale_records: leer e insertar solo tus ventas (y leer la estación para ranking)
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='sale_records' and policyname='mobile_sales_select_own'
  ) then
    create policy "mobile_sales_select_own" on public.sale_records
      for select
      to authenticated
      using ("employeeId" = public.requesting_employee_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='sale_records' and policyname='mobile_sales_select_station'
  ) then
    create policy "mobile_sales_select_station" on public.sale_records
      for select
      to authenticated
      using ("stationId" = public.requesting_station_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='sale_records' and policyname='mobile_sales_insert_own'
  ) then
    create policy "mobile_sales_insert_own" on public.sale_records
      for insert
      to authenticated
      with check (
        "employeeId" = public.requesting_employee_id() and
        "stationId" = public.requesting_station_id()
      );
  else
    alter policy "mobile_sales_insert_own" on public.sale_records
      with check (
        "employeeId" = public.requesting_employee_id() and
        "stationId" = public.requesting_station_id()
      );
  end if;

  -- employee_achievements: leer e insertar solo las tuyas
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='employee_achievements' and policyname='mobile_ach_select_own'
  ) then
    create policy "mobile_ach_select_own" on public.employee_achievements
      for select
      to authenticated
      using ("employeeId" = public.requesting_employee_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='employee_achievements' and policyname='mobile_ach_insert_own'
  ) then
    create policy "mobile_ach_insert_own" on public.employee_achievements
      for insert
      to authenticated
      with check ("employeeId" = public.requesting_employee_id());
  end if;

  -- gamification_scores: leer / insertar / actualizar solo tu score
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='gamification_scores' and policyname='mobile_scores_select_own'
  ) then
    create policy "mobile_scores_select_own" on public.gamification_scores
      for select
      to authenticated
      using ("employeeId" = public.requesting_employee_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='gamification_scores' and policyname='mobile_scores_insert_own'
  ) then
    create policy "mobile_scores_insert_own" on public.gamification_scores
      for insert
      to authenticated
      with check ("employeeId" = public.requesting_employee_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='gamification_scores' and policyname='mobile_scores_update_own'
  ) then
    create policy "mobile_scores_update_own" on public.gamification_scores
      for update
      to authenticated
      using ("employeeId" = public.requesting_employee_id());
  end if;

  -- employee_training: leer / insertar / actualizar solo tu progreso
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='employee_training' and policyname='mobile_training_select_own'
  ) then
    create policy "mobile_training_select_own" on public.employee_training
      for select
      to authenticated
      using ("employeeId" = public.requesting_employee_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='employee_training' and policyname='mobile_training_insert_own'
  ) then
    create policy "mobile_training_insert_own" on public.employee_training
      for insert
      to authenticated
      with check ("employeeId" = public.requesting_employee_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='employee_training' and policyname='mobile_training_update_own'
  ) then
    create policy "mobile_training_update_own" on public.employee_training
      for update
      to authenticated
      using ("employeeId" = public.requesting_employee_id());
  end if;

  -- quota_assignments: solo tus cuotas (misiones del día)
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='quota_assignments' and policyname='mobile_quota_select_own'
  ) then
    create policy "mobile_quota_select_own" on public.quota_assignments
      for select
      to authenticated
      using ("employeeId" = public.requesting_employee_id());
  end if;

  -- incident_reports: permitir insertar (reportes al gerente) solo para tu empleado
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='incident_reports' and policyname='mobile_incident_insert_own'
  ) then
    create policy "mobile_incident_insert_own" on public.incident_reports
      for insert
      to authenticated
      with check ("employeeId" = public.requesting_employee_id());
  end if;

  -- Catálogos: lectura abierta para autenticados
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='roles' and policyname='mobile_roles_read'
  ) then
    create policy "mobile_roles_read" on public.roles
      for select
      to authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='stations' and policyname='mobile_stations_read'
  ) then
    create policy "mobile_stations_read" on public.stations
      for select
      to authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='mobile_products_read'
  ) then
    create policy "mobile_products_read" on public.products
      for select
      to authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='product_categories' and policyname='mobile_categories_read'
  ) then
    create policy "mobile_categories_read" on public.product_categories
      for select
      to authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='achievement_definitions' and policyname='mobile_ach_defs_read'
  ) then
    create policy "mobile_ach_defs_read" on public.achievement_definitions
      for select
      to authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='training_videos' and policyname='mobile_training_videos_read'
  ) then
    create policy "mobile_training_videos_read" on public.training_videos
      for select
      to authenticated
      using (true);
  end if;
end
$$;

-- ----------------------------
-- 5) (Opcional) Vincular un vendedor a la app móvil
-- ----------------------------
-- 1) Crea el usuario en Supabase Auth (Dashboard -> Authentication -> Users).
-- 2) Asegura que exista un Employee y un User en public.* con el mismo email.
--
-- Ejemplo (ajusta EMAIL/EMPLOYEE_NUMBER):
-- select id, "employeeNumber", "firstName", "lastName", "stationId" from public.employees limit 10;
--
-- update public.employees
-- set "roleId" = 'role_vendedor', "updatedAt" = now()
-- where "employeeNumber" = 'E-0001';
--
-- insert into public.users
-- ("id","email","passwordHash","firstName","lastName","roleId","employeeId","stationIds","isActive","createdAt","updatedAt")
-- values
-- ('user_demo_vendedor','empleado@sistema.com','SUPABASE_AUTH','Empleado','Demo','role_vendedor',(select id from public.employees where "employeeNumber"='E-0001' limit 1),null,true,now(),now())
-- on conflict ("email") do update
-- set "roleId"='role_vendedor',
--     "employeeId"=excluded."employeeId",
--     "updatedAt"=now();
