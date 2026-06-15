import React, { useState } from 'react';
import { 
  Package, Wrench, ShieldCheck, ShoppingCart, Truck, Calendar, Sparkles,
  Camera, Users, FileText, CheckCircle, Search, AlertCircle, Plus, ClipboardCheck, ArrowRight
} from 'lucide-react';

interface MockModulesProps {
  moduleIndex: number;
  onSetMenu: (date: string, items: string[]) => void;
}

export default function MockModules({ moduleIndex, onSetMenu }: MockModulesProps) {
  // Common states
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Forms states
  const [formData, setFormData] = useState<Record<string, string>>({});

  const triggerSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const currentYear = 2026;

  // Render correct mockup based on index (1-based to match the user's 1-14 numbering)
  switch (moduleIndex) {
    case 1: // Stok Bahan Sisa
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                <Package className="h-6 w-6 text-emerald-700" />
                Stok Bahan Sisa (Dapur Basah & Kering)
              </h2>
              <p className="text-xs text-neutral-500">Pencatatan sisa bahan setelah proses pemorsian untuk efisiensi limbah (zero waste).</p>
            </div>
            <button 
              onClick={() => triggerSuccessMsg("Form Pencatatan Stok Sisa berhasil dibuka!")}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Tambah Data Sisa
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs text-neutral-500 font-semibold uppercase">
                  <th className="py-3 px-4">Nama Bahan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Jumlah Sisa</th>
                  <th className="py-3 px-4">Kondisi / Kelayakan</th>
                  <th className="py-3 px-4">Rencana Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {[
                  { name: 'Karkas Ayam Broiler', cat: 'Protein Basah', qty: '4.5 Kg', cond: 'Sangat Segar (Chiller)', action: 'Masuk Menu Masak Esok Hari' },
                  { name: 'Bawang Merah Kupas', cat: 'Bumbu Dapur', qty: '12.0 Kg', cond: 'Kering, Bagus', action: 'Gunakan untuk Stocking Persiapan' },
                  { name: 'Timun Lokal', cat: 'Sayur Segar', qty: '3.5 Kg', cond: 'Segar', action: 'Garnish/Lalapan Makan Malam' },
                  { name: 'Tempe Blok Premium', cat: 'Lauk Nabati', qty: '8 Batang', cond: 'Suasana Sangat Segar', action: 'Goreng Crispy Sore Ini' },
                  { name: 'Cabai Rawit Merah sisa', cat: 'Bumbu Dapur', qty: '2.1 Kg', cond: 'Sedikit Layu', action: 'Langsung blender bumbu halus' }
                ].filter(it => it.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-4 font-medium text-neutral-900">{item.name}</td>
                    <td className="py-3 px-4 text-xs text-neutral-500">{item.cat}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">{item.qty}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] uppercase tracking-wide font-black px-2 py-0.5 rounded-full border border-emerald-100">
                        {item.cond}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-serif text-neutral-600">{item.action}</td>
                  </tr>
                ))}
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
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-emerald-700" />
              Pemesanan & Requisition {isAlat ? 'Peralatan Baru' : 'Kebutuhan Operasional'}
            </h2>
            <p className="text-xs text-neutral-500">Ajukan pengadaan {isAlat ? 'peralatan masak baru atau pengganti komponen' : 'bahan bakar gas, sabun cuci, masker, dan serba-serbi operasional'}.</p>
          </div>

          <form onSubmit={e => {
            e.preventDefault();
            triggerSuccessMsg(`Pemesanan ${isAlat ? 'Alat' : 'Operasional'} berhasil dikirim ke Admin Pusat SPPG Qomaruddin!`);
            setFormData({});
          }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Nama Barang yang Diminta</label>
              <input 
                type="text" 
                required
                value={formData.itemName || ''}
                onChange={e => setFormData({...formData, itemName: e.target.value})}
                placeholder={isAlat ? 'Contoh: Mixer Adonan Kue 5Kg' : 'Contoh: Sabun Cuci Piring Jerigen 20L'}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Jumlah (Qty)</label>
              <input 
                type="text" 
                required
                value={formData.qty || ''}
                onChange={e => setFormData({...formData, qty: e.target.value})}
                placeholder="Contoh: 2 Unit / 5 Jerigen" 
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Alasan Pengadaan & Spesifikasi Teknis</label>
              <textarea 
                rows={3} 
                required
                value={formData.reason || ''}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                placeholder="Jelaskan kebutuhan mendesak / spesifikasi detail barang agar diverifikasi oleh Admin..."
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50"
              />
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2.5 px-6 rounded-lg text-sm w-full transition-colors uppercase tracking-wide"
              >
                Kirim Pengajuan Pengadaan
              </button>
            </div>
          </form>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> {successMsg}
            </div>
          )}
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

    case 10: // Menu Harian
      return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-emerald-700" />
                Menu Harian Gizi Ponpes SPPG
              </h2>
              <p className="text-xs text-neutral-500">Berikut adalah jadwal menu harian gizi tinggi yang diunggah oleh Ahli Gizi Pesantren.</p>
            </div>
            <button
              onClick={() => triggerSuccessMsg("Fungsi penyusunan jadwal menu gizi baru telah dibuka!")}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              + Buat Menu Baru
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { day: 'Senin, 15 Juni', color: 'bg-emerald-50/70 border-emerald-300', menu: ['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'], cal: '580 Kcal' },
              { day: 'Selasa, 16 Juni', color: 'bg-indigo-50/70 border-indigo-300', menu: ['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng', 'Pisang'], cal: '620 Kcal' },
              { day: 'Rabu, 17 Juni', color: 'bg-amber-50/70 border-amber-300', menu: ['Nasi Gurih', 'Soto Ayam Lamongan', 'Telur Asin Madura', 'Krupuk Bawang', 'Jeruk Manis'], cal: '600 Kcal' },
              { day: 'Kamis, 18 Juni', color: 'bg-orange-50/70 border-orange-300', menu: ['Nasi Putih', 'Rawon Daging Sapi', 'Mendol Tempe', 'Kecambah Segar & Nipis', 'Semangka Merah'], cal: '640 Kcal' },
              { day: 'Jumat, 19 Juni', color: 'bg-pink-50/70 border-pink-300', menu: ['Nasi Putih', 'Gulai Ikan Bandeng', 'Sayur Bobor Bayam Labu', 'Tahu Goreng Tepung', 'Melon Segar'], cal: '590 Kcal' }
            ].map((mn, idx) => (
              <div key={idx} className={`border p-4 rounded-xl shadow-xs flex flex-col justify-between ${mn.color}`}>
                <div>
                  <span className="font-bold text-xs text-neutral-800 block mb-2">{mn.day}</span>
                  <ul className="space-y-1.5 text-xs text-neutral-600">
                    {mn.menu.map((food, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        {food}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-2 border-t border-neutral-200/50 flex items-center justify-between">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-900/10 font-bold uppercase tracking-wide text-neutral-800">{mn.cal}</span>
                  <button 
                    onClick={() => {
                        const dateMap: any = {0: '2026-06-15', 1: '2026-06-16', 2: '2026-06-17', 3: '2026-06-18', 4: '2026-06-19'};
                        onSetMenu(dateMap[idx], mn.menu);
                        triggerSuccessMsg(`SOP untuk tanggal tersebut disinkronkan dengan menu: ${mn.menu.join(', ')}!`);
                    }}
                    className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-0.5"
                    title="Gunakan menu ini untuk meregenerasi atau membuat SOP"
                  >
                    Tulis SOP <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
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
          <div>
            <h2 className="text-xl font-bold font-sans text-neutral-800 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600 animate-pulse" />
              Log Keluhan & Masukan Kualitas Hidangan Santri
            </h2>
            <p className="text-xs text-neutral-500 font-sans">Katalog keluhan dari Ustadz Pembimbing, wali santri, atau pelayan asrama guna perbaikan SOP Dapur.</p>
          </div>

          <form onSubmit={e => {
            e.preventDefault();
            triggerSuccessMsg("Keluhan berhasil dicatat. Tim dapur akan melakukan investigasi dan corrective action!");
            setFormData({});
          }} className="p-4 border border-red-100 bg-red-50/20 rounded-xl space-y-3">
            <h4 className="font-bold text-xs text-red-800 uppercase tracking-widest">Input Keluhan Masuk Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder="Sumber (Contoh: Wali Santri Asrama Putri B)" className="w-full text-xs border border-neutral-200 rounded-lg p-2 bg-white" />
              <select className="w-full text-xs border border-neutral-200 rounded-lg p-2 bg-white">
                <option>Kategori: Kebersihan Makanan</option>
                <option>Kategori: Keterlanjuran / Keterlambatan Kirim</option>
                <option>Kategori: Rasa Hambar / Asin Berlebih</option>
                <option>Kategori: Kekurangan Porsi Jumlah</option>
              </select>
            </div>
            <textarea rows={2} required placeholder="Detail isi keluhan santri secara spesifik..." className="w-full text-xs border border-neutral-200 rounded-lg p-2 bg-white" />
            <button type="submit" className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-lg text-xs">
              Tambahkan Log Keluhan
            </button>
          </form>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          <div className="space-y-3 text-xs">
            {[
              { from: 'Ustadz Jauhari (Dorm Putra C)', cat: 'Kekurangan Porsi', text: 'Jumlah ompreng datang kurang 3 pack dibanding daftar santri absen malam ini.', date: 'Hari ini, 07:40', action: 'Diselesaikan: Driver langsung kirim susulan 3 porsi dari dapur cadangan.', status: 'Selesai' },
              { from: 'Wali Kamar Asrama Putri 4', cat: 'Rasa / Suhu Makanan', text: 'Sayur bobor bayam yang tiba untuk sarapan terasa terlalu hambar dan dingin.', date: 'Kemarin, 06:15', action: 'Investigasi: Tim masak dievaluasi agar menakar garam presisi.', status: 'Selesai' }
            ].map((kl, idx) => (
              <div key={idx} className="p-4 border border-rose-100 bg-white rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">{kl.from}</span>
                  <span className="text-neutral-400 text-[10px]">{kl.date}</span>
                </div>
                <p className="text-neutral-600"><strong>Masalah ({kl.cat}):</strong> {kl.text}</p>
                <p className="text-emerald-800 font-medium bg-emerald-50/50 p-2 rounded-lg text-[11px] border border-emerald-100/30">👍 {kl.action}</p>
                <span className="absolute bottom-4 right-4 text-[9px] uppercase tracking-wide font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{kl.status}</span>
              </div>
            ))}
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
