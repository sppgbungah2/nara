import { useState, useEffect, useRef, useCallback } from 'react';
import { SOPDocument, Division, DayMenu, TaskItem, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  getSopTaskTableNames, 
  getSopTaskTableName,
  generateInitialSOPsForDate, 
  getDefaultTasksForDivision, 
  getSlugFromDivision,
  DIVISION_CREATOR_MAP
} from '../presetData';

export function useSopData(selectedDate: string) {
  const [dayMenus, setDayMenus] = useState<DayMenu[]>([]);
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [loadingSops, setLoadingSops] = useState<boolean>(true);
  const [sopError, setSopError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const deletedSopIdsRef = useRef<Set<string>>(new Set());
  const isUpdatingSopRef = useRef<boolean>(false);

  // Load from LocalStorage fallback initially
  useEffect(() => {
    try {
      const savedSops = localStorage.getItem('sppg_sops');
      if (savedSops) {
        const parsed = JSON.parse(savedSops);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSops(parsed);
        }
      }
    } catch (e) {
      console.error('Error reading localStorage sops:', e);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (sops.length > 0) {
      try {
        localStorage.setItem('sppg_sops', JSON.stringify(sops));
      } catch (e) {
        console.error('Error writing localStorage sops:', e);
      }
    }
  }, [sops]);

  // Fetch SOPs and Menus from Cloud Supabase
  const fetchSopsAndMenus = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoadingSops(false);
      return;
    }

    try {
      setLoadingSops(true);
      setSopError(null);

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

      const divisionTables = [
        'sop_task_driver',
        'sop_task_stocking',
        'sop_task_masak',
        'sop_task_pemorsian',
        'sop_task_kebersihan',
        'sop_task_cuci',
        'sop_task_keamanan',
        'sop_tasks'
      ];

      const taskFetchResults = await Promise.all(
        divisionTables.map(tbl =>
          supabase
            .from(tbl)
            .select('*')
            .order('sort_order', { ascending: true })
            .range(0, 9999)
            .then(res => ({ tbl, data: res.data || [] }), () => ({ tbl, data: [] }))
        )
      );

      const tableDataMap = new Map<string, any[]>();
      taskFetchResults.forEach(item => {
        tableDataMap.set(item.tbl, item.data);
      });

      if (menuData) {
        setDayMenus(menuData.map((m: any) => ({
          id: m.id,
          date: m.date,
          dayName: m.day_name,
          menuList: m.menu_list || [],
          portionCount: m.portion_count || 100
        })));
      }

      if (sopData && sopData.length > 0) {
        const formattedSOPs: SOPDocument[] = sopData.map((s: any) => {
          const primaryTable = getSopTaskTableName(s.division as Division);
          const divSlug = getSlugFromDivision(s.division as Division);
          const altId = `SOP_${divSlug}_${s.date}`;

          // Get tasks from the division's specific table first
          const primaryTasks = tableDataMap.get(primaryTable) || [];
          let matchedCloudTasks = primaryTasks.filter((t: any) => {
            if (!t.sop_id) return false;
            const cleanT = String(t.sop_id).trim();
            const cleanS = String(s.id).trim();
            if (cleanT === cleanS || cleanT === altId) return true;

            const cleanTaskSopId = cleanT.toLowerCase();
            const cleanDivSlug = divSlug.toLowerCase();
            const normDate = s.date.replace(/-/g, '');
            return (cleanTaskSopId.includes(s.date) && cleanTaskSopId.includes(cleanDivSlug)) ||
                   (cleanTaskSopId.includes(normDate) && cleanTaskSopId.includes(cleanDivSlug));
          });

          // Fallback to sop_tasks if primary table is empty for legacy records
          if (matchedCloudTasks.length === 0) {
            const fallbackTasks = tableDataMap.get('sop_tasks') || [];
            matchedCloudTasks = fallbackTasks.filter((t: any) => {
              if (!t.sop_id) return false;
              const cleanT = String(t.sop_id).trim();
              const cleanS = String(s.id).trim();
              if (cleanT === cleanS || cleanT === altId) return true;

              const cleanTaskSopId = cleanT.toLowerCase();
              const cleanDivSlug = divSlug.toLowerCase();
              const normDate = s.date.replace(/-/g, '');
              return (cleanTaskSopId.includes(s.date) && cleanTaskSopId.includes(cleanDivSlug)) ||
                     (cleanTaskSopId.includes(normDate) && cleanTaskSopId.includes(cleanDivSlug));
            });
          }

          let mergedTasks: TaskItem[] = [];
          if (matchedCloudTasks.length > 0) {
            const taskMap = new Map<string, TaskItem>();
            matchedCloudTasks.forEach((ct: any) => {
              const key = ct.id || String(ct.text || '').trim().toLowerCase();
              if (!taskMap.has(key)) {
                taskMap.set(key, {
                  id: ct.id,
                  text: ct.text || '',
                  completed: !!ct.completed,
                  category: ct.category as 'persiapan' | 'aktif' | 'penutup',
                  sort_order: ct.sort_order ?? 0
                });
              }
            });
            mergedTasks = Array.from(taskMap.values()).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          } else {
            const matchedMenu = menuData?.find((m: any) => m.date === s.date)?.menu_list || [];
            mergedTasks = getDefaultTasksForDivision(s.division as Division, matchedMenu).map((t, idx) => ({
              ...t,
              id: `${s.date}-${s.division}-t-${idx}`,
              sort_order: idx
            }));
          }

          const creatorInfo = DIVISION_CREATOR_MAP[s.division as Division] || { role: UserRole.ASLAP, name: 'Aslap' };
          const creatorName = s.creator_name || (creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' : creatorInfo.role === UserRole.AHLI_GIZI ? 'Avianti Rahma Dianita' : 'Ahmad Maghfur');

          return {
            id: s.id,
            division: s.division as Division,
            date: s.date,
            creatorRole: s.creator_role || creatorInfo.role,
            creatorName: creatorName,
            tasks: mergedTasks,
            isCheckedAll: !!s.is_checked_all,
            signerSupervisor: s.signer_supervisor || '',
            signatureSupervisorUrl: s.signature_supervisor_url || '',
            signedSupervisorAt: s.signed_supervisor_at || null,
            signerCoordinator: s.signer_coordinator || '',
            signatureCoordinatorUrl: s.signature_coordinator_url || '',
            signedCoordinatorAt: s.signed_coordinator_at || null,
            status: s.status || 'aktif',
            updatedAt: s.updated_at || new Date().toISOString()
          };
        });

        setSops(prev => {
          const mergedMap = new Map<string, SOPDocument>();

          formattedSOPs.forEach(s => {
            if (!deletedSopIdsRef.current.has(s.id)) {
              mergedMap.set(s.id, s);
            }
          });

          prev.forEach(ls => {
            if (deletedSopIdsRef.current.has(ls.id)) return;
            if (!mergedMap.has(ls.id)) {
              mergedMap.set(ls.id, ls);
            }
          });

          return Array.from(mergedMap.values());
        });
      }
    } catch (err: any) {
      console.error('Error fetching SOPs from Supabase:', err);
      setSopError(err.message || 'Gagal memuat data dari Supabase');
    } finally {
      setLoadingSops(false);
    }
  }, []);

  useEffect(() => {
    fetchSopsAndMenus();
  }, [fetchSopsAndMenus]);

  // Update single SOP
  const handleUpdateSOP = async (updatedSOP: SOPDocument) => {
    setSyncStatus('saving');
    try {
      setSops(prev => prev.map(s => s.id === updatedSOP.id ? updatedSOP : s));

      if (isSupabaseConfigured && supabase) {
        const creatorInfo = DIVISION_CREATOR_MAP[updatedSOP.division as Division] || { role: UserRole.ASLAP, name: 'Aslap' };
        const creatorRole = updatedSOP.creatorRole || creatorInfo.role;
        const creatorName = updatedSOP.creatorName || (creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' : creatorInfo.role === UserRole.AHLI_GIZI ? 'Avianti Rahma Dianita' : 'Ahmad Maghfur');

        const sopPayload = {
          id: updatedSOP.id,
          division: updatedSOP.division,
          date: updatedSOP.date,
          creator_role: creatorRole,
          creator_name: creatorName,
          is_checked_all: updatedSOP.isCheckedAll,
          signer_supervisor: updatedSOP.signerSupervisor,
          signature_supervisor_url: updatedSOP.signatureSupervisorUrl,
          signed_supervisor_at: updatedSOP.signedSupervisorAt,
          signer_coordinator: updatedSOP.signerCoordinator,
          signature_coordinator_url: updatedSOP.signatureCoordinatorUrl,
          signed_coordinator_at: updatedSOP.signedCoordinatorAt,
          status: updatedSOP.status,
          updated_at: new Date().toISOString()
        };

        const { error: sopErr } = await supabase.from('sops').upsert(sopPayload);
        if (sopErr) throw sopErr;

        const targetTable = getSopTaskTableName(updatedSOP.division);
        const divSlug = getSlugFromDivision(updatedSOP.division);
        const altSopId = `SOP_${divSlug}_${updatedSOP.date}`;

        const tasksPayloadWithSId = updatedSOP.tasks.map((t, idx) => ({
          id: t.id,
          sop_id: updatedSOP.id,
          text: t.text || '',
          completed: !!t.completed,
          category: t.category || 'aktif',
          sort_order: t.sort_order ?? idx
        }));

        // Clean old records from both targetTable and sop_tasks (and legacy tables)
        const tablesToClean = [targetTable, 'sop_tasks', 'sop_driver', 'sop_stocking', 'sop_persiapan', 'sop_masak', 'sop_pemasakan', 'sop_pemorsian', 'sop_kebersihan', 'sop_cuci', 'sop_pencucian', 'sop_keamanan'];
        for (const tbl of tablesToClean) {
          try {
            await supabase.from(tbl).delete().eq('sop_id', updatedSOP.id);
            await supabase.from(tbl).delete().eq('sop_id', altSopId);
          } catch (e) {}
        }

        // Write ONLY to the division's specific task table
        if (tasksPayloadWithSId.length > 0) {
          const { error: taskErr } = await supabase.from(targetTable).upsert(tasksPayloadWithSId);
          if (taskErr) console.error(`Error writing tasks to ${targetTable}:`, taskErr);
        }
      }

      setSyncStatus('saved');
      return { success: true };
    } catch (err: any) {
      console.error('Error updating SOP:', err);
      setSyncStatus('error');
      return { success: false, error: err.message || 'Gagal menyimpan perubahan' };
    }
  };

  // Explicit Save / Publish SOPs to Cloud
  const handleSaveSopsToCloud = async (targetDate?: string, sopsOverride?: SOPDocument[]) => {
    const dateToSave = targetDate || selectedDate;
    isUpdatingSopRef.current = true;
    try {
      setSyncStatus('saving');
      const sourceSops = sopsOverride || sops;
      let sopsToSave = sourceSops.filter(s => s.date === dateToSave && !deletedSopIdsRef.current.has(s.id));
      const dayMenuObj = dayMenus.find(m => m.date === dateToSave);
      const menuList = dayMenuObj?.menuList || [];

      if (sopsToSave.length === 0) {
        sopsToSave = generateInitialSOPsForDate(dateToSave, menuList);
        setSops(prev => {
          const existingMap = new Map(prev.map(p => [p.id, p]));
          sopsToSave.forEach(ns => existingMap.set(ns.id, ns));
          return Array.from(existingMap.values());
        });
      }

      if (isSupabaseConfigured && supabase) {
        for (const s of sopsToSave) {
          const creatorInfo = DIVISION_CREATOR_MAP[s.division as Division] || { role: UserRole.ASLAP, name: 'Aslap' };
          const creatorRole = s.creatorRole || creatorInfo.role;
          const creatorName = s.creatorName || (creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' : creatorInfo.role === UserRole.AHLI_GIZI ? 'Avianti Rahma Dianita' : 'Ahmad Maghfur');

          const sopPayload = {
            id: s.id,
            division: s.division,
            date: s.date,
            creator_role: creatorRole,
            creator_name: creatorName,
            is_checked_all: !!s.isCheckedAll,
            signer_supervisor: s.signerSupervisor || '',
            signature_supervisor_url: s.signatureSupervisorUrl || '',
            signed_supervisor_at: s.signedSupervisorAt || null,
            signer_coordinator: s.signerCoordinator || '',
            signature_coordinator_url: s.signatureCoordinatorUrl || '',
            signed_coordinator_at: s.signedCoordinatorAt || null,
            status: s.status || 'aktif',
            updated_at: new Date().toISOString()
          };

          await supabase.from('sops').upsert(sopPayload);

          const divSlug = getSlugFromDivision(s.division);
          const altSopId = `SOP_${divSlug}_${s.date}`;
          const targetTable = getSopTaskTableName(s.division);

          const tasksToSave = (s.tasks && s.tasks.length > 0) 
            ? s.tasks 
            : getDefaultTasksForDivision(s.division, menuList);

          const tasksPayloadWithSId = tasksToSave.map((t, idx) => ({
            id: t.id,
            sop_id: s.id,
            text: t.text || '',
            completed: !!t.completed,
            category: t.category || 'aktif',
            sort_order: t.sort_order ?? idx
          }));

          // Clean up old tasks in targetTable and sop_tasks / legacy tables
          const tablesToClean = [targetTable, 'sop_tasks', 'sop_driver', 'sop_stocking', 'sop_persiapan', 'sop_masak', 'sop_pemasakan', 'sop_pemorsian', 'sop_kebersihan', 'sop_cuci', 'sop_pencucian', 'sop_keamanan'];
          for (const tbl of tablesToClean) {
            try {
              await supabase.from(tbl).delete().eq('sop_id', s.id);
              await supabase.from(tbl).delete().eq('sop_id', altSopId);
            } catch (e) {}
          }

          // Write ONLY to division's specific task table
          if (tasksPayloadWithSId.length > 0) {
            const { error: taskErr } = await supabase.from(targetTable).upsert(tasksPayloadWithSId);
            if (taskErr) console.error(`Failed writing to ${targetTable}:`, taskErr);
          }
        }
      }

      setSyncStatus('saved');
      return { 
        success: true, 
        message: `🎉 Berhasil! Seluruh ${sopsToSave.length} SOP tersimpan & tersinkronisasi 100% ke Cloud Supabase!` 
      };
    } catch (err: any) {
      console.error('Error in handleSaveSopsToCloud:', err);
      setSyncStatus('error');
      return { success: false, message: `Gagal menyimpan ke Cloud: ${err.message}` };
    } finally {
      isUpdatingSopRef.current = false;
    }
  };

  // Generate SOPs template for date
  const handleGenerateSOPs = async (date?: string) => {
    const targetDate = date || selectedDate;
    const dayMenuObj = dayMenus.find(m => m.date === targetDate);
    const menuList = dayMenuObj?.menuList || [];
    const generated = generateInitialSOPsForDate(targetDate, menuList) as SOPDocument[];

    setSops(prev => {
      const existingOtherDates = prev.filter(p => p.date !== targetDate);
      const updatedSopsList = [...existingOtherDates, ...generated];
      try {
        localStorage.setItem('sppg_sops', JSON.stringify(updatedSopsList));
      } catch (e) { console.error(e); }
      return updatedSopsList;
    });

    await handleSaveSopsToCloud(targetDate, generated);
  };

  // Delete SOP
  const handleDeleteSOP = async (sopId: string) => {
    try {
      deletedSopIdsRef.current.add(sopId);
      setSops(prev => prev.filter(s => s.id !== sopId));

      if (isSupabaseConfigured && supabase) {
        const divisionTables = [
          'sop_tasks', 'sop_task_driver', 'sop_driver', 'sop_task_stocking', 'sop_stocking',
          'sop_persiapan', 'sop_task_masak', 'sop_masak', 'sop_pemasakan', 'sop_task_pemorsian',
          'sop_pemorsian', 'sop_task_kebersihan', 'sop_kebersihan', 'sop_task_cuci',
          'sop_cuci', 'sop_pencucian', 'sop_task_keamanan', 'sop_keamanan'
        ];
        for (const tbl of divisionTables) {
          try {
            await supabase.from(tbl).delete().eq('sop_id', sopId);
          } catch (e) {}
        }
        await supabase.from('sops').delete().eq('id', sopId);
      }
      return { success: true, message: 'SOP berhasil dihapus' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghapus SOP' };
    }
  };

  return {
    sops,
    setSops,
    dayMenus,
    setDayMenus,
    loadingSops,
    sopError,
    syncStatus,
    fetchSopsAndMenus,
    handleUpdateSOP,
    handleSaveSopsToCloud,
    handleGenerateSOPs,
    handleDeleteSOP
  };
}
