import React, { useState } from 'react';
import { 
  ArrowLeft, Printer, Download, Plus, Check, Save, Clock, HelpCircle, UserCheck, Trash2
} from 'lucide-react';
import { SOPDocument, Division, UserRole } from '../types';
import SignaturePad from './SignaturePad';

interface SOPChecklistViewProps {
  sop: SOPDocument;
  menuList: string[];
  currentUserRole: UserRole;
  currentUsername: string;
  onUpdateSOP: (updatedSOP: SOPDocument) => void;
  onBack: () => void;
  isCoordinator?: boolean;
}

export default function SOPChecklistView({ 
  sop, 
  menuList, 
  currentUserRole, 
  currentUsername, 
  onUpdateSOP, 
  onBack,
  isCoordinator = false
}: SOPChecklistViewProps) {
  const [activeSignType, setActiveSignType] = useState<'supervisor' | 'coordinator' | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'persiapan' | 'aktif' | 'penutup'>('aktif');
  const [isExporting, setIsExporting] = useState(false);

  const handleToggleTask = (taskId: string) => {
    if (sop.status === 'selesai') return; // Cannot modify if finalized
    
    const updatedTasks = sop.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    const isCheckedAll = updatedTasks.every(t => t.completed);
    
    onUpdateSOP({
      ...sop,
      tasks: updatedTasks,
      isCheckedAll,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || sop.status === 'selesai') return;

    const newTask = {
      id: `${sop.division}-custom-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      category: newTaskCategory
    };

    onUpdateSOP({
      ...sop,
      tasks: [...sop.tasks, newTask],
      isCheckedAll: false,
      updatedAt: new Date().toISOString()
    });

    setNewTaskText('');
  };

  const handleDeleteTask = (taskId: string) => {
    if (sop.status === 'selesai') return;
    
    const updatedTasks = sop.tasks.filter(t => t.id !== taskId);
    const isCheckedAll = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
    
    onUpdateSOP({
      ...sop,
      tasks: updatedTasks,
      isCheckedAll,
      updatedAt: new Date().toISOString()
    });
  };

  const handleOpenSignaturePad = (type: 'supervisor' | 'coordinator') => {
    setActiveSignType(type);
  };

  const handleSaveSignature = (dataUrl: string) => {
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    if (activeSignType === 'supervisor') {
      onUpdateSOP({
        ...sop,
        signatureSupervisorUrl: dataUrl,
        signedSupervisorAt: timestamp,
        signerSupervisor: currentUsername || sop.signerSupervisor,
        updatedAt: new Date().toISOString()
      });
    } else if (activeSignType === 'coordinator') {
      onUpdateSOP({
        ...sop,
        signatureCoordinatorUrl: dataUrl,
        signedCoordinatorAt: timestamp,
        signerCoordinator: currentUsername || sop.signerCoordinator,
        updatedAt: new Date().toISOString()
      });
    }
    
    setActiveSignType(null);
  };

  const handleFinalizeSOP = () => {
    if (!sop.signatureSupervisorUrl || !sop.signatureCoordinatorUrl) {
      alert('Kedua tanda tangan (Pemberi SOP & Koordinator Divisi) wajib dibubuhkan sebelum mengunci SOP!');
      return;
    }

    if (confirm('Apakah Anda yakin ingin mengunci SOP ini? Berkas yang dikunci akan direkap permanen dan tidak dapat diedit kembali.')) {
      onUpdateSOP({
        ...sop,
        status: 'selesai',
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDFMock = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      
      // We will create a formatted text/document export containing the SOP details
      const docHeader = `STANDAR OPERASIONAL PROSEDUR (SOP) DIGITAL SPPG QOMARUDDIN\n`;
      const docDiv = `DIVISI: ${sop.division.toUpperCase()}\n`;
      const docDate = `HARI, TANGGAL: ${formatIndoDate(sop.date)}\n`;
      const docMenu = `MENU HARIAN: ${menuList.join(', ')}\n\n`;
      const docTasks = sopsByCategory('persiapan').map((t, i) => `[${t.completed ? 'X' : ' '}] Persiapan: ${t.text}`).join('\n') + '\n' +
                       sopsByCategory('aktif').map((t, i) => `[${t.completed ? 'X' : ' '}] Tugas Aktif: ${t.text}`).join('\n') + '\n' +
                       sopsByCategory('penutup').map((t, i) => `[${t.completed ? 'X' : ' '}] Penutup: ${t.text}`).join('\n');
      
      const docFooter = `\n\nMengetahui,\nSupervisor/Maker: ${sop.signerSupervisor} (${sop.signedSupervisorAt || 'BELUM TTD'})\nKoordinator: ${sop.signerCoordinator} (${sop.signedCoordinatorAt || 'BELUM TTD'})`;
      
      const blob = new Blob([docHeader + docDiv + docDate + docMenu + docTasks + docFooter], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SOP_${sop.division.split(' ')[0]}_${sop.date}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }, 1200);
  };

  // Helper date formatter
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${parts[2]} ${months[date.getMonth()]} ${parts[0]}`;
  };

  const getDayOnlyStr = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${parts[2]} ${months[date.getMonth()]} ${parts[0]}`;
  };

  // Filter tasks by category
  const sopsByCategory = (cat: 'persiapan' | 'aktif' | 'penutup') => {
    return sop.tasks.filter(t => t.category === cat);
  };

  // Check which divisions are being shown for printing headings
  const getDivisionHeadingName = (div: Division) => {
    switch (div) {
      case Division.STOCKING: return 'TIM PERSIPAN';
      case Division.MASAK: return 'TIM MASAK';
      case Division.PEMORSIAN: return 'TIM PEMORSIAN';
      case Division.DRIVER: return 'TIM DRIVER (DISTRIBUSI)';
      case Division.CUCI: return 'TIM CUCI OMPRENG';
      case Division.KEBERSIHAN: return 'TIM SANITASI & KEBERSIHAN';
      case Division.KEAMANAN: return 'TIM SECURITY & UTILITY';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper navigation actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
        {isCoordinator ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Halaman Kerja SOP Digital - {sop.division}
          </div>
        ) : (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-white border border-neutral-200 hover:bg-neutral-50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak Berkas (Print)
          </button>
          <button
            onClick={handleDownloadPDFMock}
            disabled={isExporting}
            className="bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Mengekspor...' : 'Unduh Digital Log'}
          </button>
          
          {sop.status !== 'selesai' && (
            <button
              onClick={handleFinalizeSOP}
              disabled={!sop.signatureSupervisorUrl || !sop.signatureCoordinatorUrl}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                sop.signatureSupervisorUrl && sop.signatureCoordinatorUrl
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              Kunci & Rekap SOP
            </button>
          )}
        </div>
      </div>

      {sop.status === 'selesai' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 no-print">
          <UserCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <span>
            <strong>SOP Berhasil Dikunci!</strong> SOP ini telah disetujui secara resmi oleh Supervisor dan Koordinator Divisi, serta telah tersimpan permanen di bank rekapitulasi dapur.
          </span>
        </div>
      )}

      {sop.status !== 'selesai' && (!sop.signatureSupervisorUrl || !sop.signatureCoordinatorUrl) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 no-print">
          <Clock className="h-5 w-5 text-amber-700 shrink-0" />
          <span>
            <strong>Belum Ditandatangani!</strong> Silakan centang tugas harian yang selesai, lalu bubuhkan tanda tangan di bagian paling bawah untuk memvalidasi kerja harian ini.
          </span>
        </div>
      )}

      {/* PRINT-READY CONTAINER / HARDCOPY PAPER SHEET */}
      <div className="print-area print-container bg-white border border-neutral-300 shadow-lg max-w-3xl mx-auto rounded-none p-4 xs:p-5 sm:p-8 md:p-12 font-serif text-neutral-900 leading-relaxed relative overflow-x-auto sm:overflow-visible">
        {/* Paper Watermark for authentic printing feel */}
        <div className="absolute top-2 right-4 text-[9px] font-mono tracking-widest text-neutral-300 no-print">
          ID BERKAS: {sop.id} / {sop.status === 'selesai' ? 'VERIFIED' : 'ACTIVE_LOG'}
        </div>

        {/* Paper Header */}
        <div className="flex items-center gap-4 border-b-2 border-black pb-5 mb-6">
          {/* Authentic National Nutrition Board Logo (Badan Gizi Nasional) in CSS SVG */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 bg-transparent flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Outer Golden Circle Ring */}
              <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#c5a84b" strokeWidth="3" />
              {/* Inner blue ring casing */}
              <circle cx="50" cy="50" r="40" fill="#1e40af" stroke="#ffffff" strokeWidth="1.5" />
              {/* Garuda Eagle Core Shape (Abstract elegant stylized vector) */}
              <path d="M50,15 L52,25 L65,18 L60,30 L75,28 L65,40 L80,48 L65,52 L75,65 L58,60 L62,75 L50,65 L38,75 L42,60 L25,65 L35,52 L20,48 L35,40 L25,28 L40,30 L35,18 L48,25 Z" fill="#eab308" />
              {/* Red-White Shield on the breast */}
              <rect x="44" y="40" width="12" height="12" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
              <path d="M44,46 L56,46 L56,52 L50,55 L44,52 Z" fill="#ffffff" stroke="#ffffff" strokeWidth="0.5" />
              <circle cx="50" cy="46" r="2.5" fill="#000000" />
              {/* Outer Text Circle arch */}
              <defs>
                <path id="textPath" d="M 50,5 A 45,45 0 0,1 50,95" fill="none" />
              </defs>
              <text fill="#ffffff" fontSize="5.5" fontWeight="bold" letterSpacing="0.8">
                <textPath href="#textPath" startOffset="50%" textAnchor="middle">
                  BADAN GIZI NASIONAL
                </textPath>
              </text>
            </svg>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-widest text-[#0c2448] uppercase leading-none">
              STANDAR OPERASIONAL PROSEDUR
            </h1>
            <h2 className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wider text-neutral-800 uppercase leading-none mt-1">
              SPPG GRESIK BUNGAH BUNGAH 2
            </h2>
            <h3 className="text-[9px] sm:text-xs font-semibold tracking-wide text-neutral-700 uppercase leading-snug mt-1">
              YAYASAN PONDOK PESANTREN QOMARUDDIN
            </h3>
            <div className="h-0.5 bg-black/80 w-full mt-1.5"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] font-semibold text-neutral-600 pt-1 font-mono uppercase gap-1">
              <span>DIVISI: {sop.division}</span>
              <span className="text-black font-bold border border-black px-2 py-0.5 bg-neutral-100 rounded-sm self-start sm:self-auto">
                {getDivisionHeadingName(sop.division)}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid (Menu & Date) */}
        <table className="w-full border-2 border-black border-collapse text-xs md:text-sm print-table mb-6">
          <tbody>
            <tr className="border-b border-black flex flex-col sm:table-row">
              <td className="w-full sm:w-1/3 py-3 px-3 sm:px-4 font-bold bg-neutral-50/70 border-b sm:border-b-0 border-r-0 sm:border-r border-black select-none block sm:table-cell">
                Menu Hari
                <div className="text-xs font-normal text-neutral-500 font-serif mt-1">
                  Untuk Tanggal Masak:
                  <div className="font-bold text-black mt-0.5">{getDayOnlyStr(sop.date)}</div>
                </div>
              </td>
              <td className="w-full sm:w-2/3 py-3 px-3 sm:px-4 block sm:table-cell">
                <ol className="list-decimal list-inside space-y-1 font-sans text-neutral-800">
                  {menuList.length > 0 ? (
                    menuList.map((item, index) => (
                      <li key={index} className="font-medium text-[13px] whitespace-normal break-words">
                        {item}
                      </li>
                    ))
                  ) : (
                    <span className="italic text-neutral-400">Ahli Gizi Belum Memperinci Menu Hari Ini</span>
                  )}
                </ol>
              </td>
            </tr>

            {/* Checklist Header Row */}
            <tr className="border-b border-black bg-neutral-100 text-xs uppercase tracking-wide font-bold flex flex-col sm:table-row">
              <td colSpan={2} className="py-2 px-3 sm:px-4 block sm:table-cell select-none">
                INSTRUKSI & TUGAS HARIAN LAPANGAN
              </td>
            </tr>

            {/* Checklist Items Row */}
            <tr className="flex flex-col sm:table-row">
              <td className="w-full sm:w-1/3 py-3 sm:py-4 px-3 sm:px-4 font-bold bg-neutral-50/70 border-b sm:border-b-0 border-r-0 sm:border-r border-black select-none align-top block sm:table-cell">
                Tugas Harian
              </td>
              <td className="w-full sm:w-2/3 py-3 sm:py-4 px-3 sm:px-4 block sm:table-cell">
                <div className="space-y-6">
                  {/* Category 1: Persiapan (General) */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b pb-1 font-sans">
                      I. Tahap Persiapan & K3
                    </h4>
                    <div className="space-y-2">
                      {sopsByCategory('persiapan').map((task) => (
                        <div key={task.id} className="flex items-start gap-2.5 sm:gap-3 group">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                            disabled={sop.status === 'selesai'}
                            className="mt-0.5 h-4.5 w-4.5 accent-emerald-800 rounded-sm border-neutral-300 focus:ring-emerald-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex-1 flex justify-between gap-2 min-w-0">
                            <span className={`text-[12.5px] font-medium leading-relaxed font-sans whitespace-normal break-words block flex-1 ${task.completed ? 'line-through text-neutral-400 font-normal' : 'text-neutral-800'}`}>
                              {task.text}
                            </span>
                            {sop.status !== 'selesai' && task.id.includes('custom') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 h-5 w-5 no-print shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: Tugas Aktif (Specific) */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b pb-1 font-sans">
                      II. Tugas Inti Aktif Hari Ini
                    </h4>
                    <div className="space-y-2">
                      {sopsByCategory('aktif').map((task) => (
                        <div key={task.id} className="flex items-start gap-2.5 sm:gap-3 group">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                            disabled={sop.status === 'selesai'}
                            className="mt-0.5 h-4.5 w-4.5 accent-emerald-800 rounded-sm border-neutral-300 focus:ring-emerald-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex-1 flex justify-between gap-2 min-w-0">
                            <span className={`text-[12.5px] font-medium leading-relaxed font-sans whitespace-normal break-words block flex-1 ${task.completed ? 'line-through text-neutral-400 font-normal' : 'text-neutral-800'}`}>
                              {task.text}
                            </span>
                            {sop.status !== 'selesai' && task.id.includes('custom') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 h-5 w-5 no-print shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 3: Penutup (Cleanup) */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b pb-1 font-sans">
                      III. Tahap Penutupan & Resanitasi
                    </h4>
                    <div className="space-y-2">
                      {sopsByCategory('penutup').map((task) => (
                        <div key={task.id} className="flex items-start gap-2.5 sm:gap-3 group">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                            disabled={sop.status === 'selesai'}
                            className="mt-0.5 h-4.5 w-4.5 accent-emerald-800 rounded-sm border-neutral-300 focus:ring-emerald-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex-1 flex justify-between gap-2 min-w-0">
                            <span className={`text-[12.5px] font-medium leading-relaxed font-sans whitespace-normal break-words block flex-1 ${task.completed ? 'line-through text-neutral-400 font-normal' : 'text-neutral-800'}`}>
                              {task.text}
                            </span>
                            {sop.status !== 'selesai' && task.id.includes('custom') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 h-5 w-5 no-print shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inline Task Adder form (Only when document is active) */}
                {sop.status !== 'selesai' && (
                  <form onSubmit={handleAddTask} className="mt-6 pt-5 border-t border-dashed border-neutral-200 no-print">
                     <h5 className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-2">
                       + Sisipkan Instruksi Tambahan Khusus
                     </h5>
                     <div className="flex flex-col sm:flex-row gap-2">
                       <select 
                         value={newTaskCategory}
                         onChange={e => setNewTaskCategory(e.target.value as any)}
                         className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 w-full sm:w-auto"
                       >
                         <option value="persiapan">I. Persiapan</option>
                         <option value="aktif">II. Tugas Inti</option>
                         <option value="penutup">III. Penutup</option>
                       </select>
                       <input
                         type="text"
                         placeholder="Tulis tugas (mis. Iris timba bumbu sisa kunyit 250gr)..."
                         value={newTaskText}
                         onChange={e => setNewTaskText(e.target.value)}
                         className="flex-1 text-xs border border-neutral-200 bg-neutral-50/50 rounded-lg px-3 py-1.5 outline-hidden focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-auto"
                       />
                       <button
                         type="submit"
                         className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
                       >
                         <Plus className="h-3.5 w-3.5" />
                         Tambah
                       </button>
                     </div>
                  </form>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Paper Signatures Section ("Mengetahui") */}
        <div className="mt-8 border-t border-black pt-6">
          <h4 className="text-center font-bold text-xs uppercase tracking-widest mb-6 select-none">
            Mengetahui / Menyetujui
          </h4>
          
          <div className="grid grid-cols-2 gap-10 text-center text-xs md:text-sm">
            {/* Left signature: Maker / Supervisor */}
            <div className="flex flex-col items-center justify-between min-h-[160px] relative">
              <span className="font-bold uppercase tracking-wider text-neutral-700 select-none">
                {sop.creatorRole.replace(' / Juru Masak', '')} (Pemberi SOP)
              </span>
              
              {sop.signatureSupervisorUrl ? (
                <div className="my-2 border border-emerald-100 rounded-sm bg-emerald-50/10 p-1 relative h-20 flex flex-col items-center justify-center">
                  <img 
                    src={sop.signatureSupervisorUrl} 
                    alt="TTD Supervisor" 
                    className="max-h-full max-w-[160px] object-contain sig-canvas"
                  />
                  <div className="absolute bottom-0 text-[8px] font-mono select-none px-1 py-0.5 bg-emerald-900/10 text-emerald-800 w-full text-center">
                    Signed: {sop.signedSupervisorAt}
                  </div>
                </div>
              ) : (
                <div className="my-2 flex flex-col items-center gap-2 no-print">
                  <div className="h-16 w-36 border border-dashed border-neutral-200 rounded-lg flex items-center justify-center bg-neutral-50">
                    <span className="text-[10px] text-neutral-400 italic">Belum Ditandatangani</span>
                  </div>
                  {isCoordinator ? (
                    <span className="text-[10px] text-neutral-400 italic bg-neutral-100 text-neutral-500 py-1.5 px-3 rounded-md font-sans font-medium border border-neutral-200/50">
                      Hanya untuk Supervisor
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenSignaturePad('supervisor')}
                      className="bg-emerald-800/90 hover:bg-emerald-800 text-white text-[10px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider"
                    >
                      Bubuhkan TTD
                    </button>
                  )}
                </div>
              )}

              <div className="w-full">
                <input
                  type="text"
                  value={sop.signerSupervisor}
                  onChange={e => {
                    if (sop.status === 'selesai') return;
                    onUpdateSOP({ ...sop, signerSupervisor: e.target.value });
                  }}
                  disabled={sop.status === 'selesai'}
                  className="font-bold text-center border-b border-black border-dashed w-3/4 mx-auto block pb-0.5 outline-hidden focus:border-emerald-600 bg-transparent text-sm"
                  placeholder="Nama Penanggung Jawab"
                />
                <span className="text-[10px] text-neutral-500 uppercase font-mono block mt-0.5 select-none">
                  Head Office / SPPG
                </span>
              </div>
            </div>

            {/* Right signature: Division Coordinator */}
            <div className="flex flex-col items-center justify-between min-h-[160px] relative">
              <span className="font-bold uppercase tracking-wider text-neutral-700 select-none">
                Koordinator Divisi ({sop.division.split(' ')[0]})
              </span>
              
              {sop.signatureCoordinatorUrl ? (
                <div className="my-2 border border-emerald-100 rounded-sm bg-emerald-50/10 p-1 relative h-20 flex flex-col items-center justify-center">
                  <img 
                    src={sop.signatureCoordinatorUrl} 
                    alt="TTD Koordinator" 
                    className="max-h-full max-w-[160px] object-contain sig-canvas"
                  />
                  <div className="absolute bottom-0 text-[8px] font-mono select-none px-1 py-0.5 bg-emerald-900/10 text-emerald-800 w-full text-center">
                    Signed: {sop.signedCoordinatorAt}
                  </div>
                </div>
              ) : (
                <div className="my-2 flex flex-col items-center gap-2 no-print">
                  <div className="h-16 w-36 border border-dashed border-neutral-200 rounded-lg flex items-center justify-center bg-neutral-50">
                    <span className="text-[10px] text-neutral-400 italic">Belum Ditandatangani</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenSignaturePad('coordinator')}
                    className="bg-emerald-800/90 hover:bg-emerald-800 text-white text-[10px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider"
                  >
                    Bubuhkan TTD
                  </button>
                </div>
              )}

              <div className="w-full">
                <input
                  type="text"
                  value={sop.signerCoordinator}
                  onChange={e => {
                    if (sop.status === 'selesai') return;
                    onUpdateSOP({ ...sop, signerCoordinator: e.target.value });
                  }}
                  disabled={sop.status === 'selesai'}
                  className="font-bold text-center border-b border-black border-dashed w-3/4 mx-auto block pb-0.5 outline-hidden focus:border-emerald-600 bg-transparent text-sm"
                  placeholder="Nama Koordinator Lapangan"
                />
                <span className="text-[10px] text-neutral-500 uppercase font-mono block mt-0.5 select-none">
                  Pelaksana Dapur
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Popup modal */}
      {activeSignType && (
        <SignaturePad
          title={`Bubuhkan TTD - ${activeSignType === 'supervisor' ? 'Pemberi SOP (Supervisor)' : 'Koordinator Lapangan'}`}
          suggestedName={activeSignType === 'supervisor' ? sop.signerSupervisor : sop.signerCoordinator}
          onSave={handleSaveSignature}
          onCancel={() => setActiveSignType(null)}
        />
      )}
    </div>
  );
}
