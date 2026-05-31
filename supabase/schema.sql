create table if not exists public.workbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  problems jsonb not null default '[]'::jsonb
);

-- Backfill existing rows (if any) so updated_at mirrors created_at
UPDATE public.workbooks SET updated_at = created_at WHERE updated_at IS NULL;

-- Trigger function to auto-update `updated_at` on row updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.workbooks;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.workbooks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

alter table public.workbooks enable row level security;

DROP POLICY IF EXISTS "Users can read own workbooks" ON public.workbooks;
DROP POLICY IF EXISTS "Users can insert own workbooks" ON public.workbooks;
DROP POLICY IF EXISTS "Users can update own workbooks" ON public.workbooks;
DROP POLICY IF EXISTS "Users can delete own workbooks" ON public.workbooks;

CREATE POLICY "Users can read own workbooks"
ON public.workbooks
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND auth.jwt() ->> 'email' LIKE '%@joongdong.hs.kr'
);

CREATE POLICY "Users can insert own workbooks"
ON public.workbooks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND auth.jwt() ->> 'email' LIKE '%@joongdong.hs.kr'
);

CREATE POLICY "Users can update own workbooks"
ON public.workbooks
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND auth.jwt() ->> 'email' LIKE '%@joongdong.hs.kr'
)
WITH CHECK (
  auth.uid() = user_id
  AND auth.jwt() ->> 'email' LIKE '%@joongdong.hs.kr'
);

CREATE POLICY "Users can delete own workbooks"
ON public.workbooks
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND auth.jwt() ->> 'email' LIKE '%@joongdong.hs.kr'
);
