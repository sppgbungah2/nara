-- =====================================================================
-- DATABASE SCHEMA & DUMMY DATA FOR SUPABASE (POSTGRESQL)
-- Webapp Dapur SPPG Qomaruddin Bungah Gresik
-- =====================================================================
-- Copy and paste this script directly into your Supabase SQL Editor.
-- This script creates the required tables and populates them with
-- the authentic initial menus and daily SOP checklists.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (Optional, for clean state)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS sop_tasks CASCADE;
DROP TABLE IF EXISTS sops CASCADE;
DROP TABLE IF EXISTS day_menus CASCADE;

-- ---------------------------------------------------------------------
-- 2. CREATE TABLE: day_menus
-- ---------------------------------------------------------------------
CREATE TABLE day_menus (
    date DATE PRIMARY KEY,
    menu_list TEXT[] NOT NULL, -- PostgreSQL indigenous array type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL
);

COMMENT ON COLUMN day_menus.menu_list IS 'List of dishes in the menu (e.g. {"Nasi Putih", "Krawu Ayam", "Pisang"})';

-- ---------------------------------------------------------------------
-- 3. CREATE TABLE: sops (SOP Documents Header)
-- ---------------------------------------------------------------------
CREATE TABLE sops (
    id VARCHAR(100) PRIMARY KEY, -- Formatted: date-division
    date DATE NOT NULL REFERENCES day_menus(date) ON DELETE CASCADE,
    division VARCHAR(100) NOT NULL, -- Stocking, Masak, Pemorsian, etc
    creator_role VARCHAR(100) NOT NULL, -- Chef, Ahli Gizi, Aslap
    creator_name VARCHAR(150) NOT NULL,
    is_checked_all BOOLEAN DEFAULT FALSE,
    
    -- Signatures and Approvals
    signer_supervisor VARCHAR(150),
    signature_supervisor_url TEXT, -- PNG Base64 DataURI or Storage link
    signed_supervisor_at VARCHAR(100),
    
    signer_coordinator VARCHAR(150),
    signature_coordinator_url TEXT, -- PNG Base64 DataURI or Storage link
    signed_coordinator_at VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'aktif', -- 'draft', 'aktif', 'selesai'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for speedy queries by Date / Division
CREATE INDEX idx_sops_date ON sops(date);
CREATE INDEX idx_sops_division ON sops(division);

-- ---------------------------------------------------------------------
-- 4. CREATE TABLE: sop_tasks (Specific items checklist)
-- ---------------------------------------------------------------------
CREATE TABLE sop_tasks (
    id VARCHAR(100) PRIMARY KEY,
    sop_id VARCHAR(100) NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('persiapan', 'aktif', 'penutup')),
    sort_order INT DEFAULT 0
);

CREATE INDEX idx_sop_tasks_sop_id ON sop_tasks(sop_id);

-- =====================================================================
-- DUMMY SEED DATA FOR DEMONSTRATION
-- Populate active records matching Monday (15 June) & Tuesday (16 June)
-- =====================================================================

-- ---------------------------------------------------------------------
-- SEED: Day Menus
-- ---------------------------------------------------------------------
INSERT INTO day_menus (date, menu_list, created_at, created_by) VALUES
('2026-06-15', ARRAY['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'], '2026-06-14 08:00:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-16', ARRAY['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng Kelapa', 'Pisang'], '2026-06-15 08:15:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-17', ARRAY['Nasi Gurih', 'Soto Ayam Lamongan', 'Telur Asin Madura', 'Krupuk Bawang', 'Jeruk Manis'], '2026-06-16 09:00:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-18', ARRAY['Nasi Putih', 'Rawon Daging Sapi', 'Mendol Tempe', 'Kecambah Segar & Nipis', 'Semangka Merah'], '2026-06-17 07:45:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-19', ARRAY['Nasi Putih', 'Gulai Ikan Bandeng', 'Sayur Bobor Bayam Labu', 'Tahu Goreng Tepung', 'Melon Segar'], '2026-06-18 10:30:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)');

-- ---------------------------------------------------------------------
-- SEED: SOP (Tuesday - 2026-06-16) Header Documents
-- ---------------------------------------------------------------------
INSERT INTO sops (id, date, division, creator_role, creator_name, is_checked_all, signer_supervisor, status, updated_at) VALUES
('2026-06-16-Stocking (Persiapan)', '2026-06-16', 'Stocking (Persiapan)', 'Chef / Juru Masak', 'Chef Ahmad', FALSE, 'Chef Ahmad', 'aktif', '2026-06-16 05:00:00+07'),
('2026-06-16-Masak', '2026-06-16', 'Masak', 'Chef / Juru Masak', 'Chef Ahmad', FALSE, 'Chef Ahmad', 'aktif', '2026-06-16 05:01:00+07'),
('2026-06-16-Pemorsian', '2026-06-16', 'Pemorsian', 'Ahli Gizi', 'Ustadzah Fatimah, S.Gz', FALSE, 'Ustadzah Fatimah, S.Gz', 'aktif', '2026-06-16 05:02:00+07'),
('2026-06-16-Driver', '2026-06-16', 'Driver', 'Aslap (Asisten Lapangan)', 'Ustadz Hakim, S.Pd (Aslap)', FALSE, 'Ustadz Hakim, S.Pd (Aslap)', 'aktif', '2026-06-16 05:03:00+07'),
('2026-06-16-Cuci', '2026-06-16', 'Cuci', 'Aslap (Asisten Lapangan)', 'Ustadz Hakim, S.Pd (Aslap)', FALSE, 'Ustadz Hakim, S.Pd (Aslap)', 'aktif', '2026-06-16 05:04:00+07');

-- ---------------------------------------------------------------------
-- SEED: SOP Tasks (For Stocking Division - 2026-06-16)
-- ---------------------------------------------------------------------
INSERT INTO sop_tasks (id, sop_id, text, completed, category, sort_order) VALUES
('stocking-tue-prep1', '2026-06-16-Stocking (Persiapan)', 'Hadir tepat waktu sesuai jadwal dinas dan melakukan absensi digital.', TRUE, 'persiapan', 1),
('stocking-tue-prep2', '2026-06-16-Stocking (Persiapan)', 'Koordinator mengecek kesiapan anggota tim serta ketersediaan bahan/alat pendukung.', TRUE, 'persiapan', 2),
('stocking-tue-prep3', '2026-06-16-Stocking (Persiapan)', 'Memakai Alat Pelindung Diri (APD) lengkap: Celemek, Masker, Hairnet (Penutup Kepala), dan Sarung Tangan.', TRUE, 'persiapan', 3),
('stocking-tue-act1', '2026-06-16-Stocking (Persiapan)', 'Menerima dan memeriksa kesegaran serta kelayakan bahan menu: Nasi Putih, Krawu Ayam Bungah, Tempe Goreng Ketumbar, dsb.', FALSE, 'aktif', 4),
('stocking-tue-act2', '2026-06-16-Stocking (Persiapan)', 'Mencuci Ayam bersih, potong, kemudian direbus dengan garam, daun salam, dan jeruk purut.', FALSE, 'aktif', 5),
('stocking-tue-act3', '2026-06-16-Stocking (Persiapan)', 'Mengupas bumbu rempah: Bawang putih, bawang merah, jahe, lengkuas, kunyit sesuai resep porsi.', FALSE, 'aktif', 6),
('stocking-tue-close1', '2026-06-16-Stocking (Persiapan)', 'Membersihkan dan mengeringkan seluruh peralatan yang digunakan dalam tugas tim.', FALSE, 'penutup', 7),
('stocking-tue-close2', '2026-06-16-Stocking (Persiapan)', 'Membersihkan area kerja masing-masing divisi (Meja dapur, lantai, atau kendaraan dsb.) setelah selesai.', FALSE, 'penutup', 8);

-- ---------------------------------------------------------------------
-- SEED: SOP Tasks (For Masak Division - 2026-06-16)
-- ---------------------------------------------------------------------
INSERT INTO sop_tasks (id, sop_id, text, completed, category, sort_order) VALUES
('masak-tue-prep1', '2026-06-16-Masak', 'Hadir tepat waktu sesuai jadwal dinas dan melakukan absensi digital.', TRUE, 'persiapan', 1),
('masak-tue-prep2', '2026-06-16-Masak', 'Koordinator mengecek kesiapan anggota tim serta ketersediaan bahan/alat pendukung.', TRUE, 'persiapan', 2),
('masak-tue-prep3', '2026-06-16-Masak', 'Memakai Alat Pelindung Diri (APD) lengkap: Celemek, Masker, Hairnet (Penutup Kepala), dan Sarung Tangan.', TRUE, 'persiapan', 3),
('masak-tue-act1', '2026-06-16-Masak', 'Merebus kuah kaldu utama atau menanak dan mengukus nasi putih sejumlah porsi gizi santri.', FALSE, 'aktif', 4),
('masak-tue-act2', '2026-06-16-Masak', 'Menggoreng atau menumis protein ayam hingga matang merata di suhu minimal 75°C.', FALSE, 'aktif', 5),
('masak-tue-act3', '2026-06-16-Masak', 'Melakukan marinasi tempe/tahu dengan bumbu ketumbar bawang lalu goreng deep-fry hingga kuning keemasan.', FALSE, 'aktif', 6),
('masak-tue-close1', '2026-06-16-Masak', 'Membersihkan dan mengeringkan seluruh peralatan yang digunakan dalam tugas tim.', FALSE, 'penutup', 7),
('masak-tue-close2', '2026-06-16-Masak', 'Membersihkan area kerja masing-masing divisi (Meja dapur, lantai, atau kendaraan dsb.) setelah selesai.', FALSE, 'penutup', 8);


-- ---------------------------------------------------------------------
-- 5. OTHER SUPPORTING TABLES SCHEMA (For Features 1-14)
-- These provide real persistence targets should you expand the other views.
-- ---------------------------------------------------------------------
CREATE TABLE stok_sisa (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    condition VARCHAR(100) NOT NULL,
    action_plan VARCHAR(255) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventaris_alat (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Baik', -- 'Baik', 'Butuh Servis', 'Rusak'
    label VARCHAR(100)
);

CREATE TABLE absensi_staff (
    id BIGSERIAL PRIMARY KEY,
    staff_name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    check_in_time VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'Hadir' -- 'Hadir', 'Izin', 'Alfa'
);

CREATE TABLE keluhan_asrama (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    action_taken TEXT,
    status VARCHAR(50) DEFAULT 'Selesai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed small records for these supporting tables so they display immediately if copy-pasted
INSERT INTO inventaris_alat (name, quantity, status, label) VALUES
('Kuali Raksasa Diameter 1.2 Meter', '4 Unit', 'Baik', 'Heavy Duty cooking'),
('Blender Komersial Heavy Duty 3HP', '2 Unit', 'Butuh Servis', 'Bumbu Halus stocking'),
('Meja Assembly Lines Premium Stainless 304', '3 Unit', 'Baik', 'Pemorsian'),
('Lemari Pendingin Industri (Cold Room Freezer)', '1 Unit', 'Baik', 'Penyimpanan Dapur');

INSERT INTO stok_sisa (name, category, quantity, condition, action_plan) VALUES
('Karkas Ayam Broiler', 'Protein Basah', '4.5 Kg', 'Sangat Segar (Chiller)', 'Masuk Menu Masak Esok Hari'),
('Bawang Merah Kupas', 'Bumbu Dapur', '12.0 Kg', 'Kering, Bagus', 'Gunakan untuk Stocking Persiapan');
