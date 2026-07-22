-- =====================================================================
-- SPPG BUNGAH 2 - SUPABASE DATABASE SCHEMA & RLS POLICIES (sql_dapur_1.sql)
-- Satuan Pelayanan Program Gizi (SPPG) Dapur Utama MBG
-- Yayasan Pondok Pesantren Qomaruddin, Bungah, Gresik
-- =====================================================================
-- Cara Penggunaan:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Paste seluruh isi script SQL ini lalu klik "Run"
-- 3. Semua tabel, RLS policy, serta index akan terbuat dan siap digunakan secara real.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABEL MENUS HARIAN (day_menus)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.day_menus (
    date TEXT PRIMARY KEY,
    menu_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
    created_by TEXT DEFAULT 'admin@qomaruddin.com'
);

ALTER TABLE public.day_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for day_menus" ON public.day_menus;
CREATE POLICY "Enable all access for day_menus" ON public.day_menus
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 2. TABEL DOKUMEN SOP DIVISI (sops)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sops (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    division TEXT NOT NULL,
    creator_role TEXT,
    creator_name TEXT,
    is_checked_all BOOLEAN DEFAULT false,
    signer_supervisor TEXT,
    signature_supervisor_url TEXT,
    signed_supervisor_at TEXT,
    signer_coordinator TEXT,
    signature_coordinator_url TEXT,
    signed_coordinator_at TEXT,
    status TEXT DEFAULT 'aktif',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP::text
);

CREATE INDEX IF NOT EXISTS idx_sops_date ON public.sops(date);
CREATE INDEX IF NOT EXISTS idx_sops_division ON public.sops(division);

ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for sops" ON public.sops;
CREATE POLICY "Enable all access for sops" ON public.sops
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 3. TABEL ITEM CHECKLIST SOP (sop_tasks)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sop_tasks (
    id TEXT PRIMARY KEY,
    sop_id TEXT NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    category TEXT,
    sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sop_tasks_sop_id ON public.sop_tasks(sop_id);

ALTER TABLE public.sop_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for sop_tasks" ON public.sop_tasks;
CREATE POLICY "Enable all access for sop_tasks" ON public.sop_tasks
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 4. TABEL MASTER PORSI SEKOLAH (master_porsi)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.master_porsi (
    date TEXT PRIMARY KEY,
    portions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by TEXT DEFAULT 'admin@qomaruddin.com',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP::text
);

ALTER TABLE public.master_porsi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for master_porsi" ON public.master_porsi;
CREATE POLICY "Enable all access for master_porsi" ON public.master_porsi
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 5. TABEL KEDATANGAN BARANG & LOGISTIK (kedatangan_barang)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kedatangan_barang (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    qty NUMERIC DEFAULT 0,
    uom TEXT,
    supplier TEXT,
    checker TEXT,
    input TEXT,
    specification TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kedatangan_barang_date ON public.kedatangan_barang(date);

ALTER TABLE public.kedatangan_barang ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for kedatangan_barang" ON public.kedatangan_barang;
CREATE POLICY "Enable all access for kedatangan_barang" ON public.kedatangan_barang
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 6. TABEL DOKUMEN PENGIRIMAN, BAST, SURAT JALAN & ORGANOLEPTIK (shipping_docs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_docs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'bast', 'surat_jalan', 'organoleptik'
    doc_number TEXT,
    date TEXT NOT NULL,
    time TEXT,
    school_name TEXT,
    portions INT DEFAULT 0,
    driver_name TEXT,
    vehicle_number TEXT,
    image_url TEXT,
    comments TEXT,
    uploaded_by TEXT,
    uploaded_at TEXT,
    receiver_name TEXT,
    status TEXT,

    -- Fields spesifik BAST
    bast_no TEXT,
    bast_driver TEXT,
    bast_sekolah TEXT,
    bast_penerima TEXT,
    bast_barang TEXT,
    bast_jumlah TEXT,
    bast_waktu TEXT,
    bast_signature_driver TEXT,
    bast_signature_receiver TEXT,

    -- Fields spesifik Surat Jalan
    sj_no TEXT,
    sj_kepada TEXT,
    sj_waktu TEXT,
    sj_driver TEXT,
    sj_rows JSONB,
    sj_signature_aslap TEXT,
    sj_signature_receiver TEXT,

    -- Fields spesifik Organoleptik
    organoleptik_rasa TEXT,
    organoleptik_aroma TEXT,
    organoleptik_tekstur TEXT,
    organoleptik_suhu TEXT,
    orlep_jam TEXT,
    orlep_panelis TEXT,
    orlep_desa TEXT,
    orlep_menu TEXT,
    orlep_kritik TEXT,
    orlep_grid JSONB,
    orlep_signature TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_docs_date ON public.shipping_docs(date);
CREATE INDEX IF NOT EXISTS idx_shipping_docs_type ON public.shipping_docs(type);

ALTER TABLE public.shipping_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for shipping_docs" ON public.shipping_docs;
CREATE POLICY "Enable all access for shipping_docs" ON public.shipping_docs
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 7. TABEL SISA STOK DAPUR (sisa_stok)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sisa_stok (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity TEXT,
    condition TEXT,
    action_plan TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sisa_stok ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for sisa_stok" ON public.sisa_stok;
CREATE POLICY "Enable all access for sisa_stok" ON public.sisa_stok
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 8. TABEL PENGAJUAN ORDER ALAT & OPERASIONAL (order_requests)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_requests (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    qty TEXT,
    reason TEXT,
    category TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for order_requests" ON public.order_requests;
CREATE POLICY "Enable all access for order_requests" ON public.order_requests
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 9. TABEL KELUHAN & MASUKAN RELAWAN/PENERIMA (volunteer_complaints)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.volunteer_complaints (
    id TEXT PRIMARY KEY,
    source TEXT,
    category TEXT,
    complaint_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.volunteer_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for volunteer_complaints" ON public.volunteer_complaints;
CREATE POLICY "Enable all access for volunteer_complaints" ON public.volunteer_complaints
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 10. TABEL STOCK OPNAME PANGAN (stock_opname)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_opname (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_opname_date ON public.stock_opname(date);

ALTER TABLE public.stock_opname ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for stock_opname" ON public.stock_opname;
CREATE POLICY "Enable all access for stock_opname" ON public.stock_opname
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 11. TABEL STOCK OPERASIONAL NON-PANGAN (stock_operasional)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_operasional (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_operasional_date ON public.stock_operasional(date);

ALTER TABLE public.stock_operasional ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for stock_operasional" ON public.stock_operasional;
CREATE POLICY "Enable all access for stock_operasional" ON public.stock_operasional
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 12. TABEL ABSENSI RELAWAN & SIGN OFF (absensi_logs & absensi_signoffs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.absensi_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    volunteers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_absensi_logs_date ON public.absensi_logs(date);

ALTER TABLE public.absensi_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for absensi_logs" ON public.absensi_logs;
CREATE POLICY "Enable all access for absensi_logs" ON public.absensi_logs
    FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.absensi_signoffs (
    date TEXT PRIMARY KEY,
    signer_name TEXT,
    signer_role TEXT,
    signature_url TEXT,
    signed_at TEXT,
    status TEXT DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.absensi_signoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for absensi_signoffs" ON public.absensi_signoffs;
CREATE POLICY "Enable all access for absensi_signoffs" ON public.absensi_signoffs
    FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 13. TABEL REKAPITULASI SAMPAH / WASTE LOGS (waste_logs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waste_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    records JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_logs_date ON public.waste_logs(date);

ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for waste_logs" ON public.waste_logs;
CREATE POLICY "Enable all access for waste_logs" ON public.waste_logs
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- SELESAI SETUP DATABASE & RLS POLICIES
-- =====================================================================
