-- ====================================================================
-- SQL RESET & INITIALIZATION SCRIPT FOR DAPUR QOMARUDDIN
-- Target: Supabase PostgreSQL Database (SQL Editor)
-- 
-- Perintah:
-- 1. Hapus seluruh database lama (table, rls, policy)
-- 2. Buat ulang table, relasi, RLS, & policy yang sesuai dengan webapp terbaru
-- 3. Isi baseline & dummy data siap pakai
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
-- STEP 4: DEFINE ACCESS CONTROL LIST & ROLE-BASED POLICIES
-- ====================================================================

-- 1. day_menus POLICIES
CREATE POLICY "day_menus_read_all" ON day_menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "day_menus_write_admin_gizi_chef" ON day_menus FOR ALL TO authenticated 
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com',
            'gizi@qomaruddin.com', 'chef@qomaruddin.com'
        )
    );

-- 2. sops POLICIES
CREATE POLICY "sops_read_all" ON sops FOR SELECT TO authenticated USING (true);
CREATE POLICY "sops_all_admin_chef_gizi_divisi" ON sops FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com',
            'chef@qomaruddin.com', 'gizi@qomaruddin.com', 'driver@qomaruddin.com',
            'stocking@qomaruddin.com', 'masak@qomaruddin.com', 'pemorsian@qomaruddin.com', 'cuci@qomaruddin.com', 'kebersihan@qomaruddin.com', 'keamanan@qomaruddin.com'
        )
    );

-- 3. sop_tasks POLICIES
CREATE POLICY "sop_tasks_read_all" ON sop_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "sop_tasks_all_admin_chef_gizi_divisi" ON sop_tasks FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com',
            'chef@qomaruddin.com', 'gizi@qomaruddin.com', 'driver@qomaruddin.com',
            'stocking@qomaruddin.com', 'masak@qomaruddin.com', 'pemorsian@qomaruddin.com', 'cuci@qomaruddin.com', 'kebersihan@qomaruddin.com', 'keamanan@qomaruddin.com'
        )
    );

-- 4. sisa_stok POLICIES
CREATE POLICY "sisa_stok_read_all" ON sisa_stok FOR SELECT TO authenticated USING (true);
CREATE POLICY "sisa_stok_all_admin_chef_gizi_akuntan" ON sisa_stok FOR ALL TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com',
            'chef@qomaruddin.com', 'gizi@qomaruddin.com', 'akuntan@qomaruddin.com'
        )
    );

-- 5. order_requests POLICIES
CREATE POLICY "order_requests_read_all" ON order_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_requests_insert_all" ON order_requests FOR INSERT TO authenticated WITH CHECK (
    lower(auth.jwt() ->> 'email') NOT IN (
        'ma@qomaruddin.com', 'smk@qomaruddin.com', 'sma@qomaruddin.com', 'mts@qomaruddin.com', 'sukowati@qomaruddin.com', 'sidokumpul@qomaruddin.com'
    )
);
CREATE POLICY "order_requests_update_admin_only" ON order_requests FOR UPDATE TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com'
        )
    );
CREATE POLICY "order_requests_delete_admin_only" ON order_requests FOR DELETE TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com'
        )
    );

-- 6. volunteer_complaints POLICIES
CREATE POLICY "volunteer_complaints_read_admin_chef_gizi_divisi" ON volunteer_complaints FOR SELECT TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com',
            'chef@qomaruddin.com', 'gizi@qomaruddin.com', 'driver@qomaruddin.com',
            'stocking@qomaruddin.com', 'masak@qomaruddin.com', 'pemorsian@qomaruddin.com', 'cuci@qomaruddin.com', 'kebersihan@qomaruddin.com', 'keamanan@qomaruddin.com'
        )
    );
CREATE POLICY "volunteer_complaints_insert_all" ON volunteer_complaints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "volunteer_complaints_update_admin_only" ON volunteer_complaints FOR UPDATE TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com'
        )
    );
CREATE POLICY "volunteer_complaints_delete_admin_only" ON volunteer_complaints FOR DELETE TO authenticated
    USING (
        lower(auth.jwt() ->> 'email') IN (
            'maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com'
        )
    );

-- 7. shipping_docs POLICIES
CREATE POLICY "shipping_docs_read_all" ON shipping_docs FOR SELECT TO authenticated USING (true);
CREATE POLICY "shipping_docs_all_auth" ON shipping_docs FOR ALL TO authenticated USING (true);

-- 8. kedatangan_barang POLICIES
CREATE POLICY "kedatangan_barang_read_all" ON kedatangan_barang FOR SELECT TO authenticated USING (true);
CREATE POLICY "kedatangan_barang_all_auth" ON kedatangan_barang FOR ALL TO authenticated USING (true);


-- ====================================================================
-- STEP 5: SEED INITIAL & DUMMY DATA FOR PRODUCTION READY LAUNCH
-- ====================================================================

-- Seed menus for 15, 16, 17, 18, 19 June 2026
INSERT INTO day_menus (date, menu_list, created_by) VALUES
('2026-06-15', ARRAY['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'], 'gizi@qomaruddin.com'),
('2026-06-16', ARRAY['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng Kelapa', 'Pisang'], 'gizi@qomaruddin.com'),
('2026-06-17', ARRAY['Nasi Gurih', 'Soto Ayam Lamongan', 'Telur Asin Madura', 'Krupuk Bawang', 'Jeruk Manis'], 'gizi@qomaruddin.com'),
('2026-06-18', ARRAY['Nasi Putih', 'Rawon Daging Sapi Pepesan', 'Mendol Tempe', 'Kecambah Segar & Jeruk Nipis', 'Semangka Merah'], 'gizi@qomaruddin.com'),
('2026-06-19', ARRAY['Nasi Putih', 'Gulai Ikan Bandeng', 'Sayur Bobor Bayam Labu', 'Tahu Goreng Tepung', 'Melon Segar'], 'gizi@qomaruddin.com');

-- Seed SOPs for 15 June 2026 (Marked as completed)
INSERT INTO sops (id, date, division, creator_role, creator_name, is_checked_all, signer_supervisor, signature_supervisor_url, signed_supervisor_at, signer_coordinator, signature_coordinator_url, signed_coordinator_at, status) VALUES
('2026-06-15-Bahan & Stocking', '2026-06-15', 'Bahan & Stocking', 'Chef / Juru Masak', 'Chef Ahmad', true, 'Chef Ahmad', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '15/06/2026, 08.00 WIB', 'Koordinator Bahan', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '15/06/2026, 08.30 WIB', 'selesai'),
('2026-06-15-Proses Memasak', '2026-06-15', 'Proses Memasak', 'Chef / Juru Masak', 'Chef Ahmad', true, 'Chef Ahmad', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '15/06/2026, 08.00 WIB', 'Koordinator Masak', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '15/06/2026, 08.30 WIB', 'selesai'),
('2026-06-15-Pemorsian Ompreng', '2026-06-15', 'Pemorsian Ompreng', 'Ahli Gizi', 'Ustadzah Fatimah, S.Gz', true, 'Ustadzah Fatimah, S.Gz', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '15/06/2026, 08.00 WIB', 'Koordinator Pemorsian', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>', '15/06/2026, 08.30 WIB', 'selesai');

-- Seed Tasks for 15 June 2026 (Marked as completed)
INSERT INTO sop_tasks (id, sop_id, text, completed, category, sort_order) VALUES
('2026-06-15-Bahan & Stocking-t-0', '2026-06-15-Bahan & Stocking', 'Hadir tepat waktu sesuai jadwal dinas and melakukan absensi digital.', true, 'persiapan', 0),
('2026-06-15-Bahan & Stocking-t-1', '2026-06-15-Bahan & Stocking', 'Koordinator mengecek kesiapan anggota tim serta ketersediaan bahan/alat pendukung.', true, 'persiapan', 1),
('2026-06-15-Bahan & Stocking-t-2', '2026-06-15-Bahan & Stocking', 'Memakai Alat Pelindung Diri (APD) lengkap: Celemek, Masker, Hairnet (Penutup Kepala), dan Sarung Tangan.', true, 'persiapan', 2),
('2026-06-15-Bahan & Stocking-t-3', '2026-06-15-Bahan & Stocking', 'Menerima dan memeriksa kesegaran serta kelayakan bahan menu.', true, 'aktif', 3),
('2026-06-15-Bahan & Stocking-t-4', '2026-06-15-Bahan & Stocking', 'Membersihkan dan merendam peralatan yang digunakan.', true, 'penutup', 4),

('2026-06-15-Proses Memasak-t-0', '2026-06-15-Proses Memasak', 'Hadir tepat waktu sesuai jadwal dinas dan melakukan absensi digital.', true, 'persiapan', 0),
('2026-06-15-Proses Memasak-t-1', '2026-06-15-Proses Memasak', 'Memakai Alat Pelindung Diri (APD) lengkap.', true, 'persiapan', 1),
('2026-06-15-Proses Memasak-t-2', '2026-06-15-Proses Memasak', 'Merebus kuah kaldu utama atau menanak dan mengukus nasi putih sejumlah porsi gizi santri.', true, 'aktif', 2),
('2026-06-15-Proses Memasak-t-3', '2026-06-15-Proses Memasak', 'Membersihkan area kompor dan mematikan gas secara aman.', true, 'penutup', 3);

-- Seed sisa_stok (Stock Opname Gudang)
INSERT INTO sisa_stok (id, item_name, category, quantity, condition, action_plan, created_by) VALUES
('stok-1', 'Beras Premium Pinisi', 'Bahan Pokok', '12 Karung @ 50kg', 'Sangat Baik (Kering & Bebas Kutu)', 'Simpan di pallet kayu, tutup terpal rapat', 'akuntan@qomaruddin.com'),
('stok-2', 'Minyak Goreng SunCo 2L', 'Sembako', '24 Pouch (2 Karton)', 'Suhu Ruang Stabil', 'Pertahankan stok minimum 3 karton seminggu', 'akuntan@qomaruddin.com'),
('stok-3', 'Garam Beriodium Daun', 'Bumbu Kering', '15 Pak @ 500g', 'Kering & Padat', 'Hindari kelembaban tinggi', 'akuntan@qomaruddin.com'),
('stok-4', 'Daging Ayam Karkas Frozen', 'Protein Basah', '75 Kg', 'Suhu -18°C Beku Sempurna', 'Gunakan sistem FIFO untuk pemorsian Selasa', 'akuntan@qomaruddin.com');

-- Seed order_requests (Order Alat & Operasional)
INSERT INTO order_requests (id, item_name, qty, reason, category, status, notes, created_by) VALUES
('req-1', 'Pisau Dapur Stainless Steel Tramontina', '6 Pcs', 'Menggantikan pisau pemotong daging yang tumpul dan berkarat', 'alat', 'disetujui', 'Disetujui. Silakan dibeli melalui nota toko Yayasan.', 'chef@qomaruddin.com'),
('req-2', 'Spons Cuci Kawat & Sabun Cair Lemon 5L', '4 Galon', 'Stok operasional divisi pencucian ompreng bulanan', 'operasional', 'pending', '', 'akuntan@qomaruddin.com'),
('req-3', 'Timbangan Digital Gizi Camry 10kg', '2 Unit', 'Mematangkan akurasi sampling timbangan rel pemorsian', 'alat', 'pending', '', 'gizi@qomaruddin.com');

-- Seed volunteer_complaints (Keluhan Relawan)
INSERT INTO volunteer_complaints (id, source, category, complaint_text, status, action_taken, created_by) VALUES
('k-1', 'Asrama Putri Gedung SPPG', 'Ketepatan Waktu', 'Pengiriman ompreng makan siang terlambat 15 menit dari jadwal 11.30', 'selesai', 'Driver dialihkan rute tercepat dan koordinasi asrama diperketat', 'gizi@qomaruddin.com'),
('k-2', 'Asrama Putra Aliyah', 'Citarasa', 'Nasi putih di sekat kanan agak terlalu lembek / lengket untuk porsi pagi', 'pending', '', 'chef@qomaruddin.com');

-- Seed shipping_docs for 16 & 17 June 2026
INSERT INTO shipping_docs (id, type, date, vehicle_number, image_url, comments, uploaded_by, uploaded_at, receiver_name, status, organoleptik_rasa, organoleptik_aroma, organoleptik_tekstur, organoleptik_suhu) VALUES
('doc-1', 'ompreng', '2026-06-16', 'W 1234 BGH', 'https://images.unsplash.com/photo-1594212699903-ec8a3cee50f6?w=400&auto=format&fit=crop&q=80', 'Pengiriman 12 koli ompreng untuk asrama timur, kondisi bersih dan tertutup rapat.', 'driver@qomaruddin.com', '2026-06-16 11:30:00+07', 'Ustadz Jauhari', 'Selesai Kirim', NULL, NULL, NULL, NULL),
('doc-2', 'serah_terima', '2026-06-16', 'W 5678 AA', 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400&auto=format&fit=crop&q=80', 'Lembar BAST ditandatangani oleh Pengurus Asrama Putri C.', 'driver@qomaruddin.com', '2026-06-16 12:05:00+07', 'Ustadzah Fatimah', 'Terverifikasi', NULL, NULL, NULL, NULL),
('doc-3', 'surat_jalan', '2026-06-17', 'W 1234 BGH', 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80', 'Surat Jalan No. 104/SJ-SPPG/VI/2026.', 'driver@qomaruddin.com', '2026-06-17 07:15:00+07', 'Ustadz Hakim', 'Dalam Perjalanan', NULL, NULL, NULL, NULL),
('doc-4', 'organoleptik', '2026-06-17', 'W 1234 BGH', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80', 'Uji organoleptik menu Nasi Sup Ayam Karkas Gizi.', 'driver@qomaruddin.com', '2026-06-17 07:20:00+07', 'Ustadzah Aminah', 'Lulus Uji', 'Sangat Layak (Segar & Gurih)', 'Sangat Harum', 'Sangat Empuk', '72');

-- Seed kedatangan_barang for 16 June 2026
INSERT INTO kedatangan_barang (id, date, name, qty, uom, supplier, checker, input, specification) VALUES
('kd-seed-1', '2026-06-16', 'tahu putih sidayu', 340, 'pcs', 'SIDAYU', 'LENGKAP', 'SUDAH', 'Tahu putih segar padat berpori halus, tidak asam, tidak berlendir, dibungkus plastik higienis.'),
('kd-seed-2', '2026-06-16', 'beras giling premium', 180, 'kg', 'BULOG', 'LENGKAP', 'SUDAH', '1 sak @20kg. Butiran beras putih cerah bersih, utuh minimal 85%, tidak berbau apek, bebas kutu & batu kerikil.'),
('kd-seed-3', '2026-06-16', 'bawang merah super', 5, 'kg', 'PAK MAFTUH', 'LENGKAP', 'SUDAH', 'Siung utuh padat, kering kulitnya, bebas pembusukan/jamur hitam, ukuran seragam.'),
('kd-seed-4', '2026-06-16', 'bawang putih kupas', 3, 'kg', 'PAK MAFTUH', 'LENGKAP', 'SUDAH', 'Sudah dikupas bersih, siung padat tebal, tidak bertunas, bebas bercak cokelat busuk.'),
('kd-seed-5', '2026-06-16', 'sayur wortel segar', 57, 'kg', 'PAK MAFTUH', 'LENGKAP', 'SUDAH', 'Warna jingga terang segar, lurus, tekstur renyah padat, sudah dicuci bebas tanah.');

-- ====================================================================
-- SELESAI. SILAKAN SALIN & JALANKAN DI SUPABASE SQL EDITOR.
-- ====================================================================
