import React, { useState, useEffect } from 'react';
import { 
  Truck, Calendar, Plus, Trash2, CheckCircle2, ChevronRight, 
  ArrowLeft, Printer, ShieldAlert, Check, X, UserCheck
} from 'lucide-react';
import { DayMenu, UserRole } from '../types';
import { UserProfile } from '../lib/supabase';
import SignaturePad from './SignaturePad';

interface SuratJalanViewProps {
  shippingDocs: any[];
  setShippingDocs: React.Dispatch<React.SetStateAction<any[]>>;
  selectedDate: string;
  loggedInUser?: UserProfile | null;
  currentUserRole: UserRole;
  allDayMenus?: DayMenu[];
}

export default function SuratJalanView({
  shippingDocs,
  setShippingDocs,
  selectedDate,
  loggedInUser,
  currentUserRole,
  allDayMenus = []
}: SuratJalanViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDoc, setActiveDoc] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Signature state for active sheet
  const [activeSigRequest, setActiveSigRequest] = useState<{
    targetField: 'sjSignatureAslap' | 'sjSignatureReceiver';
    title: string;
    suggestedName: string;
  } | null>(null);

  const getPenerimaLocation = (email: string): string => {
    const e = email.toLowerCase().trim();
    if (e === 'ma@qomaruddin.com') return "MA Assa'adah";
    if (e === 'smk@qomaruddin.com') return "SMK Assa'adah";
    if (e === 'sma@qomaruddin.com') return "SMA Assa'adah";
    if (e === 'mts@qomaruddin.com') return "MTS Assa'adah II";
    if (e === 'sukowati@qomaruddin.com') return "Desa Sukowati";
    if (e === 'sidokumpul@qomaruddin.com') return "Desa Sidokumpul";
    return "";
  };

  const restrictedLocation = loggedInUser?.email ? getPenerimaLocation(loggedInUser.email) : "";

  // Filter Surat Jalan docs for the selected date
  let dateDocs = shippingDocs.filter(d => d.type === 'surat_jalan' && d.date === selectedDate);
  if (restrictedLocation) {
    dateDocs = dateDocs.filter(d => d.sjKepada === restrictedLocation);
  }

  // Search filter
  const filteredDocs = dateDocs.filter(d => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (d.sjKepada && d.sjKepada.toLowerCase().includes(s)) ||
      (d.sjNo && d.sjNo.toLowerCase().includes(s)) ||
      (d.sjDriver && d.sjDriver.toLowerCase().includes(s))
    );
  });

  // Keep activeDoc in sync with updated shippingDocs from parent state
  useEffect(() => {
    if (activeDoc) {
      const latest = shippingDocs.find(d => d.id === activeDoc.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(activeDoc)) {
        setActiveDoc(latest);
      }
    }
  }, [shippingDocs]);

  // Auto initialize and select for Penerima
  useEffect(() => {
    if (restrictedLocation) {
      const allSuratJalanForDate = shippingDocs.filter(d => d.type === 'surat_jalan' && d.date === selectedDate);
      if (allSuratJalanForDate.length === 0) {
        handleInitializeSuratJalan();
      } else if (!activeDoc) {
        const matched = allSuratJalanForDate.find(d => d.sjKepada === restrictedLocation);
        if (matched) {
          setActiveDoc(matched);
        }
      }
    }
  }, [restrictedLocation, shippingDocs, selectedDate, activeDoc]);

  const getIndonesianDateText = (dateStr: string) => {
    if (!dateStr) return { dayName: 'Rabu', dateNum: '15', monthName: 'Juli', yearNum: '2026' };
    const dateObj = new Date(dateStr);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1]) - 1;
      const d = parseInt(parts[2]);
      const localDate = new Date(parseInt(y), m, d);
      return {
        dayName: dayNames[localDate.getDay()],
        dateNum: d.toString(),
        monthName: monthNames[m],
        yearNum: y
      };
    }
    return {
      dayName: dayNames[dateObj.getDay()] || 'Rabu',
      dateNum: dateObj.getDate().toString() || '15',
      monthName: monthNames[dateObj.getMonth()] || 'Juli',
      yearNum: dateObj.getFullYear().toString() || '2026'
    };
  };

  const generateAbbrev = (schoolName: string) => {
    const upper = (schoolName || '').toUpperCase();
    if (upper.includes('SMA')) return 'SMA';
    if (upper.includes('SMK')) return 'SMK';
    if (upper.includes('MTS') || upper.includes('TSANAWIYAH')) return 'MTS';
    if (upper.includes('MA')) return 'MA';
    if (upper.includes('SIDOKUMPUL')) return 'DS_SDK';
    if (upper.includes('SUKOWATI')) return 'DS_SKW';
    if (upper.includes('DESA')) return 'DESA';
    return 'LBG';
  };

  // Auto initialize Surat Jalan for 6 locations
  const handleInitializeSuratJalan = () => {
    const currentDayMenu = allDayMenus.find(m => m.date === selectedDate);
    const calculatedPorsi = 265;
    const schools = [
      "MA Assa'adah",
      "MTS Assa'adah II",
      "SMA Assa'adah",
      "SMK Assa'adah",
      "Desa Sidokumpul",
      "Desa Sukowati"
    ];
    const parts = selectedDate.split('-');
    const year = parts[0] || '2026';
    const month = parts[1] || '07';
    const day = parts[2] || '15';

    const newDocs = schools.map((sch, idx) => {
      const abbrev = generateAbbrev(sch);
      const sjNoStr = `${day}/${abbrev}/SJ/MBGQOM/${month}/${year}`;
      const isDesa = sch.toLowerCase().includes('desa');
      return {
        id: `sj-${selectedDate}-${idx}-${Date.now()}`,
        type: 'surat_jalan',
        date: selectedDate,
        vehicleNumber: 'W 1234 BGH',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
        comments: `Dokumen surat jalan pengiriman logistik untuk ${sch}.`,
        uploadedBy: loggedInUser?.email || 'driver@sppg.com',
        uploadedAt: new Date().toISOString(),
        receiverName: sch,
        status: 'Aktif',
        sjNo: sjNoStr,
        sjKepada: sch,
        sjWaktu: '11:00 WIB',
        sjDriver: loggedInUser?.fullName || 'Bpk. Sholeh (Driver)',
        sjRows: [
          { id: '1', jenis: isDesa ? 'Paket Program Makan Bergizi Gratis (Warga Desa)' : 'Paket Program Makan Bergizi Gratis', porsi: calculatedPorsi, alatSebelum: calculatedPorsi, alatSesudah: calculatedPorsi, keterangan: 'Hangat & Lengkap' },
          { id: '2', jenis: 'Buah Melon Potong Segar', porsi: calculatedPorsi, alatSebelum: 0, alatSesudah: 0, keterangan: 'Kondisi Baik' },
          { id: '3', jenis: 'Susu Kotak UHT 125ml', porsi: calculatedPorsi, alatSebelum: 0, alatSesudah: 0, keterangan: 'Karton Utuh' }
        ],
        sjSignatureAslap: '',
        sjSignatureReceiver: ''
      };
    });

    setShippingDocs(prev => [...newDocs, ...prev]);
    setSuccessMsg('Berhasil menginisialisasi 6 Berkas Surat Jalan harian!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Update a single field on the active document
  const handleFieldChange = (field: string, value: any) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, [field]: value };
    setActiveDoc(updated);
    
    // Save to parent list
    setShippingDocs(prev => prev.map(d => d.id === activeDoc.id ? updated : d));
  };

  // Update rows on Surat Jalan table
  const handleRowChange = (rowId: string, cell: string, value: any) => {
    if (!activeDoc) return;
    const updatedRows = (activeDoc.sjRows || []).map((row: any) => {
      if (row.id === rowId) {
        return { ...row, [cell]: value };
      }
      return row;
    });
    handleFieldChange('sjRows', updatedRows);
  };

  // Add custom row to Surat Jalan table
  const handleAddRow = () => {
    if (!activeDoc) return;
    const newRow = {
      id: `row-${Date.now()}`,
      jenis: 'Menu Tambahan / Alat Kirim',
      porsi: 0,
      alatSebelum: 0,
      alatSesudah: 0,
      keterangan: 'Kondisi Baik'
    };
    handleFieldChange('sjRows', [...(activeDoc.sjRows || []), newRow]);
  };

  // Delete a row from Surat Jalan table
  const handleDeleteRow = (rowId: string) => {
    if (!activeDoc) return;
    const updatedRows = (activeDoc.sjRows || []).filter((row: any) => row.id !== rowId);
    handleFieldChange('sjRows', updatedRows);
  };

  // Finalize / Lock Surat Jalan document
  const handleFinalize = () => {
    if (!activeDoc) return;
    if (!activeDoc.sjSignatureAslap || !activeDoc.sjSignatureReceiver) {
      setErrorMsg('Gagal mengunci! Tanda tangan Penanggung Jawab Dapur (Aslap) dan Penerima wajib dilengkapi terlebih dahulu.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    if (confirm('Apakah Anda yakin ingin mengunci Surat Jalan ini secara permanen? Setelah dikunci, data tidak dapat diubah lagi.')) {
      const updated = { ...activeDoc, status: 'Selesai' };
      setActiveDoc(updated);
      setShippingDocs(prev => prev.map(d => d.id === activeDoc.id ? updated : d));
      setSuccessMsg('Berkas Surat Jalan berhasil ditandatangani, disahkan, dan direkap permanen!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Delete a single Surat Jalan doc
  const handleDeleteDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus lembar Surat Jalan ini?')) {
      setShippingDocs(prev => prev.filter(d => d.id !== docId));
      setSuccessMsg('Berkas Surat Jalan berhasil dihapus.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const dateText = getIndonesianDateText(selectedDate);

  // Compute grand totals
  const totalPorsi = activeDoc?.sjRows?.reduce((acc: number, r: any) => acc + (parseInt(r.porsi) || 0), 0) || 0;
  const totalAlatSebelum = activeDoc?.sjRows?.reduce((acc: number, r: any) => acc + (parseInt(r.alatSebelum) || 0), 0) || 0;
  const totalAlatSesudah = activeDoc?.sjRows?.reduce((acc: number, r: any) => acc + (parseInt(r.alatSesudah) || 0), 0) || 0;

  // If viewing a document in full-depth
  if (activeDoc) {
    const isLocked = activeDoc.status === 'Selesai';
    return (
      <div className="space-y-6 animate-fade-in" id="sj-printed-view">
        {/* Sticky Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-3xs print:hidden">
          {!restrictedLocation && (
            <button
              onClick={() => setActiveDoc(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors bg-white px-3 py-2 rounded-xl border border-neutral-200 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Board
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 px-3.5 py-2 rounded-xl border border-neutral-200 cursor-pointer shadow-3xs"
            >
              <Printer className="h-4 w-4" />
              Cetak / Simpan PDF
            </button>

            {!isLocked && (
              <button
                onClick={handleFinalize}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-950 px-4 py-2 rounded-xl cursor-pointer shadow-sm transition-transform active:scale-[0.98]"
              >
                <Check className="h-4 w-4" />
                Kunci & Rekap Surat Jalan
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse print:hidden">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 print:hidden">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Paper Facsimile Document */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-neutral-300 shadow-md max-w-4xl mx-auto font-sans relative overflow-hidden print:border-0 print:shadow-none print:p-0">
          
          {/* Selesai / Terkunci Stamp Accent */}
          {isLocked && (
            <div className="absolute top-10 right-10 border-4 border-emerald-600 text-emerald-600 rounded-xl px-4 py-1.5 font-mono text-xs font-black tracking-widest uppercase rotate-12 select-none z-10 opacity-80 print:top-6 print:right-6">
              ✓ REKAP PERMANEN & SAH
            </div>
          )}

          {/* Document Header */}
          <div className="flex items-center justify-between gap-4 border-b-4 border-double border-neutral-900 pb-4">
            <img 
              src="https://www.bgn.go.id/logo-bgn.png" 
              alt="Logo BGN" 
              className="h-16 w-16 md:h-20 md:w-20 object-contain select-none shrink-0" 
              referrerPolicy="no-referrer"
            />
            <div className="text-center flex-1 space-y-1">
              <h3 className="font-extrabold text-neutral-950 text-xs md:text-sm tracking-wide uppercase">
                YAYASAN PONDOK PESANTREN QOMARUDDIN
              </h3>
              <h2 className="font-black text-neutral-900 text-lg md:text-xl tracking-wider uppercase font-display">
                UNIT DAPUR SPPG BUNGAH 2
              </h2>
              <p className="text-[9px] md:text-[10px] text-neutral-500 italic leading-tight">
                Jl. Raya Bungah No.12, Bungah, Gresik, Jawa Timur — Telp: (031) 3949012
              </p>
            </div>
            <img 
              src="https://qomaruddin.com/wp-content/uploads/2019/02/cropped-logo-qomaruddin-1-192x192.png" 
              alt="Logo PP Qomaruddin" 
              className="h-16 w-16 md:h-20 md:w-20 object-contain select-none shrink-0 border border-neutral-100 p-0.5 rounded-full" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                // In case of any loading failure, fall back to a high quality alternative
                e.currentTarget.src = "https://www.bgn.go.id/logo-bgn.png";
              }}
            />
          </div>

          <div className="text-center my-6 space-y-1">
            <h1 className="font-black text-lg text-neutral-950 tracking-wider underline">
              SURAT JALAN LOGISTIK
            </h1>
            <div className="flex justify-center items-center gap-1.5 text-xs font-semibold">
              <span className="text-neutral-500 uppercase text-[9px] tracking-wider">No. Dokumen:</span>
              {isLocked ? (
                <span className="font-mono font-bold text-neutral-850">{activeDoc.sjNo}</span>
              ) : (
                <input
                  type="text"
                  value={activeDoc.sjNo || ''}
                  onChange={(e) => handleFieldChange('sjNo', e.target.value)}
                  className="font-mono font-bold text-neutral-850 border-b border-dashed border-neutral-300 focus:border-emerald-600 focus:outline-hidden px-1 w-64 text-center text-xs"
                  placeholder="Isi No Surat Jalan..."
                />
              )}
            </div>
          </div>

          {/* Form Fields Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-y border-neutral-300 py-6 mb-6">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-450 uppercase w-32 shrink-0">Kepada Yth. (Sekolah/Desa):</span>
                {isLocked ? (
                  <span className="text-xs font-extrabold text-neutral-850">{activeDoc.sjKepada}</span>
                ) : (
                  <select
                    value={activeDoc.sjKepada || ''}
                    onChange={(e) => handleFieldChange('sjKepada', e.target.value)}
                    className="text-xs font-bold text-neutral-850 border-b border-dashed border-neutral-300 focus:border-emerald-600 focus:outline-hidden w-full"
                  >
                    <option value="MA Assa'adah">MA Assa'adah</option>
                    <option value="MTS Assa'adah II">MTS Assa'adah II</option>
                    <option value="SMA Assa'adah">SMA Assa'adah</option>
                    <option value="SMK Assa'adah">SMK Assa'adah</option>
                    <option value="Desa Sidokumpul">Desa Sidokumpul</option>
                    <option value="Desa Sukowati">Desa Sukowati</option>
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-450 uppercase w-32 shrink-0">Waktu Kirim:</span>
                {isLocked ? (
                  <span className="text-xs font-extrabold text-neutral-850">{activeDoc.sjWaktu}</span>
                ) : (
                  <input
                    type="text"
                    value={activeDoc.sjWaktu || ''}
                    onChange={(e) => handleFieldChange('sjWaktu', e.target.value)}
                    className="text-xs font-bold text-neutral-850 border-b border-dashed border-neutral-300 focus:border-emerald-600 focus:outline-hidden w-full px-1"
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-450 uppercase w-32 shrink-0">Pengemudi (Driver):</span>
                {isLocked ? (
                  <span className="text-xs font-bold text-neutral-800">{activeDoc.sjDriver}</span>
                ) : (
                  <input
                    type="text"
                    value={activeDoc.sjDriver || ''}
                    onChange={(e) => handleFieldChange('sjDriver', e.target.value)}
                    className="text-xs font-bold text-neutral-850 border-b border-dashed border-neutral-300 focus:border-emerald-600 focus:outline-hidden w-full px-1"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-450 uppercase w-32 shrink-0">No Kendaraan:</span>
                {isLocked ? (
                  <span className="text-xs font-mono font-bold text-neutral-850">{activeDoc.vehicleNumber}</span>
                ) : (
                  <input
                    type="text"
                    value={activeDoc.vehicleNumber || ''}
                    onChange={(e) => handleFieldChange('vehicleNumber', e.target.value.toUpperCase())}
                    className="text-xs font-mono font-bold text-neutral-850 border-b border-dashed border-neutral-300 focus:border-emerald-600 focus:outline-hidden w-full px-1 uppercase"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Interactive Goods Table */}
          <div className="space-y-2 mb-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Rincian Muatan Barang Kiriman:</span>
            <div className="border border-neutral-950 overflow-hidden rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-950 text-[10px] font-bold text-center">
                    <th className="p-2.5 border-r border-neutral-950 w-10 text-center">No</th>
                    <th className="p-2.5 border-r border-neutral-950 text-left">Jenis Barang / Logistik</th>
                    <th className="p-2.5 border-r border-neutral-950 w-24">Jumlah Porsi</th>
                    <th className="p-2.5 border-r border-neutral-950 w-20">Alat (Bfr)</th>
                    <th className="p-2.5 border-r border-neutral-950 w-20">Alat (Aft)</th>
                    <th className="p-2.5 border-r border-neutral-950">Keterangan</th>
                    {!isLocked && <th className="p-2.5 w-12 text-center print:hidden">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-950 text-center text-neutral-850">
                  {(activeDoc.sjRows || []).map((row: any, idx: number) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r border-neutral-950 font-mono text-neutral-400 text-center">{idx + 1}</td>
                      <td className="p-1 border-r border-neutral-950 text-left font-medium">
                        {isLocked ? (
                          <span className="px-1.5">{row.jenis}</span>
                        ) : (
                          <input
                            type="text"
                            value={row.jenis}
                            onChange={(e) => handleRowChange(row.id, 'jenis', e.target.value)}
                            className="w-full border-0 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-xs"
                          />
                        )}
                      </td>
                      <td className="p-1 border-r border-neutral-950 font-semibold text-neutral-800">
                        {isLocked ? (
                          <span>{row.porsi}</span>
                        ) : (
                          <input
                            type="number"
                            value={row.porsi}
                            onChange={(e) => handleRowChange(row.id, 'porsi', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-1 focus:ring-emerald-700 text-center rounded py-1 text-xs font-semibold"
                          />
                        )}
                      </td>
                      <td className="p-1 border-r border-neutral-950">
                        {isLocked ? (
                          <span>{row.alatSebelum}</span>
                        ) : (
                          <input
                            type="number"
                            value={row.alatSebelum}
                            onChange={(e) => handleRowChange(row.id, 'alatSebelum', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-1 focus:ring-emerald-700 text-center rounded py-1 text-xs"
                          />
                        )}
                      </td>
                      <td className="p-1 border-r border-neutral-950">
                        {isLocked ? (
                          <span>{row.alatSesudah}</span>
                        ) : (
                          <input
                            type="number"
                            value={row.alatSesudah}
                            onChange={(e) => handleRowChange(row.id, 'alatSesudah', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-1 focus:ring-emerald-700 text-center rounded py-1 text-xs"
                          />
                        )}
                      </td>
                      <td className="p-1 border-r border-neutral-950 text-left">
                        {isLocked ? (
                          <span className="px-1.5">{row.keterangan}</span>
                        ) : (
                          <input
                            type="text"
                            value={row.keterangan}
                            onChange={(e) => handleRowChange(row.id, 'keterangan', e.target.value)}
                            className="w-full border-0 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-xs"
                          />
                        )}
                      </td>
                      {!isLocked && (
                        <td className="p-1 text-center print:hidden">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-neutral-400 hover:text-red-600 p-1 rounded-sm cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {/* Grand Totals Row */}
                  <tr className="bg-neutral-50/50 font-black border-t-2 border-neutral-950 text-neutral-950">
                    <td className="p-2.5 border-r border-neutral-950 text-center" colSpan={2}>GRAND TOTAL</td>
                    <td className="p-2.5 border-r border-neutral-950 font-mono">{totalPorsi} Box</td>
                    <td className="p-2.5 border-r border-neutral-950 font-mono">{totalAlatSebelum} Koli</td>
                    <td className="p-2.5 border-r border-neutral-950 font-mono">{totalAlatSesudah} Koli</td>
                    <td className="p-2.5 text-left italic font-normal text-neutral-500" colSpan={isLocked ? 1 : 2}>
                      Beban alat terpenuhi otomatis.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {!isLocked && (
              <button
                onClick={handleAddRow}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 self-start mt-1 print:hidden"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Baris Barang Baru
              </button>
            )}
          </div>

          <div className="space-y-2 mb-8">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Catatan Driver / Aslap:</span>
            {isLocked ? (
              <p className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs text-neutral-700 italic font-mono leading-relaxed">
                "{activeDoc.comments}"
              </p>
            ) : (
              <textarea
                value={activeDoc.comments || ''}
                onChange={(e) => handleFieldChange('comments', e.target.value)}
                rows={3}
                className="w-full text-xs font-mono text-neutral-700 p-3 bg-neutral-50 hover:bg-neutral-100 focus:bg-white rounded-xl border border-neutral-200 focus:border-emerald-600 focus:outline-hidden resize-none"
                placeholder="Tulis catatan operasional logistik lainnya..."
              />
            )}
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs mt-8 pt-6 border-t border-neutral-200">
            {/* Penganggung Jawab Dapur (Aslap) */}
            <div className="space-y-4 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                PENGANGGUNG JAWAB DAPUR<br /><span className="text-[8px] text-neutral-400">(Asisten Lapangan)</span>
              </span>

              <div className="w-48 h-24 border border-dashed border-neutral-300 rounded-xl bg-neutral-50/50 flex flex-col items-center justify-center relative overflow-hidden group">
                {activeDoc.sjSignatureAslap ? (
                  <>
                    <img
                      src={activeDoc.sjSignatureAslap}
                      alt="Ttd Aslap"
                      className="max-h-full max-w-full object-contain"
                    />
                    {!isLocked && (
                      <button
                        onClick={() => handleFieldChange('sjSignatureAslap', '')}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer print:hidden"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setActiveSigRequest({
                      targetField: 'sjSignatureAslap',
                      title: 'Tanda Tangan Penanggung Jawab Dapur (Aslap)',
                      suggestedName: loggedInUser?.fullName || 'Ust. Maghfur Munif, S.Pd'
                    })}
                    className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <UserCheck className="h-4 w-4" />
                    Klik Bubuhkan Ttd
                  </button>
                )}
              </div>

              <div className="border-b border-neutral-900 w-44 font-bold text-neutral-900 uppercase">
                {loggedInUser?.fullName || 'Ust. Maghfur Munif, S.Pd'}
              </div>
            </div>

            {/* Penerima Sekolah */}
            <div className="space-y-4 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                PENERIMA SEKOLAH / ASRAMA<br /><span className="text-[8px] text-neutral-400">(Seksi Humas/Logistik)</span>
              </span>

              <div className="w-48 h-24 border border-dashed border-neutral-300 rounded-xl bg-neutral-50/50 flex flex-col items-center justify-center relative overflow-hidden group">
                {activeDoc.sjSignatureReceiver ? (
                  <>
                    <img
                      src={activeDoc.sjSignatureReceiver}
                      alt="Ttd Receiver"
                      className="max-h-full max-w-full object-contain"
                    />
                    {!isLocked && (
                      <button
                        onClick={() => handleFieldChange('sjSignatureReceiver', '')}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer print:hidden"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setActiveSigRequest({
                      targetField: 'sjSignatureReceiver',
                      title: 'Tanda Tangan Penerima Sekolah',
                      suggestedName: activeDoc.sjKepada
                    })}
                    className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <UserCheck className="h-4 w-4" />
                    Klik Bubuhkan Ttd
                  </button>
                )}
              </div>

              <div className="border-b border-neutral-900 w-44 font-bold text-neutral-900 uppercase">
                Penerima {activeDoc.sjKepada}
              </div>
            </div>
          </div>

        </div>

        {/* Signature Drawer Pad overlay */}
        {activeSigRequest && (
          <SignaturePad
            title={activeSigRequest.title}
            suggestedName={activeSigRequest.suggestedName}
            onSave={(signatureDataUrl) => {
              handleFieldChange(activeSigRequest.targetField, signatureDataUrl);
              setActiveSigRequest(null);
            }}
            onCancel={() => setActiveSigRequest(null)}
          />
        )}
      </div>
    );
  }

  // Dashboard / List View
  return (
    <div className="space-y-6 animate-fade-in" id="sj-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
              <Truck className="h-6 w-6 text-emerald-700 shrink-0" />
              Arsip Lembar Surat Jalan Logistik
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
              SOP-Aligned
            </span>
          </div>
          <p className="text-sm text-neutral-500">Lembar legalisasi perjalanan logistik dwi-harian, mencakup berat muatan, nomor segel kirim, dan porsi box hidangan.</p>
        </div>

        {dateDocs.length > 0 && (
          <button
            onClick={handleInitializeSuratJalan}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Re-Inisialisasi Surat Jalan
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Primary SOP-Like Checklist Dashboard */}
      {dateDocs.length === 0 ? (
        <div className="p-16 border border-neutral-200 rounded-3xl bg-white text-center space-y-4 max-w-2xl mx-auto shadow-2xs">
          <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto animate-bounce" />
          <div className="space-y-1.5">
            <h4 className="text-neutral-700 font-bold text-sm">Surat Jalan Belum Dirilis untuk Hari Ini</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Lembar Surat Jalan pengiriman logistik untuk 6 lokasi sasaran belum diinisialisasi untuk tanggal {selectedDate}.
            </p>
          </div>
          <button
            onClick={handleInitializeSuratJalan}
            className="bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold px-6 py-3 rounded-xl text-center inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
          >
            <Plus className="h-4 w-4" />
            + Inisialisasi 6 Surat Jalan Hari Ini
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">
              Daftar Surat Jalan Sekolah ({filteredDocs.length} Berkas)
            </h3>
            
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Cari sekolah, driver, No Surat Jalan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-neutral-200 rounded-xl pl-8 pr-3 py-2 bg-neutral-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-neutral-800"
              />
              <span className="absolute left-2.5 top-2.5 text-neutral-400">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => {
              const hasAslapSig = !!doc.sjSignatureAslap;
              const hasReceiverSig = !!doc.sjSignatureReceiver;
              const isDone = doc.status === 'Selesai';
              
              return (
                <div
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className="bg-white hover:border-emerald-600 border border-neutral-200/80 rounded-2xl p-5 shadow-3xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between min-h-[175px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-neutral-400 font-mono block uppercase tracking-wider">SURAT JALAN</span>
                        <h4 className="font-bold text-sm text-neutral-800 group-hover:text-emerald-800 transition-colors">
                          {doc.sjKepada}
                        </h4>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isDone ? 'TERKUNCI' : 'AKTIF'}
                      </span>
                    </div>

                    <p className="text-[10px] font-mono text-neutral-500 mt-2 block overflow-hidden text-ellipsis whitespace-nowrap">
                      No: {doc.sjNo}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Muatan: <strong className="text-neutral-700">{(doc.sjRows || []).length} Baris Logistik</strong> | Driver: {doc.sjDriver}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>Tanda Tangan:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={hasAslapSig ? 'text-emerald-700' : 'text-neutral-400'}>Aslap {hasAslapSig ? '✓' : '✗'}</span>
                        <span>•</span>
                        <span className={hasReceiverSig ? 'text-emerald-700' : 'text-neutral-400'}>Penerima {hasReceiverSig ? '✓' : '✗'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {!isDone && (
                        <button
                          onClick={(e) => handleDeleteDoc(doc.id, e)}
                          className="text-neutral-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                          title="Hapus berkas Surat Jalan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      
                      <span className="text-[9px] text-emerald-800 font-extrabold uppercase tracking-wider flex items-center gap-0.5 ml-auto">
                        {isDone ? 'Buka Berkas 📄' : 'Kelola & Isi ✍️'} 
                        <ChevronRight className="h-3 w-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
