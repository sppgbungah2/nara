import { useState, useEffect, useRef, useCallback } from 'react';
import { SOPDocument, Division, DayMenu, TaskItem, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  getSopTaskTableNames, 
  getSopTaskTableName,
  generateInitialSOPsForDate, 
  getDefaultTasksForDivision, 
  getSlugFromDivision,
  DIVISION_CREATOR_MAP,
  getCanonicalSopId,
  normalizeDateISO
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
        'sop_tasks_driver', 'sop_task_driver',
        'sop_tasks_stocking', 'sop_task_stocking',
        'sop_tasks_masak', 'sop_task_masak',
        'sop_tasks_pemorsian', 'sop_task_pemorsian',
        'sop_tasks_kebersihan', 'sop_task_kebersihan',
        'sop_tasks_cuci', 'sop_task_cuci',
        'sop_tasks_keamanan', 'sop_task_keamanan',
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
          date: normalizeDateISO(m.date),
          dayName: m.day_name,
          menuList: m.menu_list || [],
          portionCount: m.portion_count || 100
        })));
      }

      if (sopData && sopData.length > 0) {
        const formattedSOPs: SOPDocument[] = sopData.map((s: any) => {
          const isoDate = normalizeDateISO(s.date);
          const canonicalId = getCanonicalSopId(isoDate, s.division as Division);
          const divSlug = getSlugFromDivision(s.division as Division);
          const altId = `SOP_${divSlug}_${isoDate}`;

          const targetTables = getSopTaskTableNames(s.division as Division);
          let matchedCloudTasks: any[] = [];

          // Query candidate tables in order of specificity (sop_tasks_[div], sop_task_[div], sop_tasks)
          for (const tbl of targetTables) {
            const tblTasks = tableDataMap.get(tbl) || [];
            const matches = tblTasks.filter((t: any) => {
              if (!t.sop_id) return false;
              const cleanT = String(t.sop_id).trim();
              const cleanS = String(s.id).trim();
              const cleanCanon = String(canonicalId).trim();
              if (cleanT === cleanS || cleanT === cleanCanon || cleanT === altId) return true;

              const cleanTaskSopId = cleanT.toLowerCase();
              const normDate = isoDate.replace(/-/g, '');
              const hasDate = cleanTaskSopId.includes(isoDate) || cleanTaskSopId.includes(normDate);

              const normDiv = String(s.division || '').toLowerCase();
              const hasDivKeyword = normDiv.includes('driver') || normDiv.includes('distribusi') ? (cleanTaskSopId.includes('driver') || cleanTaskSopId.includes('distribusi')) :
                                    normDiv.includes('stocking') || normDiv.includes('persiapan') ? (cleanTaskSopId.includes('stocking') || cleanTaskSopId.includes('persiapan')) :
                                    normDiv.includes('masak') || normDiv.includes('pemasakan') ? (cleanTaskSopId.includes('masak') || cleanTaskSopId.includes('pemasakan')) :
                                    normDiv.includes('pemorsian') ? cleanTaskSopId.includes('pemorsian') :
                                    normDiv.includes('kebersihan') ? cleanTaskSopId.includes('kebersihan') :
                                    normDiv.includes('cuci') || normDiv.includes('pencucian') ? (cleanTaskSopId.includes('cuci') || cleanTaskSopId.includes('pencucian')) :
                                    normDiv.includes('keamanan') || normDiv.includes('security') ? (cleanTaskSopId.includes('keamanan') || cleanTaskSopId.includes('security')) : false;

              return hasDate && hasDivKeyword;
            });

            if (matches.length > 0) {
              matchedCloudTasks = matches;
              break;
            }
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
            const matchedMenu = menuData?.find((m: any) => normalizeDateISO(m.date) === isoDate)?.menu_list || [];
            mergedTasks = getDefaultTasksForDivision(s.division as Division, matchedMenu).map((t, idx) => ({
              ...t,
              id: `${canonicalId}-t-${idx}`,
              sort_order: idx
            }));
          }

          const creatorInfo = DIVISION_CREATOR_MAP[s.division as Division] || { role: UserRole.ASLAP, name: 'Aslap' };
          const creatorName = s.creator_name || (creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' : creatorInfo.role === UserRole.AHLI_GIZI ? 'Avianti Rahma Dianita' : 'Ahmad Maghfur');

          return {
            id: canonicalId,
            division: s.division as Division,
            date: isoDate,
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

        // Don't overwrite local state if saving is currently in progress
        if (!isUpdatingSopRef.current) {
          setSops(prev => {
            const mergedMap = new Map<string, SOPDocument>();

            formattedSOPs.forEach(s => {
              if (!deletedSopIdsRef.current.has(s.id)) {
                const key = `${s.date}__${getSlugFromDivision(s.division)}`;
                mergedMap.set(key, s);
              }
            });

            prev.forEach(ls => {
              if (deletedSopIdsRef.current.has(ls.id)) return;
              const key = `${normalizeDateISO(ls.date)}__${getSlugFromDivision(ls.division)}`;
              if (!mergedMap.has(key)) {
                mergedMap.set(key, ls);
              }
            });

            return Array.from(mergedMap.values());
          });
        }
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
    isUpdatingSopRef.current = true;
    try {
      const isoDate = normalizeDateISO(updatedSOP.date);
      const divSlug = getSlugFromDivision(updatedSOP.division);
      const canonicalId = getCanonicalSopId(isoDate, updatedSOP.division);

      const normalizedSOP: SOPDocument = {
        ...updatedSOP,
        id: canonicalId,
        date: isoDate
      };

      setSops(prev => {
        const keyToUpdate = `${isoDate}__${divSlug}`;
        let matched = false;
        const next = prev.map(s => {
          const sIsoDate = normalizeDateISO(s.date);
          const sDivSlug = getSlugFromDivision(s.division);
          const key = `${sIsoDate}__${sDivSlug}`;
          if (s.id === updatedSOP.id || s.id === canonicalId || key === keyToUpdate) {
            matched = true;
            return normalizedSOP;
          }
          return s;
        });
        if (!matched) {
          next.push(normalizedSOP);
        }
        return next;
      });

      if (isSupabaseConfigured && supabase) {
        const creatorInfo = DIVISION_CREATOR_MAP[normalizedSOP.division as Division] || { role: UserRole.ASLAP, name: 'Aslap' };
        const creatorRole = normalizedSOP.creatorRole || creatorInfo.role;
        const creatorName = normalizedSOP.creatorName || (creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' : creatorInfo.role === UserRole.AHLI_GIZI ? 'Avianti Rahma Dianita' : 'Ahmad Maghfur');

        const sopPayload = {
          id: canonicalId,
          division: normalizedSOP.division,
          date: isoDate,
          creator_role: creatorRole,
          creator_name: creatorName,
          is_checked_all: !!normalizedSOP.isCheckedAll,
          signer_supervisor: normalizedSOP.signerSupervisor || '',
          signature_supervisor_url: normalizedSOP.signatureSupervisorUrl || '',
          signed_supervisor_at: normalizedSOP.signedSupervisorAt || null,
          signer_coordinator: normalizedSOP.signerCoordinator || '',
          signature_coordinator_url: normalizedSOP.signatureCoordinatorUrl || '',
          signed_coordinator_at: normalizedSOP.signedCoordinatorAt || null,
          status: normalizedSOP.status || 'aktif',
          updated_at: new Date().toISOString()
        };

        const { error: sopErr } = await supabase.from('sops').upsert(sopPayload);
        if (sopErr) throw sopErr;

        const targetTables = getSopTaskTableNames(normalizedSOP.division);
        const altSopId = `SOP_${divSlug}_${isoDate}`;

        const deleteSopIds = Array.from(new Set([
          updatedSOP.id,
          canonicalId,
          altSopId,
          `${isoDate}-${divSlug}`,
          `${isoDate}-${normalizedSOP.division}`
        ]));

        // Clean old records from division task tables
        for (const tbl of targetTables) {
          try {
            await supabase.from(tbl).delete().in('sop_id', deleteSopIds);
          } catch (e) {
            console.warn(`Warning cleaning tasks from ${tbl}:`, e);
          }
        }

        const tasksPayloadWithSId = normalizedSOP.tasks.map((t, idx) => ({
          id: t.id ? (t.id.includes('-t-') ? t.id : `${canonicalId}-t-${idx}`) : `${canonicalId}-t-${idx}`,
          sop_id: canonicalId,
          text: t.text || '',
          completed: !!t.completed,
          category: t.category || 'aktif',
          sort_order: t.sort_order ?? idx
        }));

        // Write tasks directly to division specific tables (sop_tasks_<divisi> and sop_task_<divisi>)
        if (tasksPayloadWithSId.length > 0) {
          for (const tbl of targetTables) {
            const { error: taskErr } = await supabase.from(tbl).upsert(tasksPayloadWithSId);
            if (taskErr) {
              console.error(`Error writing tasks to ${tbl}:`, taskErr);
              throw new Error(`Gagal menyimpan tugas ke tabel divisi ${tbl}: ${taskErr.message}`);
            }
          }
        }
      }

      setSyncStatus('saved');
      return { success: true };
    } catch (err: any) {
      console.error('Error updating SOP:', err);
      setSyncStatus('error');
      return { success: false, error: err.message || 'Gagal menyimpan perubahan' };
    } finally {
      isUpdatingSopRef.current = false;
    }
  };

  // Explicit Save / Publish SOPs to Cloud
  const handleSaveSopsToCloud = async (targetDate?: string, sopsOverride?: SOPDocument[]) => {
    const rawDate = targetDate || selectedDate;
    const dateToSave = normalizeDateISO(rawDate);
    isUpdatingSopRef.current = true;
    try {
      setSyncStatus('saving');
      const sourceSops = sopsOverride || sops;
      let sopsToSave = sourceSops.filter(s => normalizeDateISO(s.date) === dateToSave && !deletedSopIdsRef.current.has(s.id));
      const dayMenuObj = dayMenus.find(m => normalizeDateISO(m.date) === dateToSave);
      const menuList = dayMenuObj?.menuList || [];

      if (sopsToSave.length === 0) {
        sopsToSave = generateInitialSOPsForDate(dateToSave, menuList);
        setSops(prev => {
          const map = new Map<string, SOPDocument>();
          prev.forEach(p => map.set(`${normalizeDateISO(p.date)}__${getSlugFromDivision(p.division)}`, p));
          sopsToSave.forEach(ns => map.set(`${normalizeDateISO(ns.date)}__${getSlugFromDivision(ns.division)}`, ns));
          return Array.from(map.values());
        });
      }

      if (isSupabaseConfigured && supabase) {
        for (const s of sopsToSave) {
          const isoDate = normalizeDateISO(s.date);
          const canonicalId = getCanonicalSopId(isoDate, s.division);
          const divSlug = getSlugFromDivision(s.division);

          const creatorInfo = DIVISION_CREATOR_MAP[s.division as Division] || { role: UserRole.ASLAP, name: 'Aslap' };
          const creatorRole = s.creatorRole || creatorInfo.role;
          const creatorName = s.creatorName || (creatorInfo.role === UserRole.CHEF ? 'Rizka Aulia' : creatorInfo.role === UserRole.AHLI_GIZI ? 'Avianti Rahma Dianita' : 'Ahmad Maghfur');

          const sopPayload = {
            id: canonicalId,
            division: s.division,
            date: isoDate,
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

          const targetTables = getSopTaskTableNames(s.division);
          const altSopId = `SOP_${divSlug}_${isoDate}`;

          const deleteSopIds = Array.from(new Set([
            s.id,
            canonicalId,
            altSopId,
            `${isoDate}-${divSlug}`,
            `${isoDate}-${s.division}`
          ]));

          const tasksToSave = (s.tasks && s.tasks.length > 0) 
            ? s.tasks 
            : getDefaultTasksForDivision(s.division, menuList);

          const tasksPayloadWithSId = tasksToSave.map((t, idx) => ({
            id: t.id ? (t.id.includes('-t-') ? t.id : `${canonicalId}-t-${idx}`) : `${canonicalId}-t-${idx}`,
            sop_id: canonicalId,
            text: t.text || '',
            completed: !!t.completed,
            category: t.category || 'aktif',
            sort_order: t.sort_order ?? idx
          }));

          // Clean up old tasks in target division tables
          for (const tbl of targetTables) {
            try {
              await supabase.from(tbl).delete().in('sop_id', deleteSopIds);
            } catch (e) {
              console.warn(`Warning deleting old tasks from ${tbl}:`, e);
            }
          }

          // Write tasks to division task tables (sop_tasks_<divisi> and sop_task_<divisi>)
          if (tasksPayloadWithSId.length > 0) {
            for (const tbl of targetTables) {
              const { error: taskErr } = await supabase.from(tbl).upsert(tasksPayloadWithSId);
              if (taskErr) {
                console.error(`Failed writing tasks to ${tbl}:`, taskErr);
                throw new Error(`Gagal menyimpan tugas ke tabel divisi ${tbl}: ${taskErr.message}`);
              }
            }
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
    const rawDate = date || selectedDate;
    const targetDate = normalizeDateISO(rawDate);
    const dayMenuObj = dayMenus.find(m => normalizeDateISO(m.date) === targetDate);
    const menuList = dayMenuObj?.menuList || [];
    const generated = generateInitialSOPsForDate(targetDate, menuList) as SOPDocument[];

    setSops(prev => {
      const existingOtherDates = prev.filter(p => normalizeDateISO(p.date) !== targetDate);
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
          'sop_tasks', 'sop_tasks_driver', 'sop_task_driver', 'sop_driver',
          'sop_tasks_stocking', 'sop_task_stocking', 'sop_stocking', 'sop_persiapan',
          'sop_tasks_masak', 'sop_task_masak', 'sop_masak', 'sop_pemasakan',
          'sop_tasks_pemorsian', 'sop_task_pemorsian', 'sop_pemorsian',
          'sop_tasks_kebersihan', 'sop_task_kebersihan', 'sop_kebersihan',
          'sop_tasks_cuci', 'sop_task_cuci', 'sop_cuci', 'sop_pencucian',
          'sop_tasks_keamanan', 'sop_task_keamanan', 'sop_keamanan'
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
