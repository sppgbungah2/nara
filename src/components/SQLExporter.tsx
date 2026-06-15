import React, { useState } from 'react';
import { 
  Database, Copy, Check, Download, Terminal, 
  BookOpen, Info, ExternalLink, HelpCircle, Server
} from 'lucide-react';

export default function SQLExporter() {
  const [copiedType, setCopiedType] = useState<'all' | 'ddl' | 'dml' | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ddl' | 'dml' | 'guide'>('all');

  const ddlQuery = `-- ---------------------------------------------------------------------
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

-- Supporting Operational Tables
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
    status VARCHAR(50) NOT NULL DEFAULT 'Baik',
    label VARCHAR(100)
);

CREATE TABLE absensi_staff (
    id BIGSERIAL PRIMARY KEY,
    staff_name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    check_in_time VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'Hadir'
);

CREATE TABLE keluhan_asrama (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    action_taken TEXT,
    status VARCHAR(50) DEFAULT 'Selesai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  const dmlQuery = `-- ---------------------------------------------------------------------
-- SEED: Day Menus
-- ---------------------------------------------------------------------
INSERT INTO day_menus (date, menu_list, created_at, created_by) VALUES
('2026-06-15', ARRAY['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'], '2026-06-14 08:00:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-16', ARRAY['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng Kelapa', 'Pisang'], '2026-06-15 08:15:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-17', ARRAY['Nasi Gurih', 'Soto Ayam Lamongan', 'Telur Asin Madura', 'Krupuk Bawang', 'Jeruk Manis'], '2026-06-16 09:00:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-18', ARRAY['Nasi Putih', 'Rawon Daging Sapi', 'Mendol Tempe', 'Kecambah Segar & Nipis', 'Semangka Merah'], '2026-06-17 07:45:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'),
('2026-06-19', ARRAY['Nasi Putih', 'Gulai Ikan Bandeng', 'Sayur Bobor Bayam Labu', 'Tahu Goreng Tepung', 'Melon Segar'], '2026-06-18 10:30:00+07', 'Ahli Gizi (Ustadzah Fatimah, S.Gz)');

-- ---------------------------------------------------------------------
-- SEED: SOP Headers (Tuesday - 2026-06-16)
-- ---------------------------------------------------------------------
INSERT INTO sops (id, date, division, creator_role, creator_name, is_checked_all, signer_supervisor, status, updated_at) VALUES
('2026-06-16-Stocking (Persiapan)', '2026-06-16', 'Stocking (Persiapan)', 'Chef / Juru Masak', 'Chef Ahmad', FALSE, 'Chef Ahmad', 'aktif', '2026-06-16 05:00:00+07'),
('2026-06-16-Masak', '2026-06-16', 'Masak', 'Chef / Juru Masak', 'Chef Ahmad', FALSE, 'Chef Ahmad', 'aktif', '2026-06-16 05:01:00+07'),
('2026-06-16-Pemorsian', '2026-06-16', 'Pemorsian', 'Ahli Gizi', 'Ustadzah Fatimah, S.Gz', FALSE, 'Ustadzah Fatimah, S.Gz', 'aktif', '2026-06-16 05:02:00+07'),
('2026-06-16-Driver', '2026-06-16', 'Driver', 'Aslap (Asisten Lapangan)', 'Ustadz Hakim, S.Pd (Aslap)', FALSE, 'Ustadz Hakim, S.Pd (Aslap)', 'aktif', '2026-06-16 05:03:00+07'),
('2026-06-16-Cuci', '2026-06-16', 'Cuci', 'Aslap (Asisten Lapangan)', 'Ustadz Hakim, S.Pd (Aslap)', FALSE, 'Ustadz Hakim, S.Pd (Aslap)', 'aktif', '2026-06-16 05:04:00+07');

-- ---------------------------------------------------------------------
-- SEED: SOP Tasks
-- ---------------------------------------------------------------------
INSERT INTO sop_tasks (id, sop_id, text, completed, category, sort_order) VALUES
('stocking-tue-prep1', '2026-06-16-Stocking (Persiapan)', 'Hadir tepat waktu sesuai jadwal dinas dan melakukan absensi digital.', TRUE, 'persiapan', 1),
('stocking-tue-prep2', '2026-06-16-Stocking (Persiapan)', 'Koordinator mengecek kesiapan anggota tim serta ketersediaan bahan/alat pendukung.', TRUE, 'persiapan', 2),
('stocking-tue-prep3', '2026-06-16-Stocking (Persiapan)', 'Memakai Alat Pelindung Diri (APD) lengkap: Celemek, Masker, Hairnet (Penutup Kepala), dan Sarung Tangan.', TRUE, 'persiapan', 3),
('stocking-tue-act1', '2026-06-16-Stocking (Persiapan)', 'Menerima dan memeriksa kesegaran serta kelayakan bahan menu: Nasi Putih, Krawu Ayam Bungah, Tempe Goreng Ketumbar, dsb.', FALSE, 'aktif', 4),
('stocking-tue-act2', '2026-06-16-Stocking (Persiapan)', 'Mencuci Ayam bersih, potong, kemudian direbus dengan garam, daun salam, dan jeruk purut.', FALSE, 'aktif', 5),
('stocking-tue-act3', '2026-06-16-Stocking (Persiapan)', 'Mengupas bumbu rempah: Bawang putih, bawang merah, jahe, lengkuas, kunyit sesuai resep porsi.', FALSE, 'aktif', 6),
('stocking-tue-close1', '2026-06-16-Stocking (Persiapan)', 'Membersihkan dan mengeringkan seluruh peralatan yang digunakan dalam tugas tim.', FALSE, 'penutup', 7),
('stocking-tue-close2', '2026-06-16-Stocking (Persiapan)', 'Membersihkan area kerja masing-masing divisi (Meja dapur, lantai, atau kendaraan dsb.) setelah selesai.', FALSE, 'penutup', 8),
('masak-tue-prep1', '2026-06-16-Masak', 'Hadir tepat waktu sesuai jadwal dinas dan melakukan absensi digital.', TRUE, 'persiapan', 1),
('masak-tue-prep2', '2026-06-16-Masak', 'Koordinator mengecek kesiapan anggota tim serta ketersediaan bahan/alat pendukung.', TRUE, 'persiapan', 2),
('masak-tue-prep3', '2026-06-16-Masak', 'Memakai Alat Pelindung Diri (APD) lengkap: Celemek, Masker, Hairnet (Penutup Kepala), dan Sarung Tangan.', TRUE, 'persiapan', 3),
('masak-tue-act1', '2026-06-16-Masak', 'Merebus kuah kaldu utama atau menanak dan mengukus nasi putih sejumlah porsi gizi santri.', FALSE, 'aktif', 4),
('masak-tue-act2', '2026-06-16-Masak', 'Menggoreng atau menumis protein ayam hingga matang merata di suhu minimal 75°C.', FALSE, 'aktif', 5),
('masak-tue-act3', '2026-06-16-Masak', 'Melakukan marinasi tempe/tahu dengan bumbu ketumbar bawang lalu goreng deep-fry hingga kuning keemasan.', FALSE, 'aktif', 6),
('masak-tue-close1', '2026-06-16-Masak', 'Membersihkan dan mengeringkan seluruh peralatan yang digunakan dalam tugas tim.', FALSE, 'penutup', 7),
('masak-tue-close2', '2026-06-16-Masak', 'Membersihkan area kerja masing-masing divisi (Meja dapur, lantai, atau kendaraan dsb.) setelah selesai.', FALSE, 'penutup', 8);

-- ---------------------------------------------------------------------
-- SEED: Supporting Operational Tables
-- ---------------------------------------------------------------------
INSERT INTO inventaris_alat (name, quantity, status, label) VALUES
('Kuali Raksasa Diameter 1.2 Meter', '4 Unit', 'Baik', 'Heavy Duty cooking'),
('Blender Komersial Heavy Duty 3HP', '2 Unit', 'Butuh Servis', 'Bumbu Halus stocking'),
('Meja Assembly Lines Premium Stainless 304', '3 Unit', 'Baik', 'Pemorsian'),
('Lemari Pendingin Industri (Cold Room Freezer)', '1 Unit', 'Baik', 'Penyimpanan Dapur');

INSERT INTO stok_sisa (name, category, quantity, condition, action_plan) VALUES
('Karkas Ayam Broiler', 'Protein Basah', '4.5 Kg', 'Sangat Segar (Chiller)', 'Masuk Menu Masak Esok Hari'),
('Bawang Merah Kupas', 'Bumbu Dapur', '12.0 Kg', 'Kering, Bagus', 'Gunakan untuk Stocking Persiapan');`;

  const fullQuery = `-- =====================================================================
-- DATABASE SCHEMA & DUMMY DATA FOR SUPABASE (POSTGRESQL)
-- Webapp Dapur SPPG Qomaruddin Bungah Gresik
-- =====================================================================

${ddlQuery}

${dmlQuery}`;

  const handleCopy = (text: string, type: 'all' | 'ddl' | 'dml') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([fullQuery], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sppg_kitchen_supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-base font-display">
              Ekspor Database SQL (Supabase)
            </h3>
            <p className="text-xs text-neutral-500">
              Sediakan skema tabel relasional &amp; semua dummy data siap saji untuk platform manajemen Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFile}
            className="bg-neutral-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Unduh file .sql
          </button>
        </div>
      </div>

      {/* Selector Subtabs */}
      <div className="flex border border-neutral-200 bg-neutral-50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'all' ? 'bg-cyan-700 text-white shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Semua Query (.sql)
        </button>
        <button
          onClick={() => setActiveTab('ddl')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ddl' ? 'bg-cyan-700 text-white shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Skema Tabel (DDL)
        </button>
        <button
          onClick={() => setActiveTab('dml')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'dml' ? 'bg-cyan-700 text-white shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Data Dummy (DML)
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'guide' ? 'bg-cyan-700 text-white shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Buku Panduan Deploy
        </button>
      </div>

      {/* Main Container Content */}
      {activeTab !== 'guide' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
              <Terminal className="h-3.5 w-3.5" />
              postgres-supabase-script.sql -- {activeTab === 'all' ? '120+ lines' : activeTab === 'ddl' ? '85 lines' : '45 lines'}
            </span>

            <button
              onClick={() => handleCopy(
                activeTab === 'all' ? fullQuery : activeTab === 'ddl' ? ddlQuery : dmlQuery,
                activeTab === 'all' ? 'all' : activeTab === 'ddl' ? 'ddl' : 'dml'
              )}
              className="text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 text-neutral-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              {copiedType ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 animate-scale" />
                  <span className="text-emerald-600">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin SQL Query</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-xl border border-neutral-200/80 bg-neutral-950 p-4 font-mono text-[11px] leading-relaxed text-neutral-300 max-h-[400px] overflow-y-auto shadow-inner">
            <pre className="whitespace-pre">
              {activeTab === 'all' ? fullQuery : activeTab === 'ddl' ? ddlQuery : dmlQuery}
            </pre>
          </div>

          <p className="text-[11px] text-neutral-500 flex items-start gap-1.5 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
            <Info className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
            <span>
              <strong>Tip Praktis:</strong> Skema ini dirancang menggunakan tipe data <strong>TEXT[]</strong> asli PostgreSQL untuk daftar menu hidangan agar memudahkan kueri, dan mendukung constraint relasi <code>ON DELETE CASCADE</code> guna menjaga konsistensi rekam data harian.
            </span>
          </p>
        </div>
      ) : (
        /* Tutorial Deployment Guide to Cloudflare & Supabase */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Supabase Side */}
            <div className="border border-cyan-100/60 bg-cyan-50/20 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-800" />
                <h4 className="font-bold text-neutral-900 text-sm">1. Setup di Supabase</h4>
              </div>
              <ol className="list-decimal list-inside text-xs text-neutral-600 space-y-2 leading-relaxed">
                <li>Buka dasbor <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-cyan-800 font-bold hover:underline inline-flex items-center gap-0.5">Supabase <ExternalLink className="h-2.5 w-2.5" /></a> dan buat project baru.</li>
                <li>Setelah project aktif, klik menu <strong>SQL Editor</strong> di sidebar sebelah kiri.</li>
                <li>Buat lembar query baru, lalu <strong>Tempel / Paste</strong> SQL query dari tab sebelumnya.</li>
                <li>Klik tombol <strong>Run</strong> untuk mengeksekusi pembuatan tabel dan pengisian dummy data.</li>
                <li>Buka menu <strong>Table Editor</strong> untuk memverifikasi tabel <code>day_menus</code>, <code>sops</code>, dan <code>sop_tasks</code> berhasil dimuat.</li>
              </ol>
            </div>

            {/* Cloudflare Deploy Side */}
            <div className="border border-indigo-100/60 bg-indigo-50/20 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-800" />
                <h4 className="font-bold text-neutral-900 text-sm">2. Deploy di Cloudflare (via GitHub)</h4>
              </div>
              <ol className="list-decimal list-inside text-xs text-neutral-600 space-y-2 leading-relaxed">
                <li>Masukkan kode app Anda ke dalam repositori <strong>GitHub</strong> pribadi.</li>
                <li>Buka dasbor <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-indigo-800 font-bold hover:underline inline-flex items-center gap-0.5">Cloudflare <ExternalLink className="h-2.5 w-2.5" /></a> lalu pilih menu <strong>Workers &amp; Pages</strong>.</li>
                <li>Pilih <strong>Create application</strong> lalu klik bagian <strong>Pages</strong>, sambungkan ke akun GitHub Anda.</li>
                <li>Pilih repositori dapur Anda, atur konfigurasi framework menjadi <strong>Vite (atau Static HTML)</strong>.</li>
                <li>Tambahkan variabel Env (jika ada API backend) di halaman settings variabel Cloudflare.</li>
                <li>Klik <strong>Save and Deploy</strong>. Cloudflare akan melakukan build otomatis dalam waktu kurang dari 2 menit.</li>
              </ol>
            </div>

          </div>

          <div className="bg-amber-50 border border-amber-200/80 text-amber-900 p-4 rounded-xl flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-bold text-[13px]">Bagaimana menghubungkan data React dengan Supabase?</h5>
              <p className="text-xs leading-relaxed text-amber-800">
                Gunakan paket resmi client library di project Anda dengan command <code>npm install @supabase/supabase-js</code>. Hubungkan menggunakan URL API dan Kunci Anonim (Anon Key) yang disediakan di dasbor Supabase Anda, kemudian panggil data menggunakan hook <code>useEffect</code> untuk membuang dummy state lokal.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
