import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Package, Wrench, ShieldCheck, ShoppingCart, Truck, 
  Camera, Users, Calendar, FileText, CheckCircle2, Flame, RefreshCcw, 
  HelpCircle, ChevronRight, UserCircle, Bell, ArrowRight, ShieldAlert,
  Menu, Info, Eye, Trash2
} from 'lucide-react';
import { Division, UserRole, DayMenu, SOPDocument } from './types';
import { PRESET_MENUS, DIVISION_CREATOR_MAP, generateInitialSOPsForDate } from './presetData';
import SOPCreator from './components/SOPCreator';
import SOPChecklistView from './components/SOPChecklistView';
import SOPRecap from './components/SOPRecap';
import MockModules from './components/MockModules';
import Login from './components/Login';
import { isSupabaseConfigured, supabase, mapUserToProfile, UserProfile } from './lib/supabase';

export default function App() {
  // User Authentication State
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null);

  // Sidebar Tabs (1-15)
  const [activeTab, setActiveTab] = useState<number>(15); // Default to SOP
  
  // Dynamic SOP State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.ADMIN);
  const [currentUsername, setCurrentUsername] = useState<string>('Sistem Administrator');
  
  // Collections of day menus and SOP Documents
  const [dayMenus, setDayMenus] = useState<DayMenu[]>(PRESET_MENUS);
  const [sops, setSops] = useState<SOPDocument[]>([]);
  
  // Inner SOP Sub-Tab selection
  const [currentSubTab, setCurrentSubTab] = useState<'dashboard' | 'create' | 'recap'>('dashboard');
  
  // Currently viewed SOP Detail (matches printed form view)
  const [activeSopDetail, setActiveSopDetail] = useState<SOPDocument | null>(null);
  
  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getTabFromPage = (pageName: string): number => {
    const norm = pageName.toLowerCase().trim();
    if (norm === 'sop') return 15;
    if (norm === 'keluhan') return 14;
    if (norm === 'order-alat' || norm === 'order_alat') return 4;
    if (norm === 'order-operasional' || norm === 'order_operasional') return 5;
    if (norm === 'pengiriman-ompreng') return 18;
    if (norm === 'serah-terima') return 19;
    if (norm === 'surat-jalan') return 20;
    if (norm === 'organoleptik') return 21;
    return 15; // default to SOP
  };

  const getPageFromTab = (tabNum: number): string => {
    if (tabNum === 15) return 'sop';
    if (tabNum === 14) return 'keluhan';
    if (tabNum === 4) return 'order-alat';
    if (tabNum === 5) return 'order-operasional';
    if (tabNum === 18) return 'pengiriman-ompreng';
    if (tabNum === 19) return 'serah-terima';
    if (tabNum === 20) return 'surat-jalan';
    if (tabNum === 21) return 'organoleptik';
    return '';
  };

  // Listen for route changes (hash route: #/prefix/page)
  useEffect(() => {
    const handleRouteChange = () => {
      let path = window.location.hash.replace(/^#\/?/, '/');
      if (!path || path === '/') {
        path = window.location.pathname;
      }
      
      if (!path || path === '/') return;
      
      const parts = path.split('/').filter(Boolean); // e.g. ["aslap", "sop"]
      if (parts.length >= 1) {
        // Find which page we are on
        const page = parts[1] || 'sop';
        const tab = getTabFromPage(page);
        setActiveTab(tab);
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange(); // Run on mount

    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // Update browser URL hash when tab changes
  useEffect(() => {
    if (!loggedInUser) return;
    
    let prefix = 'user';
    if (loggedInUser.isCoordinator && loggedInUser.coordinatorDivision) {
      // Map division to short prefix
      const div = loggedInUser.coordinatorDivision;
      if (div === Division.STOCKING) prefix = 'stocking';
      else if (div === Division.MASAK) prefix = 'masak';
      else if (div === Division.DRIVER) prefix = 'driver';
      else if (div === Division.CUCI) prefix = 'cuci';
      else if (div === Division.KEBERSIHAN) prefix = 'kebersihan';
      else if (div === Division.KEAMANAN) prefix = 'keamanan';
    } else {
      // For Admin, Chef, Ahli Gizi, Aslap, map their role as prefix
      const role = loggedInUser.role;
      if (role === UserRole.CHEF) prefix = 'chef';
      else if (role === UserRole.AHLI_GIZI) prefix = 'gizi';
      else if (role === UserRole.ASLAP) prefix = 'aslap';
      else if (role === UserRole.ADMIN) prefix = 'admin';
      else if (role === UserRole.AKUNTAN) prefix = 'akuntan';
      else if (role === UserRole.DRIVER) prefix = 'driver';
    }
    
    const page = getPageFromTab(activeTab);
    if (page) {
      const newHash = `#/${prefix}/${page}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
    }
  }, [activeTab, loggedInUser]);

  // Automatically load the coordinator's specific division's SOP checklist in active detail view
  useEffect(() => {
    if (loggedInUser?.isCoordinator && loggedInUser?.coordinatorDivision && activeTab === 15) {
      const matchedSOP = sops.find(s => s.date === selectedDate && s.division === loggedInUser.coordinatorDivision);
      if (matchedSOP) {
        setActiveSopDetail(matchedSOP);
      } else {
        setActiveSopDetail(null);
      }
    }
  }, [loggedInUser, selectedDate, sops, activeTab]);

  // Synchronise usernames based on active role
  useEffect(() => {
    if (loggedInUser?.isCoordinator) {
      // Keep name mapped directly from login profile
      setCurrentUsername(loggedInUser.fullName);
      return;
    }
    switch (currentUserRole) {
      case UserRole.CHEF:
        setCurrentUsername('Rizka Aulia (Head Chef)');
        break;
      case UserRole.AHLI_GIZI:
        setCurrentUsername('Ustadzah Fatimah, S.Gz');
        break;
      case UserRole.ASLAP:
        setCurrentUsername('Ahmad Maghfur (Aslap)');
        break;
      case UserRole.ADMIN:
        setCurrentUsername('Admin Utama SPPG');
        break;
      case UserRole.AKUNTAN:
        setCurrentUsername('Staff Akuntan SPPG');
        break;
      case UserRole.DRIVER:
        setCurrentUsername('Driver Logistik SPPG');
        break;
    }
  }, [currentUserRole, loggedInUser]);

  // Try to recover the active Supabase session on startup
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          const profile = mapUserToProfile(session.user.id, session.user.email || '');
          setLoggedInUser(profile);
          setCurrentUserRole(profile.role);
          setCurrentUsername(profile.fullName);
          const email = profile.email?.toLowerCase().trim() || '';
          if (['ma@qomaruddin.com', 'smk@qomaruddin.com', 'sma@qomaruddin.com', 'mts@qomaruddin.com', 'sukowati@qomaruddin.com', 'sidokumpul@qomaruddin.com'].includes(email)) {
            setActiveTab(19);
          }
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          const profile = mapUserToProfile(session.user.id, session.user.email || '');
          setLoggedInUser(profile);
          setCurrentUserRole(profile.role);
          setCurrentUsername(profile.fullName);
          const email = profile.email?.toLowerCase().trim() || '';
          if (['ma@qomaruddin.com', 'smk@qomaruddin.com', 'sma@qomaruddin.com', 'mts@qomaruddin.com', 'sukowati@qomaruddin.com', 'sidokumpul@qomaruddin.com'].includes(email)) {
            setActiveTab(19);
          }
        } else {
          setLoggedInUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Bootstrap Supabase with baseline preset-menus and SOP checklists if empty
  const bootstrapSupabase = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      console.log('Bootstrapping Supabase database tables with baseline values...');
      
      // 1. Seed day_menus
      const menuPayload = PRESET_MENUS.map(m => ({
        date: m.date,
        menu_list: m.menuList,
        created_at: m.createdAt,
        created_by: m.createdBy
      }));
      await supabase.from('day_menus').upsert(menuPayload);

      // 2. Generate initial blank/completed SOP documents
      const initialSopsInDatabase: any[] = [];
      const initialTasksInDatabase: any[] = [];

      // Monday 2026-06-15 sops (Seeded as completed & signed)
      const mondayMenu = ['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'];
      Object.values(Division).forEach((div) => {
        const creatorInfo = DIVISION_CREATOR_MAP[div];
        const supervisorName = creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' :
                              creatorInfo.role === UserRole.AHLI_GIZI ? 'Ustadzah Fatimah, S.Gz' : 'Ahmad Maghfur';
        
        const sopId = `2026-06-15-${div}`;
        initialSopsInDatabase.push({
          id: sopId,
          date: '2026-06-15',
          division: div,
          creator_role: creatorInfo.role,
          creator_name: supervisorName,
          is_checked_all: true,
          signer_supervisor: supervisorName,
          signature_supervisor_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>',
          signed_supervisor_at: '15/06/2026, 08.00 WIB',
          signer_coordinator: `Koordinator ${div.split(' ')[0]}`,
          signature_coordinator_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>',
          signed_coordinator_at: '15/06/2026, 08.30 WIB',
          status: 'selesai',
          updated_at: '2026-06-15T08:30:00Z'
        });

        const defaultTasks = generateInitialSOPsForDate('2026-06-15', mondayMenu).find(s => s.division === div)?.tasks || [];
        defaultTasks.forEach((t: any, idx: number) => {
          initialTasksInDatabase.push({
            id: `${sopId}-t-${idx}`,
            sop_id: sopId,
            text: t.text,
            completed: true,
            category: t.category,
            sort_order: idx
          });
        });
      });

      // Tuesday 2026-06-16 sops (Active, pre-checked partial)
      const tuesdayMenu = ['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng Kelapa', 'Pisang'];
      Object.values(Division).forEach((div) => {
        const creatorInfo = DIVISION_CREATOR_MAP[div];
        const supervisorName = creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' :
                              creatorInfo.role === UserRole.AHLI_GIZI ? 'Ustadzah Fatimah, S.Gz' : 'Ahmad Maghfur';
        
        const sopId = `2026-06-16-${div}`;
        initialSopsInDatabase.push({
          id: sopId,
          date: '2026-06-16',
          division: div,
          creator_role: creatorInfo.role,
          creator_name: supervisorName,
          is_checked_all: false,
          signer_supervisor: supervisorName,
          signature_supervisor_url: '',
          signed_supervisor_at: null,
          signer_coordinator: `Koordinator ${div.split(' ')[0]}`,
          signature_coordinator_url: '',
          signed_coordinator_at: null,
          status: 'aktif',
          updated_at: '2026-06-16T05:00:00Z'
        });

        const defaultTasks = generateInitialSOPsForDate('2026-06-16', tuesdayMenu).find(s => s.division === div)?.tasks || [];
        defaultTasks.forEach((t: any, idx: number) => {
          initialTasksInDatabase.push({
            id: `${sopId}-t-${idx}`,
            sop_id: sopId,
            text: t.text,
            completed: idx < 3,
            category: t.category,
            sort_order: idx
          });
        });
      });

      await supabase.from('sops').upsert(initialSopsInDatabase);
      await supabase.from('sop_tasks').upsert(initialTasksInDatabase);
      console.log('Bootstrapping Supabase database completed successfully!');
    } catch (e) {
      console.error('Failed to bootstrap Supabase:', e);
    }
  };

  // Load data from Supabase if configured or fall back to mock memory
  useEffect(() => {
    async function loadAllFromSupabase() {
      const loadOfflineFallback = () => {
        const mondayMenu = ['Nasi Putih', 'Ayam Geprek Sambal Korek', 'Tumis Kangkung Belacan', 'Khrupuk Udang', 'Pisang Ambon'];
        const seededSOPs: SOPDocument[] = [];

        Object.values(Division).forEach((div) => {
          const creatorInfo = DIVISION_CREATOR_MAP[div];
          const supervisorName = creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' :
                              creatorInfo.role === UserRole.AHLI_GIZI ? 'Ustadzah Fatimah, S.Gz' : 'Ahmad Maghfur';
          
          const monSOP: SOPDocument = {
            id: `2026-06-15-${div}`,
            date: '2026-06-15',
            division: div,
            creatorRole: creatorInfo.role,
            creatorName: supervisorName,
            tasks: generateInitialSOPsForDate('2026-06-15', mondayMenu).find(s => s.division === div)?.tasks.map((t: any) => ({ ...t, completed: true })) || [],
            isCheckedAll: true,
            signerSupervisor: supervisorName,
            signatureSupervisorUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>',
            signedSupervisorAt: '15/06/2026, 08.00 WIB',
            signerCoordinator: `Koordinator ${div.split(' ')[0]}`,
            signatureCoordinatorUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" fill="none" stroke="black" stroke-width="2"/></svg>',
            signedCoordinatorAt: '15/06/2026, 08.30 WIB',
            status: 'selesai',
            updatedAt: '2026-06-15T08:30:00Z'
          };
          seededSOPs.push(monSOP);
        });

        const tuesdayMenu = ['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng Kelapa', 'Pisang'];
        Object.values(Division).forEach((div) => {
          const creatorInfo = DIVISION_CREATOR_MAP[div];
          const supervisorName = creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' :
                              creatorInfo.role === UserRole.AHLI_GIZI ? 'Ustadzah Fatimah, S.Gz' : 'Ahmad Maghfur';
          
          const defaultTasks = generateInitialSOPsForDate('2026-06-16', tuesdayMenu).find(s => s.division === div)?.tasks || [];
          const populatedTasks = defaultTasks.map((t: any, i: number) => 
            i < 3 ? { ...t, completed: true } : t
          );

          const tueSOP: SOPDocument = {
            id: `2026-06-16-${div}`,
            date: '2026-06-16',
            division: div,
            creatorRole: creatorInfo.role,
            creatorName: supervisorName,
            tasks: populatedTasks,
            isCheckedAll: false,
            signerSupervisor: supervisorName,
            signatureSupervisorUrl: '',
            signedSupervisorAt: null,
            signerCoordinator: `Koordinator ${div.split(' ')[0]}`,
            signatureCoordinatorUrl: '',
            signedCoordinatorAt: null,
            status: 'aktif',
            updatedAt: '2026-06-16T05:00:00Z'
          };
          seededSOPs.push(tueSOP);
        });

        setSops(seededSOPs);
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: menuData, error: menuErr } = await supabase
            .from('day_menus')
            .select('*')
            .order('date', { ascending: true });
          
          if (menuErr) throw menuErr;

          const { data: sopData, error: sopErr } = await supabase
            .from('sops')
            .select('*')
            .order('date', { ascending: true });

          if (sopErr) throw sopErr;

          const { data: taskData, error: taskErr } = await supabase
            .from('sop_tasks')
            .select('*')
            .order('sort_order', { ascending: true });

          if (taskErr) throw taskErr;

          if (menuData && menuData.length > 0) {
            // Re-format day menus
            const formattedMenus: DayMenu[] = menuData.map((m: any) => ({
              date: m.date,
              menuList: m.menu_list || [],
              createdAt: m.created_at,
              createdBy: m.created_by as UserRole
            }));
            setDayMenus(formattedMenus);

            // Re-format SOP Documents
            const formattedSops: SOPDocument[] = (sopData || []).map((s: any) => {
              const matchedTasks = (taskData || [])
                .filter((t: any) => t.sop_id === s.id)
                .map((t: any) => ({
                  id: t.id,
                  text: t.text,
                  completed: t.completed,
                  category: t.category as 'persiapan' | 'aktif' | 'penutup'
                }));

              return {
                id: s.id,
                date: s.date,
                division: s.division as Division,
                creatorRole: s.creator_role as UserRole,
                creatorName: s.creator_name,
                tasks: matchedTasks,
                isCheckedAll: s.is_checked_all,
                signerSupervisor: s.signer_supervisor || '',
                signatureSupervisorUrl: s.signature_supervisor_url || '',
                signedSupervisorAt: s.signed_supervisor_at || null,
                signerCoordinator: s.signer_coordinator || '',
                signatureCoordinatorUrl: s.signature_coordinator_url || '',
                signedCoordinatorAt: s.signed_coordinator_at || null,
                status: s.status as 'aktif' | 'selesai',
                updatedAt: s.updated_at
              };
            });
            setSops(formattedSops);
          } else {
            // database is empty, seed it
            await bootstrapSupabase();
            // recall loading
            const { data: freshMenus } = await supabase.from('day_menus').select('*');
            const { data: freshSops } = await supabase.from('sops').select('*');
            const { data: freshTasks } = await supabase.from('sop_tasks').select('*').order('sort_order', { ascending: true });

            if (freshMenus && freshMenus.length > 0) {
              setDayMenus(freshMenus.map((m: any) => ({
                date: m.date,
                menuList: m.menu_list,
                createdAt: m.created_at,
                createdBy: m.created_by as UserRole
              })));

              setSops((freshSops || []).map((s: any) => ({
                id: s.id,
                date: s.date,
                division: s.division as Division,
                creatorRole: s.creator_role as UserRole,
                creatorName: s.creator_name,
                tasks: (freshTasks || []).filter((t: any) => t.sop_id === s.id).map((t: any) => ({
                  id: t.id,
                  text: t.text,
                  completed: t.completed,
                  category: t.category as 'persiapan' | 'aktif' | 'penutup'
                })),
                isCheckedAll: s.is_checked_all,
                signerSupervisor: s.signer_supervisor || '',
                signatureSupervisorUrl: s.signature_supervisor_url || '',
                signedSupervisorAt: s.signed_supervisor_at || null,
                signerCoordinator: s.signer_coordinator || '',
                signatureCoordinatorUrl: s.signature_coordinator_url || '',
                signedCoordinatorAt: s.signed_coordinator_at || null,
                status: s.status as 'aktif' | 'selesai',
                updatedAt: s.updated_at
              })));
            }
          }
        } catch (e) {
          console.error('Supabase fetch failed, sliding back to offline fallback state:', e);
          loadOfflineFallback();
        }
      } else {
        loadOfflineFallback();
      }
    }
    loadAllFromSupabase();
  }, [loggedInUser]);

  // Handlers
  const handleSaveMenu = async (date: string, menuList: string[]) => {
    const existingMenuIdx = dayMenus.findIndex(m => m.date === date);
    const newMenu: DayMenu = {
      date,
      menuList,
      createdAt: new Date().toISOString(),
      createdBy: currentUserRole
    };

    if (existingMenuIdx !== -1) {
      const updated = [...dayMenus];
      updated[existingMenuIdx] = newMenu;
      setDayMenus(updated);
    } else {
      setDayMenus([...dayMenus, newMenu]);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('day_menus').upsert({
          date,
          menu_list: menuList,
          created_at: newMenu.createdAt,
          created_by: newMenu.createdBy
        });
        if (error) {
          console.error('Failed to save menu on Supabase:', error);
          alert('Gagal menyimpan menu ke Supabase: ' + error.message);
        } else {
          console.log('Successfully saved menu on Supabase:', date);
        }
      } catch (e) {
        console.error('Failed to save menu to Supabase:', e);
      }
    }
  };

  const handleDeleteMenu = async (date: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu dan semua SOP digital untuk tanggal ${date}?`)) {
      return;
    }

    // Update local state immediately
    setDayMenus(prev => prev.filter(m => m.date !== date));
    setSops(prev => prev.filter(s => s.date !== date));

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: errMenu } = await supabase.from('day_menus').delete().eq('date', date);
        const { error: errSops } = await supabase.from('sops').delete().eq('date', date);
        
        if (errMenu || errSops) {
          console.error('Supabase deletion error:', errMenu || errSops);
          alert('Gagal menghapus data dari Supabase: ' + (errMenu?.message || errSops?.message));
        } else {
          console.log('Successfully deleted menu and SOPs from Supabase:', date);
        }
      } catch (e) {
        console.error('Failed to delete menu on Supabase:', e);
      }
    }
  };

  const handleGenerateSOPs = async (date: string, menuList: string[]) => {
    const hasExisting = sops.some(s => s.date === date);
    if (hasExisting) {
      if (!confirm('SOP untuk tanggal ini sudah ada. Apakah Anda ingin mengatur ulang kembalikan tugas ke setelan bawaan? Seluruh coretan tanda tangan akan terhapus.')) {
        return;
      }
    }

    const generated = generateInitialSOPsForDate(date, menuList) as SOPDocument[];
    const filteredSops = sops.filter(s => s.date !== date);
    setSops([...filteredSops, ...generated]);

    if (isSupabaseConfigured && supabase) {
      try {
        // Cascade delete old sops for this date (cascade deletes tasks as well)
        const { error: delErr } = await supabase.from('sops').delete().eq('date', date);
        if (delErr) {
          console.error('Failed to delete old SOPs:', delErr);
          alert('Gagal menghapus SOP lama: ' + delErr.message);
          return;
        }

        const sopsPayload = generated.map(s => ({
          id: s.id,
          date: s.date,
          division: s.division,
          creator_role: s.creatorRole,
          creator_name: s.creatorName,
          is_checked_all: s.isCheckedAll,
          signer_supervisor: s.signerSupervisor || '',
          signature_supervisor_url: s.signatureSupervisorUrl || '',
          signed_supervisor_at: s.signedSupervisorAt,
          signer_coordinator: s.signerCoordinator || '',
          signature_coordinator_url: s.signatureCoordinatorUrl || '',
          signed_coordinator_at: s.signedCoordinatorAt,
          status: s.status,
          updated_at: s.updatedAt
        }));

        const tasksPayload: any[] = [];
        generated.forEach(s => {
          s.tasks.forEach((t, idx) => {
            tasksPayload.push({
              id: t.id,
              sop_id: s.id,
              text: t.text,
              completed: t.completed,
              category: t.category,
              sort_order: idx
            });
          });
        });

        const { error: sopsErr } = await supabase.from('sops').insert(sopsPayload);
        if (sopsErr) {
          console.error('Failed to insert new SOPs:', sopsErr);
          alert('Gagal menyisipkan SOP baru: ' + sopsErr.message);
          return;
        }

        if (tasksPayload.length > 0) {
          const { error: tasksErr } = await supabase.from('sop_tasks').insert(tasksPayload);
          if (tasksErr) {
            console.error('Failed to insert initial tasks:', tasksErr);
            alert('Gagal menyisipkan tugas SOP baru: ' + tasksErr.message);
            return;
          }
        }
        console.log('Successfully generated and saved initial SOPs on Supabase for:', date);
      } catch (e) {
        console.error('Failed to generate template SOPs on Supabase:', e);
      }
    }
  };

  const handleUpdateSOP = async (updatedSOP: SOPDocument) => {
    const updatedList = sops.map(s => s.id === updatedSOP.id ? updatedSOP : s);
    setSops(updatedList);
    
    if (activeSopDetail && activeSopDetail.id === updatedSOP.id) {
      setActiveSopDetail(updatedSOP);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Upsert SOP header
        const { error: headerErr } = await supabase.from('sops').upsert({
          id: updatedSOP.id,
          date: updatedSOP.date,
          division: updatedSOP.division,
          creator_role: updatedSOP.creatorRole,
          creator_name: updatedSOP.creatorName,
          is_checked_all: updatedSOP.isCheckedAll,
          signer_supervisor: updatedSOP.signerSupervisor,
          signature_supervisor_url: updatedSOP.signatureSupervisorUrl,
          signed_supervisor_at: updatedSOP.signedSupervisorAt,
          signer_coordinator: updatedSOP.signerCoordinator,
          signature_coordinator_url: updatedSOP.signatureCoordinatorUrl,
          signed_coordinator_at: updatedSOP.signedCoordinatorAt,
          status: updatedSOP.status,
          updated_at: updatedSOP.updatedAt
        });

        if (headerErr) {
          console.error('Failed to update SOP header on Supabase:', headerErr);
          alert('Gagal menyinkronkan data SOP ke Supabase: ' + headerErr.message);
          return;
        }

        // Delete all old tasks for this specific SOP and insert the new list
        const { error: delTasksErr } = await supabase.from('sop_tasks').delete().eq('sop_id', updatedSOP.id);
        if (delTasksErr) {
          console.error('Failed to delete old tasks for SOP on Supabase:', delTasksErr);
          alert('Gagal menyinkronkan tugas SOP ke Supabase: ' + delTasksErr.message);
          return;
        }

        const tasksPayload = updatedSOP.tasks.map((t, idx) => ({
          id: t.id,
          sop_id: updatedSOP.id,
          text: t.text,
          completed: t.completed,
          category: t.category,
          sort_order: idx
        }));

        if (tasksPayload.length > 0) {
          const { error: insTasksErr } = await supabase.from('sop_tasks').insert(tasksPayload);
          if (insTasksErr) {
            console.error('Failed to insert updated tasks on Supabase:', insTasksErr);
            alert('Gagal memperbarui rincian tugas SOP di Supabase: ' + insTasksErr.message);
            return;
          }
        }
        console.log('Successfully synchronized SOP details with Supabase:', updatedSOP.id);
      } catch (e) {
        console.error('Failed to synchronize status with Supabase:', e);
      }
    }
  };

  // Helper selectors
  const getMenuForSelectedDate = () => {
    return dayMenus.find(m => m.date === selectedDate) || null;
  };

  const getSOPsForSelectedDate = () => {
    return sops.filter(s => s.date === selectedDate);
  };

  const syncMenuFromSchedule = (date: string, items: string[]) => {
    // Allows schedule tab to write back to our database
    handleSaveMenu(date, items);
    handleGenerateSOPs(date, items);
    setSelectedDate(date);
    setCurrentSubTab('dashboard');
  };

  // List of all capabilities
  const FEATURE_MENUS = [
    { num: 15, name: 'SOP Harian Digital', icon: CheckCircle2, category: 'Kontrol Kualitas', badge: 'UTAMA' },
    { num: 10, name: 'Menu Harian Gizi', icon: Calendar, category: 'Perencanaan' },
    { num: 12, name: 'Stock Opname Gudang', icon: ClipboardList, category: 'Aset & Logistik' },
    { num: 17, name: 'Stok Operasional', icon: Package, category: 'Aset & Logistik' },
    { num: 16, name: 'Rekap Sampah Makanan (Waste)', icon: Trash2, category: 'Kontrol Kualitas' },
    { num: 4, name: 'Order Alat Baru', icon: ShoppingCart, category: 'Perekaman & Order' },
    { num: 5, name: 'Order Operasional', icon: ShoppingCart, category: 'Perekaman & Order' },
    { num: 6, name: 'Kedatangan Barang', icon: Truck, category: 'Distribusi & Logistik' },
    { num: 7, name: 'Galeri Kedatangan Barang', icon: Camera, category: 'Dokumentasi', url: 'https://drive.google.com/drive/folders/1TBcj9LvdkzgdNRpkKvxznz5_-1VF--hw' },
    { num: 8, name: 'Dokumentasi Dapur', icon: Camera, category: 'Dokumentasi', url: 'https://drive.google.com/drive/folders/1bqTPoSzK1KscBq58gSs_LIcjK_90ExIu?usp=drive_link' },
    { num: 18, name: 'Dokumentasi Pengiriman Ompreng', icon: Camera, category: 'Dokumentasi Pengiriman' },
    { num: 19, name: 'Berita Acara Serah Terima', icon: FileText, category: 'Dokumentasi Pengiriman' },
    { num: 20, name: 'Surat Jalan', icon: Truck, category: 'Dokumentasi Pengiriman' },
    { num: 21, name: 'Organoleptik', icon: ClipboardList, category: 'Dokumentasi Pengiriman' },
    { num: 14, name: 'Keluhan Relawan', icon: ShieldAlert, category: 'Sumber Daya Manusia' }
  ];

  const visibleMenus = !loggedInUser
    ? []
    : (() => {
        const email = loggedInUser.email?.toLowerCase().trim() || '';
        const role = loggedInUser.role;

        // 1. ADMIN UTAMA
        if (
          ['maghfur@qomaruddin.com', 'rifkah@qomaruddin.com', 'fajar@qomaruddin.com', 'sam@qomaruddin.com', 'maghfurmunif@gmail.com', 'ketua@sppg.com'].includes(email) ||
          role === UserRole.ADMIN
        ) {
          return FEATURE_MENUS;
        }

        // 2. PENERIMA SASARAN
        if (
          ['ma@qomaruddin.com', 'smk@qomaruddin.com', 'sma@qomaruddin.com', 'mts@qomaruddin.com', 'sukowati@qomaruddin.com', 'sidokumpul@qomaruddin.com'].includes(email) ||
          role === UserRole.PENERIMA
        ) {
          // BAST (19), Surat Jalan (20), Organoleptik (21)
          return FEATURE_MENUS.filter(menu => [19, 20, 21].includes(menu.num));
        }

        // 3. TIM UTAMA
        if (email === 'chef@qomaruddin.com') {
          // SOP Digital, Menu Harian, Order Alat/Operasional, Keluhan
          return FEATURE_MENUS.filter(menu => [15, 10, 4, 5, 14].includes(menu.num));
        }
        if (email === 'gizi@qomaruddin.com') {
          // SOP Harian, Menu Harian Gizi, Order Alat/Operasional, Dokumentasi Pengiriman Ompreng, Keluhan
          return FEATURE_MENUS.filter(menu => [15, 10, 4, 5, 18, 14].includes(menu.num));
        }
        if (email === 'akuntan@qomaruddin.com') {
          // Stock Opname, Stock Operasional, Order Operasional, Kedatangan Barang, Galeri Kedatangan Barang
          return FEATURE_MENUS.filter(menu => [12, 17, 5, 6, 7].includes(menu.num));
        }

        // 4. DIVISI (SOP Harian, Menu Harian Gizi, Order Alat/Operasional, Keluhan)
        if (['stocking@qomaruddin.com', 'masak@qomaruddin.com', 'pemorsian@qomaruddin.com', 'cuci@qomaruddin.com', 'kebersihan@qomaruddin.com', 'keamanan@qomaruddin.com'].includes(email)) {
          return FEATURE_MENUS.filter(menu => [15, 10, 4, 5, 14].includes(menu.num));
        }

        // 5. DRIVER
        if (email === 'driver@qomaruddin.com') {
          // SOP Harian, Menu Harian Gizi, Order Alat/Operasional, BAST, Surat Jalan, Keluhan
          return FEATURE_MENUS.filter(menu => [15, 10, 4, 5, 19, 20, 14].includes(menu.num));
        }

        // Legacy/Default Fallbacks based on mapped roles
        if (role === UserRole.CHEF || role === UserRole.AHLI_GIZI) {
          return FEATURE_MENUS.filter(menu => [15, 10, 12, 16, 4, 5, 14].includes(menu.num));
        } else if (role === UserRole.AKUNTAN) {
          return FEATURE_MENUS.filter(menu => [15, 10, 12, 17, 4, 5, 6, 7, 14].includes(menu.num));
        } else if (role === UserRole.DRIVER) {
          return FEATURE_MENUS.filter(menu => [15, 14, 18, 19, 20, 21].includes(menu.num));
        } else if (loggedInUser.isCoordinator) {
          return FEATURE_MENUS.filter(menu => [15, 14, 4, 5, 16, 17].includes(menu.num));
        }

        return FEATURE_MENUS;
      })();

  // Security redirect if activeTab is not allowed for current user
  useEffect(() => {
    if (loggedInUser) {
      const allowedNums = visibleMenus.map(m => m.num);
      if (!allowedNums.includes(activeTab)) {
        if (allowedNums.length > 0) {
          setActiveTab(allowedNums[0]); // Redirect to first allowed menu tab
        } else {
          setActiveTab(15);
        }
      }
    }
  }, [loggedInUser, activeTab, visibleMenus]);

  if (!loggedInUser) {
    return (
      <Login 
        onLoginSuccess={(profile) => {
          setLoggedInUser(profile);
          setCurrentUserRole(profile.role);
          setCurrentUsername(profile.fullName);
          const email = profile.email?.toLowerCase().trim() || '';
          if (['ma@qomaruddin.com', 'smk@qomaruddin.com', 'sma@qomaruddin.com', 'mts@qomaruddin.com', 'sukowati@qomaruddin.com', 'sidokumpul@qomaruddin.com'].includes(email)) {
            setActiveTab(19);
          } else if (profile.isCoordinator) {
            setActiveTab(15);
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-neutral-800">
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-neutral-950/60 z-[98] md:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}
      
      {/* 1. LEFT SIDEBAR NAVIGATION (Hides on standard print) */}
      <aside 
        id="nav-sidebar" 
        className={`w-72 bg-neutral-900 text-white shrink-0 shadow-lg flex flex-col border-r border-[#151c2c] fixed md:relative inset-y-0 left-0 z-[99] transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
         } transition-transform duration-300 ease-in-out md:flex`}
      >
        {/* Boarding school branding */}
        <div className="p-5 border-b border-[#252f44] bg-[#0c1421] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="https://www.bgn.go.id/logo-bgn.png" 
              alt="Logo BGN" 
              className="h-10 w-10 object-contain select-none" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-bold text-xs md:text-sm tracking-wide text-white uppercase font-display">
                Dapur Qomaruddin
              </h1>
              <span className="text-[10px] text-emerald-400 block tracking-widest font-mono uppercase">
                Bungah - Gresik
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-850 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup navigasi"
          >
            <span className="text-xl font-bold">&times;</span>
          </button>
        </div>

        {/* Sidebar Capabilities scrolling List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          <div className="text-[10px] text-neutral-500 font-bold px-3 uppercase tracking-widest block select-none">
            Modul Operasional
          </div>
          <div className="space-y-1">
            {visibleMenus.map((menu) => {
              const IconComp = menu.icon;
              const isSelected = activeTab === menu.num;
              
              const innerContent = (
                <>
                  <div className="flex items-center gap-3">
                    <IconComp className={`h-4 w-4 shrink-0 ${isSelected ? 'text-emerald-300' : 'text-neutral-400'}`} />
                    <span className="text-xs truncate font-medium">{menu.name}</span>
                  </div>
                  {menu.badge && (
                    <span className="bg-amber-500 text-neutral-900 font-black text-[9px] px-1.5 py-0.5 rounded-sm shrink-0 uppercase tracking-widest scale-90 animate-pulse">
                      {menu.badge}
                    </span>
                  )}
                </>
              );

              if (menu.url) {
                return (
                  <a
                    key={menu.num}
                    href={menu.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-left transition-all text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                  >
                    {innerContent}
                  </a>
                );
              }

              return (
                <button
                  key={menu.num}
                  onClick={() => {
                    setActiveTab(menu.num);
                    setActiveSopDetail(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-left transition-all ${
                    isSelected 
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs border border-emerald-700/50' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  {innerContent}
                </button>
              );
            })}
          </div>
        </div>

        {/* Board footer credentials */}
        <div className="p-4 border-t border-[#222d3d] bg-neutral-950 font-mono text-[9px] text-neutral-500 text-center">
          DIBUAT UNTUK SPPG QOMARUDDIN
          <div className="text-[8px] text-emerald-600 mt-0.5">© {new Date().getFullYear()} - PAPERLESS PROJECT</div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        {/* Top Header Controls bar (Hides on standard print) */}
        <header id="role-bar" className="bg-white border-b border-neutral-200/80 p-4 sticky top-0 z-[98] no-print flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider font-mono">
                Sistem Informasi Digitalisasi Dapur
              </span>
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1">
                Kualitas Nutrisi &amp; Manajemen Kebersihan Pesantren
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick date selector */}
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 shadow-2xs font-mono text-xs">
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setActiveSopDetail(null);
                }}
                className="bg-transparent border-none outline-hidden focus:ring-0 font-semibold p-0 text-neutral-800"
              />
            </div>

            {/* Logged in User Profile Info & Log Out Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <UserCircle className="h-7 w-7 text-emerald-800 hidden sm:block" />
                <div className="text-left font-sans">
                  <span className="text-[10px] text-emerald-700 font-extrabold block uppercase tracking-wider leading-none">
                    {currentUserRole}
                  </span>
                  <span className="text-[11.5px] font-bold text-neutral-800 block truncate max-w-[150px] sm:max-w-[180px] mt-0.5">
                    {currentUsername}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                    setLoggedInUser(null);
                    if (isSupabaseConfigured && supabase) {
                      supabase.auth.signOut();
                    }
                  }
                }}
                className="bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200/60 font-bold text-[9px] px-2.5 py-1.5 rounded-xl uppercase tracking-wider transition-all"
                title="Keluar dari Aplikasi"
              >
                Keluar
              </button>
            </div>
          </div>
        </header>

        {/* Work Area scrollable wrap */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab !== 15 ? (
            /* Render Mockups for 1 to 14 */
            <MockModules 
              moduleIndex={activeTab} 
              onSetMenu={syncMenuFromSchedule}
              allDayMenus={dayMenus}
              onSaveMenu={handleSaveMenu}
              onGenerateSOPs={handleGenerateSOPs}
              onDeleteMenu={handleDeleteMenu}
              currentUserRole={currentUserRole}
              loggedInUser={loggedInUser}
              selectedDate={selectedDate}
            />
          ) : activeSopDetail ? (
            /* Render Full-depth checklist printed form sheet */
            <SOPChecklistView
              sop={activeSopDetail}
              menuList={getMenuForSelectedDate()?.menuList || []}
              currentUserRole={currentUserRole}
              currentUsername={currentUsername}
              onUpdateSOP={handleUpdateSOP}
              onBack={() => setActiveSopDetail(null)}
              isCoordinator={loggedInUser?.isCoordinator}
              loggedInUser={loggedInUser}
            />
          ) : loggedInUser.isCoordinator ? (
            /* Coordinator Empty State: No SOP generated for this date yet */
            <div className="bg-white p-12 rounded-3xl border border-neutral-100 shadow-xl text-center space-y-6 max-w-2xl mx-auto my-12">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-800">
                  Lembar Kerja SOP Belum Dirilis
                </h3>
                <p className="text-sm text-neutral-500">
                  SOP harian untuk divisi <strong className="text-emerald-800">{loggedInUser.coordinatorDivision}</strong> pada tanggal {selectedDate} belum dipublikasikan oleh Supervisor / Admin.
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    const menuItems = getMenuForSelectedDate()?.menuList || ['Nasi Putih', 'Lauk Protein', 'Lauk Nabati', 'Sayuran Segar'];
                    handleGenerateSOPs(selectedDate, menuItems);
                  }}
                  className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-xs transition-colors w-full sm:w-auto"
                >
                  Inisialisasi SOP Mandiri
                </button>
                <span className="text-xs text-neutral-400">
                  Atau hubungi Supervisor/Admin Utama di Ruang Admin.
                </span>
              </div>
            </div>
          ) : (
            /* SOP Management Page */
            <div className="space-y-6">
              {/* Context Banner */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-neutral-900 font-display">
                    Manajemen SOP Dapur Harian Berbasis Menu
                  </h1>
                  <p className="text-xs text-neutral-500 max-w-xl">
                    SOP Dapur SPPG disinkronkan langsung berbasis menu harian gizi tinggi. Gunakan form centang digital ini untuk mengganti kertas cetak.
                  </p>
                </div>

                {/* Sub Tab selection buttons */}
                <div className="flex border border-neutral-200 bg-neutral-50 p-1 rounded-xl shrink-0 tab-buttons no-print flex-wrap gap-1 sm:gap-0">
                  <button
                    onClick={() => setCurrentSubTab('dashboard')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentSubTab === 'dashboard'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Dashboard SOP
                  </button>
                  <button
                    onClick={() => setCurrentSubTab('create')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentSubTab === 'create'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Rilis / Atur Menu
                  </button>
                  <button
                    onClick={() => setCurrentSubTab('recap')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentSubTab === 'recap'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Bank Rekapitulasi
                  </button>
                </div>
              </div>

              {/* Render Selected SubTab */}
              {currentSubTab === 'create' ? (
                <SOPCreator
                  selectedDate={selectedDate}
                  dayMenu={getMenuForSelectedDate()}
                  sopsForDate={getSOPsForSelectedDate()}
                  currentUserRole={currentUserRole}
                  currentUsername={currentUsername}
                  onSaveMenu={handleSaveMenu}
                  onGenerateSOPs={handleGenerateSOPs}
                  onUpdateSOP={handleUpdateSOP}
                  allDayMenus={dayMenus}
                  onSelectDate={(date) => setSelectedDate(date)}
                  onDeleteMenu={handleDeleteMenu}
                  onSetUserRole={setCurrentUserRole}
                  onBootstrapDb={bootstrapSupabase}
                />
              ) : currentSubTab === 'recap' ? (
                <SOPRecap
                  sops={sops}
                  onSelectSOP={(sop) => setActiveSopDetail(sop)}
                />
              ) : (
                /* 2.A MAIN SOP DASHBOARD SUB-TAB */
                <div className="space-y-6">
                  {/* Selected Menu Highlight board */}
                  <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-emerald-800" />
                        <div>
                          <h3 className="font-bold text-neutral-800 text-sm font-display">
                            Menu Gizi Aktif Terpilih
                          </h3>
                          <p className="text-[11px] text-neutral-400">Dimasukkan oleh Ahli Gizi untuk konsumsi asrama santri</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setCurrentSubTab('create')}
                        className="text-xs text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1.5 hover:underline"
                      >
                        Kelola Menu &amp; SOP <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    {getMenuForSelectedDate() ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-neutral-400 font-medium font-sans uppercase tracking-widest mr-2">Disajikan:</span>
                        {getMenuForSelectedDate()?.menuList.map((food, idx) => (
                          <span 
                            key={idx} 
                            className="bg-emerald-50 text-emerald-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-emerald-100/60"
                          >
                            {idx + 1}. {food}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 text-center space-y-3">
                        <Info className="h-6 w-6 text-neutral-400 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-neutral-600">Menu Belum Dikeluarkan untuk Tanggal Ini</p>
                          <p className="text-[11.5px] text-neutral-400 max-w-sm mx-auto">Untuk menghasilkan tugas centang-centang harian, rilis menu harian terlebih dahulu melalui tab <strong>"Rilis / Atur Menu"</strong>.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 7 DIVISIONS CARDS LIST */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-neutral-800 text-sm font-display select-none">
                      Pilih Divisi Dapur untuk Membuka SOP Checklist
                    </h3>
                    
                    {getSOPsForSelectedDate().length === 0 ? (
                      <div className="p-16 border border-neutral-200 rounded-2xl bg-white text-center space-y-4">
                        <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto animate-bounce" />
                        <div className="space-y-1.5">
                          <h4 className="text-neutral-700 font-bold text-sm">SOP Dapur Belum Dipublikasikan</h4>
                          <p className="text-xs text-neutral-400 max-w-sm mx-auto">Checklist harian belum dikomposisikan oleh Chef, Ahli Gizi, atau Aslap. Ketuk tombol di bawah untuk membuat secara otomatis.</p>
                        </div>
                        <button
                          onClick={() => {
                            // Quick auto-generate using preloaded menu
                            const defaultList = ['Nasi Putih', 'Krawu Ayam Bungah', 'Tempe Goreng Ketumbar', 'Kupasan Timun Segar', 'Sambal Serundeng kelapa', 'Pisang'];
                            handleSaveMenu(selectedDate, defaultList);
                            handleGenerateSOPs(selectedDate, defaultList);
                          }}
                          className="bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold px-5 py-2.5 rounded-xl text-center inline-block"
                        >
                          + Instant Masukkan Template SOP
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getSOPsForSelectedDate().map((sop) => {
                          const completedCount = sop.tasks.filter(t => t.completed).length;
                          const totalCount = sop.tasks.length;
                          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                          
                          return (
                            <div 
                              key={sop.id}
                              onClick={() => setActiveSopDetail(sop)}
                              className="bg-white hover:border-emerald-600 border border-neutral-200/80 rounded-2xl p-5 shadow-3xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between min-h-[175px]"
                            >
                              <div>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[9px] text-neutral-400 font-mono block uppercase tracking-wider">DIVISI</span>
                                    <h4 className="font-bold text-base text-neutral-800 group-hover:text-emerald-800 transition-colors">
                                      {sop.division}
                                    </h4>
                                  </div>
                                  
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border ${
                                    sop.status === 'selesai'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {sop.status === 'selesai' ? 'TERKUNCI' : 'AKTIF'}
                                  </span>
                                </div>

                                <p className="text-[10px] text-neutral-400 mt-2">
                                  Dibuat: {sop.creatorName} ({sop.creatorRole.replace(' (Asisten Lapangan)', '').replace(' / Juru Masak', '')})
                                </p>
                              </div>

                              <div className="mt-5 pt-3 border-t border-neutral-100 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-neutral-500 font-semibold">Tugas Selesai:</span>
                                  <span className="font-mono font-bold text-neutral-950">
                                    {completedCount} / {totalCount} ({pct}%)
                                  </span>
                                </div>

                                {/* Custom mini progress slider */}
                                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${pct === 100 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>

                                {/* Link tag */}
                                <span className="text-[10px] text-emerald-800 font-extrabold mt-1 uppercase tracking-wider flex items-center gap-0.5 self-end">
                                  Buka Checklist <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
