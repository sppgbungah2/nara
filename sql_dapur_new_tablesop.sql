-- SQL MIGRATION SUPABASE TERBARU (SKEMA PER-DIVISI)
-- FILENAME: sql_dapur_new_tablesop.sql
-- PERINTAH: Salin seluruh skrip ini dan jalankan di Dashboard Supabase -> SQL Editor.
-- CATATAN: Skrip ini TIDAK MENGHAPUS data yang sudah ada (menggunakan CREATE TABLE IF NOT EXISTS).

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

CREATE TABLE IF NOT EXISTS public.sop_tasks (
  id TEXT PRIMARY KEY,
  sop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'aktif',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Nonaktifkan RLS agar dapat dibaca & ditulis publik/anonim tanpa kendala izin
ALTER TABLE public.sops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_driver DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_stocking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_masak DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_pemorsian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_kebersihan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_cuci DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_task_keamanan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_docs DISABLE ROW LEVEL SECURITY;
