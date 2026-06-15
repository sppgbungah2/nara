import React, { useState } from 'react';
import { 
  Calendar, Loader2, Sparkles, Plus, Trash2, Check, AlertCircle, RefreshCw, FilePlus
} from 'lucide-react';
import { Division, UserRole, DayMenu, SOPDocument } from '../types';
import { DIVISION_CREATOR_MAP, getDefaultTasksForDivision } from '../presetData';

interface SOPCreatorProps {
  selectedDate: string;
  dayMenu: DayMenu | null;
  sopsForDate: SOPDocument[];
  currentUserRole: UserRole;
  currentUsername: string;
  onSaveMenu: (date: string, menuList: string[]) => void;
  onGenerateSOPs: (date: string, menuList: string[]) => void;
  onUpdateSOP: (updatedSOP: SOPDocument) => void;
}

export default function SOPCreator({
  selectedDate,
  dayMenu,
  sopsForDate,
  currentUserRole,
  currentUsername,
  onSaveMenu,
  onGenerateSOPs,
  onUpdateSOP
}: SOPCreatorProps) {
  const [editedMenuList, setEditedMenuList] = useState<string[]>(
    dayMenu ? [...dayMenu.menuList] : []
  );
  const [newItemText, setNewItemText] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync menu changes when dayMenu changes
  React.useEffect(() => {
    if (dayMenu) {
      setEditedMenuList([...dayMenu.menuList]);
    } else {
      setEditedMenuList([]);
    }
  }, [dayMenu]);

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setEditedMenuList([...editedMenuList, newItemText.trim()]);
    setNewItemText('');
  };

  const handleRemoveMenuItem = (index: number) => {
    const updated = editedMenuList.filter((_, idx) => idx !== index);
    setEditedMenuList(updated);
  };

  const handleSaveMenuAndInitialize = () => {
    if (editedMenuList.length === 0) {
      alert('Tulis/tambahkan minimal 1 menu makanan (misal: Nasi Putih) terlebih dahulu!');
      return;
    }
    
    setIsActivating(true);
    setTimeout(() => {
      onSaveMenu(selectedDate, editedMenuList);
      onGenerateSOPs(selectedDate, editedMenuList);
      setIsActivating(false);
      setSuccessBanner('Menu harian & template SOP berhasil dipublikasikan untuk tanggal ini!');
      setTimeout(() => setSuccessBanner(null), 4000);
    }, 1000);
  };

  // Determine responsibility
  const getCreatorLabelByRole = (role: UserRole) => {
    switch (role) {
      case UserRole.CHEF: return 'Stocking (Persiapan) & Masak';
      case UserRole.AHLI_GIZI: return 'Pemorsian';
      case UserRole.ASLAP: return 'Driver, Cuci, Kebersihan, & Keamanan';
      default: return 'Semua Divisi';
    }
  };

  // Return formatted Indonesian date
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${parts[2]} ${months[date.getMonth()]} ${parts[0]}`;
  };

  return (
    <div className="space-y-6">
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2.5 animate-bounce">
          <Check className="h-5 w-5 text-emerald-700 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Role Responsibility Alert Banner */}
      <div className="bg-emerald-800 text-white p-5 rounded-2xl border border-emerald-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-700/80 uppercase text-[10px] tracking-widest font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-600/30 font-mono">
            LOG MASUK: {currentUserRole}
          </span>
          <h2 className="text-xl font-bold font-display mt-2">
            Perancang SOP Dapur SPPG Qomaruddin
          </h2>
          <p className="text-xs text-emerald-100 max-w-xl mt-1">
            Berdasarkan hak akses Anda, Anda bertanggung jawab penuh untuk memantau/merilis SOP divisi <strong className="text-emerald-300 font-bold">{getCreatorLabelByRole(currentUserRole)}</strong>.
          </p>
        </div>
        <div className="bg-emerald-940 px-4 py-2.5 rounded-xl border border-emerald-700/40 font-mono text-[11px] space-y-0.5 select-none shrink-0">
          <span className="text-emerald-400 block uppercase font-bold">Menu Dasar Tanggal</span>
          <span className="text-white font-bold">{formatIndoDate(selectedDate)}</span>
        </div>
      </div>

      {/* Main drafting grid split: Left (Menu Editor) & Right (SOP Generator Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: MENU MAKANAN (Inputted by Ahli Gizi / Admin, or editable by Chef if empty) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-bold text-neutral-800 text-sm font-display flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-700" />
                Daftar Menu Hidangan Hari H
              </h3>
              <p className="text-[11px] text-neutral-500">Menu harian gizi tinggi menjadi variabel kunci dalam pembentukan butir checklist SOP.</p>
            </div>
            
            {dayMenu && (
              <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                Terbit
              </span>
            )}
          </div>

          <form onSubmit={handleAddMenuItem} className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              className="flex-1 text-xs border border-neutral-200 bg-neutral-50/50 rounded-lg px-3 py-2 outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Contoh: Krawu Ayam Bungah (lalu klik tambah...)"
            />
            <button
              type="submit"
              className="bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ambil
            </button>
          </form>

          {editedMenuList.length === 0 ? (
            <div className="p-10 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/30 text-center text-xs text-neutral-400 space-y-1">
              <AlertCircle className="h-6 w-6 text-neutral-300 mx-auto" />
              <p className="font-medium text-neutral-500">Belum Ada Menu Ditambahkan</p>
              <p className="text-[10px]">Ahli Gizi atau Tim Dapur wajib memasukkan rincian lauk pauk di atas terlebih dahulu.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {editedMenuList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 border border-neutral-100 bg-neutral-50 rounded-lg text-xs font-sans group">
                  <span className="font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="w-5 h-5 bg-neutral-200/60 font-mono text-[10px] text-neutral-600 rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMenuItem(idx)}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-neutral-100 pt-4 flex items-center justify-between">
            <span className="text-[10px] text-neutral-400">
              *Diunggah oleh: {dayMenu ? dayMenu.createdBy : 'Draft Belum disimpan'}
            </span>
            <button
              onClick={handleSaveMenuAndInitialize}
              className="bg-neutral-900 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-neutral-800"
            >
              {dayMenu ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                  Update Menu & SOP
                </>
              ) : (
                <>
                  <FilePlus className="h-3.5 w-3.5" />
                  Rilis SOP Tanggal Ini
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SOP GENERATOR WORKFLOW GRAPH */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-bold text-neutral-800 text-sm font-display flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              Alur Penerbitan Instan SOP Digital
            </h3>
            <p className="text-[11px] text-neutral-500">Alur pendakian pembuatan berkas checklist dari supervisor ahli hingga disebarkan ke pelaksana dapur.</p>
          </div>

          {sopsForDate.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-xl space-y-3 bg-neutral-50/20">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-neutral-700 text-sm">SOP Belum Dihasilkan untuk Tanggal Ini</p>
                <p className="max-w-[340px] mx-auto text-neutral-500">Mulai dengan melengkapi daftar menu makanan di sebelah kiri, kemudian ketuk tombol <strong>"Rilis SOP Tanggal Ini"</strong> berwarna hitam.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-xs text-emerald-800 font-sans flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700" />
                <span>Format SOP digital 7 divisi saat ini aktif. Semua checklist harian disesuaikan instan berdasarkan menu porsi.</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { name: Division.STOCKING, role: UserRole.CHEF },
                  { name: Division.MASAK, role: UserRole.CHEF },
                  { name: Division.PEMORSIAN, role: UserRole.AHLI_GIZI },
                  { name: Division.DRIVER, role: UserRole.ASLAP },
                  { name: Division.CUCI, role: UserRole.ASLAP },
                  { name: Division.KEBERSIHAN, role: UserRole.ASLAP },
                  { name: Division.KEAMANAN, role: UserRole.ASLAP }
                ].map((row, id) => {
                  const creatorInfo = DIVISION_CREATOR_MAP[row.name];
                  const hasSOP = sopsForDate.find(s => s.division === row.name);
                  
                  return (
                    <div 
                      key={id} 
                      className={`p-3 border rounded-xl flex items-center justify-between ${
                        hasSOP ? 'bg-neutral-50/50 border-neutral-200/60' : 'bg-red-50/20 border-red-200/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <strong className="block text-neutral-800 font-bold font-sans">{row.name.split(' ')[0]}</strong>
                        <span className="text-[10px] text-neutral-400 block uppercase font-mono">Dibuat oleh: {creatorInfo.label}</span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                        hasSOP ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasSOP ? 'TIDAK KOSONG' : 'BELUM ADA'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
