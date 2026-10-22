import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Subscribe to the real-time audit log stream (ADMIN only)
 */
export function subscribeAuditLogs(callback, onError, maxItems = 100) {
  if (!db) {
    onError && onError(new Error('Firestore not initialized'));
    return () => {};
  }

  const auditCollection = collection(db, 'auditLogs');
  const q = query(auditCollection, orderBy('timestamp', 'desc'), limit(maxItems));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(logs);
    },
    (err) => {
      console.error('Audit logs subscription error:', err);
      onError && onError(err);
    }
  );
}
