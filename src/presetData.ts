import { Division, DayMenu, TaskItem, UserRole } from './types';

// Preset Menus
export const PRESET_MENUS: DayMenu[] = [
  {
    date: '2026-06-15', // Senin
    menuList: ['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'],
    createdAt: '2026-06-14T08:00:00Z',
    createdBy: 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'
  },
  {
    date: '2026-06-16', // Selasa (Matches the attachment example!)
    menuList: ['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng Kelapa', 'Pisang'],
    createdAt: '2026-06-15T08:15:00Z',
    createdBy: 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'
  },
  {
    date: '2026-06-17', // Rabu
    menuList: ['Nasi Gurih', 'Soto Ayam Lamongan', 'Telur Asin Madura', 'Krupuk Bawang', 'Jeruk Manis'],
    createdAt: '2026-06-16T09:00:00Z',
    createdBy: 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'
  },
  {
    date: '2026-06-18', // Kamis
    menuList: ['Nasi Putih', 'Rawon Daging Sapi Pepesan', 'Mendol Tempe', 'Kecambah Segar & Jeruk Nipis', 'Semangka Merah'],
    createdAt: '2026-06-17T07:45:00Z',
    createdBy: 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'
  },
  {
    date: '2026-06-19', // Jumat
    menuList: ['Nasi Putih', 'Gulai Ikan Bandeng', 'Sayur Bobor Bayam Labu', 'Tahu Goreng Tepung', 'Melon Segar'],
    createdAt: '2026-06-18T10:30:00Z',
    createdBy: 'Ahli Gizi (Ustadzah Fatimah, S.Gz)'
  }
];

// Map of who compiles SOP for each division
export const DIVISION_CREATOR_MAP: Record<Division, { role: UserRole; label: string }> = {
  [Division.STOCKING]: { role: UserRole.CHEF, label: 'Head Chef' },
  [Division.MASAK]: { role: UserRole.CHEF, label: 'Head Chef' },
  [Division.PEMORSIAN]: { role: UserRole.AHLI_GIZI, label: 'Ahli Gizi' },
  [Division.DRIVER]: { role: UserRole.ASLAP, label: 'Aslap (Asisten Lapangan)' },
  [Division.CUCI]: { role: UserRole.ASLAP, label: 'Aslap (Asisten Lapangan)' },
  [Division.KEBERSIHAN]: { role: UserRole.ASLAP, label: 'Aslap (Asisten Lapangan)' },
  [Division.KEAMANAN]: { role: UserRole.ASLAP, label: 'Aslap (Asisten Lapangan)' }
};

// Generates lists of default tasks for a division, potentially customizing items based on menu list
export function getDefaultTasksForDivision(division: Division, menuList: string[]): TaskItem[] {
  const tasks: TaskItem[] = [];

  // 1. ADD PREPARATION CATEGORY (GENERAL)
  tasks.push(
    { id: `${division}-prep-1`, text: 'Hadir tepat waktu sesuai jadwal dinas dan melakukan absensi digital.', completed: false, category: 'persiapan' },
    { id: `${division}-prep-2`, text: 'Koordinator mengecek kesiapan anggota tim serta ketersediaan bahan/alat pendukung.', completed: false, category: 'persiapan' },
    { id: `${division}-prep-3`, text: 'Memakai Alat Pelindung Diri (APD) lengkap: Celemek, Masker, Hairnet (Penutup Kepala), dan Sarung Tangan.', completed: false, category: 'persiapan' }
  );

  // 2. ADD MAIN ACTIVE TASKS (SPECIFIC)
  switch (division) {
    case Division.STOCKING:
      tasks.push(
        { id: `${division}-act-1`, text: `Menerima dan memeriksa kesegaran serta kelayakan bahan menu: ${menuList.join(', ')}.`, completed: false, category: 'aktif' }
      );
      if (menuList.some(m => m.toLowerCase().includes('ayam'))) {
        tasks.push(
          { id: `${division}-act-2`, text: 'Mencuci Ayam bersih, potong, kemudian direbus dengan garam, daun salam, dan jeruk purut.', completed: false, category: 'aktif' },
          { id: `${division}-act-3`, text: 'Mengupas bumbu rempah: Bawang putih, bawang merah, jahe, lengkuas, kunyit sesuai resep porsi.', completed: false, category: 'aktif' }
        );
      } else {
        tasks.push(
          { id: `${division}-act-2`, text: 'Mengupas dan memotong bumbu rempah mentah (bawang merah, bawang putih, cabai, jahe, lengkuas).', completed: false, category: 'aktif' }
        );
      }
      tasks.push(
        { id: `${division}-act-4`, text: 'Membersihkan cabai merah besar, buang bijinya setengah untuk mengontrol tingkat pedas santri.', completed: false, category: 'aktif' },
        { id: `${division}-act-5`, text: 'Memblender bumbu halus dasar (merah/putih/kuning) sesuai takaran gramasi timbangan gizi.', completed: false, category: 'aktif' },
        { id: `${division}-act-6`, text: 'Menyiapkan bahan pelengkap pendukung (seperti krupuk, timun iris, atau buah pisang) di wadah bersih.', completed: false, category: 'aktif' }
      );
      break;

    case Division.MASAK:
      tasks.push(
        { id: `${division}-act-1`, text: `Merebus kuah kaldu utama atau menanak dan mengukus nasi putih sejumlah porsi gizi santri.`, completed: false, category: 'aktif' }
      );
      if (menuList.some(m => m.toLowerCase().includes('ayam'))) {
        tasks.push(
          { id: `${division}-act-2`, text: 'Menggoreng atau menumis protein ayam hingga matang merata di suhu minimal 75°C.', completed: false, category: 'aktif' }
        );
      }
      if (menuList.some(m => m.toLowerCase().includes('tempe') || m.toLowerCase().includes('tahu'))) {
        tasks.push(
          { id: `${division}-act-3`, text: 'Melakukan marinasi tempe/tahu dengan bumbu ketumbar bawang lalu goreng deep-fry hingga kuning keemasan.', completed: false, category: 'aktif' }
        );
      }
      tasks.push(
        { id: `${division}-act-4`, text: 'Memasak lauk pelengkap tumis sayuran (durasi tidak overcooked agar vitamin terjaga).', completed: false, category: 'aktif' },
        { id: `${division}-act-5`, text: 'Membuat sambal serundeng atau sambal goreng penyetan khas, cicipi kesesuaian rasa gizi.', completed: false, category: 'aktif' },
        { id: `${division}-act-6`, text: 'Melakukan pengetesan organoleptik (Rasa, Bau, Tekstur) sebelum masakan dipindahkan ke tempat pemorsian.', completed: false, category: 'aktif' }
      );
      break;

    case Division.PEMORSIAN:
      tasks.push(
        { id: `${division}-act-1`, text: `Menata box ompreng bersih di sepanjang rel meja penyajian (assembly line).`, completed: false, category: 'aktif' },
        { id: `${division}-act-2`, text: 'Mengisi porsi nasi putih menggunakan takaran mangkuk standar gizi santri (sekitar 150-180g).', completed: false, category: 'aktif' },
        { id: `${division}-act-3`, text: 'Meletakkan lauk utama protein ayam dan lauk nabati tempe di sekat ompreng masing-masing.', completed: false, category: 'aktif' },
        { id: `${division}-act-4`, text: 'Menambahkan sayuran pendukung dengan porsi kuah terpisah agar sayur tidak layu.', completed: false, category: 'aktif' },
        { id: `${division}-act-5`, text: 'Memastikan buah pisang/semangka bersih dan krupuk sudah dibungkus plastik rapat diletakkan di atas penutup.', completed: false, category: 'aktif' },
        { id: `${division}-act-6`, text: 'Melakukan sampling timbang acak untuk memastikan berat porsi seragam bagi santri putra dan putri.', completed: false, category: 'aktif' },
        { id: `${division}-act-7`, text: 'Menghitung total box ompreng yang siap didistribusikan dan melaporkan ke koordinator gizi.', completed: false, category: 'aktif' }
      );
      break;

    case Division.DRIVER:
      tasks.push(
        { id: `${division}-act-1`, text: 'Memanaskan mesin kendaraan operasional dapur dan memeriksa tekanan ban serta bensin.', completed: false, category: 'aktif' },
        { id: `${division}-act-2`, text: 'Menata dan menumpuk box ompreng makanan secara rapi ke dalam kontainer tertutup milik truk/pickup.', completed: false, category: 'aktif' },
        { id: `${division}-act-3`, text: 'Mengunci pintu kontainer box dan memasang sabuk pengaman pengait agar tidak terjatuh saat bergerak.', completed: false, category: 'aktif' },
        { id: `${division}-act-4`, text: 'Mengantar makanan ke titik distribusi (Asrama Putra, Asrama Putri, Gedung SPPG) tepat waktu.', completed: false, category: 'aktif' },
        { id: `${division}-act-5`, text: 'Membantu koordinator asrama melakukan bongkar muatan ompreng makan dengan hati-hati.', completed: false, category: 'aktif' },
        { id: `${division}-act-6`, text: 'Mengumpulkan kembali ompreng-ompreng kotor sisa distribusi hari sebelumnya untuk dibawa balik ke dapur.', completed: false, category: 'aktif' }
      );
      break;

    case Division.CUCI:
      tasks.push(
        { id: `${division}-act-1`, text: 'Memisahkan sisa-sisa makanan dari ompreng kotor ke dalam tong sampah organik khusus.', completed: false, category: 'aktif' },
        { id: `${division}-act-2`, text: 'Merendam ompreng ber lemak di dalam bak air hangat bercampur sabun cair pembersih lemak tinggi.', completed: false, category: 'aktif' },
        { id: `${division}-act-3`, text: 'Menggosok permukaan dalam dan luar ompreng menggunakan spons kawat lembut untuk sisa nasi mengerak.', completed: false, category: 'aktif' },
        { id: `${division}-act-4`, text: 'Membilas ompreng di bawah air mengalir bertekanan tinggi hingga kesat dan bebas bau amis.', completed: false, category: 'aktif' },
        { id: `${division}-act-5`, text: 'Mencuci peralatan besar dapur (kuali raksasa, baskom, pisang/pisau) dengan klorin/antiseptik sanitasi.', completed: false, category: 'aktif' },
        { id: `${division}-act-6`, text: 'Menata peralatan yang sudah dibilas di rak pengering dengan posisi menelungkup agar air tuntas.', completed: false, category: 'aktif' }
      );
      break;

    case Division.KEBERSIHAN:
      tasks.push(
        { id: `${division}-act-1`, text: 'Menyapu seluruh bagian lantai dapur utama, ruang bahan kering, dan ruang pemorsian.', completed: false, category: 'aktif' },
        { id: `${division}-act-2`, text: 'Mengepel lantai menggunakan cairan karbol disinfektan untuk mematikan kuman dan menghilangkan licin minyak.', completed: false, category: 'aktif' },
        { id: `${division}-act-3`, text: 'Mengelap meja persiapan, meja pemorsian, dan dinding keramik kompor dari cipratan minyak / kuah.', completed: false, category: 'aktif' },
        { id: `${division}-act-4`, text: 'Membuang sampah gizi dari seluruh ruangan dapur ke Tempat Pembuangan Sampah (TPS) Akhir Ponpes.', completed: false, category: 'aktif' },
        { id: `${division}-act-5`, text: 'Membersihkan saringan air got (floor drain) dapur dari sumbatan lemak sisa pencucian piring.', completed: false, category: 'aktif' }
      );
      break;

    case Division.KEAMANAN:
      tasks.push(
        { id: `${division}-act-1`, text: 'Memeriksa kebersihan dan kelayakan instalasi pipa gas elpiji 50kg, mencium apakah ada indikasi kebocoran.', completed: false, category: 'aktif' },
        { id: `${division}-act-2`, text: 'Mengawasi pintu bongkar barang gudang agar tidak ada pihak luar yang masuk tanpa izin logistik.', completed: false, category: 'aktif' },
        { id: `${division}-act-3`, text: 'Memastikan Alat Pemadam Api Ringan (APAR) di area dapur tidak kadaluarsa dan gampang dijangkau.', completed: false, category: 'aktif' },
        { id: `${division}-act-4`, text: 'Patroli berkala mengelilingi pintu genset dan panel listrik utama pengatur daya pendingin cold storage.', completed: false, category: 'aktif' }
      );
      break;
  }

  // 3. ADD CLOSING CATEGORY (CLEANUP)
  tasks.push(
    { id: `${division}-close-1`, text: 'Membersihkan dan mengeringkan seluruh peralatan yang digunakan dalam tugas tim.', completed: false, category: 'penutup' },
    { id: `${division}-close-2`, text: 'Membersihkan area kerja masing-masing divisi (Meja dapur, lantai, atau kendaraan dsb.) setelah selesai.', completed: false, category: 'penutup' },
    { id: `${division}-close-3`, text: 'Mengembalikan seluruh peralatan ke tempat semula (rak gantung, lemari steril, atau gudang penyimpanan).', completed: false, category: 'penutup' },
    { id: `${division}-close-4`, text: 'Koordinator mengecek kembali kebersihan, kerapian, pemadaman kompor/lampu, dan menutup area kerja dengan kunci.', completed: false, category: 'penutup' }
  );

  return tasks;
}

// Generate complete set of SOP Documents for a single day based on menus
export function generateInitialSOPsForDate(date: string, menuList: string[]): Record<string, any>[] {
  const sops: any[] = [];
  
  Object.values(Division).forEach(div => {
    const creatorInfo = DIVISION_CREATOR_MAP[div];
    let creatorName = 'Bpk. Chef Ahmad';
    if (creatorInfo.role === UserRole.AHLI_GIZI) {
      creatorName = 'Ustadzah Fatimah, S.Gz';
    } else if (creatorInfo.role === UserRole.ASLAP) {
      creatorName = 'Ustadz Hakim, S.Pd (Aslap)';
    }

    sops.push({
      id: `${date}-${div}`,
      date,
      division: div,
      creatorRole: creatorInfo.role,
      creatorName,
      tasks: getDefaultTasksForDivision(div, menuList),
      isCheckedAll: false,
      signerSupervisor: creatorName,
      signatureSupervisorUrl: '',
      signedSupervisorAt: null,
      signerCoordinator: `Koordinator ${div.split(' ')[0]}`,
      signatureCoordinatorUrl: '',
      signedCoordinatorAt: null,
      status: 'aktif',
      updatedAt: new Date().toISOString()
    });
  });

  return sops;
}
