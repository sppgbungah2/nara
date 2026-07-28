-- =====================================================================
-- SPPG BUNGAH 2 - SUPABASE DATABASE SCHEMA & MIGRATION SCRIPT (sql_dapur_2.sql)
-- Satuan Pelayanan Program Gizi (SPPG) Dapur Utama MBG
-- Yayasan Pondok Pesantren Qomaruddin, Bungah, Gresik
-- =====================================================================
-- PERINTAH BUKA SUPABASE:
-- 1. Buka Dashboard Supabase -> SQL Editor.
-- 2. Salin seluruh skrip ini dan klik "Run".
-- 3. Seluruh tabel utama, per-divisi SOP task (format sop_tasks_* dan sop_task_*), dan kebijakan akses akan siap 100%.
-- =====================================================================

-- 1. TABEL MENUS HARIAN (day_menus)
CREATE TABLE IF NOT EXISTS public.day_menus (
  id TEXT,
  date TEXT PRIMARY KEY,
  day_name TEXT,
  menu_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  portion_count INT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin@qomaruddin.com'
);

-- 2. TABEL DOKUMEN SOP DIVISI (sops)
CREATE TABLE IF NOT EXISTS public.sops (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  division TEXT NOT NULL,
  creator_role TEXT,
  creator_name TEXT,
  is_checked_all BOOLEAN DEFAULT FALSE,
  signer_supervisor TEXT,
  signature_supervisor_url TEXT,
  signed_supervisor_at TIMESTAMP WITH TIME ZONE,
  signer_coordinator TEXT,
  signature_coordinator_url TEXT,
  signed_coordinator_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sops_date ON public.sops(date);
CREATE INDEX IF NOT EXISTS idx_sops_division ON public.sops(division);

-- 3. TABEL SOP TASKS (Generic + Plural & Singular Per-Divisi)
CREATE TABLE IF NOT EXISTS public.sop_tasks (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL PER-DIVISI (JAMAK: sop_tasks_*)
CREATE TABLE IF NOT EXISTS public.sop_tasks_driver (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_tasks_stocking (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_tasks_masak (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_tasks_pemorsian (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_tasks_kebersihan (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_tasks_cuci (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_tasks_keamanan (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL PER-DIVISI (TUNGGAL: sop_task_*)
CREATE TABLE IF NOT EXISTS public.sop_task_driver (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_task_stocking (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_task_masak (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_task_pemorsian (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_task_kebersihan (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_task_cuci (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sop_task_keamanan (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks Pencarian SOP ID
CREATE INDEX IF NOT EXISTS idx_sop_tasks_sop_id ON public.sop_tasks(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_tasks_driver_sop_id ON public.sop_tasks_driver(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_tasks_stocking_sop_id ON public.sop_tasks_stocking(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_tasks_masak_sop_id ON public.sop_tasks_masak(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_tasks_pemorsian_sop_id ON public.sop_tasks_pemorsian(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_tasks_kebersihan_sop_id ON public.sop_tasks_kebersihan(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_tasks_cuci_sop_id ON public.sop_tasks_cuci(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_tasks_keamanan_sop_id ON public.sop_tasks_keamanan(sop_id);

CREATE INDEX IF NOT EXISTS idx_sop_task_driver_sop_id ON public.sop_task_driver(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_task_stocking_sop_id ON public.sop_task_stocking(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_task_masak_sop_id ON public.sop_task_masak(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_task_pemorsian_sop_id ON public.sop_task_pemorsian(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_task_kebersihan_sop_id ON public.sop_task_kebersihan(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_task_cuci_sop_id ON public.sop_task_cuci(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_task_keamanan_sop_id ON public.sop_task_keamanan(sop_id);

-- 4. TABEL DOKUMEN SHIPPING & OPERASIONAL (shipping_docs)
CREATE TABLE IF NOT EXISTS public.shipping_docs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  vehicle_number TEXT,
  image_url TEXT,
  comments TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  receiver_name TEXT,
  status TEXT DEFAULT 'Aktif',
  sj_no TEXT,
  sj_kepada TEXT,
  sj_waktu TEXT,
  sj_driver TEXT,
  sj_rows JSONB,
  sj_signature_aslap TEXT,
  sj_signature_receiver TEXT,
  bast_no TEXT,
  bast_driver TEXT,
  bast_sekolah TEXT,
  bast_penerima TEXT,
  bast_barang TEXT,
  bast_jumlah INT,
  bast_waktu TEXT,
  bast_signature_driver TEXT,
  bast_signature_receiver TEXT,
  orlep_jam TEXT,
  orlep_panelis TEXT,
  orlep_desa TEXT,
  orlep_menu TEXT,
  orlep_kritik TEXT,
  orlep_grid JSONB
);

-- 5. TABEL PORSI SEKOLAH & KEDATANGAN BARANG & LAINNYA
CREATE TABLE IF NOT EXISTS public.master_porsi (
  date TEXT PRIMARY KEY,
  portions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT DEFAULT 'admin@qomaruddin.com',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kedatangan_barang (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  name TEXT,
  qty NUMERIC DEFAULT 0,
  uom TEXT,
  supplier TEXT,
  checker TEXT,
  input TEXT,
  specification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sisa_stok (
  id TEXT PRIMARY KEY,
  date TEXT,
  item_name TEXT,
  category TEXT,
  quantity TEXT,
  remaining_qty NUMERIC DEFAULT 0,
  unit TEXT,
  condition TEXT,
  action_plan TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_requests (
  id TEXT PRIMARY KEY,
  date TEXT,
  division TEXT,
  item_name TEXT,
  qty TEXT,
  requested_qty NUMERIC DEFAULT 0,
  unit TEXT,
  reason TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.volunteer_complaints (
  id TEXT PRIMARY KEY,
  date TEXT,
  source TEXT,
  reporter_name TEXT,
  category TEXT,
  complaint_text TEXT,
  status TEXT DEFAULT 'pending',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DISABLE RLS ATAU BUAT ACCESS POLICY TERBUKA AGAR TIDAK TERBLOKIR
ALTER TABLE public.day_menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.sop_tasks_driver DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks_stocking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks_masak DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks_pemorsian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks_kebersihan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks_cuci DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks_keamanan DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.sop_task_driver DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_stocking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_masak DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_pemorsian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_kebersihan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_cuci DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_keamanan DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.shipping_docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_porsi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kedatangan_barang DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisa_stok DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_complaints DISABLE ROW LEVEL SECURITY;
