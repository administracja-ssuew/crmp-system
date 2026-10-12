import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { canManage } from '../data/roles';
import { MODULE_META } from '../notifications/modules';
import { countOpenByModule } from '../notifications/logic';

// Liczniki otwartych spraw + ostatnie zdarzenia dla modułów, którymi zarządza użytkownik.
export function useNotifications(userRole) {
  const modules = useMemo(() => Object.keys(MODULE_META).filter((m) => canManage(userRole, m)), [userRole]);
  const key = modules.join(',');
  const [openDocs, setOpenDocs] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (!modules.length) { setOpenDocs([]); setRecent([]); return undefined; }
    const col = collection(db, 'notifications');
    const offOpen = onSnapshot(
      query(col, where('status', '==', 'open')),
      (s) => setOpenDocs(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setOpenDocs([]),
    );
    const offRecent = onSnapshot(
      query(col, orderBy('updatedAt', 'desc'), limit(30)),
      (s) => setRecent(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => modules.includes(d.module))),
      () => setRecent([]),
    );
    return () => { offOpen(); offRecent(); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => countOpenByModule(openDocs, modules), [openDocs, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { enabled: modules.length > 0, counts, total, recent };
}
