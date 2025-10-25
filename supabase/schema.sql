-- مخطط قاعدة البيانات لتطبيق Gold Wallet على Supabase
-- يشمل جدول المشتريات وسياسات RLS للحماية حسب المستخدم

-- تأكد من تفعيل الامتداد المطلوب لتوليد UUID (عادة مفعّل على Supabase)
-- create extension if not exists pgcrypto;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  karat int not null,
  weight numeric not null,
  price_per_gram numeric not null,
  manufacturing numeric default 0,
  other_expenses numeric default 0,
  total_cost numeric not null,
  inserted_at timestamptz default now()
);

-- فهرسة شائعة لتحسين الاستعلامات
create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists purchases_date_idx on public.purchases(date);

-- تفعيل سياسات RLS
alter table public.purchases enable row level security;

-- يسمح للمستخدم بقراءة/إضافة/تعديل/حذف سجلاته فقط
create policy "Allow read own purchases" on public.purchases
  for select using (auth.uid() = user_id);

create policy "Allow insert own purchases" on public.purchases
  for insert with check (auth.uid() = user_id);

create policy "Allow update own purchases" on public.purchases
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Allow delete own purchases" on public.purchases
  for delete using (auth.uid() = user_id);

-- ملاحظات التنفيذ:
-- 1) أنشئ مشروع Supabase من لوحة التحكم.
-- 2) ضع القيم في ملف .env.local: NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- 3) الصق هذا المخطط في SQL editor داخل Supabase ونفّذه لإنشاء الجداول والسياسات.
-- 4) تأكد أن Authentication مفعّلة مع البريد الإلكتروني، وسيتم إرسال رسالة تأكيد تلقائيًا عند التسجيل.
