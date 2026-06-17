import React, { useState, useEffect } from 'react';
import { 
  Package, Wrench, ShieldCheck, ShoppingCart, Truck, Calendar, Sparkles,
  Camera, Users, FileText, CheckCircle, Search, AlertCircle, Plus, ClipboardCheck, ArrowRight,
  Trash2, Loader2, RefreshCw, Check, X, Code, Clipboard, ShieldAlert, CheckCircle2, Info,
  Save, Archive
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
  selectedDate?: string;
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
  loggedInUser,
  selectedDate
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

  // Stock Opname & Trash Items Type Definitions
  interface StockItem {
    id: string;
    category: string;
    name: string;
    stokAwal: number;
    barangMasuk: number;
    stokAkhir: number;
    uom: string;
  }

  interface TrashItem {
    id: string;
    tanggal: string;
    hari: string;
    namaMenu: string;
    porsiBesar: number;
    porsiKecil: number;
    gramasiMP: number;
    gramasiLN: number;
    gramasiLH: number;
    gramasiSY: number;
    gramasiBuah: number;
    sampahMP: number;
    sampahLN: number;
    sampahLH: number;
    sampahSY: number;
    sampahBuah: number;
    sampahOrganik: number;
    sampahAnorganik: number;
  }

  // Stock Opname States
  const STOCK_CATEGORIES = [
    'Bumbu', 'Saus', 'Pertepungan', 'Makanan Pokok', 'Susu', 'Minyak', 
    'Air', 'Plastik', 'Chiller', 'Frezer', 'Lauk', 'Buah', 'Sayur', 'Lain-Lain'
  ];

  const defaultStockTemplate: StockItem[] = [
    { id: 'st-1', category: 'Bumbu', name: 'Kunyit bubuk Desaku', stokAwal: 10, barangMasuk: 5, stokAkhir: 15, uom: 'Sachet' },
    { id: 'st-2', category: 'Bumbu', name: 'Gula Pasir Rose Brand', stokAwal: 50, barangMasuk: 10, stokAkhir: 60, uom: 'Kg' },
    { id: 'st-3', category: 'Bumbu', name: 'Gula Merah Saringan', stokAwal: 2.2, barangMasuk: 0, stokAkhir: 2.2, uom: 'Kg' },
    { id: 'st-4', category: 'Bumbu', name: 'Garam Beriodium Garamku', stokAwal: 30, barangMasuk: 10, stokAkhir: 40, uom: 'Pack' },
    { id: 'st-5', category: 'Saus', name: 'Kecap Manis ABC', stokAwal: 5, barangMasuk: 2, stokAkhir: 7, uom: 'Jerigen 5L' },
    { id: 'st-6', category: 'Saus', name: 'Saus Sambal Asli ABC', stokAwal: 4, barangMasuk: 1, stokAkhir: 5, uom: 'Jerigen 5L' },
    { id: 'st-7', category: 'Pertepungan', name: 'Tepung Terigu Segitiga Biru', stokAwal: 25, barangMasuk: 25, stokAkhir: 50, uom: 'Kg' },
    { id: 'st-8', category: 'Pertepungan', name: 'Tepung Maizena Kunci', stokAwal: 6, barangMasuk: 2, stokAkhir: 8, uom: 'Dus' },
    { id: 'st-9', category: 'Makanan Pokok', name: 'Beras Premium Cianjur', stokAwal: 15, barangMasuk: 15, stokAkhir: 30, uom: 'Zak' },
    { id: 'st-10', category: 'Makanan Pokok', name: 'Mie Kering Telur Enak', stokAwal: 5, barangMasuk: 5, stokAkhir: 10, uom: 'Dus' },
    { id: 'st-11', category: 'Susu', name: 'SKM Carnation Original', stokAwal: 20, barangMasuk: 24, stokAkhir: 44, uom: 'Kaleng' },
    { id: 'st-12', category: 'Minyak', name: 'Minyak Goreng Bimoli Klasik', stokAwal: 12, barangMasuk: 12, stokAkhir: 24, uom: 'Pouch 2L' },
    { id: 'st-13', category: 'Air', name: 'Air Mineral Club Tanggung', stokAwal: 10, barangMasuk: 20, stokAkhir: 30, uom: 'Karton' },
    { id: 'st-14', category: 'Plastik', name: 'Kantong Plastik Kresek Putih 15', stokAwal: 8, barangMasuk: 4, stokAkhir: 12, uom: 'Pack' },
    { id: 'st-15', category: 'Plastik', name: 'Plastic Wrap Hygiene Roll', stokAwal: 3, barangMasuk: 1, stokAkhir: 4, uom: 'Roll' },
    { id: 'st-16', category: 'Chiller', name: 'Bawang Merah Kupas Segar', stokAwal: 5, barangMasuk: 5, stokAkhir: 10, uom: 'Kg' },
    { id: 'st-17', category: 'Chiller', name: 'Bawang Putih Kupas Segar', stokAwal: 4, barangMasuk: 4, stokAkhir: 8, uom: 'Kg' },
    { id: 'st-18', category: 'Frezer', name: 'Daging Sapi Giling Porsi', stokAwal: 10, barangMasuk: 10, stokAkhir: 20, uom: 'Kg' },
    { id: 'st-19', category: 'Frezer', name: 'Fillet Dada Ayam Segar', stokAwal: 15, barangMasuk: 15, stokAkhir: 30, uom: 'Kg' },
    { id: 'st-20', category: 'Lauk', name: 'Telur Ayam Broiler', stokAwal: 3, barangMasuk: 5, stokAkhir: 8, uom: 'Peti' },
    { id: 'st-21', category: 'Lauk', name: 'Tempe Papan Bungkus Daun', stokAwal: 20, barangMasuk: 30, stokAkhir: 50, uom: 'Pcs' },
    { id: 'st-22', category: 'Buah', name: 'Semangka Merah Tanpa Biji', stokAwal: 15, barangMasuk: 15, stokAkhir: 30, uom: 'Kg' },
    { id: 'st-23', category: 'Buah', name: 'Melon Orange Manis', stokAwal: 10, barangMasuk: 10, stokAkhir: 20, uom: 'Kg' },
    { id: 'st-24', category: 'Sayur', name: 'Wortel Lokal Bersepat', stokAwal: 12, barangMasuk: 8, stokAkhir: 20, uom: 'Kg' },
    { id: 'st-25', category: 'Sayur', name: 'Kubis/Kol Putih Bulat', stokAwal: 10, barangMasuk: 10, stokAkhir: 20, uom: 'Kg' },
    { id: 'st-26', category: 'Lain-Lain', name: 'Sabun Cuci Piring Mama Lemon', stokAwal: 5, barangMasuk: 5, stokAkhir: 10, uom: 'Pouch' }
  ];

  const [selectedStockDate, setSelectedStockDate] = useState<string>(selectedDate || '2026-06-16');

  // Synchronize dynamic date changes from central calendar
  useEffect(() => {
    if (selectedDate) {
      setSelectedStockDate(selectedDate);
    }
  }, [selectedDate]);

  const [stockMap, setStockMap] = useState<Record<string, StockItem[]>>(() => {
    const raw = localStorage.getItem('sppg_stock_opname_by_date_v4');
    if (raw) return JSON.parse(raw);

    const s16 = defaultStockTemplate.map(item => {
      if (item.name === 'Beras Premium Cianjur') return { ...item, stokAwal: 20, barangMasuk: 10, stokAkhir: 30 };
      if (item.name === 'Tempe Papan Bungkus Daun') return { ...item, stokAwal: 10, barangMasuk: 40, stokAkhir: 50 };
      return item;
    });

    const s17 = defaultStockTemplate.map(item => {
      if (item.name === 'Beras Premium Cianjur') return { ...item, stokAwal: 30, barangMasuk: 0, stokAkhir: 30 };
      if (item.name === 'Tempe Papan Bungkus Daun') return { ...item, stokAwal: 50, barangMasuk: 0, stokAkhir: 50 };
      return item;
    });

    return {
      '2026-06-16': s16,
      '2026-06-17': s17,
    };
  });

  // Current active date's stock items
  const activeStockList = stockMap[selectedStockDate] && stockMap[selectedStockDate].length > 0
    ? stockMap[selectedStockDate]
    : defaultStockTemplate;

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Semua');
  const [newStockName, setNewStockName] = useState('');
  const [newStockCat, setNewStockCat] = useState('Bumbu');
  const [newStockStokAwal, setNewStockStokAwal] = useState('0');
  const [newStockBarangMasuk, setNewStockBarangMasuk] = useState('0');
  const [newStockStokAkhir, setNewStockStokAkhir] = useState('0');
  const [newStockUom, setNewStockUom] = useState('Kg');
  const [isAddingStockItem, setIsAddingStockItem] = useState(false);

  // Waste (Rekap Sampah) States & Views
  const [wasteViewMode, setWasteViewMode] = useState<'card' | 'table'>('card');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    const raw = localStorage.getItem('sppg_rekap_sampah_v3');
    if (raw) return JSON.parse(raw);
    return [
      {
        id: 'ts-1',
        tanggal: '2026-06-16',
        hari: 'Selasa',
        namaMenu: 'Tumpeng Kuning, Sambal Goreng Kentang, Ayam Suwir',
        porsiBesar: 250,
        porsiKecil: 150,
        gramasiMP: 50000,
        gramasiLN: 12000,
        gramasiLH: 35000,
        gramasiSY: 18000,
        gramasiBuah: 28000,
        sampahMP: 1200,
        sampahLN: 300,
        sampahLH: 700,
        sampahSY: 900,
        sampahBuah: 1100,
        sampahOrganik: 8.5,
        sampahAnorganik: 1.8
      },
      {
        id: 'ts-2',
        tanggal: '2026-06-15',
        hari: 'Senin',
        namaMenu: 'Nasi Gurih Semur Telur, Tahu Bacem & Sop Sayur',
        porsiBesar: 240,
        porsiKecil: 160,
        gramasiMP: 48000,
        gramasiLN: 15000,
        gramasiLH: 30000,
        gramasiSY: 25000,
        gramasiBuah: 32000,
        sampahMP: 5400,
        sampahLN: 1800,
        sampahLH: 3600,
        sampahSY: 4200,
        sampahBuah: 2200,
        sampahOrganik: 15.6,
        sampahAnorganik: 2.1
      }
    ];
  });

  const [newTrashDate, setNewTrashDate] = useState('');
  const [newTrashHari, setNewTrashHari] = useState('Senin');
  const [newTrashMenu, setNewTrashMenu] = useState('');
  const [newTrashPorsiBesar, setNewTrashPorsiBesar] = useState(0);
  const [newTrashPorsiKecil, setNewTrashPorsiKecil] = useState(0);
  const [newTrashGramasiMP, setNewTrashGramasiMP] = useState(0);
  const [newTrashGramasiLN, setNewTrashGramasiLN] = useState(0);
  const [newTrashGramasiLH, setNewTrashGramasiLH] = useState(0);
  const [newTrashGramasiSY, setNewTrashGramasiSY] = useState(0);
  const [newTrashGramasiBuah, setNewTrashGramasiBuah] = useState(0);
  const [newTrashSampahMP, setNewTrashSampahMP] = useState(0);
  const [newTrashSampahLN, setNewTrashSampahLN] = useState(0);
  const [newTrashSampahLH, setNewTrashSampahLH] = useState(0);
  const [newTrashSampahSY, setNewTrashSampahSY] = useState(0);
  const [newTrashSampahBuah, setNewTrashSampahBuah] = useState(0);
  const [newTrashSisaOrganik, setNewTrashSisaOrganik] = useState(0);
  const [newTrashSisaAnorganik, setNewTrashSisaAnorganik] = useState(0);
  const [isAddingTrash, setIsAddingTrash] = useState(false);

  // States for case 10 (Menu Harian Gizi Ponpes) declared at top-level to satisfy Rules of Hooks:
  const [localSchedDate, setLocalSchedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // default to Day H+2
    return d.toISOString().split('T')[0];
  });
  const [localSchedItems, setLocalSchedItems] = useState<string[]>([]);
  const [localItemInput, setLocalItemInput] = useState('');
  const [isSavingSched, setIsSavingSched] = useState(false);

  // --- STATES FOR STOK OPERASIONAL ---
  const defaultOperasionalTemplate: StockItem[] = [
    { id: 'op-1', category: 'Kebersihan', name: 'Sabun Cuci Piring Mama Lemon', stokAwal: 3, barangMasuk: 2, stokAkhir: 5, uom: 'Jerigen' },
    { id: 'op-2', category: 'ATK', name: 'Buku Catatan Laporan Harian', stokAwal: 2, barangMasuk: 5, stokAkhir: 7, uom: 'Pcs' },
    { id: 'op-3', category: 'ATK', name: 'Bulpen Standard Hitam', stokAwal: 10, barangMasuk: 12, stokAkhir: 22, uom: 'Box' },
    { id: 'op-4', category: 'Air', name: 'Galon Air Minum Isi Ulang', stokAwal: 5, barangMasuk: 10, stokAkhir: 15, uom: 'Galon' },
    { id: 'op-5', category: 'APD', name: 'Masker Sensi Earloop 3-ply', stokAwal: 2, barangMasuk: 3, stokAkhir: 5, uom: 'Box' },
    { id: 'op-6', category: 'APD', name: 'Sarung Tangan Plastik Higienis', stokAwal: 4, barangMasuk: 4, stokAkhir: 8, uom: 'Box' }
  ];

  const [selectedOperasionalDate, setSelectedOperasionalDate] = useState<string>(selectedDate || '2026-06-16');

  // Sync date change
  useEffect(() => {
    if (selectedDate) {
      setSelectedOperasionalDate(selectedDate);
    }
  }, [selectedDate]);

  const [operasionalMap, setOperasionalMap] = useState<Record<string, StockItem[]>>(() => {
    const raw = localStorage.getItem('sppg_stok_operasional_by_date_v1');
    if (raw) return JSON.parse(raw);

    const s16 = defaultOperasionalTemplate.map(item => {
      if (item.name === 'Sabun Cuci Piring Mama Lemon') return { ...item, stokAwal: 3, barangMasuk: 2, stokAkhir: 5 };
      return item;
    });

    const s17 = defaultOperasionalTemplate.map(item => {
      if (item.name === 'Sabun Cuci Piring Mama Lemon') return { ...item, stokAwal: 5, barangMasuk: 0, stokAkhir: 5 };
      return item;
    });

    return {
      '2026-06-16': s16,
      '2026-06-17': s17,
    };
  });

  useEffect(() => {
    localStorage.setItem('sppg_stok_operasional_by_date_v1', JSON.stringify(operasionalMap));
  }, [operasionalMap]);

  const [selectedOperasionalCategoryFilter, setSelectedOperasionalCategoryFilter] = useState('Semua');
  const [operasionalSearchTerm, setOperasionalSearchTerm] = useState('');
  const [newOperasionalName, setNewOperasionalName] = useState('');
  const [newOperasionalCat, setNewOperasionalCat] = useState('ATK');
  const [newOperasionalStokAwal, setNewOperasionalStokAwal] = useState('0');
  const [newOperasionalBarangMasuk, setNewOperasionalBarangMasuk] = useState('0');
  const [newOperasionalStokAkhir, setNewOperasionalStokAkhir] = useState('0');
  const [newOperasionalUom, setNewOperasionalUom] = useState('Pcs');
  const [isAddingOperasionalItem, setIsAddingOperasionalItem] = useState(false);

  useEffect(() => {
    localStorage.setItem('sppg_stock_opname_by_date_v4', JSON.stringify(stockMap));
  }, [stockMap]);

  useEffect(() => {
    localStorage.setItem('sppg_rekap_sampah_v3', JSON.stringify(trashItems));
  }, [trashItems]);

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

    case 12: // Stock Opname revamping
      const filteredStockItems = activeStockList.filter(item => {
        const matchesCategory = selectedCategoryFilter === 'Semua' || item.category === selectedCategoryFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      const handleUpdateStockItem = (id: string, field: 'stokAwal' | 'barangMasuk' | 'stokAkhir' | 'uom', value: any) => {
        setStockMap(prev => {
          const currentList = prev[selectedStockDate] && prev[selectedStockDate].length > 0
            ? prev[selectedStockDate]
            : JSON.parse(JSON.stringify(defaultStockTemplate));
          
          const updatedList = currentList.map((item: StockItem) => {
            if (item.id === id) {
              const numVal = (field === 'stokAwal' || field === 'barangMasuk' || field === 'stokAkhir') ? (parseFloat(value) || 0) : value;
              return { ...item, [field]: numVal };
            }
            return item;
          });
          
          return { ...prev, [selectedStockDate]: updatedList };
        });
      };

      const handleCreateStockItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStockName.trim()) return;
        const newItem: StockItem = {
          id: 'st-' + Date.now(),
          category: newStockCat,
          name: newStockName,
          stokAwal: parseFloat(newStockStokAwal) || 0,
          barangMasuk: parseFloat(newStockBarangMasuk) || 0,
          stokAkhir: parseFloat(newStockStokAkhir) || 0,
          uom: newStockUom
        };

        setStockMap(prev => {
          const currentList = prev[selectedStockDate] && prev[selectedStockDate].length > 0
            ? prev[selectedStockDate]
            : JSON.parse(JSON.stringify(defaultStockTemplate));
          
          return { ...prev, [selectedStockDate]: [...currentList, newItem] };
        });

        setNewStockName('');
        setNewStockStokAwal('0');
        setNewStockBarangMasuk('0');
        setNewStockStokAkhir('0');
        setNewStockUom('Kg');
        setIsAddingStockItem(false);
        triggerSuccessMsg(`Bahan "${newItem.name}" berhasil ditambahkan ke kategori ${newItem.category} pada tanggal ${selectedStockDate}!`);
      };

      const handleRemoveStockItem = (id: string, name?: string) => {
        const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus bahan "${name || 'ini'}" dari Stock Opname tanggal ${selectedStockDate}?`);
        if (confirmed) {
          setStockMap(prev => {
            const currentList = prev[selectedStockDate] && prev[selectedStockDate].length > 0
              ? prev[selectedStockDate]
              : JSON.parse(JSON.stringify(defaultStockTemplate));
            const updatedList = currentList.filter((item: StockItem) => item.id !== id);
            return { ...prev, [selectedStockDate]: updatedList };
          });
          triggerSuccessMsg("Bahan berhasil dihapus.");
        }
      };

      const handleSaveAndCarryOverStockItem = (itemToSave: StockItem) => {
        const currentDateObj = new Date(selectedStockDate);
        currentDateObj.setDate(currentDateObj.getDate() + 1);
        const nextDateStr = currentDateObj.toISOString().split('T')[0];

        setStockMap(prev => {
          // ensure current date exists in map or gets templates
          const targetTodayList = prev[selectedStockDate] && prev[selectedStockDate].length > 0
            ? prev[selectedStockDate]
            : JSON.parse(JSON.stringify(defaultStockTemplate));

          const nextDayList = prev[nextDateStr] && prev[nextDateStr].length > 0
            ? JSON.parse(JSON.stringify(prev[nextDateStr]))
            : JSON.parse(JSON.stringify(defaultStockTemplate));

          let matchFound = false;
          const updatedNextDayList = nextDayList.map((nextItem: StockItem) => {
            if (nextItem.id === itemToSave.id || nextItem.name.toLowerCase() === itemToSave.name.toLowerCase()) {
              matchFound = true;
              const newStokAwal = itemToSave.stokAkhir;
              const newStokAkhir = newStokAwal + nextItem.barangMasuk;
              return { 
                ...nextItem, 
                stokAwal: newStokAwal,
                stokAkhir: newStokAkhir
              };
            }
            return nextItem;
          });

          if (!matchFound) {
            updatedNextDayList.push({
              id: itemToSave.id,
              category: itemToSave.category,
              name: itemToSave.name,
              stokAwal: itemToSave.stokAkhir,
              barangMasuk: 0,
              stokAkhir: itemToSave.stokAkhir,
              uom: itemToSave.uom
            });
          }

          return { 
            ...prev, 
            [selectedStockDate]: targetTodayList,
            [nextDateStr]: updatedNextDayList 
          };
        });

        triggerSuccessMsg(`Stok "${itemToSave.name}" berhasil disimpan! Stok Akhir (${itemToSave.stokAkhir} ${itemToSave.uom}) otomatis disalin menjadi Stok Awal untuk esok hari (${nextDateStr}).`);
      };

      const handleSyncAllToNextDay = () => {
        const currentDateObj = new Date(selectedStockDate);
        currentDateObj.setDate(currentDateObj.getDate() + 1);
        const nextDateStr = currentDateObj.toISOString().split('T')[0];

        setStockMap(prev => {
          const todayList = prev[selectedStockDate] && prev[selectedStockDate].length > 0
            ? prev[selectedStockDate]
            : JSON.parse(JSON.stringify(defaultStockTemplate));

          const nextDayList = prev[nextDateStr] && prev[nextDateStr].length > 0
            ? JSON.parse(JSON.stringify(prev[nextDateStr]))
            : JSON.parse(JSON.stringify(defaultStockTemplate));

          const updatedNextDayList = [...nextDayList];

          todayList.forEach((todayItem: StockItem) => {
            const idx = updatedNextDayList.findIndex(nItem => nItem.id === todayItem.id || nItem.name.toLowerCase() === todayItem.name.toLowerCase());
            if (idx !== -1) {
              const nextItem = updatedNextDayList[idx];
              const newStokAwal = todayItem.stokAkhir;
              const newStokAkhir = newStokAwal + nextItem.barangMasuk;
              updatedNextDayList[idx] = {
                ...nextItem,
                stokAwal: newStokAwal,
                stokAkhir: newStokAkhir
              };
            } else {
              updatedNextDayList.push({
                id: todayItem.id,
                category: todayItem.category,
                name: todayItem.name,
                stokAwal: todayItem.stokAkhir,
                barangMasuk: 0,
                stokAkhir: todayItem.stokAkhir,
                uom: todayItem.uom
              });
            }
          });

          return {
            ...prev,
            [nextDateStr]: updatedNextDayList
          };
        });

        triggerSuccessMsg(`Sukses menyimpan seluruh data! Stok Akhir per hari ini otomatis disalin menjadi Stok Awal untuk esok hari tanggal ${nextDateStr}.`);
      };

      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6 text-emerald-700" />
                <h2 className="text-xl font-bold font-sans text-neutral-800">
                  Stock Opname Mandiri Terintegrasi (14 Kategori)
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Kontrol ketersediaan gudang kering, chiller, freezer, bumbu, lauk pauk, dan kebutuhan harian dapur.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSyncAllToNextDay}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Simpan seluruh Stok Akhir hari ini dan salin ke Stok Awal esok hari"
              >
                <Save className="h-4 w-4" /> Simpan & Salin ke Besok
              </button>
              <button
                onClick={() => setIsAddingStockItem(!isAddingStockItem)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4" /> {isAddingStockItem ? 'Batal' : 'Tambah Bahan Baru'}
              </button>
              <button
                onClick={() => triggerSuccessMsg("Seluruh data laporan Stock Opname berhasil diekspor ke format Excel!")}
                className="border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Ekspor Excel
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          {/* Form Create Stock Item */}
          {isAddingStockItem && (
            <form onSubmit={handleCreateStockItem} className="bg-neutral-50 p-4 rounded-xl border border-neutral-250 space-y-4">
              <h3 className="text-xs font-bold font-mono text-emerald-900 uppercase tracking-wider">Formulir Tambah Bahan Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nama Bahan</label>
                  <input
                    type="text"
                    required
                    value={newStockName}
                    onChange={e => setNewStockName(e.target.value)}
                    placeholder="Contoh: Gula Merah Batang"
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Kategori</label>
                  <select
                    value={newStockCat}
                    onChange={e => setNewStockCat(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  >
                    {STOCK_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">UoM (Satuan)</label>
                  <input
                    type="text"
                    required
                    value={newStockUom}
                    onChange={e => setNewStockUom(e.target.value)}
                    placeholder="Contoh: Kg, Sachet, Roll, Pcs"
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={newStockStokAwal}
                    onChange={e => setNewStockStokAwal(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Barang Masuk</label>
                  <input
                    type="number"
                    step="any"
                    value={newStockBarangMasuk}
                    onChange={e => setNewStockBarangMasuk(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Stok Akhir / Riil</label>
                  <input
                    type="number"
                    step="any"
                    value={newStockStokAkhir}
                    onChange={e => setNewStockStokAkhir(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStockItem(false)}
                  className="px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs rounded font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-800 text-white rounded text-xs font-bold"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          )}

          {/* Daily Date Selector for Stock Opname */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-250 uppercase tracking-wider font-mono">
                📅 STOK HARIAN (DAILY STOCK OPNAME)
              </span>
              <p className="text-xs text-neutral-600 font-medium">
                Pembaruan stok diinput dan disimpan spesifik <span className="font-bold text-neutral-800">per hari kalender</span>. Pilih tanggal di bawah:
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedStockDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedStockDate(d.toISOString().split('T')[0]);
                }}
                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-center transition-all"
                title="Hari Sebelumnya"
              >
                ← Kemarin
              </button>
              
              <input
                type="date"
                value={selectedStockDate}
                onChange={e => setSelectedStockDate(e.target.value)}
                className="text-xs font-bold font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white text-neutral-800 focus:ring-emerald-500 shadow-2xs"
              />

              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedStockDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedStockDate(d.toISOString().split('T')[0]);
                }}
                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-center transition-all"
                title="Hari Selanjutnya"
              >
                Esok →
              </button>

              <button
                type="button"
                onClick={() => setSelectedStockDate('2026-06-17')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Table Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
            <div className="w-full sm:w-1/3">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1 select-none">Filter Kategori</label>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="w-full text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white font-medium"
              >
                <option value="Semua">Semua Kategori ({STOCK_CATEGORIES.length})</option>
                {STOCK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-2/3">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1 select-none">Cari Nama Bahan</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Ketik kata kunci bahan..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="overflow-x-auto border border-neutral-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Nama Bahan</th>
                  <th className="py-3 px-4 text-center w-24">Stok Awal</th>
                  <th className="py-3 px-4 text-center w-24">Barang Masuk</th>
                  <th className="py-3 px-4 text-center w-24">Stok Akhir</th>
                  <th className="py-3 px-4 text-center w-24">UoM</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400 font-medium text-xs">
                      Tidak ada data bahan yang sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredStockItems.map(item => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors text-xs">
                      <td className="py-2.5 px-4">
                        <span className="bg-slate-100 text-slate-800 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border border-slate-200/60 font-mono">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-neutral-800">{item.name}</td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.stokAwal}
                          onChange={e => handleUpdateStockItem(item.id, 'stokAwal', e.target.value)}
                          className="w-20 text-center font-mono border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800 shadow-2xs"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.barangMasuk}
                          onChange={e => handleUpdateStockItem(item.id, 'barangMasuk', e.target.value)}
                          className="w-20 text-center font-mono border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800 shadow-2xs"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.stokAkhir}
                          onChange={e => handleUpdateStockItem(item.id, 'stokAkhir', e.target.value)}
                          className="w-20 text-center font-mono border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800 shadow-2xs"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="text"
                          value={item.uom}
                          onChange={e => handleUpdateStockItem(item.id, 'uom', e.target.value)}
                          className="w-20 text-center border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveAndCarryOverStockItem(item)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded border border-emerald-200 transition-all flex items-center justify-center cursor-pointer"
                            title="Simpan & Salin Stok Akhir ke Esok Hari"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStockItem(item.id, item.name)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded border border-rose-200 transition-all flex items-center justify-center cursor-pointer"
                            title="Hapus bahan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-700" />
            <div>
              <p className="font-bold">Informasi Mode Auto-Save</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Nilai angka pada kolom Stok Awal, Barang Masuk, Stok Akhir, dan UoM dapat Anda ubah secara instan dan langsung tersimpan secara otomatis di peramban lokal Anda.
              </p>
            </div>
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

    case 16: // Rekap Sampah Makanan (Waste)
      const handleCreateTrashItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTrashDate || !newTrashMenu.trim()) return;
        const newItem: TrashItem = {
          id: 'ts-' + Date.now(),
          tanggal: newTrashDate,
          hari: newTrashHari,
          namaMenu: newTrashMenu,
          porsiBesar: Number(newTrashPorsiBesar) || 0,
          porsiKecil: Number(newTrashPorsiKecil) || 0,
          gramasiMP: Number(newTrashGramasiMP) || 0,
          gramasiLN: Number(newTrashGramasiLN) || 0,
          gramasiLH: Number(newTrashGramasiLH) || 0,
          gramasiSY: Number(newTrashGramasiSY) || 0,
          gramasiBuah: Number(newTrashGramasiBuah) || 0,
          sampahMP: Number(newTrashSampahMP) || 0,
          sampahLN: Number(newTrashSampahLN) || 0,
          sampahLH: Number(newTrashSampahLH) || 0,
          sampahSY: Number(newTrashSampahSY) || 0,
          sampahBuah: Number(newTrashSampahBuah) || 0,
          sampahOrganik: Number(newTrashSisaOrganik) || 0,
          sampahAnorganik: Number(newTrashSisaAnorganik) || 0,
        };
        setTrashItems(prev => [newItem, ...prev]);
        setNewTrashMenu('');
        setNewTrashDate('');
        setNewTrashPorsiBesar(0);
        setNewTrashPorsiKecil(0);
        setNewTrashGramasiMP(0);
        setNewTrashGramasiLN(0);
        setNewTrashGramasiLH(0);
        setNewTrashGramasiSY(0);
        setNewTrashGramasiBuah(0);
        setNewTrashSampahMP(0);
        setNewTrashSampahLN(0);
        setNewTrashSampahLH(0);
        setNewTrashSampahSY(0);
        setNewTrashSampahBuah(0);
        setNewTrashSisaOrganik(0);
        setNewTrashSisaAnorganik(0);
        setIsAddingTrash(false);
        triggerSuccessMsg("Rekap data sampah masakan berhasil didokumentasikan!");
      };

      const handleRemoveTrashItem = (id: string) => {
        const confirmed = window.confirm("Apakah Anda yakin ingin menghapus catatan sampah makanan ini?");
        if (confirmed) {
          setTrashItems(prev => prev.filter(item => item.id !== id));
          triggerSuccessMsg("Catatan sampah berhasil dihapus.");
        }
      };

      const getKelayakanStats = (item: TrashItem) => {
        const totalKirim = (item.gramasiMP || 0) + (item.gramasiLN || 0) + (item.gramasiLH || 0) + (item.gramasiSY || 0) + (item.gramasiBuah || 0);
        const totalSampah = (item.sampahMP || 0) + (item.sampahLN || 0) + (item.sampahLH || 0) + (item.sampahSY || 0) + (item.sampahBuah || 0);
        const konsumsiPercent = totalKirim > 0 ? ((totalKirim - totalSampah) / totalKirim) * 100 : 100;

        let statusText = 'Sangat Baik';
        let bgStyle = 'bg-emerald-100 text-emerald-805 border-emerald-300';
        let desc = 'Sangat disukai & diterima oleh siswa. Sisa makanan sangat minim.';

        if (konsumsiPercent < 75) {
          statusText = 'Perlu Evaluasi';
          bgStyle = 'bg-rose-100 text-rose-800 border-rose-300';
          desc = 'Perlu ditinjau ulang (rasa, tekstur, atau porsi) - sisa makanan > 25%.';
        } else if (konsumsiPercent < 90) {
          statusText = 'Baik';
          bgStyle = 'bg-amber-100 text-amber-805 border-amber-300';
          desc = 'Layak dan aman dikonsumsi dengan beberapa sisa ringan.';
        }

        return {
          totalKirim,
          totalSampah,
          percent: konsumsiPercent.toFixed(1),
          statusText,
          bgStyle,
          desc
        };
      };

      // Preview calculations for the current input fields
      const currentKirimTotal = Number(newTrashGramasiMP) + Number(newTrashGramasiLN) + Number(newTrashGramasiLH) + Number(newTrashGramasiSY) + Number(newTrashGramasiBuah);
      const currentSampahTotal = Number(newTrashSampahMP) + Number(newTrashSampahLN) + Number(newTrashSampahLH) + Number(newTrashSampahSY) + Number(newTrashSampahBuah);
      const currentPercent = currentKirimTotal > 0 ? ((currentKirimTotal - currentSampahTotal) / currentKirimTotal) * 100 : 100;
      let currentStatus = 'Sangat Baik';
      let currentBg = 'bg-emerald-100 text-emerald-800';
      if (currentPercent < 75) {
        currentStatus = 'Perlu Evaluasi';
        currentBg = 'bg-rose-100 text-rose-800';
      } else if (currentPercent < 90) {
        currentStatus = 'Baik';
        currentBg = 'bg-amber-100 text-amber-800';
      }

      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-emerald-700 font-bold" />
                <h2 className="text-xl font-bold font-sans text-neutral-800">
                  Rekapitulasi Sampah Makanan (Waste Tracker)
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Kalkulasi volume pengiriman makanan vs sisa sampah makanan siswa untuk menentukan indeks status kelayakan menu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingTrash(!isAddingTrash)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4" /> {isAddingTrash ? 'Batal' : 'Catat Rekap Sampah'}
              </button>
              <button
                onClick={() => triggerSuccessMsg("Seluruh laporan rekap sampah makanan berhasil diekspor!")}
                className="border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Ekspor Data
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          {/* Form Create Waste Report */}
          {isAddingTrash && (
            <form onSubmit={handleCreateTrashItem} className="bg-neutral-50 p-5 rounded-xl border border-neutral-250 space-y-6">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                <h3 className="text-xs font-bold font-mono text-emerald-900 uppercase tracking-wider">Formulir Log Rekap Sampah Baru</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold font-mono px-2 py-0.5 rounded uppercase">Preview Sistem</span>
              </div>

              {/* Step 1: Identitas & Porsi */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-neutral-700 uppercase border-l-4 border-emerald-850 pl-2">1. Identitas & Volume Porsi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={newTrashDate}
                      onChange={e => setNewTrashDate(e.target.value)}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Hari</label>
                    <select
                      value={newTrashHari}
                      onChange={e => setNewTrashHari(e.target.value)}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-semibold"
                    >
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nama Menu Harian</label>
                    <input
                      type="text"
                      required
                      value={newTrashMenu}
                      onChange={e => setNewTrashMenu(e.target.value)}
                      placeholder="Contoh: Sayur Bobor Bayam, Telur Dadar & Melon"
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Jumlah Porsi Besar</label>
                    <input
                      type="number"
                      value={newTrashPorsiBesar}
                      onChange={e => setNewTrashPorsiBesar(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Jumlah Porsi Kecil</label>
                    <input
                      type="number"
                      value={newTrashPorsiKecil}
                      onChange={e => setNewTrashPorsiKecil(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Total Porsi (Kalkulasi)</label>
                    <input
                      type="text"
                      disabled
                      value={`${(Number(newTrashPorsiBesar) || 0) + (Number(newTrashPorsiKecil) || 0)} Porsi`}
                      className="w-full text-xs border border-neutral-300 rounded px-2.5 py-1.5 bg-neutral-100 font-extrabold font-mono text-neutral-700"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Gramasi Pengiriman */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-neutral-700 uppercase border-l-4 border-emerald-850 pl-2">2. Gramasi Pengiriman Makanan (Gram)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">MP (Makanan Pokok)</label>
                    <input
                      type="number"
                      value={newTrashGramasiMP}
                      onChange={e => setNewTrashGramasiMP(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">LN (Lauk Nabati)</label>
                    <input
                      type="number"
                      value={newTrashGramasiLN}
                      onChange={e => setNewTrashGramasiLN(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">LH (Lauk Hewani)</label>
                    <input
                      type="number"
                      value={newTrashGramasiLH}
                      onChange={e => setNewTrashGramasiLH(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">SY (Sayur)</label>
                    <input
                      type="number"
                      value={newTrashGramasiSY}
                      onChange={e => setNewTrashGramasiSY(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1 font-semibold">Buah</label>
                    <input
                      type="number"
                      value={newTrashGramasiBuah}
                      onChange={e => setNewTrashGramasiBuah(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Total Kirim (Gr)</label>
                    <div className="bg-neutral-200 text-neutral-800 text-xs font-bold font-mono rounded px-2.5 py-1.5 text-center shadow-2xs border border-neutral-250">
                      {currentKirimTotal.toLocaleString()} g
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Gramasi Sampah */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-neutral-700 uppercase border-l-4 border-emerald-850 pl-2">3. Gramasi Sampah / Sisa Piring (Gram)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Sampah MP</label>
                    <input
                      type="number"
                      value={newTrashSampahMP}
                      onChange={e => setNewTrashSampahMP(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono text-rose-805"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Sampah LN</label>
                    <input
                      type="number"
                      value={newTrashSampahLN}
                      onChange={e => setNewTrashSampahLN(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono text-rose-805"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Sampah LH</label>
                    <input
                      type="number"
                      value={newTrashSampahLH}
                      onChange={e => setNewTrashSampahLH(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono text-rose-805"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Sampah SY</label>
                    <input
                      type="number"
                      value={newTrashSampahSY}
                      onChange={e => setNewTrashSampahSY(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono text-rose-805"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Sampah Buah</label>
                    <input
                      type="number"
                      value={newTrashSampahBuah}
                      onChange={e => setNewTrashSampahBuah(Number(e.target.value))}
                      className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white font-mono text-rose-805"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Total Sampah (Gr)</label>
                    <div className="bg-rose-50 text-rose-800 text-xs font-bold font-mono rounded px-2.5 py-1.5 text-center border border-rose-200 shadow-2xs">
                      {currentSampahTotal.toLocaleString()} g
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Sisa Produksi Organik / Anorganik */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-200 pt-4">
                <div>
                  <h4 className="text-[11px] font-bold text-neutral-700 uppercase border-l-4 border-emerald-850 pl-2 mb-3">4. Sisa Produksi (Dapur)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-1">Sampah Organik (Kg)</label>
                      <input
                        type="number"
                        step="any"
                        value={newTrashSisaOrganik}
                        onChange={e => setNewTrashSisaOrganik(Number(e.target.value))}
                        className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-1 font-semibold">Anorganik (Kg)</label>
                      <input
                        type="number"
                        step="any"
                        value={newTrashSisaAnorganik}
                        onChange={e => setNewTrashSisaAnorganik(Number(e.target.value))}
                        className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Instant Analysis Preview */}
                <div className="sm:col-span-2 bg-neutral-105 border border-neutral-250 p-4 rounded-lg">
                  <h5 className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest font-mono">Simulasi Indeks Kelayakan Menu</h5>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-xs text-neutral-550 block select-none">Persentase Konsumsi</span>
                      <span className="text-2xl font-black font-mono text-neutral-850">{currentPercent.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-550 block select-none">Status Kelayakan</span>
                      <span className={`inline-block font-extrabold px-3 py-1 text-xs rounded border capitalize ${currentBg}`}>
                        {currentStatus}
                      </span>
                    </div>
                    <div className="flex-1 text-[10.5px] text-neutral-500 leading-relaxed">
                      {currentStatus === 'Sangat Baik' && 'Penerimaan katering sangat tinggi. Makanan dikonsumsi optimal oleh murid.'}
                      {currentStatus === 'Baik' && 'Penerimaan layak & aman. Ada sedikit sisa piring yang dapat dimonitor.'}
                      {currentStatus === 'Perlu Evaluasi' && 'Tingkat kelebihan porsi atau ketidaksukaan menu di atas 25%. Silakan evaluasi rasa & porsi.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-neutral-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingTrash(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-805 hover:bg-emerald-950 text-white rounded-lg text-xs font-bold"
                >
                  Simpan Catatan Sampah
                </button>
              </div>
            </form>
          )}

          {/* Bento dynamic KPI stats for Waste tracker */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200/50 text-emerald-800 shadow-2xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono select-none block">Indeks Konsumsi</span>
                <span className="text-lg font-black text-neutral-800 font-mono">
                  {trashItems.length > 0
                    ? (trashItems.reduce((acc, item) => {
                        const tk = (item.gramasiMP || 0) + (item.gramasiLN || 0) + (item.gramasiLH || 0) + (item.gramasiSY || 0) + (item.gramasiBuah || 0);
                        const ts = (item.sampahMP || 0) + (item.sampahLN || 0) + (item.sampahLH || 0) + (item.sampahSY || 0) + (item.sampahBuah || 0);
                        return acc + (tk > 0 ? ((tk - ts) / tk) * 100 : 100);
                      }, 0) / trashItems.length).toFixed(1)
                    : '100'}%
                </span>
                <span className="text-[9px] text-emerald-700 block select-none">Rata-rata Terkonsumsi</span>
              </div>
            </div>

            <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-amber-200/50 text-amber-800 shadow-2xs">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono select-none block">Total Sampah Piring</span>
                <span className="text-lg font-black text-neutral-800 font-mono">
                  {(trashItems.reduce((acc, item) => acc + (item.sampahMP || 0) + (item.sampahLN || 0) + (item.sampahLH || 0) + (item.sampahSY || 0) + (item.sampahBuah || 0), 0) / 1000).toFixed(1)} Kg
                </span>
                <span className="text-[9px] text-amber-700 block select-none">Sisa Piring Murid (Katering)</span>
              </div>
            </div>

            <div className="bg-rose-50/30 border border-rose-100 p-4 rounded-xl flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-rose-200/50 text-rose-800 shadow-2xs">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono select-none block">Sisa Produksi Dapur</span>
                <span className="text-lg font-black text-neutral-800 font-mono">
                  {(trashItems.reduce((acc, item) => acc + (item.sampahOrganik || 0) + (item.sampahAnorganik || 0), 0)).toFixed(1)} Kg
                </span>
                <span className="text-[9px] text-rose-700 block select-none">Sampah Dapur Pasca-Masak</span>
              </div>
            </div>

            <div className="bg-blue-50/30 border border-blue-105 p-4 rounded-xl flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/50 text-blue-700 shadow-2xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="truncate max-w-full">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono select-none block">Menu Terfavorit</span>
                <span className="text-xs font-bold text-neutral-800 truncate block max-w-[160px]" title={trashItems.length > 0 ? trashItems[0].namaMenu : '-'}>
                  {trashItems.length > 0 ? trashItems[0].namaMenu.split(',')[0] : '-'}
                </span>
                <span className="text-[9px] text-blue-705 block select-none">Indeks Sisa Minim</span>
              </div>
            </div>
          </div>

          {/* View Toggle Layout */}
          <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-3">
            <span className="text-xs font-bold text-neutral-600 block select-none">
              Daftar Dokumentasi Sampah:
            </span>
            <div className="inline-flex p-1 bg-neutral-100 rounded-lg border border-neutral-200/60 font-sans">
              <button
                type="button"
                onClick={() => setWasteViewMode('card')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${wasteViewMode === 'card' ? 'bg-white text-emerald-805 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                📰 Kartu Harian (Mudah Dibaca)
              </button>
              <button
                type="button"
                onClick={() => setWasteViewMode('table')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${wasteViewMode === 'table' ? 'bg-white text-emerald-805 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                📊 Tabel Laporan Lengkap
              </button>
            </div>
          </div>

          {/* Render layout matching view mode */}
          {wasteViewMode === 'card' ? (
            /* VISUAL DAILY CARDS (SANGAT MUDAH DIBACA PER HARI) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trashItems.length === 0 ? (
                <div className="col-span-2 p-12 text-center border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 font-medium font-sans">
                  Belum ada laporan sampah piring masakan yang ditambahkan.
                </div>
              ) : (
                trashItems.map(item => {
                  const stats = getKelayakanStats(item);
                  const isExpanded = !!expandedLogs[item.id];
                  
                  // Total weights in kg
                  const mpWeight = { kirim: (item.gramasiMP / 1000).toFixed(1), sisa: (item.sampahMP / 1000).toFixed(1) };
                  const lnWeight = { kirim: (item.gramasiLN / 1000).toFixed(1), sisa: (item.sampahLN / 1000).toFixed(1) };
                  const lhWeight = { kirim: (item.gramasiLH / 1000).toFixed(1), sisa: (item.sampahLH / 1000).toFixed(1) };
                  const syWeight = { kirim: (item.gramasiSY / 1000).toFixed(1), sisa: (item.sampahSY / 1000).toFixed(1) };
                  const bhWeight = { kirim: (item.gramasiBuah / 1000).toFixed(1), sisa: (item.sampahBuah / 1000).toFixed(1) };

                  return (
                    <div key={item.id} className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden flex flex-col hover:border-emerald-250 hover:shadow-xs transition-all duration-200">
                      {/* Card Header: Tanggal & Indeks status */}
                      <div className="bg-neutral-50/80 px-5 py-4 border-b border-neutral-150 flex flex-wrap items-center justify-between gap-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs px-2.5 py-1 text-center min-w-[55px]">
                            <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest">{item.hari}</span>
                            <span className="block text-sm font-black font-mono text-neutral-800 leading-none mt-0.5">{item.tanggal.substring(8)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 font-mono block select-none">{item.tanggal}</span>
                            <span className="text-xs font-black text-neutral-700 block">{item.hari}</span>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide border ${stats.bgStyle}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                          {stats.statusText} • {stats.percent}% Terkonsumsi
                        </span>
                      </div>

                      {/* Main Card Body */}
                      <div className="p-5 flex-1 space-y-4 font-sans">
                        <div>
                          <span className="text-[9px] font-black tracking-wider text-emerald-800 uppercase block select-none">NAMA MENU DIKONSUMSI</span>
                          <h3 className="text-base font-bold text-neutral-800 mt-1 leading-snug">
                            {item.namaMenu}
                          </h3>
                        </div>

                        {/* Porsi & General Volume */}
                        <div className="flex gap-4 border-t border-b border-neutral-105 py-3 text-xs text-neutral-600">
                          <div>
                            <span className="text-[9px] text-neutral-400 block uppercase font-bold">Total Porsi Masak:</span>
                            <span className="text-neutral-800 font-bold block mt-0.5">
                              {item.porsiBesar + item.porsiKecil} Porsi
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              ({item.porsiBesar} Besar / {item.porsiKecil} Kecil)
                            </span>
                          </div>
                          <div className="border-l border-neutral-150 pl-4">
                            <span className="text-[9px] text-neutral-400 block uppercase font-bold">Volume Tonase Pangan:</span>
                            <span className="text-neutral-800 font-bold block mt-0.5">
                              {(stats.totalKirim / 1000).toFixed(1)} Kg Dikirim
                            </span>
                            <span className="text-[10px] text-rose-700 font-mono font-semibold">
                              {stats.totalSampah} Gram Sisa Piring
                            </span>
                          </div>
                        </div>

                        {/* Visual Segmented Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-emerald-805">Eaten: {stats.percent}%</span>
                            <span className="text-neutral-450 text-rose-700">Wasted: {(100 - Number(stats.percent)).toFixed(1)}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden flex shadow-inner border border-neutral-250">
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stats.percent}%` }}></div>
                            <div className="bg-rose-400 h-full transition-all flex-1"></div>
                          </div>
                        </div>

                        {/* Collapsible details controller */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedLogs(prev => ({ ...prev, [item.id]: !isExpanded }))}
                            className="w-full bg-neutral-50 hover:bg-neutral-100 text-neutral-705 py-2 px-3 rounded-lg text-xs font-bold border border-neutral-250 flex items-center justify-between transition-colors"
                          >
                            <span>{isExpanded ? 'Hide Detail Per Kategori Makanan' : 'Lihat Analisis Detail Per Kategori'}</span>
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-white border border-neutral-200 rounded">
                              {isExpanded ? 'Tutup' : 'Buka'}
                            </span>
                          </button>

                          {/* Expanded Details category grid */}
                          {isExpanded && (
                            <div className="mt-3 bg-neutral-50/50 rounded-xl p-4 border border-neutral-200 space-y-3.5 animate-fadeIn font-sans">
                              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block select-none">
                                DEGRADASI SAMPAH PIRING PER KATEGORI (KG):
                              </span>
                              
                              <div className="space-y-3">
                                {/* Cat 1: Makanan Pokok */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-neutral-700">1. Makanan Pokok (Nasi/Mie)</span>
                                    <span className="font-mono text-neutral-500">{mpWeight.kirim}kg kirim • <span className="text-rose-700 font-semibold">{item.sampahMP}g sisa</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                    <div className="bg-emerald-600 h-full" style={{ width: `${item.gramasiMP > 0 ? (((item.gramasiMP - item.sampahMP) / item.gramasiMP) * 100) : 100}%` }}></div>
                                  </div>
                                </div>

                                {/* Cat 2: Lauk Nabati */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-neutral-700">2. Lauk Nabati (Tahu/Tempe)</span>
                                    <span className="font-mono text-neutral-500">{lnWeight.kirim}kg kirim • <span className="text-rose-700 font-semibold">{item.sampahLN}g sisa</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                    <div className="bg-emerald-600 h-full" style={{ width: `${item.gramasiLN > 0 ? (((item.gramasiLN - item.sampahLN) / item.gramasiLN) * 100) : 100}%` }}></div>
                                  </div>
                                </div>

                                {/* Cat 3: Lauk Hewani */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-neutral-700">3. Lauk Hewani (Daging/Ayam)</span>
                                    <span className="font-mono text-neutral-500">{lhWeight.kirim}kg kirim • <span className="text-rose-700 font-semibold">{item.sampahLH}g sisa</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                    <div className="bg-emerald-600 h-full" style={{ width: `${item.gramasiLH > 0 ? (((item.gramasiLH - item.sampahLH) / item.gramasiLH) * 100) : 100}%` }}></div>
                                  </div>
                                </div>

                                {/* Cat 4: Sayur */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-neutral-700">4. Sayur Sop/Saut</span>
                                    <span className="font-mono text-neutral-500">{syWeight.kirim}kg kirim • <span className="text-rose-700 font-semibold">{item.sampahSY}g sisa</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                    <div className="bg-emerald-600 h-full" style={{ width: `${item.gramasiSY > 0 ? (((item.gramasiSY - item.sampahSY) / item.gramasiSY) * 100) : 100}%` }}></div>
                                  </div>
                                </div>

                                {/* Cat 5: Buah */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-neutral-700">5. Buah Pencuci Mulut</span>
                                    <span className="font-mono text-neutral-500">{bhWeight.kirim}kg kirim • <span className="text-rose-700 font-semibold">{item.sampahBuah}g sisa</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                    <div className="bg-emerald-600 h-full" style={{ width: `${item.gramasiBuah > 0 ? (((item.gramasiBuah - item.sampahBuah) / item.gramasiBuah) * 100) : 100}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sisa Dapur Organik/Anorganik */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-450 block font-bold">🗑️ SISA PRODUKSI DAPUR (Internal)</span>
                            <div className="flex gap-4 mt-1.5">
                              <div>
                                <span className="text-[9px] text-neutral-500 block select-none">Sampah Organik:</span>
                                <span className="text-emerald-800 font-extrabold font-mono text-sm">{item.sampahOrganik} Kg</span>
                              </div>
                              <div className="border-l border-neutral-200 pl-4">
                                <span className="text-[9px] text-neutral-500 block select-none">Anorganik:</span>
                                <span className="text-blue-800 font-extrabold font-mono text-sm">{item.sampahAnorganik} Kg</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveTrashItem(item.id)}
                            className="bg-white hover:bg-rose-50 hover:text-rose-700 transition-colors p-2 text-neutral-500 rounded-lg border border-neutral-200 shadow-3xs"
                            title="Hapus Catatan Sampah Hari Ini"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* TABULAR DATA TAB VIEW (TRADITIONAL COMPLETE CHECKSHEET) */
            <div className="overflow-x-auto border border-neutral-205 rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs select-text">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider select-none">
                    <th className="py-3 px-3">Tanggal / Hari</th>
                    <th className="py-3 px-3">Nama Menu Masakan</th>
                    <th className="py-3 px-3 text-center bg-slate-50 border-x border-neutral-205">
                      <div>PORSI</div>
                      <div className="flex gap-2 justify-center text-[8px] text-neutral-450 mt-1 font-mono">
                        <span>BSR</span><span>KCL</span><span>TOT</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <div>GRAMASI PENGIRIMAN</div>
                      <div className="flex gap-2 justify-center text-[7.5px] text-neutral-450 mt-1 font-mono">
                        <span>MP</span><span>LN</span><span>LH</span><span>SY</span><span>BH</span><span className="font-bold text-neutral-700">TOT</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center bg-rose-50/40">
                      <div className="text-rose-800">GRAMASI SAMPAH (SISA)</div>
                      <div className="flex gap-2 justify-center text-[7.5px] text-rose-550 mt-1 font-mono">
                        <span>MP</span><span>LN</span><span>LH</span><span>SY</span><span>BH</span><span className="font-bold text-rose-800">TOT</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <div>SISA PRODUKSI</div>
                      <div className="flex gap-3 justify-center text-[8px] text-neutral-450 mt-1 font-mono">
                        <span>ORG</span><span>ANORG</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">Analisis & Kelayakan</th>
                    <th className="py-3 px-3 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 divide-x divide-neutral-100">
                  {trashItems.map(item => {
                    const stats = getKelayakanStats(item);
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/40 text-[11px] transition-colors leading-normal">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-neutral-900">{item.tanggal}</div>
                          <div className="text-neutral-400 text-[10px]">{item.hari}</div>
                        </td>
                        <td className="py-3 px-3 min-w-[200px] font-medium text-neutral-800 max-w-[220px] truncate" title={item.namaMenu}>
                          {item.namaMenu}
                        </td>
                        <td className="py-3 px-2 text-center bg-slate-50/50 font-mono text-[10px]">
                          <div className="flex gap-3 justify-center">
                            <span className="text-neutral-600">{item.porsiBesar}</span>
                            <span className="text-neutral-600">{item.porsiKecil}</span>
                            <span className="font-extrabold text-neutral-900">{item.porsiBesar + item.porsiKecil}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-[10px]">
                          <div className="flex gap-2 justify-center text-neutral-500">
                            <span>{item.gramasiMP}</span>
                            <span>{item.gramasiLN}</span>
                            <span>{item.gramasiLH}</span>
                            <span>{item.gramasiSY}</span>
                            <span>{item.gramasiBuah}</span>
                            <span className="font-bold text-neutral-850">{(stats.totalKirim / 1000).toFixed(1)}kg</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center bg-rose-50/20 font-mono text-[10px] text-rose-800">
                          <div className="flex gap-2 justify-center">
                            <span>{item.sampahMP}</span>
                            <span>{item.sampahLN}</span>
                            <span>{item.sampahLH}</span>
                            <span>{item.sampahSY}</span>
                            <span>{item.sampahBuah}</span>
                            <span className="font-black text-rose-850">{(stats.totalSampah / 1000).toFixed(1)}kg</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono">
                          <div className="flex gap-3 justify-center">
                            <span className="text-emerald-800 font-semibold">{item.sampahOrganik} Kg</span>
                            <span className="text-blue-800 font-semibold">{item.sampahAnorganik} Kg</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide border ${stats.bgStyle}`}>
                              {stats.statusText} ({stats.percent}%)
                            </span>
                            <span className="text-[8.5px] text-neutral-400 font-medium scale-95 select-none text-center leading-tight max-w-[130px]">
                              {stats.desc}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTrashItem(item.id)}
                            className="text-rose-600 hover:text-rose-900 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-slate-50 border border-neutral-200 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-neutral-800">Petunjuk Parameter & Rumus Perhitungan:</h4>
            <ul className="list-disc list-inside text-[11px] text-neutral-500 space-y-1 pl-1">
              <li>
                <strong className="text-neutral-700">Total Porsi:</strong> Penjumlahan sederhana antara volume Porsi Besar dan Porsi Kecil.
              </li>
              <li>
                <strong className="text-neutral-700">Indeks Konsumsi (%):</strong> Kalkulasi presentasi pangan yang dimakan siswa. Rumus: <code className="bg-neutral-200/60 px-1 py-0.2 rounded text-[10px] font-mono text-neutral-800">((Total Kirim - Total Sampah) / Total Kirim) * 100</code>.
              </li>
              <li>
                <strong className="text-neutral-700">Sisa Produksi:</strong> Jumlah sisa buangan organik/anorganik dari dapur internal (sebelum piring siswa).
              </li>
            </ul>
          </div>
        </div>
      );

    case 17: { // Stok Operasional
      const OPERASIONAL_CATEGORIES = ['ATK', 'Kebersihan', 'Air', 'APD', 'Lain-Lain'];
      const activeOperasionalList = operasionalMap[selectedOperasionalDate] && operasionalMap[selectedOperasionalDate].length > 0
        ? operasionalMap[selectedOperasionalDate]
        : defaultOperasionalTemplate;

      const filteredOperasionalItems = activeOperasionalList.filter(item => {
        const matchesCategory = selectedOperasionalCategoryFilter === 'Semua' || item.category === selectedOperasionalCategoryFilter;
        const matchesSearch = item.name.toLowerCase().includes(operasionalSearchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      const handleUpdateOperasionalItem = (id: string, field: 'stokAwal' | 'barangMasuk' | 'stokAkhir' | 'uom', value: any) => {
        setOperasionalMap(prev => {
          const currentList = prev[selectedOperasionalDate] && prev[selectedOperasionalDate].length > 0
            ? prev[selectedOperasionalDate]
            : JSON.parse(JSON.stringify(defaultOperasionalTemplate));
          
          const updatedList = currentList.map((item: StockItem) => {
            if (item.id === id) {
              const numVal = (field === 'stokAwal' || field === 'barangMasuk' || field === 'stokAkhir') ? (parseFloat(value) || 0) : value;
              return { ...item, [field]: numVal };
            }
            return item;
          });
          
          return { ...prev, [selectedOperasionalDate]: updatedList };
        });
      };

      const handleCreateOperasionalItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOperasionalName.trim()) return;
        const newItem: StockItem = {
          id: 'op-' + Date.now(),
          category: newOperasionalCat,
          name: newOperasionalName,
          stokAwal: parseFloat(newOperasionalStokAwal) || 0,
          barangMasuk: parseFloat(newOperasionalBarangMasuk) || 0,
          stokAkhir: parseFloat(newOperasionalStokAkhir) || 0,
          uom: newOperasionalUom
        };

        setOperasionalMap(prev => {
          const currentList = prev[selectedOperasionalDate] && prev[selectedOperasionalDate].length > 0
            ? prev[selectedOperasionalDate]
            : JSON.parse(JSON.stringify(defaultOperasionalTemplate));
          
          return { ...prev, [selectedOperasionalDate]: [...currentList, newItem] };
        });

        setNewOperasionalName('');
        setNewOperasionalStokAwal('0');
        setNewOperasionalBarangMasuk('0');
        setNewOperasionalStokAkhir('0');
        setNewOperasionalUom('Pcs');
        setIsAddingOperasionalItem(false);
        triggerSuccessMsg(`Barang Operasional "${newItem.name}" berhasil ditambahkan ke kategori ${newItem.category} pada tanggal ${selectedOperasionalDate}!`);
      };

      const handleRemoveOperasionalItem = (id: string, name?: string) => {
        const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus barang "${name || 'ini'}" dari Stok Operasional tanggal ${selectedOperasionalDate}?`);
        if (confirmed) {
          setOperasionalMap(prev => {
            const currentList = prev[selectedOperasionalDate] && prev[selectedOperasionalDate].length > 0
              ? prev[selectedOperasionalDate]
              : JSON.parse(JSON.stringify(defaultOperasionalTemplate));
            const updatedList = currentList.filter((item: StockItem) => item.id !== id);
            return { ...prev, [selectedOperasionalDate]: updatedList };
          });
          triggerSuccessMsg("Barang operasional berhasil dihapus.");
        }
      };

      const handleSaveAndCarryOverOperasionalItem = (itemToSave: StockItem) => {
        const currentDateObj = new Date(selectedOperasionalDate);
        currentDateObj.setDate(currentDateObj.getDate() + 1);
        const nextDateStr = currentDateObj.toISOString().split('T')[0];

        setOperasionalMap(prev => {
          const targetTodayList = prev[selectedOperasionalDate] && prev[selectedOperasionalDate].length > 0
            ? prev[selectedOperasionalDate]
            : JSON.parse(JSON.stringify(defaultOperasionalTemplate));

          const nextDayList = prev[nextDateStr] && prev[nextDateStr].length > 0
            ? JSON.parse(JSON.stringify(prev[nextDateStr]))
            : JSON.parse(JSON.stringify(defaultOperasionalTemplate));

          let matchFound = false;
          const updatedNextDayList = nextDayList.map((nextItem: StockItem) => {
            if (nextItem.id === itemToSave.id || nextItem.name.toLowerCase() === itemToSave.name.toLowerCase()) {
              matchFound = true;
              const newStokAwal = itemToSave.stokAkhir;
              const newStokAkhir = newStokAwal + nextItem.barangMasuk;
              return { 
                ...nextItem, 
                stokAwal: newStokAwal,
                stokAkhir: newStokAkhir
              };
            }
            return nextItem;
          });

          if (!matchFound) {
            updatedNextDayList.push({
              id: itemToSave.id,
              category: itemToSave.category,
              name: itemToSave.name,
              stokAwal: itemToSave.stokAkhir,
              barangMasuk: 0,
              stokAkhir: itemToSave.stokAkhir,
              uom: itemToSave.uom
            });
          }

          return { 
            ...prev, 
            [selectedOperasionalDate]: targetTodayList,
            [nextDateStr]: updatedNextDayList 
          };
        });

        triggerSuccessMsg(`Stok "${itemToSave.name}" berhasil disimpan! Stok Akhir (${itemToSave.stokAkhir} ${itemToSave.uom}) otomatis disalin menjadi Stok Awal untuk esok hari (${nextDateStr}).`);
      };

      const handleSyncAllOperasionalToNextDay = () => {
        const currentDateObj = new Date(selectedOperasionalDate);
        currentDateObj.setDate(currentDateObj.getDate() + 1);
        const nextDateStr = currentDateObj.toISOString().split('T')[0];

        setOperasionalMap(prev => {
          const todayList = prev[selectedOperasionalDate] && prev[selectedOperasionalDate].length > 0
            ? prev[selectedOperasionalDate]
            : JSON.parse(JSON.stringify(defaultOperasionalTemplate));

          const nextDayList = prev[nextDateStr] && prev[nextDateStr].length > 0
            ? JSON.parse(JSON.stringify(prev[nextDateStr]))
            : JSON.parse(JSON.stringify(defaultOperasionalTemplate));

          const updatedNextDayList = [...nextDayList];

          todayList.forEach((todayItem: StockItem) => {
            const idx = updatedNextDayList.findIndex(nItem => nItem.id === todayItem.id || nItem.name.toLowerCase() === todayItem.name.toLowerCase());
            if (idx !== -1) {
              const nextItem = updatedNextDayList[idx];
              const newStokAwal = todayItem.stokAkhir;
              const newStokAkhir = newStokAwal + nextItem.barangMasuk;
              updatedNextDayList[idx] = {
                ...nextItem,
                stokAwal: newStokAwal,
                stokAkhir: newStokAkhir
              };
            } else {
              updatedNextDayList.push({
                id: todayItem.id,
                category: todayItem.category,
                name: todayItem.name,
                stokAwal: todayItem.stokAkhir,
                barangMasuk: 0,
                stokAkhir: todayItem.stokAkhir,
                uom: todayItem.uom
              });
            }
          });

          return {
            ...prev,
            [nextDateStr]: updatedNextDayList
          };
        });

        triggerSuccessMsg(`Sukses menyimpan seluruh data operasional! Stok Akhir per hari ini otomatis disalin menjadi Stok Awal untuk esok hari tanggal ${nextDateStr}.`);
      };

      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Archive className="h-6 w-6 text-emerald-700" />
                <h2 className="text-xl font-bold font-sans text-neutral-800">
                  Stok Operasional Mandiri (ATK, APD, Kebersihan, Air, & Lain-Lain)
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Lacak perlengkapan non-food pondok pesantren gizi secara akurat dan real-time per hari ketersediaan.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSyncAllOperasionalToNextDay}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Simpan seluruh Stok Akhir operasional hari ini dan salin ke Stok Awal esok hari"
              >
                <Save className="h-4 w-4" /> Simpan & Salin ke Besok
              </button>
              <button
                type="button"
                onClick={() => setIsAddingOperasionalItem(!isAddingOperasionalItem)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4" /> {isAddingOperasionalItem ? 'Batal' : 'Tambah Barang'}
              </button>
              <button
                type="button"
                onClick={() => triggerSuccessMsg("Seluruh laporan Stok Operasional berhasil diekspor ke Excel!")}
                className="border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Ekspor Excel
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          {/* Form Create Operasional Item */}
          {isAddingOperasionalItem && (
            <form onSubmit={handleCreateOperasionalItem} className="bg-neutral-50 p-4 rounded-xl border border-neutral-250 space-y-4">
              <h3 className="text-xs font-bold font-mono text-emerald-950 uppercase tracking-wider">Formulir Tambah Barang Operasional Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nama Barang</label>
                  <input
                    type="text"
                    required
                    value={newOperasionalName}
                    onChange={e => setNewOperasionalName(e.target.value)}
                    placeholder="Contoh: Sabun Mama Lemon"
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Kategori</label>
                  <select
                    value={newOperasionalCat}
                    onChange={e => setNewOperasionalCat(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  >
                    {OPERASIONAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">UoM (Satuan)</label>
                  <input
                    type="text"
                    required
                    value={newOperasionalUom}
                    onChange={e => setNewOperasionalUom(e.target.value)}
                    placeholder="Contoh: Jerigen, Pcs, Box, Galon"
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={newOperasionalStokAwal}
                    onChange={e => setNewOperasionalStokAwal(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Barang Masuk</label>
                  <input
                    type="number"
                    step="any"
                    value={newOperasionalBarangMasuk}
                    onChange={e => setNewOperasionalBarangMasuk(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Stok Akhir / Riil</label>
                  <input
                    type="number"
                    step="any"
                    value={newOperasionalStokAkhir}
                    onChange={e => setNewOperasionalStokAkhir(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOperasionalItem(false)}
                  className="px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs rounded font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-800 text-white rounded text-xs font-bold"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          )}

          {/* Daily Date Selector */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-250 uppercase tracking-wider font-mono">
                📅 STOK OPERASIONAL HARIAN
              </span>
              <p className="text-xs text-neutral-600 font-medium">
                Pembaruan stok harian. Pilih tanggal kontrol di bawah:
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedOperasionalDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedOperasionalDate(d.toISOString().split('T')[0]);
                }}
                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-center transition-all"
              >
                ← Kemarin
              </button>
              
              <input
                type="date"
                value={selectedOperasionalDate}
                onChange={e => setSelectedOperasionalDate(e.target.value)}
                className="text-xs font-bold font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white text-neutral-800 focus:ring-emerald-500 shadow-2xs"
              />

              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedOperasionalDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedOperasionalDate(d.toISOString().split('T')[0]);
                }}
                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-center transition-all"
              >
                Esok →
              </button>

              <button
                type="button"
                onClick={() => setSelectedOperasionalDate('2026-06-17')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Table Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
            <div className="w-full sm:w-1/3">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1 select-none">Filter Kategori</label>
              <select
                value={selectedOperasionalCategoryFilter}
                onChange={e => setSelectedOperasionalCategoryFilter(e.target.value)}
                className="w-full text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white font-medium"
              >
                <option value="Semua">Semua Kategori</option>
                {OPERASIONAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-2/3">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1 select-none">Cari Nama Barang</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Ketik kata kunci pencarian barang operasional..."
                  value={operasionalSearchTerm}
                  onChange={e => setOperasionalSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="overflow-x-auto border border-neutral-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4 text-center w-24">Stok Awal</th>
                  <th className="py-3 px-4 text-center w-24">Barang Masuk</th>
                  <th className="py-3 px-4 text-center w-24">Stok Akhir</th>
                  <th className="py-3 px-4 text-center w-24">UoM</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOperasionalItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400 font-medium text-xs">
                      Tidak ada barang operasional yang sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredOperasionalItems.map(item => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors text-xs">
                      <td className="py-2.5 px-4">
                        <span className="bg-slate-100 text-slate-800 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border border-slate-200/60 font-mono">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-neutral-800">{item.name}</td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.stokAwal}
                          onChange={e => handleUpdateOperasionalItem(item.id, 'stokAwal', e.target.value)}
                          className="w-20 text-center font-mono border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800 shadow-2xs"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.barangMasuk}
                          onChange={e => handleUpdateOperasionalItem(item.id, 'barangMasuk', e.target.value)}
                          className="w-20 text-center font-mono border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800 shadow-2xs"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.stokAkhir}
                          onChange={e => handleUpdateOperasionalItem(item.id, 'stokAkhir', e.target.value)}
                          className="w-20 text-center font-mono border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800 shadow-2xs"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="text"
                          value={item.uom}
                          onChange={e => handleUpdateOperasionalItem(item.id, 'uom', e.target.value)}
                          className="w-20 text-center border border-neutral-200 rounded px-1.5 py-1 text-xs bg-white text-neutral-800"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveAndCarryOverOperasionalItem(item)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded border border-emerald-200 transition-all flex items-center justify-center cursor-pointer"
                            title="Simpan & Salin Stok Akhir ke Esok Hari"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOperasionalItem(item.id, item.name)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded border border-rose-200 transition-all flex items-center justify-center cursor-pointer"
                            title="Hapus barang"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="p-8 text-center text-neutral-400">
          Sub-fitur dalam pengerjaan. Silakan pilih menu SOP di sidebar.
        </div>
      );
  }
}
