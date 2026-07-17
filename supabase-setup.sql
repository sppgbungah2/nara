-- ====================================================================
-- SQL RESET & INITIALIZATION SCRIPT FOR DAPUR QOMARUDDIN
-- Target: Supabase PostgreSQL Database (SQL Editor)
-- 
-- Perintah:
-- 1. Hapus seluruh database lama (table, rls, policy) secara menyeluruh
-- 2. Buat ulang table, relasi, RLS, & policy yang kuat dan fleksibel
-- 3. Isi baseline & sample data 1 hari (17 Juli 2026 / Hari ini)
-- ====================================================================

-- ====================================================================
-- STEP 1: DROP ALL EXISTING TABLES & POLICIES (CASCADE)
-- ====================================================================
DROP TABLE IF EXISTS sop_tasks CASCADE;
DROP TABLE IF EXISTS sops CASCADE;
DROP TABLE IF EXISTS day_menus CASCADE;
DROP TABLE IF EXISTS sisa_stok CASCADE;
DROP TABLE IF EXISTS order_requests CASCADE;
DROP TABLE IF EXISTS volunteer_complaints CASCADE;
DROP TABLE IF EXISTS shipping_docs CASCADE;
DROP TABLE IF EXISTS kedatangan_barang CASCADE;

-- ====================================================================
-- STEP 2: CREATE TABLES WITH PRIMARY KEYS, CONSTRAINTS & DEFAULT VALUES
-- ====================================================================

-- 1. Table: day_menus (Menu Harian Gizi)
CREATE TABLE day_menus (
    date DATE PRIMARY KEY,
    menu_list TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT
);

-- 2. Table: sops (SOP Digital Headers)
CREATE TABLE sops (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    division TEXT NOT NULL,
    creator_role TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    is_checked_all BOOLEAN DEFAULT false,
    signer_supervisor TEXT,
    signature_supervisor_url TEXT,
    signed_supervisor_at TEXT,
    signer_coordinator TEXT,
    signature_coordinator_url TEXT,
    signed_coordinator_at TEXT,
    status TEXT DEFAULT 'aktif',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: sop_tasks (SOP Tasks List)
CREATE TABLE sop_tasks (
    id TEXT PRIMARY KEY,
    sop_id TEXT REFERENCES sops(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    category TEXT NOT NULL, -- 'persiapan' | 'aktif' | 'penutup'
    sort_order INTEGER DEFAULT 0
);

-- 4. Table: sisa_stok (Stock Opname Gudang)
CREATE TABLE sisa_stok (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity TEXT NOT NULL,
    condition TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table: order_requests (Order Alat & Operasional)
CREATE TABLE order_requests (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    qty TEXT NOT NULL,
    reason TEXT NOT NULL,
    category TEXT NOT NULL, -- 'alat' | 'operasional'
    status TEXT DEFAULT 'pending', -- 'pending' | 'disetujui' | 'ditolak'
    notes TEXT DEFAULT '',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Table: volunteer_complaints (Keluhan Relawan)
CREATE TABLE volunteer_complaints (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    category TEXT NOT NULL,
    complaint_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' | 'selesai'
    action_taken TEXT DEFAULT '',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Table: shipping_docs (BAST, Surat Jalan, Organoleptik, & Ompreng Docs)
CREATE TABLE shipping_docs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'ompreng' | 'serah_terima' | 'surat_jalan' | 'organoleptik'
    date DATE NOT NULL,
    vehicle_number TEXT NOT NULL,
    image_url TEXT NOT NULL,
    comments TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    receiver_name TEXT,
    status TEXT NOT NULL,
    
    -- BAST specific
    bast_no TEXT,
    bast_driver TEXT,
    bast_sekolah TEXT,
    bast_penerima TEXT,
    bast_barang TEXT,
    bast_jumlah INTEGER,
    bast_waktu TEXT,
    bast_signature_driver TEXT,
    bast_signature_receiver TEXT,

    -- Surat Jalan specific
    sj_no TEXT,
    sj_kepada TEXT,
    sj_waktu TEXT,
    sj_driver TEXT,
    sj_rows JSONB,
    sj_signature_aslap TEXT,
    sj_signature_receiver TEXT,

    -- Organoleptik specific
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
    orlep_signature TEXT
);

-- 8. Table: kedatangan_barang (Incoming Goods Logs)
CREATE TABLE kedatangan_barang (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    qty NUMERIC NOT NULL,
    uom TEXT NOT NULL,
    supplier TEXT NOT NULL,
    checker TEXT NOT NULL, -- 'LENGKAP' | 'KURANG' | 'BATAL'
    input TEXT NOT NULL, -- 'SUDAH' | 'BELUM'
    specification TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
-- ====================================================================
ALTER TABLE day_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sisa_stok ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kedatangan_barang ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- STEP 4: DEFINE ACCESS CONTROL LIST & DOMAIN-BASED POLICIES
-- ====================================================================

-- 1. day_menus POLICIES
CREATE POLICY "day_menus_read_all" ON day_menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "day_menus_write_staff_domain" ON day_menus FOR ALL TO authenticated 
    USING (
        lower(auth.jwt() ->> 'email') LIKE '%@qomaruddin.com' OR 
        lower(auth.jwt() ->> 'email') LIKE '%@sppg.com' OR 
        lower(auth.jwt() ->> 'email') = 'maghfurmunif@gmail.com'
    );

-- 2. sops POLICIES
CREATE POLICY "sops_read_all" ON sops FOR SELECT TO authenticated USING (true);
CREATE POLICY "sops_write_staff_domain" ON sops FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') LIKE '%@qomaruddin.com' OR 
        lower(auth.jwt() ->> 'email') LIKE '%@sppg.com' OR 
        lower(auth.jwt() ->> 'email') = 'maghfurmunif@gmail.com'
    );

-- 3. sop_tasks POLICIES
CREATE POLICY "sop_tasks_read_all" ON sop_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "sop_tasks_write_staff_domain" ON sop_tasks FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') LIKE '%@qomaruddin.com' OR 
        lower(auth.jwt() ->> 'email') LIKE '%@sppg.com' OR 
        lower(auth.jwt() ->> 'email') = 'maghfurmunif@gmail.com'
    );

-- 4. sisa_stok POLICIES
CREATE POLICY "sisa_stok_read_all" ON sisa_stok FOR SELECT TO authenticated USING (true);
CREATE POLICY "sisa_stok_write_staff_domain" ON sisa_stok FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') LIKE '%@qomaruddin.com' OR 
        lower(auth.jwt() ->> 'email') LIKE '%@sppg.com' OR 
        lower(auth.jwt() ->> 'email') = 'maghfurmunif@gmail.com'
    );

-- 5. order_requests POLICIES
CREATE POLICY "order_requests_read_all" ON order_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_requests_insert_auth" ON order_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "order_requests_write_staff_domain" ON order_requests FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') LIKE '%@qomaruddin.com' OR 
        lower(auth.jwt() ->> 'email') LIKE '%@sppg.com' OR 
        lower(auth.jwt() ->> 'email') = 'maghfurmunif@gmail.com'
    );

-- 6. volunteer_complaints POLICIES
CREATE POLICY "volunteer_complaints_read_all" ON volunteer_complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "volunteer_complaints_insert_auth" ON volunteer_complaints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "volunteer_complaints_write_staff_domain" ON volunteer_complaints FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') LIKE '%@qomaruddin.com' OR 
        lower(auth.jwt() ->> 'email') LIKE '%@sppg.com' OR 
        lower(auth.jwt() ->> 'email') = 'maghfurmunif@gmail.com'
    );

-- 7. shipping_docs POLICIES
CREATE POLICY "shipping_docs_read_all" ON shipping_docs FOR SELECT TO authenticated USING (true);
CREATE POLICY "shipping_docs_all_auth" ON shipping_docs FOR ALL TO authenticated USING (true);

-- 8. kedatangan_barang POLICIES
CREATE POLICY "kedatangan_barang_read_all" ON kedatangan_barang FOR SELECT TO authenticated USING (true);
CREATE POLICY "kedatangan_barang_all_auth" ON kedatangan_barang FOR ALL TO authenticated USING (true);


-- ====================================================================
-- STEP 5: SEED SAMPLE DATA UNTUK 1 HARI (17 Juli 2026 / Hari ini)
-- ====================================================================

-- 1. Seed Menu Gizi Harian (day_menus)
INSERT INTO day_menus (date, menu_list, created_by) VALUES
('2026-07-17', ARRAY['Nasi Putih Sehat', 'Ayam Bakar Madu Bungah', 'Sayur Sop Bakso Gizi', 'Tempe Mendoan Hangat', 'Buah Jeruk Manis'], 'gizi@sppg.com');

-- 2. Seed SOP Header (sops)
INSERT INTO sops (id, date, division, creator_role, creator_name, is_checked_all, signer_supervisor, signature_supervisor_url, signed_supervisor_at, signer_coordinator, signature_coordinator_url, signed_coordinator_at, status) VALUES
('2026-07-17-Bahan & Stocking', '2026-07-17', 'Bahan & Stocking', 'Chef / Juru Masak', 'Chef Ahmad', true, 'Chef Ahmad', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '17/07/2026, 08.00 WIB', 'Koordinator Bahan', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '17/07/2026, 08.30 WIB', 'selesai'),
('2026-07-17-Proses Memasak', '2026-07-17', 'Proses Memasak', 'Chef / Juru Masak', 'Chef Ahmad', false, NULL, NULL, NULL, NULL, NULL, NULL, 'aktif'),
('2026-07-17-Pemorsian Ompreng', '2026-07-17', 'Pemorsian Ompreng', 'Ahli Gizi', 'Ustadzah Fatimah, S.Gz', false, NULL, NULL, NULL, NULL, NULL, NULL, 'aktif');

-- 3. Seed SOP Tasks (sop_tasks)
INSERT INTO sop_tasks (id, sop_id, text, completed, category, sort_order) VALUES
-- Division: Bahan & Stocking (Telah selesai)
('2026-07-17-Bahan & Stocking-t-0', '2026-07-17-Bahan & Stocking', 'Hadir tepat waktu sesuai jadwal dinas dan melakukan absensi digital.', true, 'persiapan', 0),
('2026-07-17-Bahan & Stocking-t-1', '2026-07-17-Bahan & Stocking', 'Memakai Alat Pelindung Diri (APD) lengkap: Celemek, Masker, Hairnet, dan Sarung Tangan.', true, 'persiapan', 1),
('2026-07-17-Bahan & Stocking-t-2', '2026-07-17-Bahan & Stocking', 'Menerima dan memeriksa kesegaran serta kelayakan bahan baku daging ayam & sayur.', true, 'aktif', 2),
('2026-07-17-Bahan & Stocking-t-3', '2026-07-17-Bahan & Stocking', 'Membersihkan area loading dock dan merendam peralatan yang digunakan.', true, 'penutup', 3),

-- Division: Proses Memasak (Masih aktif)
('2026-07-17-Proses Memasak-t-0', '2026-07-17-Proses Memasak', 'Memastikan seluruh kompor mawar menyala biru bersih dan aman.', true, 'persiapan', 0),
('2026-07-17-Proses Memasak-t-1', '2026-07-17-Proses Memasak', 'Membakar ayam dengan bumbu madu khas secara merata.', false, 'aktif', 1),
('2026-07-17-Proses Memasak-t-2', '2026-07-17-Proses Memasak', 'Merebus kuah sop dengan tambahan bakso sapi gizi.', false, 'aktif', 2),
('2026-07-17-Proses Memasak-t-3', '2026-07-17-Proses Memasak', 'Membersihkan sisa panggangan dan mematikan gas secara aman.', false, 'penutup', 3),

-- Division: Pemorsian Ompreng (Masih aktif)
('2026-07-17-Pemorsian Ompreng-t-0', '2026-07-17-Pemorsian Ompreng', 'Melakukan sanitasi meja conveyor pemorsian dengan alkohol food-grade.', true, 'persiapan', 0),
('2026-07-17-Pemorsian Ompreng-t-1', '2026-07-17-Pemorsian Ompreng', 'Mengisi sekat ompreng dengan takaran pas (Nasi 150g, Ayam 80g, Sop 100ml).', false, 'aktif', 1),
('2026-07-17-Pemorsian Ompreng-t-2', '2026-07-17-Pemorsian Ompreng', 'Mengunci tutup ompreng rapat-rapat dan menyusun ke koli pengiriman.', false, 'penutup', 2);

-- 4. Seed Stock Opname Gudang (sisa_stok)
INSERT INTO sisa_stok (id, item_name, category, quantity, condition, action_plan, created_by) VALUES
('stok-1', 'Beras Premium Pinisi', 'Bahan Pokok', '10 Karung @ 50kg', 'Sangat Baik (Kering & Bebas Kutu)', 'Pertahankan diletakkan di atas pallet kayu.', 'akuntan@sppg.com'),
('stok-2', 'Minyak Goreng SunCo 2L', 'Sembako', '15 Pouch (1 Karton)', 'Kondisi Segel Utuh', 'Lakukan order tambahan minggu depan.', 'akuntan@sppg.com'),
('stok-3', 'Daging Ayam Karkas Frozen', 'Protein Basah', '40 Kg', 'Suhu -18°C Beku Sempurna', 'Simpan di Deep Freezer Gudang Utara.', 'akuntan@sppg.com');

-- 5. Seed Order Alat & Operasional (order_requests)
INSERT INTO order_requests (id, item_name, qty, reason, category, status, notes, created_by) VALUES
('req-1', 'Pisau Dapur Stainless Steel Tramontina', '4 Pcs', 'Menggantikan pisau dapur yang tumpul untuk mengiris sayur', 'alat', 'disetujui', 'Disetujui. Silakan diajukan bon belanja ke koperasi.', 'chef@sppg.com'),
('req-2', 'Timbangan Digital Gizi Camry 10kg', '1 Unit', 'Menambah presisi timbangan porsi gizi harian santri', 'alat', 'pending', '', 'gizi@sppg.com');

-- 6. Seed Keluhan Relawan (volunteer_complaints)
INSERT INTO volunteer_complaints (id, source, category, complaint_text, status, action_taken, created_by) VALUES
('k-1', 'Asrama Putri Gedung C', 'Ketepatan Waktu', 'Pengiriman ompreng makan siang terlambat 10 menit dari jadwal seharusnya.', 'selesai', 'Driver dialihkan ke rute alternatif menghindari kemacetan pasar.', 'gizi@sppg.com'),
('k-2', 'Asrama Putra Aliyah', 'Citarasa', 'Nasi putih agak terlalu lembek pada porsi makan malam kemarin.', 'pending', '', 'chef@sppg.com');

-- 7. Seed Berkas Logistik & Pengiriman (shipping_docs)
INSERT INTO shipping_docs (id, type, date, vehicle_number, image_url, comments, uploaded_by, uploaded_at, receiver_name, status, organoleptik_rasa, organoleptik_aroma, organoleptik_tekstur, organoleptik_suhu, sj_no, sj_kepada, sj_waktu, sj_driver, sj_rows, sj_signature_aslap, sj_signature_receiver, bast_no, bast_driver, bast_sekolah, bast_penerima, bast_barang, bast_jumlah, bast_waktu, bast_signature_driver, bast_signature_receiver) VALUES
-- A. Berkas Ompreng
('doc-1', 'ompreng', '2026-07-17', 'W 1234 BGH', 'https://images.unsplash.com/photo-1594212699903-ec8a3cee50f6?w=500&auto=format&fit=crop&q=80', 'Pengiriman 15 koli ompreng untuk asrama timur, kondisi bersih dan tersegel rapat.', 'driver@sppg.com', '2026-07-17 11:30:00+07', 'Ustadz Jauhari', 'Selesai Kirim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
-- B. BAST
('doc-2', 'serah_terima', '2026-07-17', 'W 5678 AA', 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80', 'BAST serah terima makanan sehat ke Asrama Putri.', 'driver@sppg.com', '2026-07-17 12:05:00+07', 'Ustadzah Fatimah', 'Terverifikasi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BAST/QOM/17072026-01', 'Driver Sam', 'Asrama Putri Qomaruddin', 'Ustadzah Fatimah', 'Ompreng Sehat', 280, '12:00 WIB', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>'),
-- C. Surat Jalan
('doc-3', 'surat_jalan', '2026-07-17', 'W 1234 BGH', 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=80', 'Surat Jalan Pengiriman Sayuran Segar & Bahan Pokok.', 'driver@sppg.com', '2026-07-17 07:15:00+07', 'Ustadz Hakim', 'Dalam Perjalanan', NULL, NULL, NULL, NULL, 'SJ/QOM-DAPUR/1707-02', 'Ustadz Hakim (Gudang Utara)', '07:00 WIB', 'Driver Sam', '[{"item":"Beras Premium","qty":"2 Karung","note":"Utuh"},{"item":"Daging Ayam Frozen","qty":"30 Kg","note":"Beku"}]', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
-- D. Organoleptik
('doc-4', 'organoleptik', '2026-07-17', 'W 1234 BGH', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80', 'Uji kelayakan organoleptik menu santri lulus uji.', 'driver@sppg.com', '2026-07-17 07:20:00+07', 'Ustadzah Aminah', 'Lulus Uji', 'Sangat Layak (Segar & Gurih)', 'Sangat Harum', 'Sangat Empuk', '72', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- 8. Seed Logistik Penerimaan / Kedatangan Barang (kedatangan_barang)
INSERT INTO kedatangan_barang (id, date, name, qty, uom, supplier, checker, input, specification) VALUES
('kd-seed-1', '2026-07-17', 'tahu putih sidayu', 300, 'pcs', 'SIDAYU', 'LENGKAP', 'SUDAH', 'Tahu putih segar padat, tidak asam, tidak berlendir, dibungkus plastik higienis.'),
('kd-seed-2', '2026-07-17', 'beras giling premium', 150, 'kg', 'BULOG', 'LENGKAP', 'SUDAH', 'Butiran beras putih cerah bersih, utuh minimal 85%, bebas kutu.'),
('kd-seed-3', '2026-07-17', 'wortel segar organik', 40, 'kg', 'PAK MAFTUH', 'LENGKAP', 'SUDAH', 'Warna jingga terang segar, tekstur renyah padat, bebas tanah.');

-- ====================================================================
-- SELESAI. SILAKAN SALIN & JALANKAN DI SUPABASE SQL EDITOR.
-- ====================================================================
