import React, { useState, useEffect } from 'react';
import { 
  Package, Wrench, ShieldCheck, ShoppingCart, Truck, Calendar, Sparkles,
  Camera, Users, FileText, CheckCircle, Search, AlertCircle, Plus, ClipboardCheck, ArrowRight,
  Trash2, Loader2, RefreshCw, Check, X, Code, Clipboard, ShieldAlert, CheckCircle2, Info
} from 'lucide-react';
import { DayMenu, UserRole } from '../types';
import { supabase, isSupabaseConfigured, UserProfile } from '../lib/supabase';

// Real schemas for SQL integration
export interface SisaStokItem {
  id: string;
  item_name: string;
  category: string;
  quantity: string;
  condition: string;
  action_plan: string;
  created_by?: string;
  created_at?: string;
}

export interface OrderRequestItem {
  id: string;
  item_name: string;
  qty: string;
  reason: string;
  category: 'alat' | 'operasional';
  status: 'pending' | 'disetujui' | 'ditolak';
  created_by?: string;
  created_at?: string;
  notes?: string;
}

export interface VolunteerComplaintItem {
  id: string;
  source: string;
  category: string;
  complaint_text: string;
  action_taken?: string;
  status: 'pending' | 'selesai';
  created_by?: string;
  created_at?: string;
}

interface MockModulesProps {
  moduleIndex: number;
  onSetMenu: (date: string, items: string[]) => void;
  allDayMenus?: DayMenu[];
  onSaveMenu?: (date: string, menuList: string[]) => void;
  onGenerateSOPs?: (date: string, menuList: string[]) => void;
  onDeleteMenu?: (date: string) => void;
  currentUserRole?: UserRole;
  loggedInUser?: UserProfile | null;
}

const PRESET_SUGGESTIONS = [
  { name: 'Nasi Krawu Bungah', items: ['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng', 'Pisang'] },
  { name: 'Soto Lamongan Mantap', items: ['Nasi Gurih', 'Soto Ayam Lamongan', 'Telur Asin Madura', 'Krupuk Bawang', 'Jeruk Manis'] },
  { name: 'Ayam Geprek Pedas', items: ['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'] },
  { name: 'Rawon Sapi Tradisional', items: ['Nasi Putih', 'Rawon Daging Sapi', 'Mendol Tempe', 'Kecambah Segar & Nipis', 'Semangka Merah'] },
  { name: 'Gulai Bandeng Segar', items: ['Nasi Putih', 'Gulai Ikan Bandeng', 'Sayur Bobor Bayam Labu', 'Tahu Goreng Tepung', 'Melon Segar'] }
];

export default function MockModules({ 
  moduleIndex, 
  onSetMenu,
  allDayMenus = [],
  onSaveMenu,
  onGenerateSOPs,
  onDeleteMenu,
  currentUserRole,
  loggedInUser
}: MockModulesProps) {
  // Common states
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);
  
  // Forms states
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Dynamic entity states
  const [stokSisa, setStokSisa] = useState<SisaStokItem[]>([]);
  const [orderRequests, setOrderRequests] = useState<OrderRequestItem[]>([]);
  const [keluhanList, setKeluhanList] = useState<VolunteerComplaintItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // SQL Script console toggle
  const [showSqlPanel, setShowSqlPanel] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form toggles
  const [isAddingSisa, setIsAddingSisa] = useState(false);
  const [sisaCategory, setSisaCategory] = useState('Protein Basah');
  const [sisaCond, setSisaCond] = useState('Sangat Segar (Chiller)');

  // Admin approval states
  const [adminNoteInput, setAdminNoteInput] = useState<Record<string, string>>({});
  const [adminComplaintAction, setAdminComplaintAction] = useState<Record<string, string>>({});

  const isAdmin = loggedInUser?.email === 'maghfurmunif@gmail.com' || currentUserRole === UserRole.ADMIN;

  const triggerSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const loadSisaStokFromLocal = () => {
    const raw = localStorage.getItem('sppg_sisa_stok');
    if (raw) {
      setStokSisa(JSON.parse(raw));
    } else {
      const defaults: SisaStokItem[] = [
        { id: 'stok-1', item_name: 'Karkas Ayam Broiler', category: 'Protein Basah', quantity: '4.5 Kg', condition: 'Sangat Segar (Chiller)', action_plan: 'Masuk Menu Masak Esok Hari', created_by: 'stocking@sppg.com' },
        { id: 'stok-2', item_name: 'Bawang Merah Kupas', category: 'Bumbu Dapur', quantity: '12.0 Kg', condition: 'Kering, Bagus', action_plan: 'Gunakan untuk Stocking Persiapan', created_by: 'prep@sppg.com' },
        { id: 'stok-3', item_name: 'Timun Lokal', category: 'Sayur Segar', quantity: '3.5 Kg', condition: 'Segar', action_plan: 'Garnish/Lalapan Makan Malam', created_by: 'stocking@sppg.com' },
        { id: 'stok-4', item_name: 'Tempe Blok Premium', category: 'Lauk Nabati', quantity: '8 Batang', condition: 'Sangat Segar', action_plan: 'Goreng Crispy Sore Ini', created_by: 'masak@sppg.com' },
        { id: 'stok-5', item_name: 'Cabai Rawit Merah sisa', category: 'Bumbu Dapur', quantity: '2.1 Kg', condition: 'Sedikit Layu', action_plan: 'Langsung blender bumbu halus', created_by: 'stocking@sppg.com' }
      ];
      localStorage.setItem('sppg_sisa_stok', JSON.stringify(defaults));
      setStokSisa(defaults);
    }
  };

  const loadOrdersFromLocal = () => {
    const raw = localStorage.getItem('sppg_order_requests');
    if (raw) {
      setOrderRequests(JSON.parse(raw));
    } else {
      const defaults: OrderRequestItem[] = [
        { id: 'o-1', item_name: 'Blender Komersial Heavy Duty 3HP', qty: '1 Unit', reason: 'Blender utama mati total karena korsleting listrik semalam. Sangat mendesak untuk bumbu santri 450 porsi.', category: 'alat', status: 'pending', created_by: 'persiapan@sppg.com', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 'o-2', item_name: 'Sabun Cuci Piring Jerigen 20L', qty: '3 Jerigen', reason: 'Stok sabun cuci ompreng menipis sisa 1 jerigen kecil. Cukup untuk 2 hari kedepan.', category: 'operasional', status: 'disetujui', created_by: 'cuci@sppg.com', created_at: new Date(Date.now() - 3600000 * 24).toISOString(), notes: 'Sudah di-order ke Supplier Barokah' },
        { id: 'o-3', item_name: 'Tabung Gas LPG 50 Kg', qty: '2 Tabung', reason: 'Cadangan bahan bakar untuk masak gulai bandeng menu hari kamis.', category: 'operasional', status: 'pending', created_by: 'masak@sppg.com', created_at: new Date(Date.now() - 3600000 * 12).toISOString() }
      ];
      localStorage.setItem('sppg_order_requests', JSON.stringify(defaults));
      setOrderRequests(defaults);
    }
  };

  const loadKeluhanFromLocal = () => {
    const raw = localStorage.getItem('sppg_volunteer_complaints');
    if (raw) {
      setKeluhanList(JSON.parse(raw));
    } else {
      const defaults: VolunteerComplaintItem[] = [
        { id: 'k-1', source: 'Ustadz Jauhari (Dorm Putra C)', category: 'Kekurangan Porsi Jumlah', complaint_text: 'Jumlah ompreng datang kurang 3 pack dibanding daftar santri absen malam ini.', action_taken: 'Diselesaikan: Driver langsung kirim susulan 3 porsi dari dapur cadangan.', status: 'selesai', created_by: 'driver@sppg.com', created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: 'k-2', source: 'Wali Kamar Asrama Putri 4', category: 'Rasa / Suhu Makanan', complaint_text: 'Sayur bobor bayam yang tiba untuk sarapan terasa terlalu hambar dan dingin.', action_taken: 'Investigasi: Tim masak dievaluasi agar menakar garam presisi.', status: 'selesai', created_by: 'masak@sppg.com', created_at: new Date(Date.now() - 3600000 * 30).toISOString() },
        { id: 'k-3', source: 'Ustadzah Aminah (Asrama Putri C)', category: 'Keterlanjuran / Keterlambatan Kirim', complaint_text: 'Distribusi sarapan pagi ini terlambat 25 menit. Santri terburu-buru sekolah.', action_taken: 'Dalam investigasi: Penyebab keterlambatan mobil operasional slip kopling sedang diperiksa mekanik.', status: 'pending', created_by: 'driver@sppg.com', created_at: new Date(Date.now() - 3600000 * 8).toISOString() }
      ];
      localStorage.setItem('sppg_volunteer_complaints', JSON.stringify(defaults));
      setKeluhanList(defaults);
    }
  };

  const fetchDatabaseData = async () => {
    setIsLoadingData(true);
    setDbErrorMsg(null);
    try {
      if (isSupabaseConfigured && supabase) {
        // Fetch Sisa Stok
        const { data: sisaData, error: sisaErr } = await supabase
          .from('sisa_stok')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!sisaErr && sisaData) {
          setStokSisa(sisaData);
        } else {
          if (sisaErr) console.warn("sisa_stok table query error: ", sisaErr.message);
          loadSisaStokFromLocal();
        }

        // Fetch Order Requests
        const { data: orderData, error: orderErr } = await supabase
          .from('order_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!orderErr && orderData) {
          setOrderRequests(orderData);
        } else {
          if (orderErr) console.warn("order_requests table query error: ", orderErr.message);
          loadOrdersFromLocal();
        }

        // Fetch Complaints
        const { data: keluhanData, error: keluhanErr } = await supabase
          .from('volunteer_complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (!keluhanErr && keluhanData) {
          setKeluhanList(keluhanData);
        } else {
          if (keluhanErr) console.warn("volunteer_complaints table query error: ", keluhanErr.message);
          loadKeluhanFromLocal();
        }
      } else {
        loadSisaStokFromLocal();
        loadOrdersFromLocal();
        loadKeluhanFromLocal();
      }
    } catch (e: any) {
      console.warn("Error fallback loading: ", e);
      loadSisaStokFromLocal();
      loadOrdersFromLocal();
      loadKeluhanFromLocal();
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, [moduleIndex]);

  // Handle adding new sisa stok item
  const handleAddSisaStok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.qty || !formData.action) return;

    const newItem: SisaStokItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'stok-' + Math.random().toString(36).substring(7),
      item_name: formData.itemName,
      category: sisaCategory,
      quantity: formData.qty,
      condition: sisaCond,
      action_plan: formData.action,
      created_by: loggedInUser?.email || 'staf@sppg.com',
      created_at: new Date().toISOString()
    };

    let isSavedRemote = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('sisa_stok').insert([{
          id: newItem.id,
          item_name: newItem.item_name,
          category: newItem.category,
          quantity: newItem.quantity,
          condition: newItem.condition,
          action_plan: newItem.action_plan,
          created_by: newItem.created_by
        }]);
        if (!error) isSavedRemote = true;
      } catch (err) {
        console.warn("Supabase insert error:", err);
      }
    }

    const updated = [newItem, ...stokSisa];
    setStokSisa(updated);
    localStorage.setItem('sppg_sisa_stok', JSON.stringify(updated));
    setFormData({});
    setIsAddingSisa(false);
    triggerSuccessMsg(isSavedRemote 
      ? `Stok sisa "${newItem.item_name}" berhasil disinkronisasi ke Cloud Database!` 
      : `Stok sisa "${newItem.item_name}" berhasil disimpan lokal!`
    );
  };

  // Handle deleting sisa stok
  const handleDeleteSisaStok = async (id: string) => {
    let deletedRemote = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('sisa_stok').delete().eq('id', id);
        if (!error) deletedRemote = true;
      } catch (err) {
        console.warn('Delete error remote: ', err);
      }
    }
    const updated = stokSisa.filter(item => item.id !== id);
    setStokSisa(updated);
    localStorage.setItem('sppg_sisa_stok', JSON.stringify(updated));
    triggerSuccessMsg(deletedRemote ? "Data sisa stok terhapus dari Cloud!" : "Data sisa stok terhapus secara lokal!");
  };

  // Handle creating order request
  const handleCreateOrderRequest = async (e: React.FormEvent, isAlat: boolean) => {
    e.preventDefault();
    if (!formData.itemName || !formData.qty || !formData.reason) return;

    const newItem: OrderRequestItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'o-' + Math.random().toString(36).substring(7),
      item_name: formData.itemName,
      qty: formData.qty,
      reason: formData.reason,
      category: isAlat ? 'alat' : 'operasional',
      status: 'pending',
      created_by: loggedInUser?.email || 'chef@sppg.com',
      created_at: new Date().toISOString()
    };

    let isSavedRemote = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('order_requests').insert([{
          id: newItem.id,
          item_name: newItem.item_name,
          qty: newItem.qty,
          reason: newItem.reason,
          category: newItem.category,
          status: newItem.status,
          created_by: newItem.created_by
        }]);
        if (!error) isSavedRemote = true;
      } catch (err) {
        console.warn("Supabase insert order error:", err);
      }
    }

    const updated = [newItem, ...orderRequests];
    setOrderRequests(updated);
    localStorage.setItem('sppg_order_requests', JSON.stringify(updated));
    setFormData({});
    triggerSuccessMsg(isSavedRemote
      ? `Pengajuan order ${isAlat ? 'Alat' : 'Operasional'} berhasil dikirim ke Cloud Database!` 
      : `Pengajuan order ${isAlat ? 'Alat' : 'Operasional'} disimpan secara lokal!`
    );
  };

  // Handle updating order request status (Admin)
  const handleUpdateOrderStatus = async (id: string, nextStatus: 'disetujui' | 'ditolak') => {
    const notes = adminNoteInput[id] || '';
    let isUpdatedRemote = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('order_requests')
          .update({ status: nextStatus, notes })
          .eq('id', id);
        if (!error) isUpdatedRemote = true;
      } catch (err) {
        console.warn("Supabase update error: ", err);
      }
    }

    const updated = orderRequests.map(req => 
      req.id === id ? { ...req, status: nextStatus, notes } : req
    );
    setOrderRequests(updated);
    localStorage.setItem('sppg_order_requests', JSON.stringify(updated));
    
    // Clear admin input for this ID
    setAdminNoteInput(prev => ({ ...prev, [id]: '' }));
    triggerSuccessMsg(isUpdatedRemote
      ? `Pengajuan berhasil di-${nextStatus} di Cloud Database!`
      : `Pengajuan berhasil di-${nextStatus} secara lokal!`
    );
  };

  // Handle volunteer complaint submission
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source || !formData.category || !formData.complaintText) return;

    const newItem: VolunteerComplaintItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'k-' + Math.random().toString(36).substring(7),
      source: formData.source,
      category: formData.category,
      complaint_text: formData.complaintText,
      status: 'pending',
      created_by: loggedInUser?.email || 'wali@sppg.com',
      created_at: new Date().toISOString()
    };

    let isSavedRemote = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('volunteer_complaints').insert([{
          id: newItem.id,
          source: newItem.source,
          category: newItem.category,
          complaint_text: newItem.complaint_text,
          status: newItem.status,
          created_by: newItem.created_by
        }]);
        if (!error) isSavedRemote = true;
      } catch (err) {
        console.warn("Supabase insert complaint failure:", err);
      }
    }

    const updated = [newItem, ...keluhanList];
    setKeluhanList(updated);
    localStorage.setItem('sppg_volunteer_complaints', JSON.stringify(updated));
    setFormData({});
    triggerSuccessMsg(isSavedRemote
      ? "Laporan keluhan berhasil diunggah ke Cloud Database!" 
      : "Laporan keluhan berhasil dicatat secara lokal!"
    );
  };

  // Handle updating complement resolution (Admin)
  const handleResolveComplaint = async (id: string) => {
    const actionPlan = adminComplaintAction[id] || 'Telah diverifikasi dan ditindaklanjuti oleh Administrator.';
    let isUpdatedRemote = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('volunteer_complaints')
          .update({ action_taken: actionPlan, status: 'selesai' })
          .eq('id', id);
        if (!error) isUpdatedRemote = true;
      } catch (err) {
        console.warn("Supabase complaint update error:", err);
      }
    }

    const updated = keluhanList.map(kel => 
      kel.id === id ? { ...kel, action_taken: actionPlan, status: 'selesai' as const } : kel
    );
    setKeluhanList(updated);
    localStorage.setItem('sppg_volunteer_complaints', JSON.stringify(updated));
    setAdminComplaintAction(prev => ({ ...prev, [id]: '' }));
    triggerSuccessMsg(isUpdatedRemote
      ? "Keluhan asrama berhasil diselesaikan di Cloud Database!"
      : "Keluhan asrama berhasil diselesaikan secara lokal!"
    );
  };

  // SQL code block template string
  const postgres_sql_scripts = `-- SKEMA DAN QUERY MIGRASI SUPABASE SPPG GRESIK
-- Salin dan jalankan perintah SQL ini di SQL Editor dashboard Supabase Anda.

-- 1. Membuat tabel sisa_stok (Aset & Logistik)
CREATE TABLE IF NOT EXISTS sisa_stok (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT NOT NULL,
  condition TEXT NOT NULL,
  action_plan TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan RLS (Row Level Security) untuk sisa_stok
ALTER TABLE sisa_stok ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik sisa_stok" ON sisa_stok;
CREATE POLICY "Akses Publik sisa_stok" ON sisa_stok FOR ALL USING (true) WITH CHECK (true);


-- 2. Membuat tabel order_requests (Pengajuan Order Alat & Operasional)
CREATE TABLE IF NOT EXISTS order_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  qty TEXT NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('alat', 'operasional')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'disetujui', 'ditolak')),
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan RLS untuk order_requests
ALTER TABLE order_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik order_requests" ON order_requests;
CREATE POLICY "Akses Publik order_requests" ON order_requests FOR ALL USING (true) WITH CHECK (true);


-- 3. Membuat tabel volunteer_complaints (Log Keluhan Relawan / Asrama)
CREATE TABLE IF NOT EXISTS volunteer_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  complaint_text TEXT NOT NULL,
  action_taken TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'selesai')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan RLS untuk volunteer_complaints
ALTER TABLE volunteer_complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik volunteer_complaints" ON volunteer_complaints;
CREATE POLICY "Akses Publik volunteer_complaints" ON volunteer_complaints FOR ALL USING (true) WITH CHECK (true);


-- QUERY QUERY ANALISIS DAN REKAPITULASI (Silakan gunakan untuk audit data):

-- A. Query Rekap Order Alat & Operasional yang Pending
SELECT category, COUNT(*), STRING_AGG(item_name, ', ') AS item_list
FROM order_requests
WHERE status = 'pending'
GROUP BY category;

-- B. Query Keluhan yang Belum Ditangani (Status Pending)
SELECT source, category, complaint_text, created_at
FROM volunteer_complaints
WHERE status = 'pending'
ORDER BY created_at DESC;

-- C. Query Evaluasi Stok Sisa Dapur
SELECT category, COUNT(*) AS total_items, STRING_AGG(item_name || ' (' || quantity || ')', '; ') AS detail_stok
FROM sisa_stok
GROUP BY category;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postgres_sql_scripts);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const currentYear = 2026;

  // Render correct mockup based on index (1-based to match the user's 1-14 numbering)
  switch (moduleIndex) {
    case 1: // Stok Bahan Sisa
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                  <Package className="h-6 w-6 text-emerald-700" />
                  Stok Bahan Sisa (Dapur Basah & Kering)
                </h2>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {isSupabaseConfigured ? '🟢 Cloud Sync Aktif' : '🟡 Mode Lokal (Tanpa Cloud)'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Pencatatan sisa bahan setelah proses pemorsian untuk efisiensi limbah (zero waste).</p>
            </div>
            <button 
              onClick={() => setIsAddingSisa(!isAddingSisa)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
            >
              <Plus className="h-4 w-4" /> {isAddingSisa ? 'Tutup Form' : 'Pencatatan Baru'}
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          {isAddingSisa && (
            <form onSubmit={handleAddSisaStok} className="p-4 border border-emerald-100 bg-emerald-50/10 rounded-xl space-y-4">
              <h3 className="font-bold text-xs text-emerald-900 uppercase tracking-widest flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Masukkan Sisa Stok Baru
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nama Sisa Bahan</label>
                  <input 
                    type="text" 
                    required
                    value={formData.itemName || ''}
                    onChange={e => setFormData({...formData, itemName: e.target.value})}
                    placeholder="Contoh: Karkas Ayam Broiler"
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs focus:ring-1 focus:ring-emerald-700 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Kategori</label>
                  <select 
                    value={sisaCategory} 
                    onChange={e => setSisaCategory(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs outline-hidden"
                  >
                    <option value="Protein Basah">Protein Basah (Ayam/Ikan/Daging)</option>
                    <option value="Bumbu Dapur">Bumbu Dapur (Cabai/Bawang/Kunyit)</option>
                    <option value="Sayur Segar">Sayur Segar (Kangkung/Timun/Sawi)</option>
                    <option value="Lauk Nabati">Lauk Nabati (Tempe/Tahu)</option>
                    <option value="Beras & Sembako">Beras & Sembako (Minyak/Beras)</option>
                    <option value="Consumables">Consumables (Gas/Sabun)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Jumlah Sisa (Qty)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.qty || ''}
                    onChange={e => setFormData({...formData, qty: e.target.value})}
                    placeholder="Contoh: 4.5 Kg / 10 Batang"
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs focus:ring-1 focus:ring-emerald-700 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Kondisi / Kelayakan</label>
                  <select 
                    value={sisaCond} 
                    onChange={e => setSisaCond(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs outline-hidden"
                  >
                    <option value="Sangat Segar (Chiller)">Sangat Segar (Chiller)</option>
                    <option value="Kering, Bagus">Kering, Bagus</option>
                    <option value="Segar">Segar</option>
                    <option value="Sangat Segar">Sangat Segar</option>
                    <option value="Sedikit Layu">Sedikit Layu</option>
                    <option value="Baik keadaannya">Baik</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Rencana Action (Tindakan)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.action || ''}
                    onChange={e => setFormData({...formData, action: e.target.value})}
                    placeholder="Contoh: Masuk Menu Masak Esok Hari / Goreng Sore Ini"
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs focus:ring-1 focus:ring-emerald-700 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingSisa(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg text-xs font-semibold hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Cari sisa bahan (contoh: ayam, bawang, timun)..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-neutral-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Nama Bahan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Jumlah Sisa</th>
                  <th className="py-3 px-4">Kondisi / Kelayakan</th>
                  <th className="py-3 px-4">Rencana Action</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {stokSisa.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-neutral-400 font-medium">
                      {isLoadingData ? 'Memuat data dari database...' : 'Belum ada sisa log bahan hari ini.'}
                    </td>
                  </tr>
                ) : (
                  stokSisa.filter(it => it.item_name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-neutral-50/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-neutral-900">{item.item_name}</td>
                      <td className="py-3 px-4 text-xs font-mono text-neutral-500">{item.category}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{item.quantity}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] uppercase tracking-wide font-black px-2 py-0.5 rounded-full border border-emerald-100">
                          {item.condition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-serif text-neutral-600">{item.action_plan}</td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handleDeleteSisaStok(item.id)}
                          className="hover:text-red-700 text-neutral-400 p-1.5 rounded-lg hover:bg-red-50 transition-all inline-flex items-center"
                          title="Hapus sisa stok"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 2: // Inventaris alat
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
              <Wrench className="h-6 w-6 text-emerald-700" />
              Inventaris Peralatan Dapur SPPG
            </h2>
            <p className="text-xs text-neutral-500">Daftar alat aset dapur berat dan ringan beserta status kepemilikan dan masa kelayakan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
              <span className="text-xs text-neutral-500 block font-medium">Total Aset Alat</span>
              <span className="text-2xl font-bold text-emerald-800">142 Unit</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
              <span className="text-xs text-neutral-500 block font-medium">Kondisi Baik</span>
              <span className="text-2xl font-bold text-blue-800">136 Unit</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
              <span className="text-xs text-neutral-500 block font-medium">Butuh Servis</span>
              <span className="text-2xl font-bold text-amber-800">4 Unit</span>
            </div>
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
              <span className="text-xs text-neutral-500 block font-medium">Rusak Total</span>
              <span className="text-2xl font-bold text-red-800">2 Unit</span>
            </div>
          </div>

          <div className="border border-neutral-100 rounded-xl overflow-hidden text-sm">
            {[
              { name: 'Kuali Raksasa Diameter 1.2 Meter', qty: '4 Unit', status: 'Baik', label: 'Heavy Duty cooking' },
              { name: 'Blender Komersial Heavy Duty 3HP', qty: '2 Unit', status: 'Butuh Servis', label: 'Bumbu Halus stocking' },
              { name: 'Meja Assembly Lines Premium Stainless 304', qty: '3 Unit', status: 'Baik', label: 'Pemorsian' },
              { name: 'Lemari Pendingin Industri (Cold Room Freezer)', qty: '1 Unit', status: 'Baik', label: 'Penyimpanan Dapur' },
              { name: 'Baskom Stainless Ukuran Jumbo', qty: '18 Unit', status: 'Baik', label: 'Cuci & Rendam' },
              { name: 'Pisau Rajang Daging Victorinox', qty: '8 Unit', status: 'Rusak Total', label: 'Stocking' }
            ].map((item, id) => (
              <div key={id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b last:border-b-0 border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-neutral-900">{item.name}</h4>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest">{item.label}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono">
                  <span className="text-sm text-neutral-600 font-bold">Qty: {item.qty}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-extrabold ${
                    item.status === 'Baik' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    item.status === 'Butuh Servis' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 3: // Inventaris Operasional
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-700" />
              Inventaris Barang Habis Pakai / Operasional
            </h2>
            <p className="text-xs text-neutral-500 font-sans">Aset consumables seperti tabung LPG, sabun cuci piring sanitasi, masker, sarung tangan, dsb.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Bahan Bakar & Energi', list: [{ n: 'Tabung Gas Elpiji 50 Kg', q: '6 tabung', stat: 'Aman' }, { n: 'Gas Portable Stocking', q: '12 Kaleng', stat: 'Kurang' }] },
              { title: 'Sanitasi & Kebersihan', list: [{ n: 'Sabun Cuci Piring Ekonomis Jerigen', q: '8 Jerigen', stat: 'Aman' }, { n: 'Karbol Cair Wangi Pinus', q: '5 Botol', stat: 'Aman' }] },
              { title: 'Safety APD & Packaging', list: [{ n: 'Masker Higienis 3-Fly', q: '4 Box', stat: 'Kritis' }, { n: 'Sarung Tangan Nitrile steril', q: '3 Box', stat: 'Kritis' }] }
            ].map((section, idx) => (
              <div key={idx} className="border border-neutral-100 p-5 rounded-xl bg-neutral-50/50 space-y-4">
                <h3 className="font-bold text-sm text-emerald-900 border-b pb-2 border-neutral-200/55">{section.title}</h3>
                <div className="space-y-3">
                  {section.list.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-700 font-medium">{item.n}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded-sm">{item.q}</span>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                          item.stat === 'Aman' ? 'bg-emerald-100 text-emerald-800' :
                          item.stat === 'Kurang' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800 animate-pulse'
                        }`}>{item.stat}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 4: // Order Alat
    case 5: // Order Operasional
      const isAlat = moduleIndex === 4;
      const filteredRequests = orderRequests.filter(req => req.category === (isAlat ? 'alat' : 'operasional'));
      
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-emerald-700" />
                  Pemesanan & Requisition {isAlat ? 'Peralatan Baru' : 'Kebutuhan Operasional'}
                </h2>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {isSupabaseConfigured ? '🟢 Cloud Sync Aktif' : '🟡 Mode Lokal (Tanpa Cloud)'}
                </span>
                {isAdmin && (
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-200 animate-pulse">
                    🔑 Akun Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {isAlat 
                  ? 'Ajukan pengadaan peralatan masak baru atau pengganti komponen berat/ringan.' 
                  : 'Ajukan pengadaan bahan bakar gas LPG, sabun cuci piring jumbo, desinfektan, dsb.'}
              </p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setShowSqlPanel(!showSqlPanel)}
                className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Code className="h-4 w-4" /> {showSqlPanel ? 'Sembunyikan SQL' : 'Lihat Skema SQL'}
              </button>
            )}
          </div>

          {/* Admin SQL Console Section */}
          {isAdmin && showSqlPanel && (
            <div className="border border-neutral-200 rounded-xl bg-neutral-900 text-neutral-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-neutral-200">SQL DDL Schema & Query Analysis (Supabase)</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Clipboard className="h-3 w-3" />
                  {copiedSql ? 'Disalin!' : 'Salin Query'}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Gunakan query berikut untuk mengonfigurasi tabel relasi pemesanan, stok sisa, dan keluhan relawan di dashboard Supabase Anda:
              </p>
              <pre className="text-[10px] font-mono whitespace-pre-wrap bg-neutral-950 p-3 rounded-lg max-h-48 overflow-y-auto text-emerald-400 border border-neutral-800">
                {postgres_sql_scripts}
              </pre>
              <div className="bg-emerald-950/45 border border-emerald-900/50 rounded-lg p-2.5 text-[11px] text-emerald-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Admin <strong>maghfurmunif@gmail.com</strong> dikonfigurasi otomatis sebagai pengambil keputusan persetujuan. Anda dapat langsung menguji persetujuan order dan melacaknya di tabel ini.
                </span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Pengajuan / Submission (Hanya Tampil / Aktif jika bukan Admin, atau Admin juga bisa buat pengujian) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-neutral-50/50 border border-neutral-100 p-4 rounded-xl space-y-4">
                <h3 className="font-bold text-xs text-neutral-700 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-emerald-800" /> Buat Pengajuan Baru
                </h3>
                
                <form onSubmit={e => handleCreateOrderRequest(e, isAlat)} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Nama Barang</label>
                    <input 
                      type="text" 
                      required
                      value={formData.itemName || ''}
                      onChange={e => setFormData({...formData, itemName: e.target.value})}
                      placeholder={isAlat ? 'Contoh: Mixer Adonan Kue' : 'Contoh: Sabun Jerigen Premium'}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Jumlah (Qty)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.qty || ''}
                      onChange={e => setFormData({...formData, qty: e.target.value})}
                      placeholder="Contoh: 1 Unit / 3 Pcs" 
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Alasan Pengadaan & Spek</label>
                    <textarea 
                      rows={3} 
                      required
                      value={formData.reason || ''}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                      placeholder="Tulis alasan kebutuhan yang mendesak..."
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-4 rounded-lg text-xs w-full transition-colors uppercase tracking-wider"
                  >
                    Kirim Form Pengajuan
                  </button>
                </form>
              </div>
            </div>

            {/* List Pengajuan (Menampilkan data order_requests secara relasional dan real-time) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h3 className="font-bold text-xs text-neutral-700 uppercase tracking-widest flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-emerald-800" /> 
                  Daftar Pengajuan Masuk {isAlat ? '(Peralatan)' : '(Operasional)'}
                </h3>
                <span className="text-[10px] bg-neutral-100 text-neutral-600 font-mono px-2 py-0.5 rounded-full">
                  Total: {filteredRequests.length}
                </span>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="bg-neutral-50/50 border border-neutral-100 border-dashed rounded-xl p-8 text-center text-xs text-neutral-400 font-medium">
                  {isLoadingData ? 'Sedang memuat data dari database...' : 'Belum ada data pengadaan untuk kategori ini.'}
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {filteredRequests.map((req, idx) => (
                    <div key={req.id || idx} className="p-4 border border-neutral-100 rounded-xl bg-white hover:bg-neutral-50/20 transition-all shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-neutral-900 text-sm">{req.item_name}</h4>
                            <span className="bg-neutral-100 text-neutral-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded-lg border border-neutral-200">
                              Qty: {req.qty}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Diajukan oleh: <strong className="text-neutral-600 font-mono">{req.created_by}</strong> 
                            {req.created_at && ` • Pada: ${new Date(req.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'})}`}
                          </p>
                        </div>

                        {/* Status badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${
                          req.status === 'disetujui' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          req.status === 'ditolak' ? 'bg-red-50 text-red-800 border-red-200' :
                          'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                        }`}>
                          {req.status === 'pending' ? '⌛ Pending' : req.status === 'disetujui' ? '✓ Disetujui' : '✗ Ditolak'}
                        </span>
                      </div>

                      <div className="bg-neutral-50/60 p-2.5 rounded-lg text-xs text-neutral-600 font-serif leading-relaxed">
                        <span className="font-sans font-bold text-[10px] text-neutral-400 block uppercase mb-0.5 select-none">Justifikasi Alasan:</span>
                        {req.reason}
                      </div>

                      {/* Admin Note if already approved/rejected */}
                      {req.notes && (
                        <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg text-xs text-blue-900">
                          <span className="font-sans font-bold text-[10px] text-blue-500 block uppercase mb-0.5">Catatan Administrator:</span>
                          {req.notes}
                        </div>
                      )}

                      {/* Admin panel controls (Only visible for maghfurmunif@gmail.com and pending state) */}
                      {isAdmin && req.status === 'pending' && (
                        <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text"
                              value={adminNoteInput[req.id] || ''}
                              onChange={e => setAdminNoteInput({ ...adminNoteInput, [req.id]: e.target.value })}
                              placeholder="Masukkan catatan keputusan admin (cth: Di-order ke supplier, Dana disetujui)"
                              className="text-xs border border-neutral-200 rounded-lg px-3 py-1.5 flex-1 bg-white focus:outline-emerald-700"
                            />
                            <button
                              onClick={() => handleUpdateOrderStatus(req.id, 'disetujui')}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] uppercase px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Check className="h-3.5 w-3.5" /> Setujui
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(req.id, 'ditolak')}
                              className="bg-red-750 hover:bg-red-850 text-white font-extrabold text-[10px] uppercase px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <X className="h-3.5 w-3.5" /> Tolak
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      );

    case 6: // Kedatangan Barang
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                <Truck className="h-6 w-6 text-emerald-700" />
                Catatan Kedatangan Logistik Barang Masuk
              </h2>
              <p className="text-xs text-neutral-500">Pengecekan kesesuaian bumbu, sayur, daging, dan gas yang dikirim supplier SPPG.</p>
            </div>
            <button
              onClick={() => triggerSuccessMsg("Fungsi pencatatan kedatangan logistik diaktifkan!")}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Masukkan Surat Jalan
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          <div className="space-y-4">
            {[
              { id: 'RC-1029', supplier: 'CV. Agro Tani Makmur', items: 'Sayuran Sayur Bobor, Cabai Merah & Lengkuas', weight: '45.5 Kg', time: 'Hari ini, 05:45', status: 'Diterima Sesuai' },
              { id: 'RC-1028', supplier: 'Haji Dul Ayam Gresik', items: 'Ayam Karkas Segar Potong 10', weight: '70.0 Kg', time: 'Hari ini, 06:10', status: 'Diterima Sesuai' },
              { id: 'RC-1027', supplier: 'Toko Kelontong Sumber Barokah', items: 'Minyak Goreng Sunco, Beras Cianjur 5 Zak', weight: '125.0 Kg', time: 'Kemarin, 14:20', status: 'Kurang 1 Zak (Dikirim Susulan)' }
            ].map((arr, id) => (
              <div key={id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50/50 flex justify-between items-start text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-800 text-sm">{arr.id}</span>
                    <span className="text-neutral-400">|</span>
                    <span className="text-emerald-900 font-semibold">{arr.supplier}</span>
                  </div>
                  <p className="text-neutral-600 font-medium">Bahan: <span className="text-neutral-900">{arr.items}</span></p>
                  <p className="text-neutral-500 text-[10px]">Waktu Tiba: {arr.time} ({arr.weight})</p>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                    arr.status.includes('Sesuai') 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {arr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 7: // Galeri Kedatangan Barang
    case 8: // Dokumentasi
      const isGaleri = moduleIndex === 7;
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                <Camera className="h-6 w-6 text-emerald-700" />
                {isGaleri ? 'Galeri Kedatangan & Timbangan Barang' : 'Dokumentasi Dapur & Distribusi Santri'}
              </h2>
              <p className="text-xs text-neutral-500">Unggahan visual dan foto-foto sebagai bukti otentik pengawasan dapur pondok pesantren.</p>
            </div>
            <button
              onClick={() => triggerSuccessMsg("Fungsi upload kamera diaktifkan! Silakan pilih foto.")}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Ambil Foto / Upload
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {isGaleri ? (
              [
                { t: 'Timbangan Ayam Karkas 70kg', d: 'Supplier Bpk Dul', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=60' },
                { t: 'Bawang Merah & Putih Bersih', d: 'Kondisi kering & mulus', img: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=150&auto=format&fit=crop&q=60' },
                { t: 'Sayur Kangkung Segar', d: 'Seikat 35 ikat', img: 'https://images.unsplash.com/photo-1587593817658-af82697ed3b2?w=150&auto=format&fit=crop&q=60' },
                { t: 'Pemeriksaan Telur Asin', d: 'Utuh tidak retak', img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=150&auto=format&fit=crop&q=60' },
              ].map((ph, idx) => (
                <div key={idx} className="border border-neutral-100 rounded-xl overflow-hidden shadow-xs bg-neutral-50 group hover:border-emerald-500 transition-all">
                  <div className="relative aspect-square bg-neutral-200 overflow-hidden">
                    <img referrerPolicy="no-referrer" src={ph.img} alt={ph.t} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-emerald-700/90 text-white text-[8px] font-mono">OK</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <h5 className="font-bold text-[11px] text-neutral-800 truncate">{ph.t}</h5>
                    <p className="text-[9px] text-neutral-400">{ph.d}</p>
                  </div>
                </div>
              ))
            ) : (
              [
                { t: 'Penyajian Rel Pemorsian', d: 'Selesai 450 pack', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=150&auto=format&fit=crop&q=60' },
                { t: 'Pencucian Wadah Stainless', d: 'Kebersihan alat paking', img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&auto=format&fit=crop&q=60' },
                { t: 'Distribusi Food Box Asrama', d: 'Diterima Uztadz Asrama', img: 'https://images.unsplash.com/photo-1594212699903-ec8a3cee50f6?w=150&auto=format&fit=crop&q=60' },
                { t: 'Kebersihan Lantai Dapur', d: 'Mop Karbol Pasca Masak', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&auto=format&fit=crop&q=60' },
              ].map((ph, idx) => (
                <div key={idx} className="border border-neutral-100 rounded-xl overflow-hidden shadow-xs bg-neutral-50 group hover:border-emerald-500 transition-all">
                  <div className="relative aspect-square bg-neutral-200 overflow-hidden">
                    <img referrerPolicy="no-referrer" src={ph.img} alt={ph.t} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-emerald-700/90 text-white text-[8px] font-mono">DOKUMENTASI</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <h5 className="font-bold text-[11px] text-neutral-800 truncate">{ph.t}</h5>
                    <p className="text-[9px] text-neutral-400">{ph.d}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );

    case 9: // Absensi
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-700" />
                Absensi Digital Tim Dapur SPPG
              </h2>
              <p className="text-xs text-neutral-500">Pencatatan kehadiran juru masak, tim porsi, driver, dan bagian cuci hari ini.</p>
            </div>
            <button
              onClick={() => triggerSuccessMsg("Anda berhasil melakukan Absensi Masuk (Check-In)!")}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-transform active:scale-95 animate-pulse"
            >
              Ketuk Masuk (Check-In)
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Chef Ahmad', role: 'Head Chef', time: '04:20 AM', status: 'Hadir' },
              { name: 'Suwandi', role: 'Koordinator Stocking', time: '04:30 AM', status: 'Hadir' },
              { name: 'Ustadzah Fatimah', role: 'Ahli Gizi', time: '06:00 AM', status: 'Hadir' },
              { name: 'Soleh', role: 'Koordinator Driver', time: '07:12 AM', status: 'Hadir' },
              { name: 'Maman', role: 'Tim Cuci', time: '07:15 AM', status: 'Hadir' },
              { name: 'Karno', role: 'Tim Kebersihan', time: '-', status: 'Izin Sakit' }
            ].map((abs, idx) => (
              <div key={idx} className="p-4 border border-neutral-100 bg-neutral-50/50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-neutral-900">{abs.name}</h4>
                  <p className="text-[10px] text-neutral-400">{abs.role}</p>
                  <p className="text-neutral-500 text-[10px] mt-1 font-mono">Masuk: {abs.time}</p>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold ${
                    abs.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {abs.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 10: // Menu Harian Gizi Ponpes
      const [localSchedDate, setLocalSchedDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2); // default to Day H+2
        return d.toISOString().split('T')[0];
      });
      const [localSchedItems, setLocalSchedItems] = useState<string[]>([]);
      const [localItemInput, setLocalItemInput] = useState('');
      const [isSavingSched, setIsSavingSched] = useState(false);

      const handleAddLocalItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!localItemInput.trim()) return;
        setLocalSchedItems([...localSchedItems, localItemInput.trim()]);
        setLocalItemInput('');
      };

      const handlePresetLocalSched = (presetItems: string[]) => {
        setLocalSchedItems([...presetItems]);
      };

      const handleLocalSubmitSchedule = () => {
        if (!localSchedDate) {
          alert('Silakan pilih tanggal terlebih dahulu!');
          return;
        }
        if (localSchedItems.length === 0) {
          alert('Masukkan minimal 1 hidangan makanan gizi untuk dijadwalkan!');
          return;
        }
        if (!onSaveMenu || !onGenerateSOPs) {
          alert('Fasilitas penyimpanan data sandboxed!');
          return;
        }

        setIsSavingSched(true);
        setTimeout(() => {
          onSaveMenu(localSchedDate, localSchedItems);
          onGenerateSOPs(localSchedDate, localSchedItems);
          setIsSavingSched(false);
          triggerSuccessMsg(`Jadwal Menu & SOP baru untuk tanggal ${localSchedDate} berhasil diterbitkan & diunggah ke database!`);
          setLocalSchedItems([]);
        }, 1000);
      };

      const getIndoDayName = (dateStr: string) => {
        try {
          const parts = dateStr.split('-');
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
          return `${days[date.getDay()]}, ${parts[2]} ${months[date.getMonth()]}`;
        } catch (e) {
          return dateStr;
        }
      };

      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-emerald-700" />
                Menu Harian Gizi Ponpes SPPG (Data Real-Time Cloud)
              </h2>
              <p className="text-xs text-neutral-500">Jadwal menu gizi santri yang disinkronkan langsung dengan sops dan database Supabase.</p>
            </div>
            
            <span className="bg-emerald-50 text-[10px] text-emerald-800 uppercase tracking-widest font-extrabold px-3 py-1 rounded font-mono">
              ROLE: {currentUserRole}
            </span>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          {/* scheduler form for admins */}
          {currentUserRole === UserRole.ADMIN && (
            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/50 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider font-mono text-emerald-900">
                  📅 Tambah & Jadwalkan Menu Hari Selanjutnya (Tanggal Esok+)
                </h3>
                <span className="text-[9px] bg-neutral-200 text-neutral-600 font-bold px-1.5 py-0.5 rounded">ADMIN PANEL</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                {/* select date & presets */}
                <div className="md:col-span-5 space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Pilih Tanggal Selanjutnya</label>
                    <input 
                      type="date"
                      value={localSchedDate}
                      onChange={e => setLocalSchedDate(e.target.value)}
                      className="w-full bg-white border border-neutral-200 p-2 rounded-lg font-mono font-bold text-neutral-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Pilih Paket Templat:</span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_SUGGESTIONS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePresetLocalSched(preset.items)}
                          className="bg-white hover:bg-emerald-800 hover:text-white border border-neutral-200 text-[10px] py-1 px-2.5 rounded transition-all truncate"
                        >
                          {preset.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* list editor */}
                <div className="md:col-span-7 space-y-3 border-l border-neutral-200/50 pl-0 md:pl-5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Draf Items Makanan</label>
                    <form onSubmit={handleAddLocalItem} className="flex gap-2">
                      <input 
                        type="text"
                        value={localItemInput}
                        onChange={e => setLocalItemInput(e.target.value)}
                        placeholder="Contoh: Tempe Goreng Mendoan..."
                        className="flex-1 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-xs"
                      />
                      <button type="submit" className="bg-neutral-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg shrink-0">
                        Tambah
                      </button>
                    </form>
                  </div>

                  {localSchedItems.length === 0 ? (
                    <div className="p-6 border border-dashed border-neutral-200 rounded-xl bg-white text-center text-neutral-400 text-[11px]">
                      Belum ada draf. Ketuk templat paket menu di sebelah kiri atau ketik hidangan mandiri.
                    </div>
                  ) : (
                    <div className="bg-white border rounded-xl overflow-hidden divide-y divide-neutral-100 max-h-[120px] overflow-y-auto">
                      {localSchedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 text-neutral-700 text-xs">
                          <span className="font-semibold flex items-center gap-1.5 text-neutral-800">
                            <span className="w-4 h-4 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-[9px] text-neutral-500">{idx+1}</span>
                            {item}
                          </span>
                          <button
                            type="button"
                            onClick={() => setLocalSchedItems(localSchedItems.filter((_, i) => i !== idx))}
                            className="text-neutral-400 hover:text-red-500 font-bold px-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-right pt-2 border-t border-neutral-200/30">
                    <button
                      type="button"
                      onClick={handleLocalSubmitSchedule}
                      className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 font-bold font-mono text-white text-[10.5px] px-4 py-2 rounded-lg inline-flex items-center gap-1.5 tracking-wider transition-all"
                    >
                      {isSavingSched ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      PUBLIKASIKAN JADWAL MENU ({localSchedDate})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* grid listing of our real menus */}
          <div className="space-y-3">
            <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider font-mono">
              📚 DAFTAR JADWAL MENU SAAT INI DI DATABASE ({allDayMenus.length} Hari Terbit)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {[...allDayMenus]
                .sort((a,b) => a.date.localeCompare(b.date))
                .map((mn, idx) => (
                <div 
                  key={mn.date} 
                  className={`border p-4 rounded-xl shadow-xs flex flex-col justify-between bg-white border-neutral-200 hover:border-emerald-600 hover:shadow-xs transition-all relative`}
                >
                  {/* Delete Button for Admin */}
                  {currentUserRole === UserRole.ADMIN && onDeleteMenu && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMenu(mn.date);
                      }}
                      className="absolute top-2.5 right-2.5 p-1 text-neutral-300 hover:text-red-600 rounded bg-neutral-50 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all text-[11px]"
                      title="Hapus menu gizi ini"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}

                  <div>
                    <span className="font-bold text-xs text-neutral-900 block mb-2 font-display pr-5">
                      {getIndoDayName(mn.date)}
                    </span>
                    <ul className="space-y-1 text-xs text-neutral-600">
                      {mn.menuList.map((food, i) => (
                        <li key={i} className="flex items-center gap-1.5 truncate">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="truncate text-[11.5px]">{food}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono">
                      620 Kcal
                    </span>
                    <button 
                      onClick={() => {
                        onSetMenu(mn.date, mn.menuList);
                        triggerSuccessMsg(`SOP untuk tanggal ${mn.date} diaktifkan dengan menu: ${mn.menuList.join(', ')}!`);
                      }}
                      className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-0.5 hover:underline"
                      title="Aktifkan menu dan tampilkan SOP harian"
                    >
                      Gunakan SOP <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 11: // Form Pemesanan
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
              <FileText className="h-6 w-6 text-emerald-700" />
              Formulir Pemesanan Makanan Kegiatan Khusus Ponpes
            </h2>
            <p className="text-xs text-neutral-500">Pemesanan khusus untuk wali santri, rapat asatidzah, wisuda pondok pesantren, dan event tumpengan.</p>
          </div>

          <form onSubmit={e => {
            e.preventDefault();
            triggerSuccessMsg("Pemesanan catering khusus berhasil direkam. Masuk antrean dapur asatidz!");
            setFormData({});
          }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Nama Pemesan / Lembaga</label>
              <input type="text" required placeholder="Contoh: Panitia Isro' Mi'raj Ponpes" className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Tanggal Kebutuhan</label>
              <input type="date" required className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Jumlah Porsi (Packs / Tampah)</label>
              <input type="text" required placeholder="Contoh: 120 Packs Box" className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Jenis Hidangan / Catatan Alergi</label>
              <textarea rows={3} placeholder="Contoh: Nasi kuning tumpeng komplit, lauk ayam ingkung bakar tanpa kolesterol." className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" />
            </div>
            <div className="md:col-span-3 text-right">
              <button type="submit" className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-transform active:scale-98">
                Submit Pemesanan Catering
              </button>
            </div>
          </form>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}
        </div>
      );

    case 12: // Stock Opname
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6 text-emerald-700" />
                Stock Opname & Verifikasi Gudang Kering
              </h2>
              <p className="text-xs text-neutral-500">Pencatatan mingguan ketersediaan sembako utama pondok pesantren.</p>
            </div>
            <button
              onClick={() => triggerSuccessMsg("Fungsi ekspor data excel stock opname berhasil dijalankan!")}
              className="border border-emerald-700 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              Ekspor Catatan (Excel)
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          <div className="space-y-3">
            {[
              { item: 'Beras Premium Cianjur', sys: '25 Zak', act: '25 Zak', diff: '0', status: 'Sesuai' },
              { item: 'Minyak Goreng Sunco 2L', sys: '42 Pouch', act: '40 Pouch', diff: '-2 (Bocor)', status: 'Selisih' },
              { item: 'Gula Pasir Gulaku 1Kg', sys: '50 Pcs', act: '50 Pcs', diff: '0', status: 'Sesuai' },
              { item: 'Kecap Manis ABC Jerigen 5L', sys: '12 Unit', act: '12 Unit', diff: '0', status: 'Sesuai' },
              { item: 'Garam Dapur Beriodium', sys: '100 Pcs', act: '105 Pcs', diff: '+5 (Saku Bonus)', status: 'Sesuai' }
            ].map((st, idx) => (
              <div key={idx} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-neutral-900">{st.item}</h4>
                  <p className="text-neutral-400 text-[10px]">Pencatatan System: {st.sys}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Fisik Riil</span>
                    <span className="font-semibold text-neutral-800">{st.act}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Selisih</span>
                    <span className={`font-semibold ${st.diff === '0' ? 'text-neutral-500' : 'text-red-600'}`}>{st.diff}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-extrabold ${
                      st.status === 'Sesuai' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>{st.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 13: // Request Bahan dan Alat
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-emerald-700" />
              Permintaan (Request) Bahan Spesifik atau Alat Tambahan
            </h2>
            <p className="text-xs text-neutral-500">Ajukan bahan diluar menu terjadwal (misal bumbu tambahan, santan mendadak, dsb.).</p>
          </div>

          <form onSubmit={e => {
            e.preventDefault();
            triggerSuccessMsg("Permintaan bahan mendesak berhasil diteruskan ke tim gudang logistik!");
            setFormData({});
          }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Nama Bahan/Alat Tambahan</label>
                <input type="text" required placeholder="Contoh: Kemiri Kupas 3Kg" className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Sifat Urgensi</label>
                <select className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50">
                  <option>Biasa (Dipersiapkan esok)</option>
                  <option>Segera (Butuh siang ini)</option>
                  <option>Sangat Mendesak (Butuh dalam 1 jam)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Catatan Keperluan Lapangan</label>
              <textarea rows={2} placeholder="Sebutkan kenapa bahan ini dibutuhkan mendadak..." className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" />
            </div>
            <button type="submit" className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2 px-5 rounded-lg text-xs">
              Kirim Request Bahan
            </button>
          </form>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}
        </div>
      );

    case 14: // Keluhan
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-red-600 animate-pulse" />
                  Log Keluhan & Masukan Hidangan Asrama
                </h2>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {isSupabaseConfigured ? '🟢 Cloud Sync Aktif' : '🟡 Mode Lokal (Tanpa Cloud)'}
                </span>
                {isAdmin && (
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-200 animate-pulse">
                    🔑 Akun Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Katalog keluhan dari Ustadz Pembimbing, asrama, aslap, atau relawan untuk corrective action SOP Dapur.</p>
            </div>

            {isAdmin && (
              <button 
                onClick={() => setShowSqlPanel(!showSqlPanel)}
                className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Code className="h-4 w-4" /> {showSqlPanel ? 'Sembunyikan SQL' : 'Lihat Skema SQL'}
              </button>
            )}
          </div>

          {/* Admin SQL Console Section */}
          {isAdmin && showSqlPanel && (
            <div className="border border-neutral-200 rounded-xl bg-neutral-900 text-neutral-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-neutral-200">SQL DDL Schema & Query Analysis (Supabase)</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Clipboard className="h-3 w-3" />
                  {copiedSql ? 'Disalin!' : 'Salin Query'}
                </button>
              </div>
              <pre className="text-[10px] font-mono whitespace-pre-wrap bg-neutral-950 p-3 rounded-lg max-h-48 overflow-y-auto text-emerald-400 border border-neutral-800">
                {postgres_sql_scripts}
              </pre>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Input Keluhan */}
            <div className="lg:col-span-1">
              <form onSubmit={handleCreateComplaint} className="p-4 border border-rose-100 bg-rose-50/10 rounded-xl space-y-4">
                <h4 className="font-bold text-xs text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Catat Keluhan Baru
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Sumber Keluhan</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.source || ''}
                      onChange={e => setFormData({ ...formData, source: e.target.value })}
                      placeholder="Contoh: Ustadz Jauhari (Asrama Putra C)" 
                      className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs outline-hidden focus:ring-1 focus:ring-rose-300" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Kategori Masalah</label>
                    <select 
                      value={formData.category || 'Kebersihan Hidangan'}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs outline-hidden focus:ring-1 focus:ring-rose-300"
                    >
                      <option value="Kebersihan Hidangan">Kebersihan Hidangan (Asing/Serangga)</option>
                      <option value="Keterlambatan Distribusi">Keterlambatan Distribusi (Sarapan/Sore)</option>
                      <option value="Rasa / Suhu Makanan">Rasa / Suhu Makanan (Hambar/Dingin/Asin)</option>
                      <option value="Kekurangan Porsi Jumlah">Kekurangan Porsi Jumlah (Kurang Box/Ompreng)</option>
                      <option value="Lainnya">Lainnya (Komplain Non-Spesifik)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Isi Keluhan</label>
                    <textarea 
                      rows={3} 
                      required 
                      value={formData.complaintText || ''}
                      onChange={e => setFormData({ ...formData, complaintText: e.target.value })}
                      placeholder="Uraikan laporan masalah asrama secara lengkap..." 
                      className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-white shadow-2xs outline-hidden focus:ring-1 focus:ring-rose-300" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="bg-red-750 hover:bg-neutral-900 border border-transparent text-white font-bold px-4 py-2.5 rounded-lg text-xs w-full transition-colors uppercase tracking-wider"
                  >
                    Kirim Log Keluhan
                  </button>
                </div>
              </form>
            </div>

            {/* List Keluhan dan Solusi / Tindakan Perbaikan */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h3 className="font-bold text-xs text-neutral-700 uppercase tracking-widest flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-rose-800" />
                  Daftar Investigasi Keluhan Asrama
                </h3>
                <span className="text-[10px] bg-red-100 text-red-800 font-mono px-2 py-0.5 rounded-full font-black">
                  Keluhan Pasif: {keluhanList.length}
                </span>
              </div>

              {keluhanList.length === 0 ? (
                <div className="bg-neutral-50/50 border border-neutral-100 border-dashed rounded-xl p-8 text-center text-xs text-neutral-400 font-medium">
                  {isLoadingData ? 'Sedang memuat data dari database...' : 'Tidak ada catatan keluhan saat ini.'}
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {keluhanList.map((item, idx) => (
                    <div key={item.id || idx} className="p-4 border border-rose-100 bg-white rounded-xl space-y-3 relative hover:bg-neutral-50/20 transition-all shadow-2xs">
                      
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-neutral-900 text-xs sm:text-sm bg-neutral-100/80 px-2 py-1 rounded-sm border border-neutral-200">
                              🏠 {item.source}
                            </span>
                            <span className="text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-150 px-2 py-0.5 rounded-full uppercase">
                              {item.category}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-400 mt-1">
                            Pelapor: <span className="font-mono">{item.created_by || 'wali@sppg.com'}</span>
                            {item.created_at && ` • Tanggal: ${new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}`}
                          </p>
                        </div>

                        {/* Status label */}
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded border ${
                          item.status === 'selesai' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200 animate-pulse'
                        }`}>
                          {item.status === 'selesai' ? '✓ Terselesaikan' : '⌛ Sedang Diperiksa'}
                        </span>
                      </div>

                      <div className="text-xs bg-neutral-50/60 p-2.5 rounded-lg text-neutral-700 leading-relaxed font-serif">
                        <strong className="text-neutral-400 font-sans text-[10px] block uppercase mb-0.5 select-none font-bold">Laporan Masalah:</strong>
                        "{item.complaint_text}"
                      </div>

                      {/* Corrective Action Display or Form update */}
                      {item.status === 'selesai' ? (
                        <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg text-xs text-emerald-950 font-sans">
                          <strong className="text-emerald-800 font-sans text-[10px] block uppercase mb-1 font-extrabold">🚀 Corrective Action (Tindakan Nyata):</strong>
                          {item.action_taken}
                        </div>
                      ) : (
                        <div className="bg-red-50/40 border border-red-100 p-2.5 rounded-lg text-xs text-neutral-600 font-sans space-y-2">
                          <strong className="text-red-800 text-[10px] block uppercase font-extrabold">🚨 Tindakan Investigasi Belum Dirilis:</strong>
                          
                          {/* If admin is logged-in, they see form input */}
                          {isAdmin ? (
                            <div className="flex gap-2 items-center mt-1">
                              <input 
                                type="text"
                                value={adminComplaintAction[item.id] || ''}
                                onChange={e => setAdminComplaintAction({ ...adminComplaintAction, [item.id]: e.target.value })}
                                placeholder="Tulis instruksi perbaikan kuah / ganti porsi dsb..."
                                className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 flex-1 bg-white focus:outline-rose-300"
                              />
                              <button
                                onClick={() => handleResolveComplaint(item.id)}
                                className="bg-rose-750 hover:bg-neutral-950 text-white font-extrabold text-[10px] uppercase px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Selesaikan Keluhan
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">
                              Menanti tindakan perbaikan dan evaluasi dari Administrator (Ustadz Munif).
                            </span>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      );

    default:
      return (
        <div className="p-8 text-center text-neutral-400">
          Sub-fitur dalam pengerjaan. Silakan pilih menu SOP di sidebar.
        </div>
      );
  }
}
